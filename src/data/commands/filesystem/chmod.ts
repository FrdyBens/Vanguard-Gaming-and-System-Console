import { CommandDefinition } from '../../../types';

export const chmodCommand: CommandDefinition = {
  id: 'chmod',
  name: 'chmod',
  executable: 'chmod',
  category: 'permissions',
  description: 'Change file mode bits (read, write, execute permissions) for user, group, and others.',
  whatItDoes: 'Modifies POSIX discretionary access control flags stored in filesystem inodes.',
  whyUseIt: 'Essential for making shell scripts or Wine executables runnable (+x), securing private SSH keys (600), or opening game directories for multi-user access.',
  whenNotToUseIt: 'Do not run "chmod -R 777 /" which completely destroys system security and breaks sudo/ssh! Also has no effect on non-POSIX filesystems (FAT/NTFS) where permissions are set at mount time via uid/gid.',
  privilege: 'none',
  safetyLevel: 'low_risk',
  fixedComponents: ['chmod'],
  arguments: [
    {
      name: 'mode',
      label: 'Permissions Mode',
      description: 'Octal (755, 644, 600) or symbolic mode (+x, u+rwx, g+rw).',
      type: 'string',
      required: true,
      placeholder: '+x or 755 or 600',
      suggestions: ['+x', '755', '644', '600', 'u+rwx']
    },
    {
      name: 'path',
      label: 'Target File or Directory',
      description: 'The path to apply permissions changes to.',
      type: 'path',
      required: true,
      placeholder: '/home/cachy/Games/launch.sh',
      suggestions: ['/home/cachy/Games/launch.sh', '/home/cachy/.local/bin/myscript']
    }
  ],
  commonOptions: [
    { flag: '-R', label: 'Recursive', description: 'Apply permissions recursively to all files and subdirectories.', type: 'boolean' },
    { flag: '-v', label: 'Verbose', description: 'Output a diagnostic line for every file processed.', type: 'boolean' }
  ],
  realWorldExamples: [
    {
      title: 'Make a Game Launch Script Executable',
      scenario: 'Allowing a downloaded bash script or wine wrapper to run as an executable program.',
      command: 'chmod +x /home/cachy/Games/launch.sh',
      argumentsExplanation: '+x grants execution rights to user, group, and others.',
      verificationStep: 'ls -l /home/cachy/Games/launch.sh (confirm "x" bit is set)'
    }
  ],
  commonMistakes: [
    'Applying chmod to an NTFS or exFAT mounted partition, which silently fails or errors because those filesystems do not store POSIX permission bits.',
    'Carelessly using -R on system directories.'
  ],
  commonErrors: [],
  cachyOsNotes: 'Standard GNU coreutils.',
  archNotes: 'Core utility.',
  gamingNotes: 'If a Linux-native game or wrapper script refuses to start with "Permission denied", verify with "ls -l" and run "chmod +x <file>".',
  relatedCommandIds: ['chown', 'cp']
};

export const cpCommand: CommandDefinition = {
  id: 'cp',
  name: 'cp',
  executable: 'cp',
  category: 'filesystem',
  description: 'Copy files and directories with optional attribute preservation and recursion.',
  whatItDoes: 'Creates byte-for-byte duplicates of files or recursively copies directory trees to new locations.',
  whyUseIt: 'Standard tool for backing up game saves, duplicating Wine prefixes, or copying ROMs and mod files.',
  whenNotToUseIt: 'For large transfers between drives or over networks, prefer rsync to get progress indicators, resume capability, and partial transfer recovery.',
  privilege: 'none',
  safetyLevel: 'low_risk',
  fixedComponents: ['cp'],
  arguments: [
    {
      name: 'source',
      label: 'Source Path(s)',
      description: 'One or more source files or directories.',
      type: 'path',
      required: true,
      placeholder: '/home/cachy/Documents/My Games/Saves'
    },
    {
      name: 'destination',
      label: 'Destination Path',
      description: 'Target directory or file path.',
      type: 'path',
      required: true,
      placeholder: '/run/media/cachy/BackupSSD/SavesBackup'
    }
  ],
  commonOptions: [
    { flag: '-r', label: 'Recursive', description: 'Copy directories and their contents recursively.', type: 'boolean' },
    { flag: '-a', label: 'Archive Mode', description: 'Preserve all attributes (ownership, timestamps, permissions, symlinks).', type: 'boolean' },
    { flag: '-u', label: 'Update Only', description: 'Copy only when source is newer than destination or destination is missing.', type: 'boolean' },
    { flag: '-v', label: 'Verbose Output', description: 'Explain what is being done.', type: 'boolean' }
  ],
  realWorldExamples: [
    {
      title: 'Full Game Save Archive with Timestamps and Permissions',
      scenario: 'Backing up a game save directory to external storage while preserving original timestamps.',
      command: 'cp -av "/home/cachy/Documents/My Games/Cyberpunk 2077" /run/media/cachy/BackupSSD/SavesBackup/',
      argumentsExplanation: '-a (archive: preserves timestamps, mode, ownership) and -v (verbose progress).',
      verificationStep: 'ls -la /run/media/cachy/BackupSSD/SavesBackup/'
    }
  ],
  commonMistakes: [
    'Omitting -r or -a when copying a directory, causing cp to abort with "omitting directory".',
    'Accidentally overwriting existing files without using interactive (-i) or update (-u) flags.'
  ],
  commonErrors: [],
  cachyOsNotes: 'On Btrfs filesystems, cp supports --reflink=auto for near-instant copy-on-write cloning without consuming extra disk space!',
  archNotes: 'Standard GNU coreutils.',
  gamingNotes: 'When copying game directories across Btrfs partitions, use "cp --reflink=auto" for instantaneous zero-cost snapshots.',
  relatedCommandIds: ['chmod', 'rsync']
};
