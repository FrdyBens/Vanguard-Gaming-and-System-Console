import {
  UniversalContextObject,
  FileSystemItem,
  ExecutionRecord,
  GatewayMode
} from '../types';

export interface SystemTelemetry {
  kernel: string;
  architecture: string;
  cpu: string;
  gpu: string;
  driver: string;
  vulkanVersion: string;
  uptime: string;
  memoryUsedGb: number;
  memoryTotalGb: number;
  activeWineVersion: string;
  activeProtonVersion: string;
}

export const INITIAL_TELEMETRY: SystemTelemetry = {
  kernel: 'Linux 6.13.4-cachyos-bore-lto',
  architecture: 'x86-64-v4 (AVX-512)',
  cpu: 'AMD Ryzen 7 7800X3D (8C/16T @ 5.0GHz)',
  gpu: 'AMD Radeon RX 7900 XTX (24GB VRAM)',
  driver: 'Mesa 24.3.4 (RADV / LLVM 19.1.7)',
  vulkanVersion: 'Vulkan 1.3.296 (ICD: radv_icd.x86_64.json)',
  uptime: '4 days, 6 hours, 22 mins',
  memoryUsedGb: 11.4,
  memoryTotalGb: 31.2,
  activeWineVersion: 'wine-cachyos 10.2 (Staging + NTSYNC)',
  activeProtonVersion: 'Proton-GE-9-25-cachyos'
};

// Initial block devices
export const INITIAL_BLOCK_DEVICES = [
  {
    name: 'nvme0n1p1',
    path: '/dev/nvme0n1p1',
    size: '512M',
    fsType: 'vfat',
    label: 'SYSTEM_BOOT',
    uuid: '1C2D-3E4F',
    mountPoint: '/boot/efi',
    isMounted: true,
    isReadOnly: false,
    model: 'Samsung SSD 990 PRO 2TB'
  },
  {
    name: 'nvme0n1p2',
    path: '/dev/nvme0n1p2',
    size: '953.5G',
    fsType: 'btrfs',
    label: 'CACHY_ROOT',
    uuid: '4a8f9b21-6b2a-4f51-b0cd-7e614bc59891',
    mountPoint: '/',
    isMounted: true,
    isReadOnly: false,
    subvolumes: ['@', '@home', '@cache', '@log'],
    model: 'Samsung SSD 990 PRO 2TB'
  },
  {
    name: 'nvme0n1p3',
    path: '/dev/nvme0n1p3',
    size: '1.8T',
    fsType: 'btrfs',
    label: 'GamesSSD',
    uuid: '8f7e6d5c-4b3a-2109-8877-665544332211',
    mountPoint: '/run/media/cachy/GamesSSD',
    isMounted: true,
    isReadOnly: false,
    subvolumes: ['@games'],
    model: 'Samsung SSD 990 PRO 2TB'
  },
  {
    name: 'sdb1',
    path: '/dev/sdb1',
    size: '1.8T',
    fsType: 'ntfs',
    label: 'WindowsGames',
    uuid: 'E6A21B8F421B6301',
    mountPoint: '/mnt/windows',
    isMounted: true,
    isReadOnly: false,
    model: 'Crucial MX500 2TB'
  },
  {
    name: 'sdc1',
    path: '/dev/sdc1',
    size: '465.8G',
    fsType: 'ext4',
    label: 'CachyBackup',
    uuid: '99aa88bb-77cc-66dd-55ee-44ff33221100',
    mountPoint: '',
    isMounted: false,
    isReadOnly: false,
    model: 'SanDisk Ultra Luxe USB 3.2'
  }
];

