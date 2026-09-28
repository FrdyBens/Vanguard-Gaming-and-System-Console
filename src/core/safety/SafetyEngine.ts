/**
 * Vanguard Core - Safety Engine
 * Coordinates risk assessment, device validation, capability checking, and dry-run previewing
 */

import { RiskAssessment, RiskAnalysis } from './RiskAssessment';
import { CapabilityEngine, CapabilityCheckResult } from './CapabilityEngine';
import { ObjectGraph } from '../graph/ObjectGraph';

export interface DeviceSafetyCheck {
  isSafe: boolean;
  devicePath: string;
  stableId: string;
  model?: string;
  serial?: string;
  uuid?: string;
  size?: string;
  isMounted: boolean;
  isSystemDisk: boolean;
  isBootDisk: boolean;
  requiresExplicitTypingConfirmation: boolean;
  warningMessage?: string;
}

export interface DryRunPreview {
  planId: string;
  intent: string;
  operationType: string;
  targetObject: string;
  effectiveUser: string;
  risk: RiskAnalysis;
  capabilities: CapabilityCheckResult;
  isReversible: boolean;
  rollbackAction?: string;
  estimatedSteps: { title: string; command: string; risk: string }[];
  requiresConfirmation: boolean;
}

export class SafetyEngine {
  /**
   * Validate storage device before any operation (especially destructive ones)
   */
  public static verifyDeviceSafety(
    devicePath: string,
    graph: ObjectGraph,
    isDestructive = false
  ): DeviceSafetyCheck {
    const node = graph.getNode(devicePath);
    const props = node?.properties || {};

    const isSystemDisk = props.isSystemDisk || props.mountPoint === '/';
    const isBootDisk = props.isBootDisk || props.mountPoint === '/boot/efi';
    const isMounted = props.isMounted || Boolean(props.mountPoint);

    let isSafe = true;
    let warningMessage: string | undefined;

    if (isDestructive && (isSystemDisk || isBootDisk)) {
      isSafe = false;
      warningMessage = `BLOCKED: Target ${devicePath} is the active system/boot device (${props.label || 'SYSTEM'}). Destructive actions are prohibited.`;
    } else if (isDestructive && isMounted) {
      isSafe = false;
      warningMessage = `BLOCKED: Target ${devicePath} is currently mounted at ${props.mountPoint}. Must be unmounted before destructive operations.`;
    }

    return {
      isSafe,
      devicePath,
      stableId: node?.stableId || devicePath,
      model: props.model,
      serial: props.serial,
      uuid: props.uuid,
      size: props.displaySize,
      isMounted,
      isSystemDisk,
      isBootDisk,
      requiresExplicitTypingConfirmation: isDestructive,
      warningMessage
    };
  }

  /**
   * Produce comprehensive Dry-Run Preview
   */
  public static generateDryRun(
    planId: string,
    intent: string,
    operationType: string,
    targetPath: string,
    command: string,
    userContext: { user: string; uid: number; groups: string[]; sudoAvailable: boolean },
    isReversible = true,
    rollbackAction?: string
  ): DryRunPreview {
    const risk = RiskAssessment.assessOperation(operationType, targetPath);
    const requiredCaps = CapabilityEngine.getRequiredCapabilities(operationType, targetPath);
    const capabilities = CapabilityEngine.evaluateCapabilities(requiredCaps, userContext, targetPath);

    return {
      planId,
      intent,
      operationType,
      targetObject: targetPath,
      effectiveUser: capabilities.requiresElevation ? 'root (via sudo)' : userContext.user,
      risk,
      capabilities,
      isReversible,
      rollbackAction,
      estimatedSteps: [
        {
          title: `Execute ${operationType}`,
          command,
          risk: risk.level
        }
      ],
      requiresConfirmation: risk.requiresExplicitConfirmation || capabilities.requiresElevation
    };
  }
}
