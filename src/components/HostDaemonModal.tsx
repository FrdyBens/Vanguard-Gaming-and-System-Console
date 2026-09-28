import React, { useState, useEffect } from 'react';
import {
  Server,
  Shield,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  X,
  Terminal,
  Activity,
  FileText,
  Lock,
  RefreshCw,
  Cpu,
  User,
  HardDrive
} from 'lucide-react';
import { cachyState } from '../services/cachyState';
import { vanguardCore } from '../core/VanguardCore';
import { DaemonAuditRecord } from '../types';

interface HostDaemonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export const HostDaemonModal: React.FC<HostDaemonModalProps> = ({
  isOpen,
  onClose,
  onConnected
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'setup' | 'audit'>('status');
  const [daemonUrl, setDaemonUrl] = useState(cachyState.getDaemonUrl());
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusData, setStatusData] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [auditRecords, setAuditRecords] = useState<DaemonAuditRecord[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchHostStatus = async () => {
    setIsVerifying(true);
    setErrorMsg(null);
    try {
      const [hRes, sRes, aRes] = await Promise.all([
        fetch('/api/daemon/health').catch(() => null),
        fetch('/api/daemon/status').catch(() => null),
        fetch('/api/daemon/audit').catch(() => null)
      ]);

      if (hRes && hRes.ok) {
        const hData = await hRes.json();
        setHealthData(hData);
        vanguardCore.setBackend('cachyos_local');
        cachyState.setGatewayMode('live_daemon');
      } else {
        setHealthData({ daemonRunning: false });
      }

      if (sRes && sRes.ok) {
        const sData = await sRes.json();
        setStatusData(sData);
      }

      if (aRes && aRes.ok) {
        const aData = await aRes.json();
        setAuditRecords(aData.records || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setHealthData({ daemonRunning: false });
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHostStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const runCommandSnippet = `# 1. Start the secure Vanguard local daemon on 127.0.0.1:9090
npm run daemon

# Or directly execute via tsx
npx tsx daemon/vanguard-daemon.ts`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(runCommandSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSwitchToSimulation = () => {
    vanguardCore.setBackend('simulation');
    cachyState.setGatewayMode('simulated');
    onConnected();
  };

  const handleSwitchToRealHost = async () => {
    await fetchHostStatus();
    vanguardCore.setBackend('cachyos_local');
    cachyState.setGatewayMode('live_daemon');
    await vanguardCore.refreshSnapshot();
    onConnected();
  };

  const isRealHostConnected = healthData?.daemonRunning === true;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0c1222] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-[#080d19] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                CachyOS Host Execution Daemon
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${
                    isRealHostConnected
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {isRealHostConnected ? 'REAL HOST ACTIVE' : 'HOST UNREACHABLE'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Local loopback daemon bound strictly to <code className="text-emerald-400 font-mono">127.0.0.1:9090</code>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-[#090f1d] px-5 text-xs">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-2.5 px-3 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'status'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Host Security Status
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`py-2.5 px-3 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'setup'
                ? 'border-[#00d4ff] text-[#00d4ff] bg-[#00d4ff]/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Daemon Architecture & Setup
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-2.5 px-3 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'audit'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Host Audit Log ({auditRecords.length})
          </button>
        </div>

        {/* Tab 1: Live Status */}
        {activeTab === 'status' && (
          <div className="p-5 space-y-4 overflow-y-auto text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#070b14] border border-slate-800 rounded-lg space-y-1">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Binding & Interface
                </div>
                <div className="font-mono text-emerald-400 text-sm font-semibold">127.0.0.1:9090</div>
                <div className="text-[10px] text-slate-500">Strict IPv4 loopback (Never 0.0.0.0 / No LAN)</div>
              </div>

              <div className="p-3 bg-[#070b14] border border-slate-800 rounded-lg space-y-1">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#00d4ff]" />
                  Cryptographic Token
                </div>
                <div className="font-mono text-slate-200 text-sm font-semibold">
                  {statusData?.tokenConfigured ? 'Active & Restricted' : 'Pending Generation'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {statusData?.tokenFile ? `~/.config/vanguard/daemon/auth.token (${statusData.tokenPermissions || '0600'})` : 'Local POSIX storage'}
                </div>
              </div>

              <div className="p-3 bg-[#070b14] border border-slate-800 rounded-lg space-y-1">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  Host User & Authority
                </div>
                <div className="font-mono text-slate-200 text-sm font-semibold">
                  {statusData?.user || 'root'} (UID: {statusData?.uid ?? 0})
                </div>
                <div className="text-[10px] text-slate-500 font-mono">{statusData?.homedir || '/root'}</div>
              </div>

              <div className="p-3 bg-[#070b14] border border-slate-800 rounded-lg space-y-1">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  Host Platform & Arch
                </div>
                <div className="font-mono text-slate-200 text-sm font-semibold">
                  {statusData?.platform || 'linux'} ({statusData?.arch || 'x64'})
                </div>
                <div className="text-[10px] text-slate-500 font-mono">Host: {statusData?.hostname || 'cachyos-machine'}</div>
              </div>
            </div>

            {/* Security Hardening Checklist */}
            <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-2">
              <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Vanguard v2 Security Assertions
              </h4>
              <ul className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>No <code className="text-emerald-400 font-mono">shell=True</code> execution</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Structured argv arrays only</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>No generic command endpoint</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>CORS restricted to app origin</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Replay nonce cache with 60s TTL</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Append-only forensic audit log</span>
                </li>
              </ul>
            </div>

            {/* Mode Switcher Banner */}
            <div className="p-3 bg-[#0a1120] border border-slate-700/60 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block text-xs">Current Execution Mode</span>
                <span className="text-[11px] text-slate-400">
                  {cachyState.getGatewayMode() === 'live_daemon'
                    ? 'Connected to real host via local authenticated loopback daemon.'
                    : 'Running in simulated test sandbox mode.'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSwitchToSimulation}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                    cachyState.getGatewayMode() === 'simulated'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Sandbox Sim
                </button>
                <button
                  onClick={handleSwitchToRealHost}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                    cachyState.getGatewayMode() === 'live_daemon'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Real Host
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Architecture & Setup */}
        {activeTab === 'setup' && (
          <div className="p-5 space-y-4 overflow-y-auto text-xs">
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-200">How Vanguard Interacts with CachyOS</h4>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Vanguard operates as an object-centric command intelligence console. Privileged operations (mount, directory creation, service control, package queries) are dispatched as strictly structured requests through an authenticated Unix loopback daemon.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#00d4ff]" />
                  Launch Local Daemon via Shell
                </span>
                <button
                  onClick={handleCopySnippet}
                  className="text-[#00d4ff] hover:underline flex items-center gap-1 text-[11px]"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedCode ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-black/60 font-mono text-[11px] text-slate-300 border border-slate-800 overflow-x-auto">
                {runCommandSnippet}
              </pre>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h5 className="font-bold text-slate-200 text-xs">Security Architecture Boundaries</h5>
              <div className="space-y-1.5 text-[11px] text-slate-400">
                <p>
                  • <strong>Loopback Only:</strong> The daemon binds to <code className="text-[#00d4ff] font-mono">127.0.0.1</code>. Port 9090 is never exposed to the local network or internet.
                </p>
                <p>
                  • <strong>Cryptographic Secrets:</strong> The token is saved in <code className="text-[#00d4ff] font-mono">~/.config/vanguard/daemon/auth.token</code> with permissions <code className="text-emerald-400 font-mono">0600</code>.
                </p>
                <p>
                  • <strong>Argv Arrays Only:</strong> Every command runs via <code className="text-emerald-400 font-mono">execFile(binary, argv, &#123; shell: false &#125;)</code>. Shell string concatenation is strictly banned.
                </p>
                <p>
                  • <strong>Verification Gates:</strong> Operations query post-conditions (e.g. <code className="text-emerald-400 font-mono">findmnt</code> for mounts, <code className="text-emerald-400 font-mono">systemctl is-active</code> for services) before marking any task succeeded.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Forensic Audit Log */}
        {activeTab === 'audit' && (
          <div className="p-5 space-y-3 overflow-y-auto text-xs flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-200">Append-Only Audit Log</h4>
                <p className="text-[11px] text-slate-400 font-mono">~/.config/vanguard/audit.log</p>
              </div>
              <button
                onClick={fetchHostStatus}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
              >
                <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
                Refresh Log
              </button>
            </div>

            {auditRecords.length === 0 ? (
              <div className="p-8 text-center bg-[#070b14] border border-slate-800 rounded-lg text-slate-500">
                No audit events recorded yet. Dispatched operations on real host will appear here in real-time.
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {auditRecords.map((rec, i) => (
                  <div key={i} className="p-2.5 bg-[#070b14] border border-slate-800 rounded-lg space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-emerald-400">{rec.operation}</span>
                      <span className="text-[10px] text-slate-500">{new Date(rec.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span>Actor: <code className="text-slate-300 font-mono">{rec.actor}</code></span>
                      <span>Risk: <code className="text-amber-400 font-mono">{rec.riskLevel}</code></span>
                      <span>Target: <code className="text-slate-300 font-mono">{rec.target || 'host'}</code></span>
                      <span>Exit: <code className={rec.exitCode === 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>{rec.exitCode}</code></span>
                    </div>
                    {rec.verification?.message && (
                      <div className="text-[10px] text-slate-400 italic">
                        ↳ {rec.verification.message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#080d19] flex items-center justify-between text-xs">
          <button
            onClick={fetchHostStatus}
            disabled={isVerifying}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            Re-probe Host Daemon
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
