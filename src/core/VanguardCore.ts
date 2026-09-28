/**
 * Vanguard Core - Master Orchestrator
 * Central intelligence platform unifying the Object Graph, Machine Snapshot,
 * Recommendation Engine, Execution Planner, Safety Policy, and Backend Abstraction.
 */

import { ObjectGraph } from './graph/ObjectGraph';
import { MachineSnapshot } from './machine/MachineSnapshot';
import { MachineDiscovery } from './machine/MachineDiscovery';
import { MemoryEngine } from './memory/MemoryEngine';
import { KnowledgeEngine } from './knowledge/KnowledgeEngine';
import { VanguardBackend, BackendType } from './backend/VanguardBackend';
import { SimulationBackend } from './backend/SimulationBackend';
import { LocalHostBackend } from './backend/LocalHostBackend';
import { ExecutionPlanner } from './planning/ExecutionPlanner';
import { OperationPlan } from './planning/OperationPlan';
import { PlanStep } from './planning/PlanStep';
import { SafetyEngine, DeviceSafetyCheck, DryRunPreview } from './safety/SafetyEngine';
import { RecommendationEngine } from './recommendation/RecommendationEngine';
import { RecommendationCandidate } from './recommendation/RecommendationCandidate';
import { UniversalContextObject, ExecutionRecord } from '../types';
import { cachyState, CachyStateManager } from '../services/cachyState';

export class VanguardCore {
  private static instance: VanguardCore;

  public graph: ObjectGraph;
  public snapshot: MachineSnapshot;
  public memory: MemoryEngine;
  public knowledge: KnowledgeEngine;
  public stateManager: CachyStateManager;

  private simulationBackend: SimulationBackend;
  private localHostBackend: LocalHostBackend;
  private activeBackend: VanguardBackend;

  private constructor() {
    this.graph = new ObjectGraph();
    this.stateManager = cachyState;
    this.memory = new MemoryEngine();
    this.knowledge = new KnowledgeEngine();

    // 1. Initial snapshot & graph hydration
    this.snapshot = MachineDiscovery.createDefaultSnapshot();
    MachineDiscovery.populateGraph(this.graph, this.snapshot);

    // 2. Initialize backends
    this.simulationBackend = new SimulationBackend(this.stateManager, this.graph);
    this.localHostBackend = new LocalHostBackend(this.stateManager.getDaemonUrl());
    this.activeBackend = this.simulationBackend;
  }

  public static getInstance(): VanguardCore {
    if (!VanguardCore.instance) {
      VanguardCore.instance = new VanguardCore();
    }
    return VanguardCore.instance;
  }

  public getActiveBackend(): VanguardBackend {
    return this.activeBackend;
  }

  public setBackend(type: BackendType, daemonUrl?: string): void {
    if (type === 'cachyos_local') {
      if (daemonUrl) {
        this.localHostBackend.setDaemonUrl(daemonUrl);
      }
      this.activeBackend = this.localHostBackend;
      this.stateManager.setGatewayMode('live_daemon');
    } else {
      this.activeBackend = this.simulationBackend;
      this.stateManager.setGatewayMode('simulated');
    }
  }

