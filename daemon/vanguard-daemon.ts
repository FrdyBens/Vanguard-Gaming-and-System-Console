/**
 * Vanguard CachyOS Host Daemon
 * Secure local system daemon listening strictly on 127.0.0.1
 * Enforces cryptographic auth, nonce replay prevention, strict CORS, and structured argv execution
 */

import http from 'http';
import os from 'os';
import { DAEMON_HOST, DAEMON_PORT } from './config';
import { DaemonSecurity } from './security';
import { AuditLogger } from './audit';
import { SystemOperations } from './operations/system';
import { StorageOperations } from './operations/storage';
import { FilesystemOperations } from './operations/filesystem';
import { ServiceOperations } from './operations/services';
import { PackageOperations } from './operations/packages';

// Hard assertion: Daemon must NEVER bind to 0.0.0.0 or LAN
if (DAEMON_HOST !== '127.0.0.1') {
  console.error('[FATAL SECURITY VIOLATION] Daemon host is not 127.0.0.1. Halting immediately.');
  process.exit(1);
}

export function createDaemonServer(): http.Server {
  // Ensure token is generated on startup
  const token = DaemonSecurity.initDaemonAuth();
  console.log(`[Vanguard Daemon] Initialized local authentication token in ~/.config/vanguard/daemon/auth.token`);

  const server = http.createServer(async (req, res) => {
    const startTime = Date.now();
    const origin = req.headers.origin as string | undefined;

    // Origin Check (CORS) - Never '*'
    if (!DaemonSecurity.isOriginAllowed(origin)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Origin Forbidden: Request from unauthorized origin' }));
      return;
    }

    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': origin || 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-vanguard-request-id, x-vanguard-timestamp, x-vanguard-nonce',
      'Access-Control-Max-Age': '86400',
      'Content-Type': 'application/json'
    };

    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders);
      res.end();
      return;
    }

    // Health check endpoint (unauthenticated for liveness probe)
    if (req.url === '/health' || req.url === '/api/health') {
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify({
        status: 'ok',
        version: '2.0-cachyos',
        host: DAEMON_HOST,
        port: DAEMON_PORT,
        user: os.userInfo().username,
        authRequired: true
      }));
      return;
    }

    // All operational endpoints require strict authentication
    const authHeader = req.headers['authorization'] as string | undefined;
    const reqId = (req.headers['x-vanguard-request-id'] as string) || '';
    const timestampHdr = req.headers['x-vanguard-timestamp'] as string | undefined;
    const nonceHdr = req.headers['x-vanguard-nonce'] as string | undefined;

    const authCheck = DaemonSecurity.verifyRequest(authHeader, reqId, timestampHdr, nonceHdr);
    if (!authCheck.authenticated) {
      res.writeHead(401, corsHeaders);
      res.end(JSON.stringify({
        requestId: reqId,
        success: false,
        exitCode: 401,
        error: { code: 'UNAUTHORIZED', message: authCheck.error },
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // Read body with 64KB size limit to prevent buffer overflow attacks
    let bodyRaw = '';
    req.on('data', (chunk) => {
      bodyRaw += chunk;
      if (bodyRaw.length > 65536) {
        res.writeHead(413, corsHeaders);
        res.end(JSON.stringify({ error: 'Payload Too Large: Maximum 64KB' }));
        req.destroy();
      }
    });

    req.on('end', async () => {
      let body: any = {};
      if (bodyRaw) {
        try {
          body = JSON.parse(bodyRaw);
        } catch {
          res.writeHead(400, corsHeaders);
          res.end(JSON.stringify({ error: 'Malformed JSON payload' }));
          return;
        }
      }

      const operation = body.operation || (req.url?.includes('snapshot') ? 'system_info' : undefined);
      const params = body.parameters || {};

      if (!operation || typeof operation !== 'string') {
        res.writeHead(400, corsHeaders);
        res.end(JSON.stringify({ error: 'Missing or invalid operation field' }));
        return;
      }

      // Structured operation routing
      let resultData: any = null;
      let exitCode = 0;
      let errorObj: any = null;
      let verificationInfo: any = undefined;
      let riskLevel: 'READ_ONLY' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'READ_ONLY';

      try {
        switch (operation) {
          case 'system_info':
            resultData = await SystemOperations.getSystemInfo();
            break;

          case 'cpu_info':
            resultData = await SystemOperations.getCpuInfo();
            break;

          case 'memory_info':
            resultData = await SystemOperations.getMemoryInfo();
            break;

          case 'gpu_info':
            resultData = await SystemOperations.getGpuInfo();
            break;

          case 'disk_list':
            resultData = await StorageOperations.getDiskList();
            break;

          case 'mount_list':
            resultData = await StorageOperations.getMountList();
            break;

          case 'mount_device': {
            riskLevel = 'MEDIUM';
            const mountRes = await StorageOperations.mountDevice(params);
            exitCode = mountRes.exitCode;
            resultData = mountRes;
            verificationInfo = { verified: mountRes.verified, message: mountRes.verificationMessage };
            if (!mountRes.verified) exitCode = 1;
            break;
          }

          case 'unmount_device': {
            riskLevel = 'MEDIUM';
            const umountRes = await StorageOperations.unmountDevice(params);
            exitCode = umountRes.exitCode;
            resultData = umountRes;
            verificationInfo = { verified: umountRes.verified, message: umountRes.verificationMessage };
            if (!umountRes.verified) exitCode = 1;
            break;
          }

          case 'path_inspect':
            resultData = FilesystemOperations.inspectPath(params.path);
            break;

          case 'list_directory':
            resultData = FilesystemOperations.listDirectory(params.path);
            break;

          case 'create_directory': {
            riskLevel = 'LOW';
            const mkdirRes = FilesystemOperations.createDirectory(params);
            resultData = mkdirRes;
            verificationInfo = { verified: mkdirRes.verified, message: mkdirRes.verificationMessage };
            break;
          }

          case 'remove_directory': {
            riskLevel = 'MEDIUM';
            const rmdirRes = FilesystemOperations.removeDirectory(params);
            resultData = rmdirRes;
            verificationInfo = { verified: rmdirRes.verified, message: rmdirRes.verificationMessage };
            break;
          }

          case 'service_status':
            resultData = await ServiceOperations.getServiceStatus(params.unit);
            break;

          case 'control_service': {
            riskLevel = 'MEDIUM';
            const svcRes = await ServiceOperations.controlService(params);
            exitCode = svcRes.exitCode;
            resultData = svcRes;
            verificationInfo = { verified: svcRes.verified, message: svcRes.verificationMessage };
            break;
          }

          case 'network_info':
            resultData = await SystemOperations.getNetworkInfo();
            break;

          case 'process_list':
            resultData = await SystemOperations.getProcessList();
            break;

          case 'journal_query':
            resultData = await SystemOperations.getJournalQuery(params);
            break;

          case 'filesystem_info':
            resultData = await SystemOperations.getFilesystemInfo();
            break;

          case 'storage_health':
            resultData = await SystemOperations.getStorageHealth(params.device);
            break;

          case 'package_info':
            resultData = await PackageOperations.getPackageInfo(params.package || params.packageName);
            break;

          case 'install_package': {
            riskLevel = 'HIGH';
            const instRes = await PackageOperations.installPackage({ packageName: params.package || params.packageName });
            exitCode = instRes.exitCode;
            resultData = instRes;
            verificationInfo = { verified: instRes.verified, message: instRes.verificationMessage };
            if (!instRes.verified) exitCode = 1;
            break;
          }

          case 'remove_package': {
            riskLevel = 'HIGH';
            const remRes = await PackageOperations.removePackage({ packageName: params.package || params.packageName });
            exitCode = remRes.exitCode;
            resultData = remRes;
            verificationInfo = { verified: remRes.verified, message: remRes.verificationMessage };
            if (!remRes.verified) exitCode = 1;
            break;
          }

          case 'start_service':
          case 'stop_service':
          case 'restart_service': {
            riskLevel = 'MEDIUM';
            const action = operation.replace('_service', '') as 'start' | 'stop' | 'restart';
            const svcRes = await ServiceOperations.controlService({ unit: params.unit, action });
            exitCode = svcRes.exitCode;
            resultData = svcRes;
            verificationInfo = { verified: svcRes.verified, message: svcRes.verificationMessage };
            break;
          }

          case 'change_service_enabled_state': {
            riskLevel = 'MEDIUM';
            const action = params.enabled ? 'enable' : 'disable';
            const svcRes = await ServiceOperations.controlService({ unit: params.unit, action });
            exitCode = svcRes.exitCode;
            resultData = svcRes;
            verificationInfo = { verified: svcRes.verified, message: svcRes.verificationMessage };
            break;
          }

          default:
            res.writeHead(400, corsHeaders);
            res.end(JSON.stringify({ error: `Unknown or disallowed operation '${operation}'` }));
            return;
        }
      } catch (err: any) {
        exitCode = 1;
        errorObj = { code: 'OPERATION_ERROR', message: err.message || 'Execution error' };
      }

      const durationMs = Date.now() - startTime;

      // Log to append-only audit trail
      AuditLogger.log({
        requestId: reqId,
        operation,
        actor: os.userInfo().username,
        riskLevel,
        target: params.path || params.device || params.unit || params.package,
        parameters: params,
        success: exitCode === 0,
        exitCode,
        verification: verificationInfo,
        durationMs
      });

      res.writeHead(exitCode === 0 ? 200 : 500, corsHeaders);
      res.end(JSON.stringify({
        requestId: reqId,
        operation,
        success: exitCode === 0,
        exitCode,
        data: resultData,
        error: errorObj,
        verification: verificationInfo,
        durationMs,
        timestamp: new Date().toISOString()
      }));
    });
  });

  return server;
}

// Start standalone if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createDaemonServer();
  server.listen(DAEMON_PORT, DAEMON_HOST, () => {
    console.log(`[Vanguard Daemon] Secure CachyOS daemon listening on http://${DAEMON_HOST}:${DAEMON_PORT}`);
  });
}
