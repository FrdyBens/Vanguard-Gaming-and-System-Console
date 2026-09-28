import React, { useState } from 'react';
import {
  HardDrive,
  Gamepad2,
  Folder,
  File,
  Terminal,
  Layers,
  Copy,
  Check,
  Play,
  Settings,
  AlertOctagon,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { UniversalContextObject, ExecutionRecord, SafetyLevel } from '../types';

interface UniversalContextCardProps {
  contextObject: UniversalContextObject;
  onExecuteAction: (actionId: string, commandTemplate?: string, risk?: SafetyLevel) => void;
  onOpenInCommandBuilder?: (cmdString: string) => void;
  onClose?: () => void;
}

export const UniversalContextCard: React.FC<UniversalContextCardProps> = ({
  contextObject,
  onExecuteAction,
  onOpenInCommandBuilder,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'history'>('overview');

  const handleCopyPath = () => {
    navigator.clipboard.writeText(contextObject.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeIcon = () => {
    switch (contextObject.type) {
      case 'device':
      case 'partition':
      case 'mount':
        return <HardDrive className="w-5 h-5 text-amber-400" />;
      case 'win_exe':
      case 'wine_prefix':
      case 'proton_prefix':
      case 'steam_game':
        return <Gamepad2 className="w-5 h-5 text-emerald-400" />;
      case 'directory':
        return <Folder className="w-5 h-5 text-[#00d4ff]" />;
      default:
        return <File className="w-5 h-5 text-slate-300" />;
    }
  };

  return (
    <div className="bg-[#0b101d] border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
      {/* Header Bar */}
      <div className="p-4 bg-[#090e1a] border-b border-slate-800 flex items-start justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
            {getTypeIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight truncate">
                {contextObject.label}
              </h2>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#00d4ff] bg-[#00d4ff]/10 px-2 py-0.5 rounded border border-[#00d4ff]/20">
                {contextObject.type.replace('_', ' ')}
              </span>
            </div>

            {/* Path & Copy */}
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs text-slate-400 truncate max-w-md select-all">
                {contextObject.path}
              </span>
              <button
                onClick={handleCopyPath}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                title="Copy Path"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Clean Unboxed Metadata Line with typographic separators */}
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 font-mono">
              <span>Confidence: {contextObject.confidence}</span>
              <span aria-hidden="true">·</span>
              <span>Stable ID: {contextObject.stableId.slice(0, 16)}...</span>
              {contextObject.metadata.fsType && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400 uppercase font-semibold">
                    FS: {contextObject.metadata.fsType}
                  </span>
                </>
              )}
              {contextObject.metadata.size && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{contextObject.metadata.size}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800">
            Close
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-[#080d17] px-4 gap-2 text-xs font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-[#00d4ff] text-[#00d4ff]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Knowledge & Metadata
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'actions'
              ? 'border-[#00d4ff] text-[#00d4ff]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Available Actions ({contextObject.availableActions.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-[#00d4ff] text-[#00d4ff]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Contextual History ({contextObject.recentHistory.length})
        </button>
      </div>

      {/* Tab 1: Overview & Metadata */}
      {activeTab === 'overview' && (
        <div className="p-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-[#0d1424] rounded-lg border border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00d4ff]" />
                System & Security Attributes
              </div>
              <div className="space-y-1 font-mono text-[11px] text-slate-300">
                <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Permissions:</span>
                  <span className="text-white">{contextObject.metadata.permissions || 'POSIX 755'}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Owner / Group:</span>
                  <span className="text-white">
                    {contextObject.metadata.owner || 'cachy'} : {contextObject.metadata.group || 'cachy'}
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                  <span className="text-slate-400">State / Mount:</span>
                  <span className={contextObject.metadata.status === 'mounted' ? 'text-emerald-400' : 'text-slate-400'}>
                    {contextObject.metadata.status || 'Active'}
                  </span>
                </div>
                {contextObject.metadata.uuid && (
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Filesystem UUID:</span>
                    <span className="text-[#00d4ff] truncate max-w-[180px]">{contextObject.metadata.uuid}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Windows / Wine Specific Details */}
            {contextObject.type === 'win_exe' && (
              <div className="p-3 bg-[#0d1424] rounded-lg border border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
                  Gaming & Compatibility Layer
                </div>
                <div className="space-y-1 font-mono text-[11px] text-slate-300">
                  <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Binary Architecture:</span>
                    <span className="text-emerald-400">{contextObject.metadata.architecture}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Recommended Wine:</span>
                    <span className="text-white truncate max-w-[180px]">{contextObject.metadata.wineVersion}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Proton Runtime:</span>
                    <span className="text-white truncate max-w-[180px]">{contextObject.metadata.protonVersion}</span>
                  </div>
                  {contextObject.relationships.savePath && (
                    <div className="py-1">
                      <span className="text-slate-400 block mb-0.5">Saves Standardized in ~/Documents:</span>
                      <span className="text-emerald-300 block truncate">{contextObject.relationships.savePath}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Device Details */}
            {contextObject.type === 'device' && (
              <div className="p-3 bg-[#0d1424] rounded-lg border border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                  Block Storage Telemetry
                </div>
                <div className="space-y-1 font-mono text-[11px] text-slate-300">
                  <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Hardware Model:</span>
                    <span className="text-white">{contextObject.metadata.deviceModel || 'NVMe SSD'}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Capacity:</span>
                    <span className="text-white">{contextObject.metadata.size}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Filesystem Driver:</span>
                    <span className="text-amber-400 uppercase">{contextObject.metadata.fsType}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Current Mount Point:</span>
                    <span className="text-white truncate max-w-[180px]">{contextObject.metadata.mountPoint || 'Not Mounted'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Bar at bottom of overview */}
          <div className="pt-2 flex flex-wrap gap-2">
            {contextObject.availableActions.slice(0, 2).map((action) => (
              <button
                key={action.id}
                onClick={() => onExecuteAction(action.id, action.commandTemplate, action.risk)}
                className={`px-3 py-2 rounded-lg font-semibold text-xs transition-colors flex items-center gap-2 ${
                  action.risk === 'destructive'
                    ? 'bg-rose-950/40 text-rose-300 border border-rose-800/60 hover:bg-rose-900/60'
                    : 'bg-[#00d4ff] text-slate-950 hover:bg-[#00d4ff]/90'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {action.label}
              </button>
            ))}
            {contextObject.availableActions[0]?.commandTemplate && onOpenInCommandBuilder && (
              <button
                onClick={() => onOpenInCommandBuilder(contextObject.availableActions[0].commandTemplate!)}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5 text-[#00d4ff]" />
                Inspect in Command Builder
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Available Actions */}
      {activeTab === 'actions' && (
        <div className="p-4 space-y-2 text-xs">
          <div className="text-[11px] text-slate-400 mb-2">
            Contextual actions generated from local machine state, installed runtimes, and permissions:
          </div>
          {contextObject.availableActions.map((act) => (
            <div
              key={act.id}
              className="p-3 bg-[#0d1424] hover:bg-[#121c33] rounded-lg border border-slate-800 flex items-center justify-between gap-4 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-xs">{act.label}</span>
                  {act.recommended && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      Recommended
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded ${
                      act.risk === 'destructive'
                        ? 'text-rose-400 bg-rose-500/10'
                        : act.risk === 'privileged'
                        ? 'text-amber-400 bg-amber-500/10'
                        : 'text-slate-400 bg-slate-800'
                    }`}
                  >
                    {act.risk}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">{act.description}</div>
                {act.commandTemplate && (
                  <div className="font-mono text-[10px] text-[#00d4ff] bg-black/40 px-2 py-1 rounded mt-1.5 truncate">
                    {act.commandTemplate}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {act.commandTemplate && onOpenInCommandBuilder && (
                  <button
                    onClick={() => onOpenInCommandBuilder(act.commandTemplate!)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                    title="Edit in Command Builder"
                  >
                    <Terminal className="w-4 h-4 text-[#00d4ff]" />
                  </button>
                )}
                <button
                  onClick={() => onExecuteAction(act.id, act.commandTemplate, act.risk)}
                  className="px-3 py-1.5 rounded bg-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff] hover:text-slate-950 font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Execute
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: History & Failures */}
      {activeTab === 'history' && (
        <div className="p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Historical executions for this object (Retained for 30 days):</span>
            <span className="font-mono text-[#00d4ff]">{contextObject.recentHistory.length} recorded events</span>
          </div>

          {contextObject.recentHistory.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              No executions have been recorded yet for this object.
            </div>
          ) : (
            <div className="space-y-2">
              {contextObject.recentHistory.map((rec) => (
                <div
                  key={rec.id}
                  className={`p-3 rounded-lg border text-xs ${
                    rec.status === 'success'
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-200'
                      : 'bg-rose-950/20 border-rose-800/40 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold flex items-center gap-1.5">
                      {rec.status === 'success' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      {rec.toolUsed || rec.executable}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(rec.timestamp).toLocaleDateString()} · Exit {rec.exitCode}
                    </span>
                  </div>

                  <div className="font-mono text-[10px] bg-black/30 p-1.5 rounded mt-1 text-slate-300 truncate">
                    {rec.command}
                  </div>

                  {rec.failureReason && (
                    <div className="text-rose-300 text-[11px] mt-1 bg-rose-950/30 p-1.5 rounded border border-rose-900/40">
                      <span className="font-semibold">Diagnosed Cause:</span> {rec.failureReason}
                    </div>
                  )}

                  {rec.stdoutSnippet && (
                    <pre className="font-mono text-[10px] text-slate-400 bg-black/40 p-1.5 rounded mt-1 overflow-x-auto">
                      {rec.stdoutSnippet}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
