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
  ShieldAlert,
  GitFork,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { UniversalContextObject, ExecutionRecord, SafetyLevel } from '../types';
import { vanguardCore } from '../core/VanguardCore';
import { RecommendationCandidate } from '../core/recommendation/RecommendationCandidate';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'graph' | 'recommendations' | 'history'>('overview');

  const core = vanguardCore;

  // Retrieve recommendations with explicit evidence from core
  const recommendations: RecommendationCandidate[] = core.getRecommendations(contextObject.path);

  // Retrieve graph node & relationships
  const graphNode = core.graph.getNode(contextObject.path) || core.graph.getNode(contextObject.label);
  const relatedEdges = graphNode ? core.graph.getRelatedNodes(graphNode.id, undefined, 'both') : [];

  // Device safety verification
  const isDevice = contextObject.type === 'device' || contextObject.type === 'partition';
  const deviceSafety = isDevice ? core.verifyDeviceSafety(contextObject.path, false) : null;

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
    <div className="bg-[#0b101d] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
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
              {deviceSafety && !deviceSafety.isSafe && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  Protected Node
                </span>
              )}
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
              <span>Stable ID: {contextObject.stableId.slice(0, 18)}...</span>
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
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors">
            Close
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-[#080d17] px-4 gap-2 text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-[#00d4ff] text-[#00d4ff]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Knowledge & Metadata
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'actions'
              ? 'border-[#00d4ff] text-[#00d4ff]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Available Actions ({contextObject.availableActions.length})
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'recommendations'
              ? 'border-[#00d4ff] text-[#00d4ff]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#00d4ff]" />
          Recommendations ({recommendations.length})
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'graph'
              ? 'border-[#00d4ff] text-[#00d4ff]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitFork className="w-3.5 h-3.5 text-slate-400" />
          Graph Links ({relatedEdges.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-[#00d4ff] text-[#00d4ff]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          History & Failures ({contextObject.recentHistory.length})
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="p-4 overflow-y-auto space-y-4 text-xs">
        {/* Tab 1: Overview & Metadata */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
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

            {/* Quick Action Bar */}
            <div className="pt-2 flex flex-wrap gap-2">
              {contextObject.availableActions.slice(0, 2).map((action) => (
                <button
                  key={action.id}
                  onClick={() => onExecuteAction(action.id, action.commandTemplate, action.risk)}
                  className={`px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors flex items-center gap-2 ${
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
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
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
          <div className="space-y-2">
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

        {/* Tab 3: Recommendations with Transparent Evidence */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            <div className="p-3 bg-[#111927] border border-[#1e293b] rounded-lg">
              <h4 className="font-semibold text-white text-xs mb-1">Transparent Rationale</h4>
              <p className="text-[11px] text-slate-400">
                Recommendations are derived from historical success, verified local runtime availability, and hardware
                telemetry. Never hallucinated by generic scoreboards.
              </p>
            </div>

            {recommendations.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                No compatibility recommendations currently indexed for this object type.
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-[#0d1424] border border-slate-800 rounded-lg space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs">{rec.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00d4ff]/10 text-[#00d4ff] font-mono">
                          {rec.candidate}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                        {rec.confidence} CONFIDENCE
                      </span>
                    </div>

                    {/* Evidence Badges */}
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Supporting Evidence:
                      </span>
                      <div className="space-y-1">
                        {rec.evidence.map((ev, eIdx) => (
                          <div
                            key={eIdx}
                            className="flex items-center gap-2 text-[11px] text-slate-300 font-mono"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="text-emerald-400 font-semibold">{ev.type}:</span>
                            <span className="text-slate-300">{ev.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rationale list */}
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Why this is recommended:
                      </span>
                      <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
                        {rec.reasons.map((r, rIdx) => (
                          <li key={rIdx}>{r}</li>
                        ))}
                      </ul>
                    </div>

                    {rec.warnings.length > 0 && (
                      <div className="p-2 bg-amber-950/20 border border-amber-800/40 rounded text-[11px] text-amber-300 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <div>{rec.warnings.join(' ')}</div>
                      </div>
                    )}

                    {rec.commandTemplate && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-mono text-slate-500 truncate max-w-sm">
                          {rec.commandTemplate}
                        </span>
                        <button
                          onClick={() => onExecuteAction('launch_recommended', rec.commandTemplate, 'low_risk')}
                          className="px-3 py-1 text-xs rounded bg-[#00d4ff] text-slate-950 font-semibold hover:bg-[#00d4ff]/90 transition-colors"
                        >
                          Launch with this Setup
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Graph Knowledge & Relationships */}
        {activeTab === 'graph' && (
          <div className="space-y-4">
            <div className="p-3 bg-[#111927] border border-[#1e293b] rounded-lg">
              <h4 className="font-semibold text-white text-xs mb-1">Bi-Directional Graph Links</h4>
              <p className="text-[11px] text-slate-400">
                Traversable hardware, prefix, library, and application associations in the Vanguard Object Graph.
              </p>
            </div>

            {relatedEdges.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                No external graph vertices directly linked to this entity.
              </div>
            ) : (
              <div className="space-y-2">
                {relatedEdges.map((edge) => (
                  <div
                    key={edge.relationship.id}
                    className="p-2.5 bg-[#0d1424] border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400">
                        {edge.direction === 'outgoing' ? 'Points to' : 'Referenced by'}:
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#00d4ff]/10 text-[#00d4ff] font-mono font-semibold">
                        {edge.relationship.type}
                      </span>
                    </div>
                    <div className="font-medium text-white truncate max-w-xs">{edge.node.displayName}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: History & Failures */}
        {activeTab === 'history' && (
          <div className="space-y-3">
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
    </div>
  );
};
