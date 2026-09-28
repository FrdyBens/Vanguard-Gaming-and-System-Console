import { TroubleshootingEntry } from '../types';

export const TROUBLESHOOTING_DATABASE: TroubleshootingEntry[] = [
  {
    id: 'mount_wrong_fs_type',
    title: 'mount: wrong fs type, bad option, bad superblock',
    category: 'storage',
    errorPattern: 'wrong fs type|bad option|bad superblock|missing codepage',
    symptom: 'Attempting to mount a disk or partition fails with an ambiguous error message mentioning filesystem type or corrupted superblock.',
    likelyCauses: [
      'The partition is formatted with Btrfs/Ext4 but you passed the wrong "-t" type flag.',
      'The drive is an NTFS partition from Windows and Windows Fast Startup or Hibernation left it in an unclean/locked state.',
      'The drive is encrypted (LUKS/BitLocker) and must be opened before mounting.',
      'The filesystem journal or superblock is damaged from an improper power disconnect.'
    ],
    diagnosticCommand: 'sudo blkid /dev/sdb1 && sudo dmesg | tail -n 25',
    outputInterpretation: 'blkid prints the true detected filesystem type (TYPE="ntfs" or "btrfs"). dmesg indicates if the kernel driver failed due to dirty log or missing driver module.',
    safeFixCommand: 'sudo mount -t ntfs3 -o ro,uid=1000,gid=1000 /dev/sdb1 /mnt/windows',
    safeFixDescription: 'Mount the filesystem as read-only ("-o ro") to safely read data without needing write access to a dirty journal.',
    dangerousFixCommand: 'sudo ntfsfix --clear-dirty /dev/sdb1',
    dangerousFixWarning: 'Running ntfsfix forces the NTFS dirty bit to clear, which can cause data loss if unwritten Windows cache files were pending.',
    verificationCommand: 'findmnt /mnt/windows',
    cachySpecificNote: 'On CachyOS, prefer the high-performance in-kernel "ntfs3" driver over user-space "ntfs-3g".'
  },
  {
    id: 'vulkan_icd_missing',
    title: 'Vulkan: No ICD found / Unable to initialize Vulkan loader',
    category: 'drivers',
    errorPattern: 'vkCreateInstance failed|VK_ERROR_INITIALIZATION_FAILED|No ICD found',
    symptom: 'Gamescope, MangoHud, DXVK, or native Vulkan games fail to start, crashing with Vulkan instance creation errors.',
    likelyCauses: [
      'Missing 32-bit or 64-bit Vulkan driver packages (vulkan-radeon, lib32-vulkan-radeon, nvidia-utils, or vulkan-intel).',
      'Conflicting or outdated ICD files in /usr/share/vulkan/icd.d/.',
      'Dual-GPU laptop attempting to run on integrated GPU without proper prime render offload flags.'
    ],
    diagnosticCommand: 'vulkaninfo --summary && ls -la /usr/share/vulkan/icd.d/',
    outputInterpretation: 'Should output available GPU devices (e.g. AMD Radeon RX 7800 XT) and active driver ICD JSON configurations.',
    safeFixCommand: 'sudo pacman -S --needed vulkan-radeon lib32-vulkan-radeon vulkan-tools',
    safeFixDescription: 'Install or update the official CachyOS optimized AMD Radeon Vulkan driver and diagnostics.',
    verificationCommand: 'vkcube',
    cachySpecificNote: 'CachyOS includes optimized RADV drivers with ray tracing and mesh shading enabled by default.'
  },
  {
    id: 'wine_prefix_corruption',
    title: 'Wine: could not load kernel32.dll / 0xc0000135 crash',
    category: 'gaming',
    errorPattern: 'could not load kernel32.dll|status c0000135|wineboot failed|prefix corrupt',
    symptom: 'Windows executables fail immediately when launched in a custom Wine prefix with low-level DLL loading failure.',
    likelyCauses: [
      'The WINEPREFIX was created with a conflicting architecture (e.g., win32 vs win64).',
      'An update to Wine or Wine-Staging replaced internal DLLs while old symlinks remained.',
      'Previous Wine process crashed midway through an installer, leaving locked registry hives.'
    ],
    diagnosticCommand: 'WINEPREFIX="$WINEPREFIX" wineboot -u',
    outputInterpretation: 'Re-evaluates and updates all system DLL symlinks and registry keys in the prefix.',
    safeFixCommand: 'WINEPREFIX="$HOME/.local/share/wineprefixes/gog_games" wineboot -u',
    safeFixDescription: 'Safely regenerates system DLLs and updates prefix metadata without touching installed game files.',
    dangerousFixCommand: 'rm -rf "$WINEPREFIX" && WINEARCH=win64 wineboot -i',
    dangerousFixWarning: 'Completely deletes the prefix! Game save files inside drive_c/users/ will be permanently destroyed unless backed up first.',
    verificationCommand: 'wine --version',
    cachySpecificNote: 'Vanguard automatically identifies if game saves are located in prefix user directories and maps them to ~/Documents/My Games.'
  },
  {
    id: 'pacman_lock_error',
    title: 'pacman: failed to lock database: File exists (/var/lib/pacman/db.lck)',
    category: 'packages',
    errorPattern: 'failed to lock database|db.lck: File exists',
    symptom: 'Installing or upgrading packages fails because pacman claims another transaction is active.',
    likelyCauses: [
      'A background update or Discover/Pamac daemon is running in the background.',
      'A previous pacman or paru command was terminated by closing the terminal or hard rebooting.'
    ],
    diagnosticCommand: 'pgrep -l pacman || pgrep -l paru',
    outputInterpretation: 'If a process ID is printed, pacman is actively running and you must wait. If blank, the lock file is stale.',
    safeFixCommand: 'sudo rm /var/lib/pacman/db.lck',
    safeFixDescription: 'Remove stale lock file once verified that no pacman/paru process is running.',
    verificationCommand: 'sudo pacman -Sy',
    cachySpecificNote: 'Never remove db.lck if pacman is actively compiling or downloading packages.'
  }
];

export function findTroubleshootingByError(errorText: string): TroubleshootingEntry | undefined {
  const lower = errorText.toLowerCase();
  return TROUBLESHOOTING_DATABASE.find((item) => {
    const regex = new RegExp(item.errorPattern, 'i');
    return regex.test(lower);
  });
}