// Initial File System Items in simulated virtual tree
export const INITIAL_FILES: FileSystemItem[] = [
  // /home/cachy
  { id: 'f-1', name: 'Documents', path: '/home/cachy/Documents', type: 'directory', owner: 'cachy', group: 'cachy', permissions: 'drwxr-xr-x', modified: '2026-09-27 14:10' },
  { id: 'f-2', name: 'Downloads', path: '/home/cachy/Downloads', type: 'directory', owner: 'cachy', group: 'cachy', permissions: 'drwxr-xr-x', modified: '2026-09-28 09:15' },
  { id: 'f-3', name: 'Games', path: '/home/cachy/Games', type: 'directory', owner: 'cachy', group: 'cachy', permissions: 'drwxr-xr-x', modified: '2026-09-26 19:40' },
  { id: 'f-4', name: '.wine', path: '/home/cachy/.wine', type: 'wine_prefix', owner: 'cachy', group: 'cachy', permissions: 'drwxr-xr-x', modified: '2026-09-25 11:20' },
  { id: 'f-5', name: '.steam', path: '/home/cachy/.steam', type: 'steam_lib', owner: 'cachy', group: 'cachy', permissions: 'drwxr-xr-x', modified: '2026-09-28 12:00' },
  // /home/cachy/Documents
  { id: 'f-6', name: 'My Games', path: '/home/cachy/Documents/My Games', type: 'directory', owner: 'cachy', group: 'cachy', permissions: 'drwxr-xr-x', modified: '2026-09-27 16:30' },
  { id: 'f-7', name: 'Cyberpunk 2077', path: '/home/cachy/Documents/My Games/Cyberpunk 2077', type: 'directory', owner: 'cachy', group: 'cachy', permissions: 'drwxr-xr-x', modified: '2026-09-28 10:12' },
  { id: 'f-8', name: 'Elden Ring', path: '/home/cachy/Documents/My Games/Elden Ring', type: 'directory', owner: 'cachy', group: 'cachy', permissions: 'drwxr-xr-x', modified: '2026-09-26 22:45' },
  { id: 'f-9', name: 'Witcher 3', path: '/home/cachy/Documents/My Games/Witcher 3', type: 'directory', owner: 'cachy', group: 'cachy', permissions: 'drwxr-xr-x', modified: '2026-09-25 18:20' },
  // /home/cachy/Games
  { id: 'f-10', name: 'Stalker2', path: '/home/cachy/Games/Stalker2', type: 'directory', owner: 'cachy', group: 'cachy', permissions: 'drwxr-xr-x', modified: '2026-09-28 01:14' },
  { id: 'f-11', name: 'Stalker2.exe', path: '/home/cachy/Games/Stalker2/Stalker2.exe', type: 'win_exe', sizeBytes: 104857600, displaySize: '98.5 MB', owner: 'cachy', group: 'cachy', permissions: '-rwxr-xr-x', modified: '2026-09-28 01:14' },
  { id: 'f-12', name: 'launch.sh', path: '/home/cachy/Games/launch.sh', type: 'file', sizeBytes: 540, displaySize: '540 B', owner: 'cachy', group: 'cachy', permissions: '-rwxr-xr-x', modified: '2026-09-28 08:30' },
  // /run/media/cachy/GamesSSD
  { id: 'f-13', name: 'GamesSSD', path: '/run/media/cachy/GamesSSD', type: 'directory', isMountPoint: true, fsType: 'btrfs', owner: 'cachy', group: 'cachy', permissions: 'drwxr-xr-x', modified: '2026-09-28 12:00' },
  { id: 'f-14', name: 'SteamLibrary', path: '/run/media/cachy/GamesSSD/SteamLibrary', type: 'steam_lib', owner: 'cachy', group: 'cachy', permissions: 'drwxr-xr-x', modified: '2026-09-28 12:00' },
  { id: 'f-15', name: 'GOG', path: '/run/media/cachy/GamesSSD/GOG', type: 'directory', owner: 'cachy', group: 'cachy', permissions: 'drwxr-xr-x', modified: '2026-09-20 15:00' },
  { id: 'f-16', name: 'witcher3.exe', path: '/run/media/cachy/GamesSSD/GOG/Witcher3/bin/x64/witcher3.exe', type: 'win_exe', sizeBytes: 68500000, displaySize: '65.3 MB', owner: 'cachy', group: 'cachy', permissions: '-rwxr-xr-x', modified: '2026-09-20 15:00' },
  // /dev block nodes
  { id: 'dev-1', name: 'nvme0n1', path: '/dev/nvme0n1', type: 'device', owner: 'root', group: 'disk', permissions: 'brw-rw----', modified: '2026-09-28 08:00' },
  { id: 'dev-2', name: 'nvme0n1p1', path: '/dev/nvme0n1p1', type: 'device', owner: 'root', group: 'disk', permissions: 'brw-rw----', modified: '2026-09-28 08:00' },
  { id: 'dev-3', name: 'nvme0n1p2', path: '/dev/nvme0n1p2', type: 'device', owner: 'root', group: 'disk', permissions: 'brw-rw----', modified: '2026-09-28 08:00' },
  { id: 'dev-4', name: 'nvme0n1p3', path: '/dev/nvme0n1p3', type: 'device', owner: 'root', group: 'disk', permissions: 'brw-rw----', modified: '2026-09-28 08:00' },
  { id: 'dev-5', name: 'sdb1', path: '/dev/sdb1', type: 'device', owner: 'root', group: 'disk', permissions: 'brw-rw----', modified: '2026-09-28 08:00' },
  { id: 'dev-6', name: 'sdc1', path: '/dev/sdc1', type: 'device', owner: 'root', group: 'disk', permissions: 'brw-rw----', modified: '2026-09-28 08:00' }
];

