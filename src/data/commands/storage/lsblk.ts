import { CommandDefinition } from '../../../types';

export const lsblkCommand: CommandDefinition = {
  id: 'lsblk',
  name: 'lsblk',
  executable: 'lsblk',
  category: 'storage',
  description: 'List block devices in a tree structure with filesystem types, sizes, labels, and mount points.',
  whatItDoes: 'Queries the sysfs filesystem and udev database to output an exhaustive layout of all connected disks, partitions, NVMe namespaces, and loop devices.',
  whyUseIt: 'The absolute safest and fastest way to identify disk names (/dev/nvme0n1, /dev/sda), verify partition UUIDs before mounting, and check remaining disk space.',
  whenNotToUseIt: 'Not needed if you only want to know currently mounted paths (use findmnt for mount tree inspection).',
  privilege: 'none',
  safetyLevel: 'read_only',
  arguments: [
    {
      name: 'device',
      label: 'Target Device (Optional)',
      description: 'Filter output strictly to a specific disk or partition node.',
      type: 'device',
      required: false,
      placeholder: '/dev/nvme0n1 or /dev/sdb',
      detectionMethod: 'detect_block_devices'
    }
  ],
  commonOptions: [
    { flag: '-f', label: 'Filesystem Info', description: 'Show filesystem types (FSTYPE), filesystem labels (LABEL), and UUIDs.', type: 'boolean' },
    { flag: '-m', label: 'Permissions & Modes', description: 'Show device owner, group, and octal access modes.', type: 'boolean' },
    { flag: '-o', label: 'Custom Columns', description: 'Select specific columns: NAME,FSTYPE,FSVER,LABEL,UUID,FSAVAIL,FSUSE%,MOUNTPOINTS.', type: 'string' },
    { flag: '-J', label: 'JSON Output', description: 'Produce machine-readable JSON format for programmatic consumption.', type: 'boolean' }
  ],
  realWorldExamples: [
    {
      title: 'Inspect All Partitions With Filesystems & Mount Points',
      scenario: 'Preparing to mount a secondary gaming drive and checking whether it is Btrfs or Ext4.',
      command: 'lsblk -f',
      argumentsExplanation: 'Outputs name, filesystem type, label, UUID, and active mount point in an easy-to-read ASCII tree.',
      verificationStep: 'Verify your target partition name (e.g. nvme0n1p3) appears with its FSTYPE.'
    },
    {
      title: 'Output Complete Disk Telemetry with Free Space',
      scenario: 'Checking free gigabytes on all partitions before installing large games.',
      command: 'lsblk -o NAME,FSTYPE,LABEL,SIZE,FSAVAIL,FSUSE%,MOUNTPOINTS',
      argumentsExplanation: 'Custom column format highlighting exact available space on each mounted filesystem.',
      verificationStep: 'Check the FSAVAIL and FSUSE% columns for your gaming partition.'
    }
  ],
  commonMistakes: [
    'Assuming device names (/dev/sdb, /dev/sdc) are permanent across reboots. Always rely on UUID or filesystem LABEL in /etc/fstab instead.',
    'Running fdisk instead of lsblk just to check sizes, risking accidental disk partition table writes.'
  ],
  commonErrors: [],
  cachyOsNotes: 'CachyOS includes updated util-linux with full Btrfs multi-device and Zstandard compression metrics in lsblk output.',
  archNotes: 'Standard utility installed by default in base-devel and util-linux.',
  gamingNotes: 'Use lsblk -f to confirm your Steam library drive is formatted with a Linux-native filesystem (Btrfs/Ext4) rather than exFAT.',
  relatedCommandIds: ['mount', 'findmnt', 'blkid', 'df']
};

export const findmntCommand: CommandDefinition = {
  id: 'findmnt',
  name: 'findmnt',
  executable: 'findmnt',
  category: 'storage',
  description: 'Find, list, and verify currently mounted filesystems and their active kernel mount options.',
  whatItDoes: 'Reads /proc/self/mountinfo and /etc/fstab to display a hierarchical view of all active mount points, filesystems, and options.',
  whyUseIt: 'The definitive command to verify if a filesystem is mounted read-write or read-only, check active Btrfs compression, and troubleshoot mount failures.',
  whenNotToUseIt: 'Not for listing unmounted raw disks (use lsblk instead).',
  privilege: 'none',
  safetyLevel: 'read_only',
  arguments: [
    {
      name: 'target',
      label: 'Target Mount Point or Device',
      description: 'The mount point or device to inspect.',
      type: 'path',
      required: false,
      placeholder: '/ or /run/media/cachy/GamesSSD',
      suggestions: ['/', '/home', '/run/media/cachy/GamesSSD', '/mnt/backup']
    }
  ],
  commonOptions: [
    { flag: '-s', label: 'Inspect /etc/fstab', description: 'Search mounts declared in fstab instead of currently active kernel mounts.', type: 'boolean' },
    { flag: '-t', label: 'Filter by Filesystem', description: 'Filter output strictly to specific filesystem types (e.g. btrfs, ext4, ntfs3).', type: 'filesystem' },
    { flag: '-o', label: 'Output Columns', description: 'Select columns: TARGET,SOURCE,FSTYPE,OPTIONS.', type: 'string' }
  ],
  realWorldExamples: [
    {
      title: 'Verify Active Btrfs Mount Options & Subvolumes',
      scenario: 'Verifying whether CachyOS root and home subvolumes have ZSTD compression and noatime enabled.',
      command: 'findmnt -t btrfs',
      argumentsExplanation: 'Filters strictly to Btrfs mounts, exposing subvol=@, subvol=@home, and compression flags.',
      verificationStep: 'Look for "compress=zstd" and "noatime" in the OPTIONS column.'
    },
    {
      title: 'Verify Game Directory Mount Status',
      scenario: 'Checking whether external drive is mounted read-write or read-only.',
      command: 'findmnt /run/media/cachy/GamesSSD',
      argumentsExplanation: 'Outputs whether the drive is mounted rw (read-write) or ro (read-only).',
      verificationStep: 'Check the OPTIONS column for "rw" rather than "ro".'
    }
  ],
  commonMistakes: [
    'Checking "mount" without flags which spits out an unformatted wall of text; findmnt formats output in a clean structured tree.'
  ],
  commonErrors: [],
  cachyOsNotes: 'Essential on CachyOS for verifying that zstd compression and subvolumes are mounted with optimal latency parameters.',
  archNotes: 'Standard tool in util-linux package.',
  gamingNotes: 'If games crash on startup with file write errors, run findmnt on your game library to confirm the drive was not remounted read-only due to I/O errors.',
  relatedCommandIds: ['mount', 'umount', 'lsblk']
};
