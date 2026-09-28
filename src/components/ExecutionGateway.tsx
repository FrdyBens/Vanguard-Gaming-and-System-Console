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
  const [executionResult, setExecutionResult] = useState<ExecutionContext | null>(null);

  if (!isOpen) return null;

  const effectiveUser = privilege === 'sudo' ? 'root' : 'cachy';
  const workingDir = '/home/cachy';
  const isDestructive = riskLevel === 'destructive' || riskLevel === 'critical';

  const handleExecute = () => {
    setIsRunning(true);
    const startTime = Date.now();

    // Simulate realistic execution timing & response
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
        // update simulated state
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

      const outcome: ExecutionContext = {
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
        timestamp: Date.now()
      };

      // Check if matches troubleshooting database
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

      // Record in contextual history
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
    }, 700);
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
                <span className="font-mono text-[11px] text-slate-400 flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  {executionResult.durationMs}ms · Exit Code: {executionResult.exitCode}
                </span>
              </div>

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
