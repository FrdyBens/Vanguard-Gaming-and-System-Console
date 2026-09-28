import React, { useState } from 'react';
import {
  Activity,
  Layers,
  ShieldAlert,
  Sparkles,
  Server,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  X,
  Database,
  Cpu,
  Workflow
} from 'lucide-react';
import { vanguardCore } from '../core/VanguardCore';
import { runVanguardCoreAcceptanceTests } from '../core/__tests__/core.test';

interface DaemonTestSuiteResult {
  allPassed: boolean;
  results: { testId: number; title: string; passed: boolean; message: string }[];
}

interface DevConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevConsoleModal: React.FC<DevConsoleModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'tests' | 'graph' | 'snapshot' | 'safety' | 'memory'>('tests');
  const [testResults, setTestResults] = useState<ReturnType<typeof runVanguardCoreAcceptanceTests> | null>(null);
  const [daemonTestResults, setDaemonTestResults] = useState<DaemonTestSuiteResult | null>(null);
  const [isRunningDaemonTests, setIsRunningDaemonTests] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-game-timberborn');
  const [graphSearch, setGraphSearch] = useState('');

  if (!isOpen) return null;

  const core = vanguardCore;
  const snapshot = core.snapshot;
  const allNodes = core.graph.getAllNodes();
  const selectedNode = core.graph.getNode(selectedNodeId);
  const relatedEdges = selectedNode ? core.graph.getRelatedNodes(selectedNode.id, undefined, 'both') : [];

  const handleRunTests = () => {
    const outcome = runVanguardCoreAcceptanceTests();
    setTestResults(outcome);
  };

  const handleRunDaemonTests = async () => {
    setIsRunningDaemonTests(true);
    try {
      const res = await fetch('/api/daemon/tests');
      if (res.ok) {
        const outcome = await res.json();
        setDaemonTestResults(outcome);
      }
    } catch (err: any) {
      console.error('Failed to run daemon tests:', err);
    } finally {
      setIsRunningDaemonTests(false);
    }
  };

  const filteredNodes = allNodes.filter(
    (n) =>
      n.displayName.toLowerCase().includes(graphSearch.toLowerCase()) ||
      n.type.toLowerCase().includes(graphSearch.toLowerCase()) ||
      n.stableId.toLowerCase().includes(graphSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0c121e] border border-[#1e293b] rounded-xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#090d16]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00d4ff]/10 border border-[#00d4ff]/30 rounded-lg text-[#00d4ff]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">Vanguard Core Architecture Console</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v2.0 Extended
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Live inspection of Object Graph, Machine Snapshot, Capability Engine, and Acceptance Suite
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                core.getActiveBackend().resetState?.();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#141d2e] hover:bg-[#1a273e] border border-slate-700/60 rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              Reset State
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-2 border-b border-[#1e293b] bg-[#090d16] text-xs font-medium">
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'tests'
                ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Acceptance Tests ({testResults ? `${testResults.results.filter((r) => r.passed).length}/10` : 'Ready'})
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'graph'
                ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Object Graph ({allNodes.length} nodes)
          </button>
          <button
            onClick={() => setActiveTab('snapshot')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'snapshot'
                ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Machine Snapshot
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'safety'
                ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Capabilities & Safety
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'memory'
                ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Memory & Audit Log
          </button>
        </div>

        {/* Tab content area */}
        <div className="flex-1 p-6 overflow-y-auto font-sans">
          {activeTab === 'tests' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-[#111927] border border-[#1e293b] rounded-lg">
                <div>
                  <h3 className="text-sm font-semibold text-white">Vanguard Architectural & Daemon Verification</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Verifies all 10 architectural criteria plus 8 strict CachyOS host daemon security assertions (loopback, 0700/0600 POSIX permissions, nonces, argv-only execution).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunTests}
                    className="flex items-center gap-2 px-3.5 py-2 bg-[#00d4ff] hover:bg-[#00b8dc] text-slate-950 font-semibold text-xs rounded-lg transition-colors shadow-lg shadow-[#00d4ff]/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Run 10 Core Tests
                  </button>
                  <button
                    onClick={handleRunDaemonTests}
                    disabled={isRunningDaemonTests}
                    className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {isRunningDaemonTests ? 'Verifying...' : 'Run 8 Daemon Tests'}
                  </button>
                </div>
              </div>

              {daemonTestResults && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span className="font-semibold text-white">
                      Host Daemon Security Suite:{' '}
                      <strong className={daemonTestResults.allPassed ? 'text-emerald-400' : 'text-amber-400'}>
                        {daemonTestResults.results.filter((r) => r.passed).length} of {daemonTestResults.results.length} Passed
                      </strong>
                    </span>
                    <span className="font-mono text-[11px] text-emerald-400">
                      {daemonTestResults.allPassed ? 'ALL DAEMON CONSTRAINTS HARDENED' : 'SECURITY WARNING'}
                    </span>
                  </div>

                  <div className="divide-y divide-[#1e293b] border border-emerald-500/30 rounded-lg bg-[#08121d] overflow-hidden">
                    {daemonTestResults.results.map((res) => (
                      <div key={res.testId} className="p-3 flex items-start gap-3 hover:bg-[#0d1a29] transition-colors">
                        {res.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-100">
                              Daemon Check {res.testId}: {res.title}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              VERIFIED
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{res.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {testResults ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>
                      Results:{' '}
                      <strong className={testResults.allPassed ? 'text-emerald-400' : 'text-amber-400'}>
                        {testResults.results.filter((r) => r.passed).length} of {testResults.results.length} Passed
                      </strong>
                    </span>
                    <span>Status: {testResults.allPassed ? 'ALL VERIFICATIONS PASSED' : 'ACTION NEEDED'}</span>
                  </div>

                  <div className="divide-y divide-[#1e293b] border border-[#1e293b] rounded-lg bg-[#0d1422] overflow-hidden">
                    {testResults.results.map((res) => (
                      <div key={res.testId} className="p-3.5 flex items-start gap-3 hover:bg-[#121c2e] transition-colors">
                        {res.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">
                              Test {res.testId}: {res.title}
                            </span>
                            <span
                              className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                                res.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                              }`}
                            >
                              {res.passed ? 'PASS' : 'FAIL'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 font-mono">{res.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-slate-700/60 rounded-lg text-slate-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                  <p className="text-sm">Click "Run All 10 Tests" to execute the verification suite.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'graph' && (
            <div className="grid grid-cols-12 gap-6 h-full">
              {/* Node List */}
              <div className="col-span-5 flex flex-col border border-[#1e293b] rounded-lg bg-[#0d1422] p-3 space-y-3">
                <input
                  type="text"
                  placeholder="Filter nodes by name, type, stable ID..."
                  value={graphSearch}
                  onChange={(e) => setGraphSearch(e.target.value)}
                  className="w-full bg-[#141d2e] border border-slate-700/60 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00d4ff]"
                />
                <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                  {filteredNodes.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setSelectedNodeId(n.id)}
                      className={`w-full text-left p-2 rounded text-xs transition-colors flex items-center justify-between ${
                        selectedNodeId === n.id
                          ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <span className="font-semibold">{n.displayName}</span>
                        <div className="text-[10px] text-slate-500 truncate">{n.stableId}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0 font-mono">
                        {n.type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Node Inspector */}
              <div className="col-span-7 border border-[#1e293b] rounded-lg bg-[#0d1422] p-4 flex flex-col overflow-y-auto space-y-4">
                {selectedNode ? (
                  <>
                    <div className="border-b border-[#1e293b] pb-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white">{selectedNode.displayName}</h4>
                        <span className="text-xs px-2 py-0.5 rounded bg-[#00d4ff]/10 text-[#00d4ff] font-mono">
                          {selectedNode.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        Stable ID: <span className="text-slate-300">{selectedNode.stableId}</span>
                      </p>
                      {selectedNode.path && (
                        <p className="text-xs text-slate-400 font-mono">
                          Path: <span className="text-slate-300">{selectedNode.path}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <h5 className="text-xs font-semibold text-slate-300 mb-2">Properties</h5>
                      <pre className="p-3 bg-[#080c14] border border-[#1e293b] rounded text-[11px] font-mono text-emerald-400 overflow-x-auto">
                        {JSON.stringify(selectedNode.properties, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <h5 className="text-xs font-semibold text-slate-300 mb-2">
                        Bi-Directional Graph Relationships ({relatedEdges.length})
                      </h5>
                      <div className="space-y-1.5">
                        {relatedEdges.map((rel) => (
                          <div
                            key={rel.relationship.id}
                            className="p-2 bg-[#121c2e] border border-slate-800 rounded text-xs flex items-center justify-between"
                          >
                            <span className="text-slate-400 font-mono">
                              {rel.direction === 'outgoing' ? '→' : '←'}{' '}
                              <strong className="text-[#00d4ff]">{rel.relationship.type}</strong>
                            </span>
                            <span className="text-white font-medium">{rel.node.displayName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-slate-500 p-8">Select a node to inspect</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'snapshot' && (
            <div className="space-y-6 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0d1422] border border-[#1e293b] rounded-lg space-y-2">
                  <h4 className="font-semibold text-white">Operating System & Kernel</h4>
                  <p className="text-slate-400">Distribution: <span className="text-slate-200">{snapshot.os.distro} {snapshot.os.distroVersion}</span></p>
                  <p className="text-slate-400">Kernel: <span className="text-slate-200 font-mono">{snapshot.os.kernel}</span></p>
                  <p className="text-slate-400">Desktop: <span className="text-slate-200">{snapshot.os.desktopEnvironment} ({snapshot.os.displayServer})</span></p>
                  <p className="text-slate-400">Arch: <span className="text-slate-200 font-mono">{snapshot.os.architecture}</span></p>
                </div>
                <div className="p-4 bg-[#0d1422] border border-[#1e293b] rounded-lg space-y-2">
                  <h4 className="font-semibold text-white">GPU & Vulkan</h4>
                  <p className="text-slate-400">GPU: <span className="text-slate-200">{snapshot.gpu.model}</span></p>
                  <p className="text-slate-400">Driver: <span className="text-slate-200 font-mono">{snapshot.gpu.driver}</span></p>
                  <p className="text-slate-400">Vulkan: <span className="text-slate-200 font-mono">{snapshot.gpu.vulkanVersion} ({snapshot.gpu.vulkanIcd})</span></p>
                  <p className="text-slate-400">VRAM: <span className="text-slate-200 font-mono">{(snapshot.gpu.vramTotalMb / 1024).toFixed(1)} GB</span></p>
                </div>
              </div>

              <div className="p-4 bg-[#0d1422] border border-[#1e293b] rounded-lg">
                <h4 className="font-semibold text-white mb-2">Gaming & Compatibility Stack</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-[#111927] border border-slate-800 rounded">
                    <span className="text-slate-400">Gamescope</span>
                    <p className="text-emerald-400 font-mono mt-1">
                      {snapshot.gaming.gamescopeAvailable ? `Active (${snapshot.gaming.gamescopeVersion})` : 'Missing'}
                    </p>
                  </div>
                  <div className="p-3 bg-[#111927] border border-slate-800 rounded">
                    <span className="text-slate-400">MangoHud</span>
                    <p className="text-emerald-400 font-mono mt-1">
                      {snapshot.gaming.mangohudAvailable ? 'Available' : 'Missing'}
                    </p>
                  </div>
                  <div className="p-3 bg-[#111927] border border-slate-800 rounded">
                    <span className="text-slate-400">DXVK / VKD3D</span>
                    <p className="text-emerald-400 font-mono mt-1">
                      v{snapshot.gaming.dxvkVersion} / v{snapshot.gaming.vkd3dVersion}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-[#0d1422] border border-[#1e293b] rounded-lg">
                <h4 className="font-semibold text-white mb-1">Capability-Based Security Model</h4>
                <p className="text-slate-400">
                  Vanguard avoids naive binary sudo prompts by gating operations through explicit granular capabilities.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#0d1422] border border-[#1e293b] rounded-lg space-y-2">
                  <h5 className="font-semibold text-slate-300">Storage Protection Policy</h5>
                  <p className="text-slate-400">
                    Destructive operations on devices require verification against stable hardware identifiers (UUID,
                    serial, model) rather than transient `/dev/sd*` node names.
                  </p>
                </div>
                <div className="p-3 bg-[#0d1422] border border-[#1e293b] rounded-lg space-y-2">
                  <h5 className="font-semibold text-slate-300">Dry-Run Preview Guarantee</h5>
                  <p className="text-slate-400">
                    Modifying commands are pre-evaluated with effective user escalation, affected path diffs, and
                    reversibility assessments.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-[#0d1422] border border-[#1e293b] rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">Execution Memory & Audit Records</h4>
                  <p className="text-slate-400">
                    Indexed historical executions supporting context recovery and failure difference diagnosis.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
                  {core.memory.getAllRecords().length} Records (30-day retention)
                </span>
              </div>

              <div className="space-y-2">
                {core.memory.getAllRecords().map((rec) => (
                  <div key={rec.id} className="p-3 bg-[#0d1422] border border-[#1e293b] rounded-lg space-y-1.5 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-semibold">{rec.intent}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          rec.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {rec.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-slate-400 truncate">{rec.command}</div>
                    {rec.failureReason && (
                      <div className="text-rose-400 text-[11px]">Failure reason: {rec.failureReason}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
