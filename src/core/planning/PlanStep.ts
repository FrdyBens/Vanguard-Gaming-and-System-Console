/**
 * Vanguard Core - Plan Step Definition
 * Atomic executable unit within an OperationPlan
 */

import { RiskLevel } from '../safety/RiskAssessment';
import { VanguardCapability } from '../machine/MachineCapabilities';

export type StepStatus =
  | 'pending'
  | 'ready'
  | 'running'
  | 'success'
  | 'warning'
  | 'failed'
  | 'cancelled'
  | 'skipped'
  | 'rolled_back';

export type Reversibility = 'reversible' | 'partially_reversible' | 'irreversible' | 'unknown';

export interface VerificationPredicate {
  type:
    | 'file_exists'
    | 'directory_exists'
    | 'mount_active'
    | 'service_active'
    | 'package_installed'
    | 'process_running'
    | 'hash_matches';
  targetPathOrEntity: string;
  expectedState?: any;
}

export interface StepResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  verified: boolean;
  verificationMessage?: string;
}

export interface PlanStep {
  id: string;
  stepNumber: number;
  name: string;
  operationType: string;
  target: string;
  command: string;
  arguments: Record<string, any>;
  dependencies: string[]; // step IDs that must finish successfully first
  requiredCapabilities: VanguardCapability[];
  risk: RiskLevel;
  reversibility: Reversibility;
  rollbackCommand?: string;
  verification?: VerificationPredicate;
  status: StepStatus;
  result?: StepResult;
}
