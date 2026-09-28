/**
 * Vanguard Core - Execution Planner
 * Translates high-level user intent and target entities into a structured, dependency-resolved OperationPlan
 */

import { OperationPlan } from './OperationPlan';
import { PlanStep } from './PlanStep';
import { RiskAssessment } from '../safety/RiskAssessment';
import { CapabilityEngine } from '../safety/CapabilityEngine';
import { ObjectGraph } from '../graph/ObjectGraph';

export class ExecutionPlanner {
  /**
   * Plan directory creation with parent existence check
   */
  public static planCreateDirectory(
    targetDir: string,
    graph: ObjectGraph,
    userSession: { user: string; uid: number; groups: string[]; sudoAvailable: boolean }
  ): OperationPlan {
    const planId = `plan-mkdir-${Date.now()}`;
    const steps: PlanStep[] = [];

    // Check if target already exists in graph
    const existing = graph.getNode(targetDir);

    const step1: PlanStep = {
      id: `${planId}-step-1`,
      stepNumber: 1,
      name: `Create directory hierarchy ${targetDir}`,
      operationType: 'CreateDirectory',
      target: targetDir,
      command: `mkdir -p "${targetDir}"`,
      arguments: { path: targetDir, parents: true },
      dependencies: [],
      requiredCapabilities: CapabilityEngine.getRequiredCapabilities('CreateDirectory', targetDir),
      risk: targetDir.startsWith('/home') || targetDir.startsWith('/tmp') ? 'LOW_RISK' : 'PRIVILEGED',
      reversibility: 'reversible',
      rollbackCommand: `rmdir "${targetDir}" 2>/dev/null || true`,
      verification: {
        type: 'directory_exists',
        targetPathOrEntity: targetDir
      },
      status: 'ready'
    };
    steps.push(step1);

    const overallRisk = steps.some((s) => s.risk === 'PRIVILEGED') ? 'PRIVILEGED' : 'LOW_RISK';
    const allCaps = Array.from(new Set(steps.flatMap((s) => s.requiredCapabilities)));

    return {
      id: planId,
      intent: `Create directory: ${targetDir}`,
      targetObjects: [targetDir],
      steps,
      requiredCapabilities: allCaps,
      risk: overallRisk,
      requiresConfirmation: overallRisk === 'PRIVILEGED',
      status: 'draft',
      createdAt: Date.now()
    };
  }

  /**
   * Plan device mount with prerequisite mount point directory verification
   */
  public static planMountDevice(
    devicePath: string,
    mountPoint: string,
    fsType: string,
    graph: ObjectGraph,
    userSession: { user: string; uid: number; groups: string[]; sudoAvailable: boolean }
  ): OperationPlan {
    const planId = `plan-mount-${Date.now()}`;
    const steps: PlanStep[] = [];

    // Step 1: Ensure mount directory exists
    const stepMkdir: PlanStep = {
      id: `${planId}-step-1`,
      stepNumber: 1,
      name: `Ensure mount point exists at ${mountPoint}`,
      operationType: 'CreateDirectory',
      target: mountPoint,
      command: `sudo mkdir -p "${mountPoint}"`,
      arguments: { path: mountPoint },
      dependencies: [],
      requiredCapabilities: ['filesystem.create'],
      risk: 'LOW_RISK',
      reversibility: 'reversible',
      rollbackCommand: `sudo rmdir "${mountPoint}" 2>/dev/null || true`,
      verification: {
        type: 'directory_exists',
        targetPathOrEntity: mountPoint
      },
      status: 'ready'
    };
    steps.push(stepMkdir);

    // Step 2: Mount filesystem with optimal CachyOS flags
    let mountFlags = 'noatime';
    if (fsType === 'btrfs') {
      mountFlags = 'noatime,compress=zstd:1,subvol=@games';
    } else if (fsType === 'ntfs') {
      fsType = 'ntfs3';
      mountFlags = 'noatime,uid=1000,gid=1000,windows_names';
    }

    const stepMount: PlanStep = {
      id: `${planId}-step-2`,
      stepNumber: 2,
      name: `Mount ${devicePath} onto ${mountPoint}`,
      operationType: 'MountFilesystem',
      target: devicePath,
      command: `sudo mount -t ${fsType} -o ${mountFlags} ${devicePath} "${mountPoint}"`,
      arguments: { device: devicePath, mountPoint, fsType, flags: mountFlags },
      dependencies: [stepMkdir.id],
      requiredCapabilities: ['filesystem.mount', 'device.inspect'],
      risk: 'PRIVILEGED',
      reversibility: 'reversible',
      rollbackCommand: `sudo umount "${mountPoint}"`,
      verification: {
        type: 'mount_active',
        targetPathOrEntity: mountPoint
      },
      status: 'pending'
    };
    steps.push(stepMount);

    return {
      id: planId,
      intent: `Mount ${devicePath} to ${mountPoint}`,
      targetObjects: [devicePath, mountPoint],
      steps,
      requiredCapabilities: ['filesystem.create', 'filesystem.mount', 'device.inspect'],
      risk: 'PRIVILEGED',
      requiresConfirmation: true,
      status: 'draft',
      createdAt: Date.now()
    };
  }