// Historical contextual execution memory
export const INITIAL_EXECUTION_HISTORY: ExecutionRecord[] = [
  {
    id: 'hist-1',
    timestamp: Date.now() - 1000 * 60 * 45, // 45m ago
    command: 'gamescope -W 2560 -H 1440 -w 1920 -h 1080 -r 165 -F fsr -f -- mangohud wine "/run/media/cachy/GamesSSD/GOG/Witcher3/bin/x64/witcher3.exe"',
    executable: 'witcher3.exe',
    toolUsed: 'Gamescope + MangoHud + Wine-CachyOS',
    winePrefix: '/home/cachy/.local/share/wineprefixes/gog_games',
    exitCode: 0,
    status: 'success',
    durationMs: 7420000,
    userConfirmedSuccess: true,
    stdoutSnippet: 'DXVK: Using Vulkan 1.3 adapter: AMD Radeon RX 7900 XTX\nGamescope: FSR enabled (1920x1080 -> 2560x1440)'
  },
  {
    id: 'hist-2',
    timestamp: Date.now() - 1000 * 60 * 60 * 26, // 1 day ago
    command: 'wine "/home/cachy/Games/Stalker2/Stalker2.exe"',
    executable: 'Stalker2.exe',
    toolUsed: 'Vanilla Wine',
    winePrefix: '/home/cachy/.wine',
    exitCode: 135,
    status: 'failed',
    failureCategory: 'config_mismatch',
    failureReason: 'Missing DirectX 12 VKD3D compiler runtime (d3dcompiler_47) in default prefix.',
    durationMs: 1400,
    userConfirmedFailure: true,
    stdoutSnippet: 'wine: Call to unimplemented function d3d12.dll.D3D12CreateDevice'
  },
  {
    id: 'hist-3',
    timestamp: Date.now() - 1000 * 60 * 60 * 72, // 3 days ago
    command: 'sudo mount -t btrfs -o noatime,compress=zstd:1,subvol=@games /dev/nvme0n1p3 /run/media/cachy/GamesSSD',
    executable: 'mount',
    exitCode: 0,
    status: 'success',
    durationMs: 310,
    userConfirmedSuccess: true,
    stdoutSnippet: '[BTRFS info] mounted subvolume @games with zstd:1'
  }
];

export class CachyStateManager {
  private telemetry: SystemTelemetry = { ...INITIAL_TELEMETRY };
  private blockDevices = [...INITIAL_BLOCK_DEVICES];
  private fileSystem = [...INITIAL_FILES];
  private executionHistory = [...INITIAL_EXECUTION_HISTORY];
  private gatewayMode: GatewayMode = 'simulated';
  private daemonUrl = 'http://localhost:9090';

  public getTelemetry(): SystemTelemetry {
    return this.telemetry;
  }

  public getBlockDevices() {
    return this.blockDevices;
  }

  public getFileSystemItems(): FileSystemItem[] {
    return this.fileSystem;
  }

  public getExecutionHistory(): ExecutionRecord[] {
    return this.executionHistory;
  }

  public getGatewayMode(): GatewayMode {
    return this.gatewayMode;
  }

  public setGatewayMode(mode: GatewayMode) {
    this.gatewayMode = mode;
  }

  public getDaemonUrl(): string {
    return this.daemonUrl;
  }

  public setDaemonUrl(url: string) {
    this.daemonUrl = url;
  }

  // Get items in specific directory
  public listDirectory(dirPath: string): FileSystemItem[] {
    const normalized = dirPath.endsWith('/') && dirPath !== '/' ? dirPath.slice(0, -1) : dirPath;
    return this.fileSystem.filter((item) => {
      const parent = item.path.substring(0, item.path.lastIndexOf('/')) || '/';
      return parent === normalized;
    });
  }

