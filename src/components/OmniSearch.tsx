import React, { useState, useEffect, useRef } from 'react';
import { Search, Terminal, Folder, File, HardDrive, Gamepad2, ArrowRight, CornerDownLeft, X, Sparkles } from 'lucide-react';
import { ALL_COMMANDS } from '../data/commands';
import { WORKFLOWS_DATABASE } from '../data/workflows';
import { cachyState } from '../services/cachyState';
import { UniversalContextObject } from '../types';

interface OmniSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCommand: (commandId: string) => void;
  onSelectContextObject: (obj: UniversalContextObject) => void;
  onSelectWorkflow: (workflowId: string) => void;
}

export const OmniSearch: React.FC<OmniSearchProps> = ({
  isOpen,
  onClose,
  onSelectCommand,
  onSelectContextObject,
  onSelectWorkflow
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isOpen && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        // open search with '/'
        setQuery('/');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isPathMode = query.startsWith('/');
  const trimmed = query.trim().toLowerCase();

  // Search Commands
  const matchingCommands = ALL_COMMANDS.filter((cmd) => {
    if (!trimmed || isPathMode) return false;
    return (
      cmd.name.toLowerCase().includes(trimmed) ||
      cmd.executable.toLowerCase().includes(trimmed) ||
      cmd.category.toLowerCase().includes(trimmed) ||
      cmd.description.toLowerCase().includes(trimmed)
    );
  }).slice(0, 5);

  // Search Workflows
  const matchingWorkflows = WORKFLOWS_DATABASE.filter((wf) => {
    if (!trimmed || isPathMode) return false;
    return (
      wf.name.toLowerCase().includes(trimmed) ||
      wf.description.toLowerCase().includes(trimmed) ||
      wf.category.toLowerCase().includes(trimmed)
    );
  }).slice(0, 3);

  // Search Filesystem & Devices
  const allFiles = cachyState.getFileSystemItems();
  const allDevices = cachyState.getBlockDevices();

  let matchingFiles = allFiles.filter((item) => {
    if (isPathMode) {
      return item.path.toLowerCase().startsWith(trimmed);
    }
    if (!trimmed) return true;
    return item.name.toLowerCase().includes(trimmed) || item.path.toLowerCase().includes(trimmed);
  }).slice(0, 6);

  let matchingDevices = allDevices.filter((dev) => {
    if (isPathMode) {
      return dev.path.toLowerCase().startsWith(trimmed);
    }
    if (!trimmed) return false;
    return (
      dev.name.toLowerCase().includes(trimmed) ||
      dev.label.toLowerCase().includes(trimmed) ||
      dev.path.toLowerCase().includes(trimmed) ||
      dev.fsType.toLowerCase().includes(trimmed)
    );
  }).slice(0, 4);

  // Natural Language Intent Helper
  const isIntentMount = trimmed.includes('mount') || trimmed.includes('drive') || trimmed.includes('disk');
  const isIntentWine = trimmed.includes('exe') || trimmed.includes('wine') || trimmed.includes('proton') || trimmed.includes('game');
  const isIntentService = trimmed.includes('restart') || trimmed.includes('service') || trimmed.includes('jellyfin');

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-2xl bg-[#0c1222] border border-[#00d4ff]/30 rounded-xl shadow-[0_0_30px_rgba(0,212,255,0.15)] overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-[#090e1a]">
          <Search className="w-5 h-5 text-[#00d4ff] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type command, /path, .exe, device, or natural intent (e.g. 'mount ssd')..."
            className="w-full bg-transparent text-white text-sm placeholder:text-slate-500 focus:outline-hidden"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline font-mono text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Path Quick Bar when in path mode */}
        {isPathMode && (
          <div className="px-4 py-2 bg-[#080c16] border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs text-slate-400">
            <span className="text-[#00d4ff] font-medium shrink-0">Path roots:</span>
            {['/dev/', '/run/media/cachy/', '/home/cachy/', '/home/cachy/Documents/My Games/', '/mnt/'].map((p) => (
              <button
                key={p}
                onClick={() => setQuery(p)}
                className="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 font-mono text-[11px] whitespace-nowrap"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Results Body */}
        <div className="overflow-y-auto p-3 space-y-4">
          {/* Natural Language Intent Suggestion */}
          {(isIntentMount || isIntentWine || isIntentService) && !isPathMode && (
            <div className="p-2.5 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-xs">
              <div className="flex items-center gap-1.5 text-[#00d4ff] font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Detected Operational Intent
              </div>
              <div className="text-slate-300 flex items-center justify-between">
                <span>
                  {isIntentMount && 'Prepare and safely mount storage devices using Btrfs/NTFS parameters.'}
                  {isIntentWine && 'Configure Wine/Proton compatibility layer, Gamescope, and Documents redirection.'}
                  {isIntentService && 'Query systemd unit status and restart active system services.'}
                </span>
                <button
                  onClick={() => {
                    if (isIntentMount) onSelectCommand('mount');
                    else if (isIntentWine) onSelectCommand('wine');
                    else if (isIntentService) onSelectCommand('systemctl');
                    onClose();
                  }}
                  className="px-2 py-1 rounded bg-[#00d4ff] text-slate-950 font-bold hover:bg-[#00d4ff]/90 shrink-0 ml-2"
                >
                  Open Builder
                </button>
              </div>
            </div>
          )}

          {/* Commands Section */}
          {matchingCommands.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-2 mb-1.5 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#00d4ff]" />
                Command Knowledge Base
              </div>
              <div className="space-y-1">
                {matchingCommands.map((cmd) => (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      onSelectCommand(cmd.id);
                      onClose();
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-[#142038] flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-sm font-bold text-[#00d4ff] group-hover:underline">
                        {cmd.executable}
                      </span>
                      <span className="text-xs text-slate-400 truncate">{cmd.description}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {cmd.privilege === 'sudo' ? 'sudo' : 'user'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Workflows Section */}
          {matchingWorkflows.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-2 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Multi-Step Workflows
              </div>
              <div className="space-y-1">
                {matchingWorkflows.map((wf) => (
                  <button
                    key={wf.id}
                    onClick={() => {
                      onSelectWorkflow(wf.id);
                      onClose();
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-[#142038] flex items-center justify-between group transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white group-hover:text-[#00d4ff]">
                        {wf.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{wf.description}</div>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono shrink-0 ml-2">
                      {wf.steps.length} steps
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Devices Section */}
          {matchingDevices.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-2 mb-1.5 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                Storage Block Devices & Partitions
              </div>
              <div className="space-y-1">
                {matchingDevices.map((dev) => (
                  <button
                    key={dev.path}
                    onClick={() => {
                      const ctx = cachyState.resolveContextObject(dev.path);
                      onSelectContextObject(ctx);
                      onClose();
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-[#142038] flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-white font-semibold">{dev.path}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-amber-300">{dev.fsType.toUpperCase()}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-300">{dev.label || dev.size}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {dev.isMounted ? `Mounted on ${dev.mountPoint}` : 'Unmounted'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filesystem Items Section */}
          {matchingFiles.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-2 mb-1.5 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-[#00d4ff]" />
                Filesystem Objects & Executables
              </div>
              <div className="space-y-1">
                {matchingFiles.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      const ctx = cachyState.resolveContextObject(f.path);
                      onSelectContextObject(ctx);
                      onClose();
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-[#142038] flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {f.type === 'win_exe' ? (
                        <Gamepad2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : f.type === 'directory' ? (
                        <Folder className="w-4 h-4 text-[#00d4ff] shrink-0" />
                      ) : (
                        <File className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-mono text-xs text-white truncate flex items-center gap-2">
                          <span>{f.name}</span>
                          {f.type === 'win_exe' && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 rounded border border-emerald-500/30">
                              Windows EXE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">{f.path}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                      {f.displaySize || f.permissions}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchingCommands.length === 0 && matchingFiles.length === 0 && matchingDevices.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              No matching commands or paths found for "{query}".
              <div className="mt-1 text-slate-400">
                Tip: Type <code className="text-[#00d4ff] font-mono">/dev/</code> to inspect storage, or <code className="text-[#00d4ff] font-mono">mount</code> to build a command.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
