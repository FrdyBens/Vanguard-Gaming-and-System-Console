import React from 'react';
import { Terminal, HardDrive, Gamepad2, GitPullRequest, AlertTriangle, Cpu, Search } from 'lucide-react';
import { GatewayMode } from '../types';

interface TopBarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  gatewayMode: GatewayMode;
  setGatewayMode: (mode: GatewayMode) => void;
  onOpenSearch: () => void;
  onOpenDevConsole: () => void;
  onOpenHostModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  setActiveView,
  gatewayMode,
  setGatewayMode,
  onOpenSearch,
  onOpenDevConsole,
  onOpenHostModal
}) => {
  const navItems = [
    { id: 'builder', label: 'Command Builder', icon: Terminal },
    { id: 'dualfs', label: 'Dual-FS Workspace', icon: HardDrive },
    { id: 'gaming', label: 'Gaming & Wine/Proton', icon: Gamepad2 },
    { id: 'workflows', label: 'Workflows', icon: GitPullRequest },
    { id: 'troubleshoot', label: 'Troubleshooting', icon: AlertTriangle }
  ];

  const isSimulated = gatewayMode === 'simulated' || gatewayMode === 'simulated_test';
  const executionStatus = isSimulated ? 'SIMULATED/TEST' : 'REAL HOST';

  return (
    <header className="h-14 border-b border-slate-800 bg-[#0a0f1d] px-4 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Zone 1: Single text element wordmark with active backend badge */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center text-[#00d4ff] font-mono font-bold text-base shadow-[0_0_12px_rgba(0,212,255,0.25)]">
          V
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
            Vanguard
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#00d4ff] bg-[#00d4ff]/10 px-1.5 py-0.5 rounded border border-[#00d4ff]/20">
              CachyOS
            </span>
          </span>

          {/* Explicit 3-State Backend Status Badge: REAL HOST / SIMULATED/TEST / UNKNOWN */}
          <button
            onClick={onOpenHostModal}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border font-mono text-[10px] transition-all hover:scale-105 ${
              executionStatus === 'REAL HOST'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-400'
            }`}
            title="Click to view host security metrics and audit trail"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                executionStatus === 'REAL HOST' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-semibold">{executionStatus}</span>
          </button>
        </div>
      </div>

      {/* Zone 2: Navigation Links (single-line, clean buttons) */}
      <nav className="hidden md:flex items-center gap-1 bg-[#070a12] p-1 rounded-lg border border-slate-800/80">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#142036] text-[#00d4ff] border border-[#00d4ff]/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Actions, Search Trigger, Core Console & Mode Switcher */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e1628] hover:bg-[#142036] border border-slate-700/60 text-slate-300 hover:text-white text-xs transition-colors group"
          title="Search commands, filesystem paths, or gaming runtimes (Press /)"
        >
          <Search className="w-3.5 h-3.5 text-[#00d4ff] group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline text-slate-400">Search commands or type / for path</span>
          <kbd className="hidden sm:inline font-mono text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
            /
          </kbd>
        </button>

        {/* Core Architecture Console trigger */}
        <button
          onClick={onOpenDevConsole}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111927] hover:bg-[#192437] border border-[#00d4ff]/30 text-[#00d4ff] hover:text-white text-xs font-medium transition-colors"
          title="Inspect Object Graph, Machine Snapshot & Run Acceptance Suite"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Core Console</span>
        </button>

        {/* Backend mode toggle */}
        <div className="flex items-center bg-[#070a12] p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setGatewayMode('simulated')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              gatewayMode === 'simulated'
                ? 'bg-[#00d4ff]/20 text-[#00d4ff] font-semibold border border-[#00d4ff]/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Simulated
          </button>
          <button
            onClick={() => setGatewayMode('live_daemon')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
              gatewayMode === 'live_daemon'
                ? 'bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Host Daemon
          </button>
        </div>
      </div>
    </header>
  );
};