  // Create Universal Context Object for any entity
  public resolveContextObject(targetPathOrId: string): UniversalContextObject {
    const fileItem = this.fileSystem.find((f) => f.path === targetPathOrId || f.id === targetPathOrId || f.name === targetPathOrId);
    const blockDevice = this.blockDevices.find((b) => b.path === targetPathOrId || b.name === targetPathOrId);

    if (blockDevice) {
      return {
        id: `ctx-${blockDevice.name}`,
        type: 'device',
        stableId: blockDevice.uuid,
        label: `${blockDevice.name} (${blockDevice.label || blockDevice.fsType})`,
        path: blockDevice.path,
        displayPath: blockDevice.path,
        confidence: 'verified',
        lastDetectedTimestamp: Date.now(),
        metadata: {
          size: blockDevice.size,
          fsType: blockDevice.fsType,
          label: blockDevice.label,
          uuid: blockDevice.uuid,
          deviceModel: blockDevice.model,
          mountPoint: blockDevice.mountPoint,
          status: blockDevice.isMounted ? 'mounted' : 'unmounted',
          isReadOnly: blockDevice.isReadOnly
        },
        relationships: {
          mountTarget: blockDevice.mountPoint
        },
        availableActions: [
          {
            id: 'mount_action',
            label: blockDevice.isMounted ? 'Unmount Device' : 'Mount Device',
            description: blockDevice.isMounted ? 'Safely detach from filesystem tree' : 'Mount partition with optimal CachyOS flags',
            risk: blockDevice.isMounted ? 'low_risk' : 'privileged',
            recommended: true,
            commandTemplate: blockDevice.isMounted
              ? `sudo umount ${blockDevice.path}`
              : `sudo mount -t ${blockDevice.fsType === 'ntfs' ? 'ntfs3' : blockDevice.fsType} ${blockDevice.path} /run/media/cachy/${blockDevice.label || 'Storage'}`
          },
          {
            id: 'inspect_blkid',
            label: 'Inspect UUID & Signature',
            description: 'Run blkid to inspect low-level filesystem superblock',
            risk: 'read_only',
            commandTemplate: `sudo blkid ${blockDevice.path}`
          },
          {
            id: 'fsck_repair',
            label: 'Filesystem Health Check',
            description: 'Inspect filesystem integrity with btrfs check or fsck',
            risk: 'destructive',
            commandTemplate: `sudo fsck -n ${blockDevice.path}`
          }
        ],
        recentHistory: this.executionHistory.filter((h) => h.command.includes(blockDevice.path))
      };
    }

    if (fileItem && fileItem.type === 'win_exe') {
      const parentDir = fileItem.path.substring(0, fileItem.path.lastIndexOf('/'));
      const appName = fileItem.name.replace(/\.exe$/i, '');
      const defaultDocs = `/home/cachy/Documents/My Games/${appName}`;

      return {
        id: `ctx-${fileItem.id}`,
        type: 'win_exe',
        stableId: `sha256-calc-${fileItem.name.toLowerCase()}`,
        label: fileItem.name,
        path: fileItem.path,
        displayPath: fileItem.path,
        confidence: 'detected',
        lastDetectedTimestamp: Date.now(),
        metadata: {
          size: fileItem.displaySize || '68 MB',
          architecture: 'PE32+ (x86_64 Windows GUI)',
          wineVersion: this.telemetry.activeWineVersion,
          protonVersion: this.telemetry.activeProtonVersion,
          targetDirectory: parentDir,
          saveDirectory: defaultDocs,
          permissions: fileItem.permissions,
          owner: fileItem.owner
        },
        relationships: {
          winePrefix: '/home/cachy/.local/share/wineprefixes/gog_games',
          savePath: defaultDocs,
          workingDirectory: parentDir
        },
        availableActions: [
          {
            id: 'launch_gamescope_mangohud',
            label: 'Run with Gamescope + MangoHud (FSR Upscaling)',
            description: 'Launch inside isolated compositor with 165Hz cap and FSR scaling',
            risk: 'low_risk',
            recommended: true,
            commandTemplate: `WINEPREFIX="$HOME/.local/share/wineprefixes/gog_games" gamescope -W 2560 -H 1440 -w 1920 -h 1080 -r 165 -F fsr -f -- mangohud wine "${fileItem.path}"`
          },
          {
            id: 'launch_proton_ge',
            label: 'Run with Proton-GE (DirectX 12 / VKD3D)',
            description: 'Execute using CachyOS Proton-GE compatibility runtime',
            risk: 'low_risk',
            commandTemplate: `STEAM_COMPAT_CLIENT_INSTALL_PATH="$HOME/.local/share/Steam" "$HOME/.local/share/Steam/compatibilitytools.d/GE-Proton9-25/proton" run "${fileItem.path}"`
          },
          {
            id: 'open_winecfg',
            label: 'Configure Dedicated Wine Prefix',
            description: 'Run winecfg to set Windows version (Win10/11) and virtual desktop',
            risk: 'low_risk',
            commandTemplate: `WINEPREFIX="$HOME/.local/share/wineprefixes/gog_games" winecfg`
          },
          {
            id: 'open_save_dir',
            label: 'Open Save Games in ~/Documents',
            description: 'Navigate to standardized game save directory',
            risk: 'read_only'
          }
        ],
        recentHistory: this.executionHistory.filter((h) => h.executable.toLowerCase().includes(fileItem.name.toLowerCase()))
      };
    }

    // Default file or directory context
    return {
      id: `ctx-${fileItem ? fileItem.id : 'unknown'}`,
      type: fileItem?.type === 'directory' ? 'directory' : 'file',
      stableId: targetPathOrId,
      label: fileItem?.name || targetPathOrId.split('/').pop() || targetPathOrId,
      path: targetPathOrId,
      displayPath: targetPathOrId,
      confidence: fileItem ? 'verified' : 'inferred',
      lastDetectedTimestamp: Date.now(),
      metadata: {
        permissions: fileItem?.permissions || '-rw-r--r--',
        owner: fileItem?.owner || 'cachy',
        group: fileItem?.group || 'cachy',
        size: fileItem?.displaySize || '4.0 KB',
        status: 'active'
      },
      relationships: {},
      availableActions: [
        {
          id: 'copy_path',
          label: 'Copy Full Path',
          description: 'Copy escaped Linux path to clipboard',
          risk: 'read_only',
          recommended: true
        },
        {
          id: 'inspect_permissions',
          label: 'Change Permissions (chmod)',
          description: 'Modify read, write, or executable bits',
          risk: 'low_risk',
          commandTemplate: `chmod +x "${targetPathOrId}"`
        }
      ],
      recentHistory: this.executionHistory.filter((h) => h.command.includes(targetPathOrId))
    };
  }

