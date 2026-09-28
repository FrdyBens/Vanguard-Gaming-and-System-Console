import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  Eye,
  AlertTriangle,
  Info,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ChevronDown,
  Layers,
  FolderPlus
} from 'lucide-react';
import { CommandDefinition, SafetyLevel, PrivilegeLevel } from '../types';
import { ALL_COMMANDS } from '../data/commands';
import { cachyState } from '../services/cachyState';

interface CommandBuilderProps {
  initialCommandId?: string;
  initialCustomCommand?: string;
  onRunCommand: (commandString: string, riskLevel: SafetyLevel, priv: PrivilegeLevel, dryRun: boolean) => void;
}

export const CommandBuilder: React.FC<CommandBuilderProps> = ({
  initialCommandId = 'mount',
  initialCustomCommand,
  onRunCommand
}) => {
  const [selectedCommandId, setSelectedCommandId] = useState(initialCommandId);
  const currentCommand = ALL_COMMANDS.find((c) => c.id === selectedCommandId) || ALL_COMMANDS[0];

  // Dynamic argument values
  const [argValues, setArgValues] = useState<Record<string, string>>({});
  // Active flag options
  const [selectedFlags, setSelectedFlags] = useState<Record<string, boolean | string>>({});

  // Missing path state detector
  const [missingPathWarning, setMissingPathWarning] = useState<string | null>(null);

  // Initialize argument values when command changes
  useEffect(() => {
    const defaults: Record<string, string> = {};
    currentCommand.arguments.forEach((arg) => {
      defaults[arg.name] = (arg.defaultValue as string) || (arg.suggestions && arg.suggestions[0]) || '';
    });
    setArgValues(defaults);
    setSelectedFlags({});
    setMissingPathWarning(null);
  }, [selectedCommandId]);

  // Check for missing path when values change
  useEffect(() => {
    // If an argument is a path or mount_point or directory, check against virtual file system
    const allFiles = cachyState.getFileSystemItems();
    let detectedMissing: string | null = null;

    currentCommand.arguments.forEach((arg) => {
      if (arg.type === 'mount_point' || arg.type === 'directory' || arg.type === 'path') {
        const val = argValues[arg.name];
        if (val && val.startsWith('/')) {
          const exists = allFiles.some((f) => f.path === val);
          if (!exists) {
            detectedMissing = val;
          }
        }
      }
    });

    setMissingPathWarning(detectedMissing);
  }, [argValues, currentCommand]);

  // Generate real shell command string
  const generateCommandString = (): string => {
    const parts: string[] = [];

    // Privilege prefix
    if (currentCommand.privilege === 'sudo') {
      parts.push('sudo');
    }

    // Fixed executable component
    parts.push(currentCommand.executable);

    // Active flags from options
    currentCommand.commonOptions.forEach((opt) => {
      const val = selectedFlags[opt.flag];
      if (val === true) {
        parts.push(opt.flag);
      } else if (typeof val === 'string' && val.trim()) {
        parts.push(`${opt.flag} "${val.trim()}"`);
      }
    });

    // Dynamic arguments
    currentCommand.arguments.forEach((arg) => {
      const val = argValues[arg.name];
      if (val) {
        if (arg.isFlag && arg.flagName) {
          parts.push(`${arg.flagName} "${val}"`);
        } else {
          // If value has spaces or special chars, escape or quote
          parts.push(val.includes(' ') ? `"${val}"` : val);
        }
      }
    });

    return parts.join(' ');
  };

  const commandString = generateCommandString();

  const handleFixMissingPath = () => {
    if (!missingPathWarning) return;
    // Add path to virtual filesystem
    const parts = missingPathWarning.split('/').filter(Boolean);
    const folderName = parts[parts.length - 1];
    const parentPath = '/' + parts.slice(0, -1).join('/');
    cachyState.createFolder(parentPath, folderName);
    setMissingPathWarning(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-[#070a12] text-slate-100 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Command Selector Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#0b101e] border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff]">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-mono">Selected Capability</span>
            <div className="flex items-center gap-2">
              <select
                value={selectedCommandId}
                onChange={(e) => setSelectedCommandId(e.target.value)}
                className="bg-[#0e1628] border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-hidden focus:border-[#00d4ff]"
              >
                {ALL_COMMANDS.map((cmd) => (
                  <option key={cmd.id} value={cmd.id}>
                    {cmd.name} — {cmd.description.slice(0, 50)}...
                  </option>
                ))}
              </select>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                  currentCommand.safetyLevel === 'destructive'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : currentCommand.safetyLevel === 'privileged'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}
              >
                {currentCommand.safetyLevel}
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono flex items-center gap-3">
          <span>Category: <strong className="text-slate-200 capitalize">{currentCommand.category}</strong></span>
          <span>·</span>
          <span>Privilege: <strong className="text-slate-200">{currentCommand.privilege.toUpperCase()}</strong></span>
        </div>
      </div>

      {/* Real-Time Generated Command Preview Banner */}
      <div className="p-4 rounded-xl bg-[#090e1a] border border-[#00d4ff]/30 space-y-3 shadow-[0_0_20px_rgba(0,212,255,0.08)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#00d4ff] flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            SYNTHESIZED COMMAND (SHELL-ESCAPED)
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Auto-formatted with privilege boundaries
          </span>
        </div>

        <div className="font-mono text-sm text-emerald-300 bg-black/60 p-3 rounded-lg border border-slate-800 overflow-x-auto select-all">
          {commandString}
        </div>

        {/* Missing Path Alert & Prerequisite Generator */}
        {missingPathWarning && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs flex items-center justify-between gap-3 text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Target mount path <strong>{missingPathWarning}</strong> does not exist on the filesystem tree.
              </span>
            </div>
            <button
              onClick={handleFixMissingPath}
              className="px-3 py-1 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 text-xs shrink-0 flex items-center gap-1.5"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              Add "mkdir -p" Prerequisite
            </button>
          </div>
        )}

        {/* Dry-Run & Execute Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => onRunCommand(commandString, currentCommand.safetyLevel, currentCommand.privilege, true)}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-2 border border-slate-700"
          >
            <Eye className="w-3.5 h-3.5 text-[#00d4ff]" />
            Preview & Dry-Run
          </button>
          <button
            onClick={() => onRunCommand(commandString, currentCommand.safetyLevel, currentCommand.privilege, false)}
            className="px-5 py-2 rounded-lg bg-[#00d4ff] hover:bg-[#00d4ff]/90 text-slate-950 text-xs font-bold transition-colors flex items-center gap-2 shadow-lg shadow-[#00d4ff]/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Execute in Gateway
          </button>
        </div>
      </div>

      {/* Main Form: Fixed vs Dynamic Argument Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Progressive Dynamic Parameters */}
        <div className="lg:col-span-2 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#00d4ff]" />
            Dynamic Parameters ({currentCommand.arguments.length})
          </div>

          <div className="space-y-4 bg-[#0a0f1d] border border-slate-800 rounded-xl p-5">
            {currentCommand.arguments.map((arg) => {
              // Discovered values based on detection method
              let discoveredOptions: string[] = arg.suggestions || [];
              if (arg.detectionMethod === 'detect_block_devices') {
                discoveredOptions = cachyState.getBlockDevices().map((b) => b.path);
              }

              return (
                <div key={arg.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>{arg.label}</span>
                      {arg.required && (
                        <span className="text-[10px] text-amber-400 font-mono">(required)</span>
                      )}
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">type: {arg.type}</span>
                  </div>

                  <p className="text-[11px] text-slate-400">{arg.description}</p>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={argValues[arg.name] || ''}
                      onChange={(e) =>
                        setArgValues((prev) => ({ ...prev, [arg.name]: e.target.value }))
                      }
                      placeholder={arg.placeholder || 'Enter value...'}
                      className="flex-1 bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-[#00d4ff]"
                    />
                  </div>

                  {/* Discovered / Machine-Aware Quick Badges */}
                  {discoveredOptions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-mono">Discovered:</span>
                      {discoveredOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setArgValues((prev) => ({ ...prev, [arg.name]: opt }))}
                          className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-[#00d4ff] text-[11px] font-mono border border-slate-700/60 transition-colors"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Common Options & Flags */}
            {currentCommand.commonOptions.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-300 block">
                  Common Options & Flags
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentCommand.commonOptions.map((opt) => (
                    <div
                      key={opt.flag}
                      className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800/80 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono text-[#00d4ff] flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!selectedFlags[opt.flag]}
                            onChange={(e) =>
                              setSelectedFlags((prev) => ({
                                ...prev,
                                [opt.flag]: e.target.checked
                              }))
                            }
                            className="rounded bg-slate-900 border-slate-700 text-[#00d4ff]"
                          />
                          <span>{opt.flag}</span>
                        </label>
                        <span className="text-[10px] text-slate-400">{opt.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 pl-5">{opt.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deep Documentation & CachyOS Intelligence */}
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#00d4ff]" />
            Documentation & System Impact
          </div>

          <div className="bg-[#0a0f1d] border border-slate-800 rounded-xl p-4 space-y-4 text-xs">
            {/* What it does */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                What It Does
              </span>
              <p className="text-slate-300 leading-relaxed">{currentCommand.whatItDoes}</p>
            </div>

            {/* Why use it */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Why You Would Use It
              </span>
              <p className="text-slate-300 leading-relaxed">{currentCommand.whyUseIt}</p>
            </div>

            {/* When NOT to use it */}
            <div>
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block mb-1">
                When NOT to Use It
              </span>
              <p className="text-amber-200/90 leading-relaxed bg-amber-950/20 p-2.5 rounded border border-amber-900/30">
                {currentCommand.whenNotToUseIt}
              </p>
            </div>

            {/* CachyOS specific notes */}
            {currentCommand.cachyOsNotes && (
              <div className="p-3 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/20">
                <span className="text-[11px] font-bold text-[#00d4ff] uppercase tracking-wider block mb-1">
                  CachyOS Specialized Tuning
                </span>
                <p className="text-slate-200 leading-relaxed">{currentCommand.cachyOsNotes}</p>
              </div>
            )}

            {/* Common Mistakes */}
            {currentCommand.commonMistakes.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Common Mistakes to Avoid
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  {currentCommand.commonMistakes.map((m, idx) => (
                    <li key={idx} className="leading-snug">{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
