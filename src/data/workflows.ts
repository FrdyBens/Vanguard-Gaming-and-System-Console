import { WorkflowDefinition } from '../types';

export const WORKFLOWS_DATABASE: WorkflowDefinition[] = [
  {
    id: 'workflow_mount_btrfs_gaming',
    name: 'Mount Btrfs Gaming SSD with ZSTD Compression',
    description: 'Safely inspects block device, ensures target mount directory exists, attaches Btrfs subvolume with latency-optimized zstd compression, and verifies read-write state.',
    category: 'storage',
    riskLevel: 'privileged',
    requiredPrivilege: 'sudo',
    successCount: 14,
    failureCount: 0,
    inputs: [
      {
        key: 'DEVICE',
        label: 'Source Partition / Device',
        type: 'device',
        defaultValue: '/dev/nvme0n1p3',
        placeholder: '/dev/nvme0n1p3'
      },
      {
        key: 'MOUNT_POINT',
        label: 'Target Mount Directory',
        type: 'directory',
        defaultValue: '/run/media/cachy/GamesSSD',
        placeholder: '/run/media/cachy/GamesSSD'
      },
      {
        key: 'SUBVOL',
        label: 'Btrfs Subvolume Name',
        type: 'string',
        defaultValue: '@games',
        placeholder: '@games'
      }
    ],
    steps: [
      {
        stepNumber: 1,
        name: 'Inspect Filesystem UUID & State',
        description: 'Verify partition signature and ensure device is not dirty or locked.',
        commandTemplate: 'lsblk -f {{DEVICE}}',
        privilege: 'none',
        risk: 'read_only'
      },
      {
        stepNumber: 2,
        name: 'Ensure Target Directory Exists',
        description: 'Create directory hierarchy if missing prior to mount.',
        commandTemplate: 'sudo mkdir -p {{MOUNT_POINT}}',
        privilege: 'sudo',
        risk: 'low_risk'
      },
      {
        stepNumber: 3,
        name: 'Mount Btrfs Subvolume with ZSTD & Noatime',
        description: 'Mount with optimal gaming parameters for low I/O latency.',
        commandTemplate: 'sudo mount -t btrfs -o noatime,compress=zstd:1,subvol={{SUBVOL}} {{DEVICE}} {{MOUNT_POINT}}',
        privilege: 'sudo',
        risk: 'privileged',
        rollbackCommand: 'sudo umount {{MOUNT_POINT}}'
      },
      {
        stepNumber: 4,
        name: 'Verify Active Mount State',
        description: 'Ensure directory is mounted read-write and accessible.',
        commandTemplate: 'findmnt {{MOUNT_POINT}}',
        privilege: 'none',
        risk: 'read_only',
        verifyCondition: 'TARGET == {{MOUNT_POINT}} && OPTIONS includes "rw"'
      }
    ]
  },
  {
    id: 'workflow_launch_gamescope_wine',
    name: 'Launch Windows Executable with Gamescope, FSR & MangoHud',
    description: 'Prepares an isolated Wine prefix, directs Windows Documents to ~/Documents/My Games, configures MangoHud overlay, and executes inside Gamescope with AMD FSR upscaling.',
    category: 'gaming',
    riskLevel: 'low_risk',
    requiredPrivilege: 'none',
    successCount: 28,
    failureCount: 1,
    inputs: [
      {
        key: 'EXE_PATH',
        label: 'Windows Executable (.exe)',
        type: 'win_exe',
        defaultValue: '/run/media/cachy/GamesSSD/GOG/Witcher3/bin/x64/witcher3.exe'
      },
      {
        key: 'PREFIX_PATH',
        label: 'Isolated Wine Prefix',
        type: 'wine_prefix',
        defaultValue: '/home/cachy/.local/share/wineprefixes/gog_games'
      },
      {
        key: 'RES_OUT',
        label: 'Display Resolution (WxH)',
        type: 'string',
        defaultValue: '2560 -H 1440'
      },
      {
        key: 'RES_IN',
        label: 'Internal Render Resolution (wxh)',
        type: 'string',
        defaultValue: '1920 -h 1080'
      },
      {
        key: 'REFRESH_RATE',
        label: 'FPS Cap / Refresh Rate',
        type: 'number',
        defaultValue: '165'
      }
    ],
    steps: [
      {
        stepNumber: 1,
        name: 'Validate Prefix & Documents Directory Mapping',
        description: 'Ensure prefix directory exists and Windows Documents symlink points to Linux ~/Documents.',
        commandTemplate: 'mkdir -p {{PREFIX_PATH}} && mkdir -p "$HOME/Documents/My Games"',
        privilege: 'none',
        risk: 'low_risk'
      },
      {
        stepNumber: 2,
        name: 'Execute Game via Gamescope + MangoHud + Wine',
        description: 'Launches executable in isolated session with hardware monitoring and FSR scaling.',
        commandTemplate: 'WINEPREFIX="{{PREFIX_PATH}}" WINEFSYNC=1 gamescope -W {{RES_OUT}} -w {{RES_IN}} -r {{REFRESH_RATE}} -F fsr -f -- mangohud wine "{{EXE_PATH}}"',
        privilege: 'none',
        risk: 'low_risk'
      }
    ]
  },
  {
    id: 'workflow_cachy_package_maintenance',
    name: 'CachyOS Full System Update & Cache Trim',
    description: 'Synchronizes CachyOS x86-64-v3/v4 repositories, upgrades packages, checks for orphaned packages, and safely cleans older cached tarballs.',
    category: 'maintenance',
    riskLevel: 'privileged',
    requiredPrivilege: 'sudo',
    successCount: 42,
    failureCount: 0,
    inputs: [],
    steps: [
      {
        stepNumber: 1,
        name: 'Synchronize & Upgrade Packages',
        description: 'Full update of system binaries and kernel from CachyOS mirrors.',
        commandTemplate: 'sudo pacman -Syu --needed',
        privilege: 'sudo',
        risk: 'privileged'
      },
      {
        stepNumber: 2,
        name: 'Clean Old Cached Package Archives',
        description: 'Keeps the newest 2 versions of cached packages and removes older ones.',
        commandTemplate: 'sudo paccache -r || sudo pacman -Sc --noconfirm',
        privilege: 'sudo',
        risk: 'low_risk'
      }
    ]
  }
];
