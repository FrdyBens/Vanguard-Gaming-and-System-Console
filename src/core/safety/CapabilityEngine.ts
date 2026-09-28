/**
 * Vanguard Core - Capability Engine
 * Validates whether operations can proceed given current capability grants
 */

import { VanguardCapability, CapabilityGrant } from '../machine/MachineCapabilities';

export interface CapabilityCheckResult {
  granted: boolean;
  required: VanguardCapability[];
  missing: VanguardCapability[];
  requiresElevation: boolean;
  explanation: string;
}

export class CapabilityEngine {
  /**
   * Determine required capabilities for an operation
   */
  public static getRequiredCapabilities(operationType: string, targetPath?: string): VanguardCapability[] {
    switch (operationType) {
      case 'InspectDevice':
        return ['device.inspect'];
      case 'MountFilesystem':
        return ['device.inspect', 'filesystem.mount'];
      case 'UnmountFilesystem':
        return ['filesystem.unmount'];
      case 'FormatDevice':
      case 'PartitionDisk':
        return ['device.inspect', 'device.modify'];
      case 'CreateDirectory':
        return ['filesystem.read', 'filesystem.create'];
      case 'CopyFile':
        return ['filesystem.read', 'filesystem.copy', 'filesystem.write'];
      case 'MoveFile':
        return ['filesystem.read', 'filesystem.move', 'filesystem.write'];
      case 'DeleteFile':
        return ['filesystem.read', 'filesystem.delete'];
      case 'InstallPackage':
        return ['package.read', 'package.install'];
      case 'RemovePackage':
        return ['package.read', 'package.remove'];
      case 'StartService':
      case 'StopService':
      case 'RestartService':
        return ['service.read', 'service.start', 'service.stop'];
      case 'LaunchWineApplication':
        return ['filesystem.read', 'wine.launch'];
      case 'LaunchSteamGame':
        return ['filesystem.read', 'steam.launch', 'gaming.launch'];
      default:
        return ['command.execute'];
    }
  }

  /**
   * Check if user/session has the requested capabilities
   */
  public static evaluateCapabilities(
    required: VanguardCapability[],
    session: { user: string; uid: number; groups: string[]; sudoAvailable: boolean },
    targetPath?: string
  ): CapabilityCheckResult {
    const isRoot = session.uid === 0 || session.user === 'root';
    const missing: VanguardCapability[] = [];
    let requiresElevation = false;

    for (const cap of required) {
      // Check privilege requirements
      if (
        cap === 'device.modify' ||
        cap === 'filesystem.mount' ||
        cap === 'filesystem.unmount' ||
        cap === 'package.install' ||
        cap === 'package.remove' ||
        cap === 'service.start' ||
        cap === 'service.stop' ||
        cap === 'command.execute_elevated'
      ) {
        if (!isRoot) {
          if (session.sudoAvailable) {
            requiresElevation = true;
          } else {
            missing.push(cap);
          }
        }
      }

      // Check filesystem write outside home
      if (
        (cap === 'filesystem.write' || cap === 'filesystem.create' || cap === 'filesystem.delete') &&
        targetPath &&
        !targetPath.startsWith('/home') &&
        !targetPath.startsWith('/tmp') &&
        !targetPath.startsWith('/run/media')
      ) {
        if (!isRoot) {
          if (session.sudoAvailable) {
            requiresElevation = true;
          } else {
            missing.push(cap);
          }
        }
      }
    }

    const granted = missing.length === 0;
    const explanation = granted
      ? requiresElevation
        ? 'Operation allowed with temporary privilege elevation (sudo/polkit).'
        : 'Operation fully permitted under current unprivileged session.'
      : `Missing required capabilities: ${missing.join(', ')}`;

    return {
      granted,
      required,
      missing,
      requiresElevation,
      explanation
    };
  }
}
