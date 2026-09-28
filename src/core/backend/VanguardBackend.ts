/**
 * Vanguard Core - Backend Interface
 * Decouples Vanguard intelligence, graph, planning, and UI from the execution target
 */

import { MachineSnapshot } from '../machine/MachineSnapshot';
import { OperationPlan } from '../planning/OperationPlan';
import { PlanStep } from '../planning/PlanStep';

export type BackendType = 'simulation' | 'cachyos_local' | 'remote_host';

export interface VanguardBackend {
  readonly type: BackendType;
  readonly isConnected: boolean;
  
  discoverMachine(): Promise<MachineSnapshot>;
  inspectPath(path: string): Promise<any>;
  inspectDevice(devicePath: string): Promise<any>;
  executePlan(plan: OperationPlan, onStepProgress?: (step: PlanStep) => void): Promise<OperationPlan>;
  cancelOperation(planId: string): Promise<boolean>;
  
  // Simulation lifecycle (for testability and safe sandbox experimentation)
  resetState?(): void;
  createSnapshotState?(): string;
  restoreSnapshotState?(snapshotData: string): boolean;
}
