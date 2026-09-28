/**
 * Vanguard Core - Machine Discovery
 * Adapters for scanning machine state and hydrating the ObjectGraph
 */

import { ObjectGraph } from '../graph/ObjectGraph';
import { GraphNode } from '../graph/GraphNode';
import { MachineSnapshot } from './MachineSnapshot';
import { INITIAL_TELEMETRY, INITIAL_BLOCK_DEVICES, INITIAL_FILES } from '../../services/cachyState';

export class MachineDiscovery {
  /**
   * Produce a complete MachineSnapshot from simulated CachyOS environment
   */
  public static createDefaultSnapshot(): MachineSnapshot {
    return {
      snapshotId: `snap-${Date.now()}`,
      timestamp: Date.now(),
      confidence: 'verified',
      source: 'simulator',
      os: {
        distro: 'CachyOS',
        distroVersion: '2026.03',
        architecture: 'x86-64-v4',
        kernel: INITIAL_TELEMETRY.kernel,
        kernelFlavor: 'bore-lto',
        desktopEnvironment: 'KDE Plasma 6.3.2',
        displayServer: 'Wayland'
      },
      cpu: {
        model: INITIAL_TELEMETRY.cpu,
        cores: 8,
        threads: 16,
        architecture: 'x86_64-v4 (AVX-512)',
        governor: 'schedutil'
      },
      gpu: {
        vendor: 'AMD',
        model: 'AMD Radeon RX 7900 XTX (24GB VRAM)',
        driver: INITIAL_TELEMETRY.driver,
        driverVersion: 'Mesa 24.3.4',
        vulkanVersion: '1.3.296',
        vulkanIcd: 'radv_icd.x86_64.json',
        openGlVersion: '4.6 (Compatibility Profile)',
        vramTotalMb: 24576
      },
      memory: {
        totalBytes: 32 * 1024 * 1024 * 1024,
        availableBytes: 20 * 1024 * 1024 * 1024,
        usedBytes: 12 * 1024 * 1024 * 1024,
        swapBytes: 0,
        zramBytes: 16 * 1024 * 1024 * 1024
      },
      storage: {
        devices: INITIAL_BLOCK_DEVICES.map((dev) => ({
          name: dev.name,
          path: dev.path,
          serial: `S6X9NU0W${dev.name}`,
          model: dev.model,
          sizeBytes: dev.size.includes('T') ? 2 * 1024 * 1024 * 1024 * 1024 : 500 * 1024 * 1024 * 1024,
          displaySize: dev.size,
          fsType: dev.fsType,
          uuid: dev.uuid,
          label: dev.label,
          mountPoint: dev.mountPoint,
          isMounted: dev.isMounted,
          isReadOnly: dev.isReadOnly,
          isSystemDisk: dev.mountPoint === '/',
          isBootDisk: dev.mountPoint === '/boot/efi',
          subvolumes: (dev as any).subvolumes
        }))
      },
      gaming: {
        steamInstalled: true,
        steamLibraries: ['/home/cachy/.steam', '/run/media/cachy/GamesSSD/SteamLibrary'],
        protonVersions: [
          { name: 'Proton-GE-9-25-cachyos', path: '/home/cachy/.local/share/Steam/compatibilitytools.d/GE-Proton9-25', isGe: true },
          { name: 'Proton Experimental', path: '/home/cachy/.steam/steam/steamapps/common/Proton - Experimental', isGe: false },
          { name: 'Proton 9.0 (Beta)', path: '/home/cachy/.steam/steam/steamapps/common/Proton 9.0', isGe: false }
        ],
        wineVersions: [
          { name: 'wine-cachyos 10.2 (Staging + NTSYNC)', path: '/usr/bin/wine', hasNtsync: true },
          { name: 'wine-staging 9.22', path: '/opt/wine-staging/bin/wine', hasNtsync: false }
        ],
        gamescopeAvailable: true,
        gamescopeVersion: '3.14.24-cachyos',
        mangohudAvailable: true,
        dxvkVersion: '2.5.3',
        vkd3dVersion: '2.14.1',
        detectedPrefixes: [
          { path: '/home/cachy/.wine', arch: 'win64', lastUsed: '2026-09-28' },
          { path: '/home/cachy/.local/share/wineprefixes/gog_games', arch: 'win64', lastUsed: '2026-09-28' },
          { path: '/run/media/cachy/GamesSSD/SteamLibrary/steamapps/compatdata/1062090/pfx', arch: 'win64', lastUsed: '2026-09-27' }
        ]
      },
      services: [
        { name: 'systemd-resolved.service', description: 'Network Name Resolution', active: true, enabled: true, subState: 'running' },
        { name: 'systemd-zram-setup@zram0.service', description: 'Create swap on /dev/zram0', active: true, enabled: true, subState: 'exited' },
        { name: 'btrfs-scrub@-.timer', description: 'Monthly Btrfs scrub timer', active: true, enabled: true, subState: 'waiting' },
        { name: 'jellyfin.service', description: 'Jellyfin Media Server', active: false, enabled: false, subState: 'dead' }
      ],
      permissions: {
        user: 'cachy',
        uid: 1000,
        groups: ['wheel', 'storage', 'audio', 'video', 'gamemode'],
        sudoAvailable: true,
        writablePaths: ['/home/cachy', '/run/media/cachy', '/tmp']
      }
    };
  }