  /**
   * Plan unmount operation
   */
  public static planUnmountDevice(
    mountPointOrDevice: string,
    graph: ObjectGraph,
    userSession: { user: string; uid: number; groups: string[]; sudoAvailable: boolean }
  ): OperationPlan {
    const planId = `plan-umount-${Date.now()}`;
    const riskAnalysis = RiskAssessment.assessOperation('UnmountFilesystem', mountPointOrDevice);

    const step: PlanStep = {
      id: `${planId}-step-1`,
      stepNumber: 1,
      name: `Unmount ${mountPointOrDevice}`,
      operationType: 'UnmountFilesystem',
      target: mountPointOrDevice,
      command: `sudo umount "${mountPointOrDevice}"`,
      arguments: { target: mountPointOrDevice },
      dependencies: [],
      requiredCapabilities: ['filesystem.unmount'],
      risk: riskAnalysis.level,
      reversibility: 'partially_reversible',
      status: 'ready'
    };

    return {
      id: planId,
      intent: `Unmount ${mountPointOrDevice}`,
      targetObjects: [mountPointOrDevice],
      steps: [step],
      requiredCapabilities: ['filesystem.unmount'],
      risk: riskAnalysis.level,
      requiresConfirmation: riskAnalysis.requiresExplicitConfirmation || riskAnalysis.level === 'CRITICAL',
      status: 'draft',
      createdAt: Date.now()
    };
  }

  /**
   * Plan Windows game or application launch with prefix & runtime orchestration
   */
  public static planLaunchGame(
    gameTitle: string,
    exePath: string,
    options: {
      winePrefix?: string;
      protonVersion?: string;
      useGamescope?: boolean;
      useMangoHud?: boolean;
      fsrUpscale?: boolean;
      resolution?: { w: number; h: number; outW: number; outH: number; refresh: number };
    },
    graph: ObjectGraph
  ): OperationPlan {
    const planId = `plan-game-${Date.now()}`;
    const steps: PlanStep[] = [];

    const prefix = options.winePrefix || '/home/cachy/.local/share/wineprefixes/gog_games';

    // Step 1: Ensure prefix directory exists
    const stepPrefix: PlanStep = {
      id: `${planId}-step-1`,
      stepNumber: 1,
      name: `Verify / initialize Wine prefix at ${prefix}`,
      operationType: 'CreateDirectory',
      target: prefix,
      command: `mkdir -p "${prefix}"`,
      arguments: { path: prefix },
      dependencies: [],
      requiredCapabilities: ['filesystem.create'],
      risk: 'LOW_RISK',
      reversibility: 'reversible',
      verification: {
        type: 'directory_exists',
        targetPathOrEntity: prefix
      },
      status: 'ready'
    };
    steps.push(stepPrefix);

    // Step 2: Build game launch command string
    let launcherPrefix = '';
    if (options.useGamescope) {
      const res = options.resolution || { w: 1920, h: 1080, outW: 2560, outH: 1440, refresh: 165 };
      const fsrFlag = options.fsrUpscale !== false ? '-F fsr ' : '';
      launcherPrefix += `gamescope -W ${res.outW} -H ${res.outH} -w ${res.w} -h ${res.h} -r ${res.refresh} ${fsrFlag}-f -- `;
    }

    if (options.useMangoHud) {
      launcherPrefix += 'mangohud ';
    }

    const command = `WINEPREFIX="${prefix}" ${launcherPrefix}wine "${exePath}"`;

    const stepLaunch: PlanStep = {
      id: `${planId}-step-2`,
      stepNumber: 2,
      name: `Launch ${gameTitle} (${options.useGamescope ? 'Gamescope + ' : ''}${options.useMangoHud ? 'MangoHud + ' : ''}Wine)`,
      operationType: 'LaunchWineApplication',
      target: exePath,
      command,
      arguments: {
        executable: exePath,
        prefix,
        useGamescope: options.useGamescope,
        useMangoHud: options.useMangoHud
      },
      dependencies: [stepPrefix.id],
      requiredCapabilities: ['gaming.launch', 'wine.launch'],
      risk: 'LOW_RISK',
      reversibility: 'reversible',
      verification: {
        type: 'process_running',
        targetPathOrEntity: exePath
      },
      status: 'pending'
    };
    steps.push(stepLaunch);

    return {
      id: planId,
      intent: `Launch ${gameTitle} with optimal graphics & overlay stack`,
      targetObjects: [exePath, prefix],
      steps,
      requiredCapabilities: ['gaming.launch', 'wine.launch', 'filesystem.create'],
      risk: 'LOW_RISK',
      requiresConfirmation: false,
      status: 'draft',
      createdAt: Date.now()
    };
  }
}
