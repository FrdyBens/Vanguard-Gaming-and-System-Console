import { CommandDefinition } from '../../../types';

export const mountCommand: CommandDefinition = {
  id: 'mount',
  name: 'mount',
  executable: 'mount',
  category: 'storage',
  description: 'Mount a filesystem or block device to a directory mount point in the Linux virtual filesystem.',
  whatItDoes: 'Attaches the filesystem found on a block device or virtual node (like a Btrfs subvolume or ISO image) to the big file tree hierarchy at the specified directory.',
  whyUseIt: 'Essential for accessing external drives, secondary NVMe/SATA gaming storage, Btrfs subvolumes (@games, @data), Windows dual-boot NTFS partitions, and ISO loop devices.',
  whenNotToUseIt: 'Do not use mount if udisks2 or your file manager (Dolphin) can auto-mount removable USB drives in user-space under /run/media/ without requiring root privilege.',
  privilege: 'sudo',
  safetyLevel: 'privileged',
  fixedComponents: ['mount'],
  arguments: [
    {
      name: 'device',
      label: 'Source Device / Partition',
      description: 'The physical device node, partition, loop image, or UUID to mount.',
      type: 'device',
      required: true,
      placeholder: '/dev/nvme0n1p3 or UUID=...',
      detectionMethod: 'detect_block_devices',
      suggestions: ['/dev/nvme0n1p3', '/dev/sdb1', '/dev/sdc1', 'LABEL=GamesSSD']
    },
    {
      name: 'mount_point',
      label: 'Target Mount Point',
      description: 'The existing target directory where the filesystem will become accessible.',
      type: 'mount_point',
      required: true,
      placeholder: '/run/media/cachy/GamesSSD or /mnt/storage',
      detectionMethod: 'detect_mount_points',
      suggestions: ['/run/media/cachy/GamesSSD', '/mnt/backup', '/home/cachy/Games', '/mnt/windows']
    }
  ],
  commonOptions: [
    { flag: '-t', label: 'Filesystem Type', description: 'Explicitly specify filesystem (btrfs, ext4, ntfs3, vfat, xfs, iso9660).', type: 'filesystem' },
    { flag: '-o', label: 'Mount Options', description: 'Comma-separated mount options (e.g. noatime,compress=zstd:3,subvol=@games,uid=1000).', type: 'string' },
    { flag: '-r', label: 'Read-Only', description: 'Mount the filesystem read-only (prevents write operations and journal updates).', type: 'boolean' },
    { flag: '--bind', label: 'Bind Mount', description: 'Remount part of the file hierarchy elsewhere (e.g., share game cache).', type: 'boolean' }
  ],
  advancedOptions: [
    { flag: '-o subvol=', label: 'Btrfs Subvolume', description: 'Mount specific Btrfs subvolume (e.g. subvol=@games or subvolid=256).' },
    { flag: '-o uid=1000,gid=1000', label: 'User/Group Ownership', description: 'Required for FAT32/exFAT/NTFS partitions that lack native POSIX ownership.' }
  ],
  realWorldExamples: [
    {
      title: 'Mount CachyOS High-Performance Btrfs Gaming Subvolume',
      scenario: 'Mounting a secondary dedicated fast NVMe partition with ZSTD compression and zero access-time write overhead for Steam.',
      command: 'sudo mount -t btrfs -o noatime,compress=zstd:1,subvol=@games /dev/nvme0n1p3 /run/media/cachy/GamesSSD',
      argumentsExplanation: 'Uses Btrfs with Zstandard compression level 1 for maximum streaming speed while saving storage space.',
      potentialPitfall: 'Target directory must exist prior to running mount, or command will fail with "mount point does not exist".',
      verificationStep: 'findmnt /run/media/cachy/GamesSSD'
    },
    {
      title: 'Mount Windows NTFS Game Drive with Native In-Kernel Driver',
      scenario: 'Mounting a shared Windows 11 game library so Proton can read and write game files safely.',
      command: 'sudo mount -t ntfs3 -o uid=1000,gid=1000,noatime,windows_names /dev/sdb1 /mnt/windows',
      argumentsExplanation: 'Uses CachyOS optimized ntfs3 in-kernel driver (much faster than user-space ntfs-3g) and maps ownership to your local user.',
      potentialPitfall: 'If Windows was shutdown with "Fast Startup" enabled or is in hibernation, ntfs3 will refuse to mount dirty filesystem.',
      verificationStep: 'ls -la /mnt/windows'
    }
  ],
  commonMistakes: [
    'Forgetting to create the target mount directory before mounting (e.g. mkdir -p /mnt/games).',
    'Mounting NTFS/FAT drives without uid=1000,gid=1000, causing games to fail because everything is owned by root with 777 permissions.',
    'Using legacy ntfs-3g on CachyOS when the fast kernel-native ntfs3 driver is available.',
    'Mounting a Btrfs disk without specifying subvolume, exposing top-level root instead of @home or @games.'
  ],
  commonErrors: [
    {
      error: 'mount: wrong fs type, bad option, bad superblock',
      cause: 'The specified filesystem type does not match the actual partition formatting, the filesystem is corrupted, or required kernel module is not loaded.',
      recovery: 'Inspect partition signature using "sudo blkid <device>" or "lsblk -f", then run fsck/btrfs check if damaged.'
    },
    {
      error: 'mount: /mnt/storage: mount point does not exist',
      cause: 'The target directory has not been created on the root filesystem.',
      recovery: 'Execute "sudo mkdir -p /mnt/storage" before mounting.'
    },
    {
      error: 'mount: /dev/sdb1 is already mounted on /run/media/...',
      cause: 'Device is already actively attached elsewhere in the tree.',
      recovery: 'Use "findmnt /dev/sdb1" to locate current mount point, or unmount first with "sudo umount /dev/sdb1".'
    }
  ],
  cachyOsNotes: 'CachyOS features optimized Btrfs mount presets with tuned zstd compression algorithms. For NTFS games, always prefer ntfs3 with "windows_names" to prevent Steam filename encoding errors.',
  archNotes: 'Requires root privileges (sudo). Ensure util-linux is updated.',
  gamingNotes: 'Never mount Steam libraries with "noexec" flag. Always ensure the mounting user owns the directory to allow Proton prefix creation.',
  relatedCommandIds: ['umount', 'findmnt', 'lsblk', 'blkid', 'btrfs']
};