  /**
   * Populate ObjectGraph with initial nodes and relationships from snapshot and files
   */
  public static populateGraph(graph: ObjectGraph, snapshot: MachineSnapshot): void {
    const now = Date.now();

    // 1. Kernel & GPU nodes
    const kernelNode: GraphNode = {
      id: 'node-kernel-cachyos',
      stableId: `kernel:${snapshot.os.kernel}`,
      type: 'kernel',
      displayName: snapshot.os.kernel,
      confidence: 'verified',
      source: 'kernel',
      properties: { flavor: snapshot.os.kernelFlavor, arch: snapshot.os.architecture },
      availableActions: [],
      timestamps: { detectedAt: now, updatedAt: now }
    };
    graph.upsertNode(kernelNode);

    const gpuNode: GraphNode = {
      id: 'node-gpu-radv',
      stableId: `gpu:${snapshot.gpu.vendor}:${snapshot.gpu.model}`,
      type: 'gpu',
      displayName: snapshot.gpu.model,
      confidence: 'verified',
      source: 'udev',
      properties: { driver: snapshot.gpu.driver, vulkanVersion: snapshot.gpu.vulkanVersion },
      availableActions: [],
      timestamps: { detectedAt: now, updatedAt: now }
    };
    graph.upsertNode(gpuNode);

    // 2. Storage Devices & Partitions
    snapshot.storage.devices.forEach((dev) => {
      const devNode: GraphNode = {
        id: `node-dev-${dev.name}`,
        stableId: dev.uuid ? `uuid:${dev.uuid}` : `device:${dev.serial || dev.name}`,
        type: 'device',
        displayName: `${dev.name} (${dev.label || dev.fsType || dev.displaySize})`,
        path: dev.path,
        confidence: 'verified',
        source: 'udev',
        properties: {
          ...dev,
          isSystemDisk: dev.isSystemDisk,
          isBootDisk: dev.isBootDisk
        },
        availableActions: [
          {
            id: 'mount_toggle',
            label: dev.isMounted ? 'Unmount Partition' : 'Mount Partition',
            description: dev.isMounted ? 'Detach from active mountpoint' : 'Mount with optimal Btrfs/NTFS flags',
            risk: dev.isMounted ? 'low_risk' : 'privileged',
            recommended: true,
            operationType: dev.isMounted ? 'UnmountFilesystem' : 'MountFilesystem'
          },
          {
            id: 'inspect_health',
            label: 'Inspect Smart Health',
            description: 'Check NVMe health & wear indicators',
            risk: 'read_only',
            operationType: 'InspectDevice'
          }
        ],
        timestamps: { detectedAt: now, updatedAt: now }
      };
      graph.upsertNode(devNode);

      if (dev.mountPoint) {
        const mountNode: GraphNode = {
          id: `node-mount-${dev.name}`,
          stableId: `mount:${dev.mountPoint}`,
          type: 'mount',
          displayName: dev.mountPoint,
          path: dev.mountPoint,
          confidence: 'verified',
          source: 'kernel',
          properties: { fsType: dev.fsType, options: 'noatime,compress=zstd:1' },
          availableActions: [],
          timestamps: { detectedAt: now, updatedAt: now }
        };
        graph.upsertNode(mountNode);
        graph.addRelationship(devNode.id, mountNode.id, 'MOUNTED_AT');
      }
    });

    // 3. Steam Game Example (Timberborn)
    const timberbornAppId = 1062090;
    const gameNode: GraphNode = {
      id: 'node-game-timberborn',
      stableId: `steam:app:${timberbornAppId}`,
      type: 'steam_game',
      displayName: 'Timberborn',
      path: '/run/media/cachy/GamesSSD/SteamLibrary/steamapps/common/Timberborn',
      confidence: 'verified',
      source: 'steam',
      properties: {
        appId: timberbornAppId,
        protonVersion: 'Proton-GE-9-25-cachyos',
        compatPrefix: '/run/media/cachy/GamesSSD/SteamLibrary/steamapps/compatdata/1062090/pfx',
        saveDirectory: '/home/cachy/Documents/My Games/Timberborn'
      },
      availableActions: [
        {
          id: 'launch_game',
          label: 'Launch Timberborn with Proton-GE & MangoHud',
          description: 'Start executable via Steam compatibility runtime',
          risk: 'low_risk',
          recommended: true,
          operationType: 'LaunchSteamGame'
        }
      ],
      timestamps: { detectedAt: now, updatedAt: now }
    };
    graph.upsertNode(gameNode);

    // Steam Library node
    const steamLibNode: GraphNode = {
      id: 'node-steamlib-games',
      stableId: 'steamlib:/run/media/cachy/GamesSSD/SteamLibrary',
      type: 'steam_library',
      displayName: 'Steam Library (GamesSSD)',
      path: '/run/media/cachy/GamesSSD/SteamLibrary',
      confidence: 'verified',
      source: 'steam',
      properties: { isDefault: false },
      availableActions: [],
      timestamps: { detectedAt: now, updatedAt: now }
    };
    graph.upsertNode(steamLibNode);
    graph.addRelationship(steamLibNode.id, gameNode.id, 'CONTAINS');

    // Executable node
    const timberExeNode: GraphNode = {
      id: 'node-exe-timberborn',
      stableId: 'file:sha256:timberborn_exe',
      type: 'executable',
      displayName: 'Timberborn.exe',
      path: '/run/media/cachy/GamesSSD/SteamLibrary/steamapps/common/Timberborn/Timberborn.exe',
      confidence: 'verified',
      source: 'steam',
      properties: { architecture: 'PE32+ (x86_64)', sizeBytes: 52428800 },
      availableActions: [],
      timestamps: { detectedAt: now, updatedAt: now }
    };
    graph.upsertNode(timberExeNode);
    graph.addRelationship(gameNode.id, timberExeNode.id, 'EXECUTABLE_FOR');

    // Proton Prefix node
    const protonPrefixNode: GraphNode = {
      id: 'node-proton-prefix-1062090',
      stableId: 'protonpfx:1062090',
      type: 'proton_prefix',
      displayName: 'Proton Prefix (AppID 1062090)',
      path: '/run/media/cachy/GamesSSD/SteamLibrary/steamapps/compatdata/1062090/pfx',
      confidence: 'verified',
      source: 'steam',
      properties: { arch: 'win64' },
      availableActions: [],
      timestamps: { detectedAt: now, updatedAt: now }
    };
    graph.upsertNode(protonPrefixNode);
    graph.addRelationship(gameNode.id, protonPrefixNode.id, 'PREFIX_FOR');

    // Link relationships
    graph.addRelationship(timberExeNode.id, protonPrefixNode.id, 'RUNS_WITH');
    graph.addRelationship(timberExeNode.id, gpuNode.id, 'USES');

    // 4. Filesystem items (skip /dev block nodes as they are modeled as rich device nodes)
    INITIAL_FILES.forEach((f) => {
      if (f.path.startsWith('/dev/') || graph.getNode(f.path)) {
        return;
      }
      const nodeType = f.type === 'directory' ? 'directory' : f.type === 'win_exe' ? 'executable' : 'file';
      const fileNode: GraphNode = {
        id: `node-file-${f.id}`,
        stableId: `file:${f.path}`,
        type: nodeType,
        displayName: f.name,
        path: f.path,
        confidence: 'verified',
        source: 'simulator',
        properties: {
          permissions: f.permissions,
          owner: f.owner,
          group: f.group,
          size: f.displaySize
        },
        availableActions: [],
        timestamps: { detectedAt: now, updatedAt: now }
      };
      graph.upsertNode(fileNode);
    });
  }
}
