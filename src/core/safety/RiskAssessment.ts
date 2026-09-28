/**
 * Vanguard Core - Risk Assessment Engine
 * Evaluates operational risk based on target, command structure, and filesystem scope
 */

export type RiskLevel =
  | 'READ_ONLY'
  | 'LOW_RISK'
  | 'MODIFY'
  | 'PRIVILEGED'
  | 'DESTRUCTIVE'
  | 'CRITICAL';

export interface RiskAnalysis {
  level: RiskLevel;
  requiresExplicitConfirmation: boolean;
  isSystemDiskAffected: boolean;
  isDestructive: boolean;
  reasons: string[];
  warnings: string[];
  safeAlternatives?: string[];
}

export class RiskAssessment {
  private static CRITICAL_PATHS = ['/', '/boot', '/etc', '/usr', '/dev', '/sys', '/proc'];
  private static SYSTEM_BOOT_PATHS = ['/dev/nvme0n1p1', '/dev/nvme0n1p2', '/boot/efi'];

  public static assessOperation(
    operationType: string,
    targetPathOrDevice: string,
    args?: Record<string, any>
  ): RiskAnalysis {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let level: RiskLevel = 'LOW_RISK';
    let requiresExplicitConfirmation = false;
    let isSystemDiskAffected = false;
    let isDestructive = false;

    // Check system disk relevance
    if (this.SYSTEM_BOOT_PATHS.some((p) => targetPathOrDevice.startsWith(p))) {
      isSystemDiskAffected = true;
      warnings.push(`Target ${targetPathOrDevice} is associated with active system or boot partition.`);
    }

    switch (operationType) {
      case 'InspectDevice':
      case 'InspectFilesystem':
      case 'ReadFile':
      case 'ListDirectory':
        level = 'READ_ONLY';
        reasons.push('Read-only inspection operation with zero side effects on state.');
        break;

      case 'CreateDirectory':
        level = 'LOW_RISK';
        reasons.push('Creates a directory node if not already existing.');
        if (targetPathOrDevice.startsWith('/home') || targetPathOrDevice.startsWith('/tmp')) {
          // safe user territory
        } else {
          level = 'PRIVILEGED';
          warnings.push('Target directory is outside user home and may require root privileges.');
        }
        break;

      case 'CopyFile':
      case 'MoveFile':
        level = 'MODIFY';
        reasons.push('Alters filesystem file contents or file location.');
        if (args?.overwrite) {
          warnings.push('Destination file already exists and will be replaced.');
        }
        break;

      case 'MountFilesystem':
        level = 'PRIVILEGED';
        reasons.push('Mounts filesystem to directory hierarchy. Requires root or fstab entry.');
        break;

      case 'UnmountFilesystem':
        level = isSystemDiskAffected ? 'CRITICAL' : 'LOW_RISK';
        reasons.push('Unmounts block device from filesystem tree.');
        if (isSystemDiskAffected) {
          requiresExplicitConfirmation = true;
          warnings.push('DANGER: Attempting to unmount system disk or boot volume!');
        }
        break;

      case 'DeleteFile':
        isDestructive = true;
        if (this.CRITICAL_PATHS.includes(targetPathOrDevice)) {
          level = 'CRITICAL';
          requiresExplicitConfirmation = true;
          warnings.push('CRITICAL HAZARD: Attempted deletion of system root or essential OS hierarchy!');
        } else {
          level = 'DESTRUCTIVE';
          requiresExplicitConfirmation = true;
          warnings.push('File or directory will be permanently removed.');
        }
        break;

      case 'FormatDevice':
      case 'PartitionDisk':
      case 'WipeFilesystem':
        level = 'CRITICAL';
        isDestructive = true;
        requiresExplicitConfirmation = true;
        warnings.push('IRREVERSIBLE DATA LOSS: Entire block device contents will be destroyed.');
        break;

      case 'LaunchSteamGame':
      case 'LaunchWineApplication':
      case 'RunExecutable':
        level = 'LOW_RISK';
        reasons.push('Launches application process in isolated user space or compatibility prefix.');
        break;

      case 'StartService':
      case 'StopService':
      case 'RestartService':
        level = 'PRIVILEGED';
        reasons.push('Modifies state of systemd system service unit.');
        break;

      default:
        level = 'MODIFY';
        reasons.push('Generic operational execution.');
    }

    return {
      level,
      requiresExplicitConfirmation,
      isSystemDiskAffected,
      isDestructive,
      reasons,
      warnings
    };
  }
}