  // Record an execution
  public recordExecution(record: Omit<ExecutionRecord, 'id'>): ExecutionRecord {
    const fullRecord: ExecutionRecord = {
      ...record,
      id: `hist-${Date.now()}`
    };
    this.executionHistory.unshift(fullRecord);
    // Keep last 30 days / max 100 entries
    if (this.executionHistory.length > 100) {
      this.executionHistory.pop();
    }
    return fullRecord;
  }

  // Toggle mount state for simulated block device
  public toggleMount(devicePath: string, targetMountPoint?: string): boolean {
    const dev = this.blockDevices.find((b) => b.path === devicePath);
    if (!dev) return false;

    if (dev.isMounted) {
      dev.isMounted = false;
      dev.mountPoint = '';
    } else {
      dev.isMounted = true;
      dev.mountPoint = targetMountPoint || `/run/media/cachy/${dev.label || 'Storage'}`;
    }
    return true;
  }

  // Create new folder in file system
  public createFolder(parentPath: string, folderName: string): FileSystemItem {
    const newPath = `${parentPath.endsWith('/') ? parentPath : parentPath + '/'}${folderName}`;
    const newItem: FileSystemItem = {
      id: `f-${Date.now()}`,
      name: folderName,
      path: newPath,
      type: 'directory',
      owner: 'cachy',
      group: 'cachy',
      permissions: 'drwxr-xr-x',
      modified: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    this.fileSystem.push(newItem);
    return newItem;
  }

  // Copy or move items between paths
  public transferItems(sources: FileSystemItem[], destinationDir: string, operation: 'copy' | 'move' | 'symlink'): void {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    sources.forEach((src) => {
      const destPath = `${destinationDir.endsWith('/') ? destinationDir : destinationDir + '/'}${src.name}`;
      if (operation === 'copy') {
        this.fileSystem.push({
          ...src,
          id: `f-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          path: destPath,
          modified: timestamp
        });
      } else if (operation === 'move') {
        const item = this.fileSystem.find((f) => f.id === src.id);
        if (item) {
          item.path = destPath;
          item.modified = timestamp;
        }
      } else if (operation === 'symlink') {
        this.fileSystem.push({
          id: `sym-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: src.name,
          path: destPath,
          type: 'symlink',
          target: src.path,
          owner: 'cachy',
          group: 'cachy',
          permissions: 'lrwxrwxrwx',
          modified: timestamp
        });
      }
    });
  }
}

export const cachyState = new CachyStateManager();
