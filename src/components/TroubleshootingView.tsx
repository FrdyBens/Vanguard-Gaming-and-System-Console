import React, { useState } from 'react';
import {
  AlertTriangle,
  Search,
  CheckCircle,
  AlertOctagon,
  ShieldCheck,
  Terminal,
  Play,
  ArrowRight,
  Info
} from 'lucide-react';
import { TROUBLESHOOTING_DATABASE } from '../data/troubleshooting';
import { TroubleshootingEntry } from '../types';

interface TroubleshootingViewProps {
  onRunFixCommand: (commandString: string) => void;
}

export const TroubleshootingView: React.FC<TroubleshootingViewProps> = ({ onRunFixCommand }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntryId, setSelectedEntryId] = useState(TROUBLESHOOTING_DATABASE[0].id);

  const filtered = TROUBLESHOOTING_DATABASE.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.symptom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentEntry =
    TROUBLESHOOTING_DATABASE.find((e) => e.id === selectedEntryId) || TROUBLESHOOTING_DATABASE[0];

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-y-auto bg-[#070a12] p-4 md:p-6 space-y-6 text-slate-100">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl bg-[#0b101e] border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h1 className="text-base font-bold text-white tracking-tight">
              CachyOS & Gaming Troubleshooting Knowledge Base
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Machine-interpretable error patterns, safe diagnostic commands, and verified recovery procedures.
          </p>
        </div>

        <div className="w-full md:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symptoms, errors, or fs types..."
            className="w-full bg-[#080d17] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-[#00d4ff]"
          />
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Problem Catalog List */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block mb-2">
            Known Error Patterns ({filtered.length})
          </span>

          <div className="space-y-2">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedEntryId(item.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedEntryId === item.id
                    ? 'bg-[#121c33] border-[#00d4ff] text-white shadow-md'
                    : 'bg-[#0a0f1d] border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Verified Guide</span>
                </div>
                <h4 className="font-semibold text-xs leading-snug line-clamp-2">{item.title}</h4>
              </button>
            ))}
          </div>
        </div>

        {/* Right 2 Columns: Deep Diagnostic & Recovery Guide */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-xl bg-[#0a0f1d] border border-slate-800 space-y-5 text-xs">
            {/* Title & Symptom */}
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-amber-400" />
                {currentEntry.title}
              </h2>
              <p className="text-slate-300 mt-1 leading-relaxed bg-[#070b14] p-3 rounded-lg border border-slate-800/80">
                {currentEntry.symptom}
              </p>
            </div>

            {/* Likely Causes */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
                Likely Root Causes
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                {currentEntry.likelyCauses.map((cause, idx) => (
                  <li key={idx} className="leading-relaxed">{cause}</li>
                ))}
              </ul>
            </div>

            {/* Diagnostic Command */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#00d4ff] uppercase tracking-wider block font-mono">
                1. Diagnostic Command
              </span>
              <div className="flex items-center gap-2">
                <pre className="flex-1 font-mono text-xs text-emerald-300 bg-black/60 p-2.5 rounded-lg border border-slate-800 select-all overflow-x-auto">
                  {currentEntry.diagnosticCommand}
                </pre>
                <button
                  onClick={() => onRunFixCommand(currentEntry.diagnosticCommand)}
                  className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white shrink-0 flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Run
                </button>
              </div>
              <p className="text-[11px] text-slate-400 italic pt-0.5">
                Expected Interpretation: {currentEntry.outputInterpretation}
              </p>
            </div>

            {/* Safe Fix */}
            <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Recommended Safe Fix
                </span>
                <button
                  onClick={() => onRunFixCommand(currentEntry.safeFixCommand)}
                  className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-current" /> Apply Fix
                </button>
              </div>
              <p className="text-slate-300 text-[11px]">{currentEntry.safeFixDescription}</p>
              <pre className="font-mono text-xs text-emerald-300 bg-black/60 p-2 rounded border border-emerald-900/40 select-all overflow-x-auto">
                {currentEntry.safeFixCommand}
              </pre>
            </div>

            {/* Dangerous Fix Warning */}
            {currentEntry.dangerousFixCommand && (
              <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-800/40 space-y-2">
                <span className="font-bold text-rose-400 text-xs flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4" />
                  Dangerous Alternative (Potential Data Loss)
                </span>
                <p className="text-slate-300 text-[11px]">{currentEntry.dangerousFixWarning}</p>
                <pre className="font-mono text-xs text-rose-300 bg-black/60 p-2 rounded border border-rose-900/40 select-all overflow-x-auto">
                  {currentEntry.dangerousFixCommand}
                </pre>
              </div>
            )}

            {/* Verification Step */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Verification: <code className="text-[#00d4ff]">{currentEntry.verificationCommand}</code>
              </span>
              <button
                onClick={() => onRunFixCommand(currentEntry.verificationCommand)}
                className="text-xs text-[#00d4ff] hover:underline flex items-center gap-1 font-semibold"
              >
                Verify State <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