  /**
   * Universal Context Object resolution powered by ObjectGraph + Memory + Recommendations
   */
  public resolveContextObject(targetPathOrId: string): UniversalContextObject {
    const node = this.graph.getNode(targetPathOrId);
    const history = this.memory.getObjectHistory(targetPathOrId);

    // If node exists in ObjectGraph, synthesize rich context object
    if (node) {
      const recommendations = RecommendationEngine.recommendRuntimeForExecutable(
        node.path || node.displayName,
        this.snapshot,
        this.memory,
        this.graph
      );

      // Traversal of related nodes
      const outgoing = this.graph.getRelatedNodes(node.id, undefined, 'outgoing');
      const relations: Record<string, any> = {};
      outgoing.forEach((edge) => {
        relations[edge.relationship.type.toLowerCase()] = edge.node.path || edge.node.displayName;
      });

      return {
        id: `ctx-${node.id}`,
        type: node.type as any,
        stableId: node.stableId,
        label: node.displayName,
        path: node.path || node.displayName,
        displayPath: node.path || node.displayName,
        confidence: node.confidence as any,
        lastDetectedTimestamp: node.timestamps.updatedAt,
        metadata: {
          ...node.properties,
          status: node.properties.status || (node.properties.isMounted ? 'mounted' : 'active')
        },
        relationships: relations,
        availableActions: node.availableActions.map((act) => ({
          id: act.id,
          label: act.label,
          description: act.description,
          risk: act.risk as any,
          recommended: act.recommended,
          commandTemplate: act.commandTemplate
        })),
        recentHistory: this.stateManager
          .getExecutionHistory()
          .filter(
            (h) =>
              h.executable.toLowerCase().includes(node.displayName.toLowerCase()) ||
              h.command.includes(node.path || '')
          )
      };
    }

    // Fallback to legacy stateManager resolve for dynamically typed paths
    return this.stateManager.resolveContextObject(targetPathOrId);
  }

  /**
   * Plan and execute an operational request
   */
  public async executePlan(
    plan: OperationPlan,
    onStepProgress?: (step: PlanStep) => void
  ): Promise<OperationPlan> {
    const executedPlan = await this.activeBackend.executePlan(plan, onStepProgress);

    // Record every executed step into memory
    for (const step of executedPlan.steps) {
      if (step.result) {
        this.memory.recordExecution({
          timestamp: Date.now(),
          intent: plan.intent,
          operationType: step.operationType,
          command: step.command,
          target: step.target,
          arguments: step.arguments,
          workingDir: '/home/cachy',
          backend: this.activeBackend.type,
          user: 'cachy',
          objects: plan.targetObjects,
          exitCode: step.result.exitCode,
          status: step.result.exitCode === 0 ? 'success' : 'failed',
          stdout: step.result.stdout,
          stderr: step.result.stderr,
          durationMs: step.result.durationMs,
          userConfirmedSuccess: step.result.exitCode === 0
        });

        // Also record to legacy stateManager for UI sync
        this.stateManager.recordExecution({
          timestamp: Date.now(),
          command: step.command,
          executable: step.operationType,
          toolUsed: this.activeBackend.type === 'simulation' ? 'Simulated CachyOS Engine' : 'Vanguard Host Agent',
          exitCode: step.result.exitCode,
          status: step.result.exitCode === 0 ? 'success' : 'failed',
          durationMs: step.result.durationMs,
          userConfirmedSuccess: step.result.exitCode === 0,
          stdoutSnippet: step.result.stdout
        });
      }
    }

    return executedPlan;
  }

  /**
   * Verify safety of storage device before performing operations
   */
  public verifyDeviceSafety(devicePath: string, isDestructive = false): DeviceSafetyCheck {
    return SafetyEngine.verifyDeviceSafety(devicePath, this.graph, isDestructive);
  }

  /**
   * Generate transparent recommendations for an entity
   */
  public getRecommendations(targetPathOrExe: string): RecommendationCandidate[] {
    return RecommendationEngine.recommendRuntimeForExecutable(
      targetPathOrExe,
      this.snapshot,
      this.memory,
      this.graph
    );
  }

  /**
   * Unified search across graph nodes, commands, and filesystem items
   */
  public searchUnified(query: string) {
    const q = query.toLowerCase().trim();
    if (!q) {
      return {
        nodes: this.graph.getAllNodes().slice(0, 10),
        commands: this.knowledge.getAllCommands().slice(0, 6)
      };
    }

    const matchingNodes = this.graph.query({ search: q });
    const matchingCommands = this.knowledge.searchCommands(q);

    return {
      nodes: matchingNodes,
      commands: matchingCommands
    };
  }

  /**
   * Refresh machine snapshot and update affected graph nodes
   */
  public async refreshSnapshot(): Promise<MachineSnapshot> {
    this.snapshot = await this.activeBackend.discoverMachine();
    MachineDiscovery.populateGraph(this.graph, this.snapshot);
    return this.snapshot;
  }
}

export const vanguardCore = VanguardCore.getInstance();
