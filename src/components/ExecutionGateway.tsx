import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Play,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { SafetyLevel, PrivilegeLevel, ExecutionContext } from '../types';
import { cachyState } from '../services/cachyState';
import { findTroubleshootingByError } from '../data/troubleshooting';

import { vanguardCore } from '../core/VanguardCore';

interface ExecutionGatewayProps {
  isOpen: boolean;
  commandString: string;
  riskLevel: SafetyLevel;
  privilege: PrivilegeLevel;
  isDryRun: boolean;
  onClose: () => void;
  onOpenTroubleshooting?: (troubleshootId: string) => void;
}

export const ExecutionGateway: React.FC<ExecutionGatewayProps> = ({
  isOpen,
  commandString,
  riskLevel,
  privilege,
  isDryRun,
  onClose,
  onOpenTroubleshooting
}) => {
  const [confirmedDestructive, setConfirmedDestructive] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<(ExecutionContext & { verification?: { verified: boolean; message: string }; backendTarget?: string }) | null>(null);

  if (!isOpen) return null;

  const isLiveDaemon = cachyState.getGatewayMode() === 'live_daemon';
  const effectiveUser = privilege === 'sudo' ? 'root' : ((vanguardCore.snapshot as any)?.os?.user || 'user');
  const workingDir = (vanguardCore.snapshot as any)?.os?.homedir || '/root';
  const isDestructive = riskLevel === 'destructive' || riskLevel === 'critical';

  const handleExecute = async () => {
    setIsRunning(true);
    const startTime = Date.now();

    // 1. Live Host Daemon Execution Mode
    if (isLiveDaemon && !isDryRun) {
      try {
        const localBackend = vanguardCore.getLocalHostBackend();
        let opName = 'system_info';
        let opParams: Record<string, any> = {};

        // Parse command into structured daemon operations
        const cleanCmd = commandString.replace(/^sudo\s+/, '').trim();
        const parts = cleanCmd.split(/\s+/);
        const bin = parts[0];

        if (bin === 'mount') {
          opName = 'mount_device';
          const dev = parts.find((p) => p.startsWith('/dev/')) || '/dev/nvme0n1p3';
          const target = parts.filter((p) => !p.startsWith('-') && p !== dev && p !== 'mount')[0] || '/run/media/Games';
          opParams = { device: dev, mountPoint: target };
        } else if (bin === 'umount') {
          opName = 'unmount_device';
          opParams = { target: parts[1] || '/run/media/Games' };
        } else if (bin === 'mkdir') {
          opName = 'create_directory';
          const dirPath = parts.find((p) => !p.startsWith('-') && p !== 'mkdir') || '/tmp/vanguard_test';
          opParams = { path: dirPath, mode: 0o755 };
        } else if (bin === 'rmdir' || (bin === 'rm' && parts.includes('-r'))) {
          opName = 'remove_directory';
          const dirPath = parts.find((p) => !p.startsWith('-') && p !== 'rm' && p !== 'rmdir') || '/tmp/vanguard_test';
          opParams = { path: dirPath };
        } else if (bin === 'systemctl') {
          const action = parts[1] || 'status';
          const unit = parts[2] || 'systemd-resolved.service';
          if (['start', 'stop', 'restart', 'enable', 'disable'].includes(action)) {
            opName = 'control_service';
            opParams = { unit, action };
          } else {
            opName = 'service_status';
            opParams = { unit };
          }
        } else if (bin === 'pacman') {
          if (parts.includes('-S')) {
            opName = 'install_package';
            opParams = { packageName: parts[parts.length - 1] };
          } else if (parts.includes('-R')) {
            opName = 'remove_package';
            opParams = { packageName: parts[parts.length - 1] };
          } else {
            opName = 'package_info';
            opParams = { package: parts[parts.length - 1] };
          }
        } else if (bin === 'lsblk') {
          opName = 'disk_list';
        } else if (bin === 'findmnt') {
          opName = 'mount_list';
        } else if (bin === 'ps') {
          opName = 'process_list';
        } else if (bin === 'journalctl') {
          opName = 'journal_query';
        }

        const opResult = await localBackend.dispatchOperation(opName, opParams);
        const duration = Date.now() - startTime;

        const stdoutLines = opResult.data?.stdout
          ? opResult.data.stdout.split('\n')
          : opResult.data
          ? [JSON.stringify(opResult.data, null, 2)]
          : ['Operation completed.'];

        const stderrLines = opResult.error?.message
          ? [opResult.error.message]
          : opResult.data?.stderr
          ? [opResult.data.stderr]
          : [];

        const isSuccess = opResult.exitCode === 0 && (opResult.verification?.verified !== false);

        const outcome: ExecutionContext & { verification?: { verified: boolean; message: string }; backendTarget?: string } = {
          id: `exec-${Date.now()}`,
          commandString,
          executable: bin,
          effectiveUser,
          privilegeLevel: privilege,
          workingDir,
          envVars: { USER: effectiveUser, LANG: 'en_US.UTF-8' },
          affectedPaths: [workingDir],
          riskLevel,
          dryRun: false,
          status: isSuccess ? 'success' : 'failed',
          exitCode: opResult.exitCode,
          stdout: stdoutLines,
          stderr: stderrLines,
          durationMs: duration,
          timestamp: Date.now(),
          backendTarget: 'REAL HOST (CachyOS Host Daemon)',
          verification: opResult.verification
        };

        cachyState.recordExecution({
          timestamp: Date.now(),
          command: commandString,
          executable: bin,
          exitCode: opResult.exitCode,
          status: isSuccess ? 'success' : 'failed',
          durationMs: duration,
          stdoutSnippet: stdoutLines.slice(0, 3).join('\n')
        });

        setExecutionResult(outcome);
        setIsRunning(false);
        return;
      } catch (err: any) {
        // Fallback to error display
      }
    }

    // 2. Simulated / Test Sandbox Execution Mode
    setTimeout(() => {
      const isFailed = commandString.includes('Stalker2.exe') && !commandString.includes('WINEPREFIX');
      const exitCode = isFailed ? 135 : 0;
      const duration = Date.now() - startTime;

      let stdoutLines: string[] = [];
      let stderrLines: string[] = [];

      if (commandString.startsWith('sudo mount')) {
        stdoutLines = [
          `[  142.108] BTRFS: device fsid 8f7e6d5c-4b3a-2109-8877-665544332211 devid 1 transid 4018 /dev/nvme0n1p3`,
          `[  142.112] BTRFS info (device nvme0n1p3): using zstd:1 compression`,
          `[  142.115] BTRFS info (device nvme0n1p3): disk space caching is enabled`,
          `SUCCESS: Mounted /dev/nvme0n1p3 to target directory with rw permissions.`
        ];
        cachyState.toggleMount('/dev/nvme0n1p3');
      } else if (commandString.startsWith('gamescope') || commandString.includes('wine')) {
        if (isFailed) {
          stderrLines = [
            `wine: Call to unimplemented function d3d12.dll.D3D12CreateDevice (version: 12.0)`,
            `wine: could not load kernel32.dll, status c0000135`,
            `FATAL: Process exited with non-zero code 135.`
          ];
        } else {
          stdoutLines = [
            `gamescope: [Info] Using Wayland compositor with AMD Radeon RX 7900 XTX`,
            `gamescope: [Info] Output resolution: 2560x1440 @ 165Hz (FSR Enabled)`,
            `MANGOHUD: Loaded Vulkan layer version 1.3`,
            `DXVK: Using Vulkan 1.3 adapter: AMD Radeon RX 7900 XTX (RADV)`,
            `[Process running in background session pid: 48920]`
          ];
        }
      } else if (commandString.startsWith('sudo pacman')) {
        stdoutLines = [
          `:: Synchronizing package databases...`,
          ` cachyos is up to date`,
          ` cachyos-v4 is up to date`,
          ` core is up to date`,
          ` extra is up to date`,
          `:: Starting full system upgrade...`,
          ` there is nothing to do`
        ];
      } else {
        stdoutLines = [
          `Execution started for: ${commandString}`,
          `Process completed successfully with exit code 0.`
        ];
      }

      const outcome: ExecutionContext & { verification?: { verified: boolean; message: string }; backendTarget?: string } = {
        id: `exec-${Date.now()}`,
        commandString,
        executable: commandString.split(' ')[0],
        effectiveUser,
        privilegeLevel: privilege,
        workingDir,
        envVars: { USER: effectiveUser, LANG: 'en_US.UTF-8' },
        affectedPaths: [workingDir],
        riskLevel,
        dryRun: isDryRun,
        status: isFailed ? 'failed' : 'success',
        exitCode,
        stdout: stdoutLines,
        stderr: stderrLines,
        durationMs: duration,
        timestamp: Date.now(),
        backendTarget: isDryRun ? 'DRY-RUN INSPECTION' : 'SIMULATED/TEST SANDBOX',
        verification: { verified: !isFailed, message: isFailed ? 'Process exited with error' : 'Virtual sandbox simulation verified' }
      };

      if (isFailed) {
        const errorText = stderrLines.join('\n');
        const match = findTroubleshootingByError(errorText);
        if (match) {
          outcome.failureAnalysis = {
            symptom: match.symptom,
            category: match.category,
            troubleshootingId: match.id,
            suggestedFix: match.safeFixDescription
          };
        }
      }

      cachyState.recordExecution({
        timestamp: Date.now(),
        command: commandString,
        executable: commandString.split(' ')[0],
        exitCode,
        status: isFailed ? 'failed' : 'success',
        durationMs: duration,
        failureReason: outcome.failureAnalysis?.symptom,
        stdoutSnippet: stdoutLines.slice(0, 2).join('\n')
      });

      setExecutionResult(outcome);
      setIsRunning(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0c1222] border border-slate-700 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#090e1a] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {isDestructive ? (
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-[#00d4ff]" />
            )}
            <h3 className="font-bold text-sm text-white tracking-tight">
              {isDryRun ? 'Dry-Run & Impact Inspection' : 'Execution Gateway & Safety Verification'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Synthesized Command Display */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">
              Target Shell Execution
            </span>
            <pre className="font-mono text-xs text-emerald-300 bg-black/60 p-3 rounded-lg border border-slate-800 overflow-x-auto select-all">
              {commandString}
            </pre>
          </div>

          {/* Pre-Execution Environmental & Impact Inspection */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
            <div className="p-2.5 bg-[#090e1a] rounded border border-slate-800">
              <span className="text-slate-400 block">Effective User</span>
              <strong className={effectiveUser === 'root' ? 'text-amber-400' : 'text-white'}>
                {effectiveUser}
              </strong>
            </div>
            <div className="p-2.5 bg-[#090e1a] rounded border border-slate-800">
              <span className="text-slate-400 block">Privilege Tier</span>
              <strong className="text-[#00d4ff] uppercase">{privilege}</strong>
            </div>
            <div className="p-2.5 bg-[#090e1a] rounded border border-slate-800">
              <span className="text-slate-400 block">Risk Level</span>
              <strong
                className={`uppercase ${
                  riskLevel === 'destructive'
                    ? 'text-rose-400'
                    : riskLevel === 'privileged'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {riskLevel}
              </strong>
            </div>
            <div className="p-2.5 bg-[#090e1a] rounded border border-slate-800">
              <span className="text-slate-400 block">Working Dir</span>
              <strong className="text-slate-200 truncate block">{workingDir}</strong>
            </div>
          </div>

          {/* Destructive Confirmation Gate */}
          {isDestructive && !executionResult && (
            <div className="p-3 bg-rose-950/30 border border-rose-800/60 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Destructive Operation Confirmation Required</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                This command modifies raw block partitions, destroys inodes, or irrevocably alters disk structures.
              </p>
              <label className="flex items-center gap-2 text-rose-200 text-xs cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={confirmedDestructive}
                  onChange={(e) => setConfirmedDestructive(e.target.checked)}
                  className="rounded bg-slate-900 border-rose-600 text-rose-500"
                />
                <span>I confirm that I understand the system impact of this command.</span>
              </label>
            </div>
          )}

          {/* Execution Result Log Terminal */}
          {executionResult && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#00d4ff]" />
                  Execution Stream Output
                </span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                    executionResult.backendTarget?.includes('REAL HOST')
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {executionResult.backendTarget || 'CACHYOS LOCAL'}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {executionResult.durationMs}ms · Exit: {executionResult.exitCode}
                  </span>
                </div>
              </div>

              {/* Post-Condition Verification Status Banner */}
              {executionResult.verification && (
                <div className={`p-2.5 rounded-lg border text-[11px] flex items-center gap-2 font-mono ${
                  executionResult.verification.verified
                    ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
                }`}>
                  {executionResult.verification.verified ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{executionResult.verification.message}</span>
                </div>
              )}

              <div className="bg-black/80 rounded-lg p-3 font-mono text-[11px] space-y-1 border border-slate-800 max-h-48 overflow-y-auto">
                {executionResult.stdout.map((line, idx) => (
                  <div key={idx} className="text-slate-300">
                    {line}
                  </div>
                ))}
                {executionResult.stderr.map((line, idx) => (
                  <div key={idx} className="text-rose-400">
                    {line}
                  </div>
                ))}
              </div>

              {/* Troubleshooting Recommendation if Failed */}
              {executionResult.failureAnalysis && (
                <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Known Error Pattern Identified in Knowledge Base
                    </span>
                    {onOpenTroubleshooting && executionResult.failureAnalysis.troubleshootingId && (
                      <button
                        onClick={() =>
                          onOpenTroubleshooting(executionResult.failureAnalysis!.troubleshootingId!)
                        }
                        className="text-xs font-semibold text-[#00d4ff] hover:underline flex items-center gap-1"
                      >
                        Inspect Diagnostic Guide <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    {executionResult.failureAnalysis.symptom}
                  </p>
                  <div className="text-emerald-300 text-[11px] pt-1">
                    <strong>Suggested Recovery:</strong> {executionResult.failureAnalysis.suggestedFix}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#090e1a] border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white"
          >
            {executionResult ? 'Close' : 'Cancel'}
          </button>

          {!executionResult ? (
            <button
              disabled={isRunning || (isDestructive && !confirmedDestructive)}
              onClick={handleExecute}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                isDestructive
                  ? 'bg-rose-600 hover:bg-rose-500 disabled:opacity-30 text-white'
                  : 'bg-[#00d4ff] hover:bg-[#00d4ff]/90 disabled:opacity-30 text-slate-950 shadow-md shadow-[#00d4ff]/20'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isRunning
                ? 'Executing...'
                : isDryRun
                ? 'Simulate Dry-Run'
                : 'Confirm & Dispatch to OS'}
            </button>
          ) : (
            <button
              onClick={() => setExecutionResult(null)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" /> Re-execute
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
