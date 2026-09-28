import React, { useState } from 'react';
import { TopBar } from './components/TopBar';
import { CommandBuilder } from './components/CommandBuilder';
import { DualFileSystem } from './components/DualFileSystem';
import { GamingCockpit } from './components/GamingCockpit';
import { WorkflowsView } from './components/WorkflowsView';
import { TroubleshootingView } from './components/TroubleshootingView';
import { UniversalContextCard } from './components/UniversalContextCard';
import { ExecutionGateway } from './components/ExecutionGateway';
import { OmniSearch } from './components/OmniSearch';
import { HostDaemonModal } from './components/HostDaemonModal';
import { DevConsoleModal } from './components/DevConsoleModal';
import { UniversalContextObject, SafetyLevel, PrivilegeLevel, GatewayMode } from './types';
import { cachyState } from './services/cachyState';
import { vanguardCore } from './core/VanguardCore';

export default function App() {
  const [activeView, setActiveView] = useState<'builder' | 'dualfs' | 'gaming' | 'workflows' | 'troubleshoot'>('builder');
  const [activeCommandId, setActiveCommandId] = useState('mount');
  const [selectedContextObject, setSelectedContextObject] = useState<UniversalContextObject | null>(null);

  // Search Modal
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Core Architecture Console Modal
  const [devConsoleOpen, setDevConsoleOpen] = useState(false);

  // Gateway Modal
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const [gatewayCmd, setGatewayCmd] = useState('');
  const [gatewayRisk, setGatewayRisk] = useState<SafetyLevel>('low_risk');
  const [gatewayPriv, setGatewayPriv] = useState<PrivilegeLevel>('none');
  const [gatewayDryRun, setGatewayDryRun] = useState(false);

  // Host Daemon Bridge Modal
  const [daemonModalOpen, setDaemonModalOpen] = useState(false);
  const [gatewayMode, setGatewayMode] = useState<GatewayMode>(cachyState.getGatewayMode());

  // Command Builder launcher
  const handleRunCommand = (commandString: string, riskLevel: SafetyLevel, priv: PrivilegeLevel, dryRun: boolean) => {
    setGatewayCmd(commandString);
    setGatewayRisk(riskLevel);
    setGatewayPriv(priv);
    setGatewayDryRun(dryRun);
    setGatewayOpen(true);
  };

  // Quick Action execution from Context Card
  const handleExecuteContextAction = (actionId: string, commandTemplate?: string, risk?: SafetyLevel) => {
    if (commandTemplate) {
      const isSudo = commandTemplate.startsWith('sudo');
      handleRunCommand(
        commandTemplate,
        risk || (isSudo ? 'privileged' : 'low_risk'),
        isSudo ? 'sudo' : 'none',
        false
      );
    }
  };

  const handleOpenInBuilder = (commandString: string) => {
    const firstWord = commandString.replace(/^sudo\s+/, '').split(' ')[0];
    setActiveCommandId(firstWord);
    setActiveView('builder');
    setSelectedContextObject(null);
  };

  const handleModeChange = (mode: GatewayMode) => {
    if (mode === 'live_daemon') {
      setDaemonModalOpen(true);
    } else {
      vanguardCore.setBackend('simulation');
      setGatewayMode('simulated');
    }
  };

  const handleSelectObject = (targetPathOrId: string | UniversalContextObject) => {
    if (typeof targetPathOrId === 'string') {
      const resolved = vanguardCore.resolveContextObject(targetPathOrId);
      setSelectedContextObject(resolved);
    } else {
      // Re-resolve via VanguardCore to attach graph relations and recommendations
      const resolved = vanguardCore.resolveContextObject(targetPathOrId.path || targetPathOrId.label);
      setSelectedContextObject(resolved);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Bar with Single Wordmark, Backend Badge, Navigation and Core Console Trigger */}
      <TopBar
        activeView={activeView}
        setActiveView={(v) => setActiveView(v as any)}
        gatewayMode={gatewayMode}
        setGatewayMode={handleModeChange}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenDevConsole={() => setDevConsoleOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 overflow-hidden relative">
        {activeView === 'builder' && (
          <CommandBuilder
            initialCommandId={activeCommandId}
            onRunCommand={handleRunCommand}
          />
        )}

        {activeView === 'dualfs' && (
          <DualFileSystem
            onOpenContextCard={handleSelectObject}
            onPrepareCommand={(cmd) => handleRunCommand(cmd, 'low_risk', 'none', false)}
          />
        )}

        {activeView === 'gaming' && (
          <GamingCockpit
            onOpenContextCard={handleSelectObject}
            onLaunchGame={(cmd) => handleRunCommand(cmd, 'low_risk', 'none', false)}
          />
        )}

        {activeView === 'workflows' && (
          <WorkflowsView
            onRunStepCommand={handleRunCommand}
          />
        )}

        {activeView === 'troubleshoot' && (
          <TroubleshootingView
            onRunFixCommand={(cmd) => {
              const isSudo = cmd.startsWith('sudo');
              handleRunCommand(cmd, isSudo ? 'privileged' : 'low_risk', isSudo ? 'sudo' : 'none', false);
            }}
          />
        )}

        {/* Floating Universal Context Card Modal when an item is inspected */}
        {selectedContextObject && (
          <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <UniversalContextCard
                contextObject={selectedContextObject}
                onExecuteAction={handleExecuteContextAction}
                onOpenInCommandBuilder={handleOpenInBuilder}
                onClose={() => setSelectedContextObject(null)}
              />
            </div>
          </div>
        )}
      </main>

      {/* Omni-Search Modal */}
      <OmniSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectCommand={(cmdId) => {
          setActiveCommandId(cmdId);
          setActiveView('builder');
        }}
        onSelectContextObject={handleSelectObject}
        onSelectWorkflow={() => setActiveView('workflows')}
      />

      {/* Execution Gateway & Safety Verification Modal */}
      <ExecutionGateway
        isOpen={gatewayOpen}
        commandString={gatewayCmd}
        riskLevel={gatewayRisk}
        privilege={gatewayPriv}
        isDryRun={gatewayDryRun}
        onClose={() => setGatewayOpen(false)}
        onOpenTroubleshooting={() => {
          setGatewayOpen(false);
          setActiveView('troubleshoot');
        }}
      />

      {/* Host Bridge Daemon Connector Modal */}
      <HostDaemonModal
        isOpen={daemonModalOpen}
        onClose={() => setDaemonModalOpen(false)}
        onConnected={() => {
          vanguardCore.setBackend('cachyos_local', cachyState.getDaemonUrl());
          setGatewayMode('live_daemon');
          setDaemonModalOpen(false);
        }}
      />

      {/* Core Architecture & Acceptance Test Console Modal */}
      <DevConsoleModal
        isOpen={devConsoleOpen}
        onClose={() => setDevConsoleOpen(false)}
      />
    </div>
  );
}
