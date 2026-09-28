import React, { useState } from 'react';
import {
  GitPullRequest,
  Play,
  CheckCircle,
  AlertOctagon,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { WorkflowDefinition, SafetyLevel, PrivilegeLevel } from '../types';
import { WORKFLOWS_DATABASE } from '../data/workflows';

interface WorkflowsViewProps {
  onRunStepCommand: (commandString: string, riskLevel: SafetyLevel, priv: PrivilegeLevel, dryRun: boolean) => void;
}

export const WorkflowsView: React.FC<WorkflowsViewProps> = ({ onRunStepCommand }) => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(WORKFLOWS_DATABASE[0].id);
  const activeWorkflow = WORKFLOWS_DATABASE.find((w) => w.id === selectedWorkflowId) || WORKFLOWS_DATABASE[0];

  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  // Initialize input defaults
  React.useEffect(() => {
    const defaults: Record<string, string> = {};
    activeWorkflow.inputs.forEach((inp) => {
      defaults[inp.key] = inp.defaultValue || '';
    });
    setInputValues(defaults);
  }, [selectedWorkflowId]);

  // Resolve template variables in a step command
  const resolveTemplate = (template: string): string => {
    let resolved = template;
    Object.entries(inputValues).forEach(([key, val]) => {
      resolved = resolved.replaceAll(`{{${key}}}`, val);
    });
    return resolved;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-y-auto bg-[#070a12] p-4 md:p-6 space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#0b101e] border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-[#00d4ff]" />
            <h1 className="text-base font-bold text-white tracking-tight">
              Multi-Step Workflows & Pipeline Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automate multi-stage system maintenance, storage mounting, and gaming prefix setup with verified rollbacks.
          </p>
        </div>

        {/* Workflow Picker */}
        <select
          value={selectedWorkflowId}
          onChange={(e) => setSelectedWorkflowId(e.target.value)}
          className="bg-[#0e1628] border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-hidden focus:border-[#00d4ff]"
        >
          {WORKFLOWS_DATABASE.map((wf) => (
            <option key={wf.id} value={wf.id}>
              {wf.name} ({wf.steps.length} steps)
            </option>
          ))}
        </select>
      </div>

      {/* Main Workflow Details & Input Variables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configurable Variables */}
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            Pipeline Inputs ({activeWorkflow.inputs.length})
          </div>

          <div className="p-4 rounded-xl bg-[#0a0f1d] border border-slate-800 space-y-3 text-xs">
            {activeWorkflow.inputs.length === 0 ? (
              <div className="text-slate-400">This workflow requires no dynamic user inputs.</div>
            ) : (
              activeWorkflow.inputs.map((inp) => (
                <div key={inp.key} className="space-y-1">
                  <label className="font-semibold text-slate-300 block">{inp.label}</label>
                  <input
                    type="text"
                    value={inputValues[inp.key] || ''}
                    onChange={(e) =>
                      setInputValues((prev) => ({ ...prev, [inp.key]: e.target.value }))
                    }
                    placeholder={inp.placeholder}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-xs text-white focus:outline-hidden focus:border-[#00d4ff]"
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 2 Columns: Sequential Steps */}
        <div className="lg:col-span-2 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between">
            <span>Sequential Execution Plan</span>
            <span className="text-[11px] text-emerald-400">
              Verified Success Rate: {activeWorkflow.successCount} of {activeWorkflow.successCount + activeWorkflow.failureCount}
            </span>
          </div>

          <div className="space-y-3">
            {activeWorkflow.steps.map((step) => {
              const resolvedCmd = resolveTemplate(step.commandTemplate);
              return (
                <div
                  key={step.stepNumber}
                  className="p-4 rounded-xl bg-[#0a0f1d] border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#00d4ff]/20 text-[#00d4ff] flex items-center justify-center font-mono text-xs font-bold border border-[#00d4ff]/30">
                        {step.stepNumber}
                      </span>
                      <h3 className="font-bold text-xs text-white">{step.name}</h3>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                          step.risk === 'destructive'
                            ? 'bg-rose-500/10 text-rose-400'
                            : step.risk === 'privileged'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {step.risk}
                      </span>
                    </div>

                    <button
                      onClick={() => onRunStepCommand(resolvedCmd, step.risk, step.privilege, false)}
                      className="px-3 py-1 rounded bg-[#00d4ff] text-slate-950 hover:bg-[#00d4ff]/90 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" /> Run Step
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400">{step.description}</p>

                  <div className="font-mono text-xs text-[#00d4ff] bg-black/50 p-2.5 rounded-lg border border-slate-800/80 overflow-x-auto select-all">
                    {resolvedCmd}
                  </div>

                  {step.rollbackCommand && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      Rollback action: <code className="text-amber-300">{resolveTemplate(step.rollbackCommand)}</code>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
