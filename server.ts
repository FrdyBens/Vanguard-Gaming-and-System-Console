/**
 * Vanguard CachyOS Full-Stack Server
 * Hosts the Vanguard React console on port 3000 while orchestrating
 * the authenticated local loopback daemon on 127.0.0.1:9090
 */

import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { createServer as createViteServer } from 'vite';
import { createDaemonServer } from './daemon/vanguard-daemon';
import { DAEMON_HOST, DAEMON_PORT, DAEMON_TOKEN_FILE, AUDIT_LOG_FILE } from './daemon/config';
import { DaemonSecurity } from './daemon/security';

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '128kb' }));

  // Initialize daemon auth token in ~/.config/vanguard/daemon/auth.token (mode 0700/0600)
  const daemonToken = DaemonSecurity.initDaemonAuth();
  console.log(`[Vanguard Server] Initialized secure daemon token`);

  // Start internal loopback daemon on 127.0.0.1:9090
  let daemonServer: http.Server | null = null;
  try {
    daemonServer = createDaemonServer();
    daemonServer.listen(DAEMON_PORT, DAEMON_HOST, () => {
      console.log(`[Vanguard Daemon] Secure local loopback daemon listening on http://${DAEMON_HOST}:${DAEMON_PORT}`);
    });
    daemonServer.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[Vanguard Daemon] Port ${DAEMON_PORT} is already in use (external daemon running).`);
      } else {
        console.error(`[Vanguard Daemon] Error starting daemon:`, err);
      }
    });
  } catch (err) {
    console.error(`[Vanguard Server] Failed to initialize internal daemon:`, err);
  }

  // --------------------------------------------------------------------------
  // REST API: Secure Daemon Bridge Proxy
  // Browser calls this server-side proxy which signs requests with local token
  // --------------------------------------------------------------------------

  // 1. Health check
  app.get('/api/daemon/health', async (_req, res) => {
    try {
      const response = await fetch(`http://${DAEMON_HOST}:${DAEMON_PORT}/health`);
      if (response.ok) {
        const data = await response.json();
        res.json({
          status: 'ok',
          daemonRunning: true,
          endpoint: `http://${DAEMON_HOST}:${DAEMON_PORT}`,
          hostUser: os.userInfo().username,
          data
        });
        return;
      }
      res.status(502).json({ status: 'error', daemonRunning: false, message: 'Daemon health check failed' });
    } catch (err: any) {
      res.status(503).json({ status: 'offline', daemonRunning: false, error: err.message });
    }
  });

  // 2. Daemon status & authentication info (does NOT expose the secret itself)
  app.get('/api/daemon/status', (_req, res) => {
    const tokenExists = fs.existsSync(DAEMON_TOKEN_FILE);
    let tokenPerms = 'unknown';
    try {
      if (tokenExists) {
        const stat = fs.statSync(DAEMON_TOKEN_FILE);
        tokenPerms = '0' + (stat.mode & 0o777).toString(8);
      }
    } catch {
      // ignore
    }

    res.json({
      daemonHost: DAEMON_HOST,
      daemonPort: DAEMON_PORT,
      tokenConfigured: tokenExists,
      tokenFile: DAEMON_TOKEN_FILE,
      tokenPermissions: tokenPerms,
      user: os.userInfo().username,
      uid: os.userInfo().uid,
      homedir: os.userInfo().homedir,
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime()
    });
  });

  // 3. Structured operation dispatch
  // Signs and routes structured operations from UI through to local daemon
  app.post('/api/daemon/dispatch', async (req, res) => {
    const { operation, parameters } = req.body || {};

    if (!operation || typeof operation !== 'string') {
      res.status(400).json({ error: 'Operation name is required' });
      return;
    }

    const requestId = `req-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString('hex');

    try {
      const daemonResponse = await fetch(`http://${DAEMON_HOST}:${DAEMON_PORT}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${daemonToken}`,
          'x-vanguard-request-id': requestId,
          'x-vanguard-timestamp': timestamp,
          'x-vanguard-nonce': nonce
        },
        body: JSON.stringify({
          operation,
          parameters: parameters || {}
        })
      });

      const responseData = await daemonResponse.json();
      res.status(daemonResponse.status).json(responseData);
    } catch (err: any) {
      res.status(502).json({
        requestId,
        operation,
        success: false,
        exitCode: 502,
        error: { code: 'DAEMON_UNREACHABLE', message: `Cannot connect to 127.0.0.1:${DAEMON_PORT}: ${err.message}` }
      });
    }
  });

  // 4. Audit Log access for UI inspection
  app.get('/api/daemon/audit', (_req, res) => {
    if (!fs.existsSync(AUDIT_LOG_FILE)) {
      res.json({ records: [], total: 0 });
      return;
    }

    try {
      const raw = fs.readFileSync(AUDIT_LOG_FILE, 'utf8');
      const lines = raw.trim().split('\n').filter(Boolean);
      const records = lines
        .slice(-100) // Return last 100 entries
        .map((l) => {
          try {
            return JSON.parse(l);
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .reverse();

      res.json({ records, total: lines.length });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to read audit log: ${err.message}` });
    }
  });

  // 5. Host Daemon Security Test Suite
  app.get('/api/daemon/tests', async (_req, res) => {
    try {
      const { runDaemonSecurityTests } = await import('./daemon/daemon.test');
      const testResults = await runDaemonSecurityTests();
      res.json(testResults);
    } catch (err: any) {
      res.status(500).json({ allPassed: false, error: err.message, results: [] });
    }
  });

  // --------------------------------------------------------------------------
  // Vite Integration (React SPA Frontend on port 3000)
  // --------------------------------------------------------------------------
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Vanguard Console] Server listening on http://0.0.0.0:${PORT}`);
  });

  // Graceful termination
  const shutdown = () => {
    console.log(`[Vanguard Server] Shutting down...`);
    if (daemonServer) {
      daemonServer.close();
    }
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('[Vanguard Server] Fatal startup failure:', err);
  process.exit(1);
});
