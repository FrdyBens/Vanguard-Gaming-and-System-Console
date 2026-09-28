/**
 * Vanguard Core - Operation Plan
 * Multi-step verified operational plan constructed before any execution occurs
 */

import { PlanStep, StepStatus } from './PlanStep';
import { RiskLevel } from '../safety/RiskAssessment';
import { VanguardCapability } from '../machine/MachineCapabilities';

export interface OperationPlan {
  id: string;
  intent: string;
  targetObjects: string[];
  steps: PlanStep[];
  requiredCapabilities: VanguardCapability[];
  risk: RiskLevel;
  requiresConfirmation: boolean;
  status: 'draft' | 'approved' | 'executing' | 'completed' | 'failed' | 'cancelled' | 'rolled_back';
  createdAt: number;
  completedAt?: number;
  summaryMessage?: string;
}
