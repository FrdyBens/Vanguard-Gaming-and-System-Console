import { CommandDefinition } from '../../../types';

export const pacmanCommand: CommandDefinition = {
  id: 'pacman',
  name: 'pacman',
  executable: 'pacman',
  category: 'packages',
  description: 'Package manager for Arch Linux and CachyOS optimized binary repositories.',
  whatItDoes: 'Tracks installed packages, resolves dependencies, synchronizes package databases with mirrors, and safely installs or removes software binaries.',
  whyUseIt: 'The primary, battle-tested package manager for CachyOS x86-64-v3 and v4 optimized repositories.',
  whenNotToUseIt: 'Do not use pacman to install packages directly from the Arch User Repository (AUR); use paru or makepkg for AUR builds.',
  privilege: 'sudo',
  safetyLevel: 'privileged',
  fixedComponents: ['pacman'],
  arguments: [
    {
      name: 'operation',
      label: 'Operation Mode',
      description: 'Major pacman operational flag (-S, -Syu, -Ss, -Rns, -Q, -Sc).',
      type: 'enum',
      required: true,
      defaultValue: '-S',
      allowedValues: ['-S (Install/Sync)', '-Syu (Full System Upgrade)', '-Ss (Search)', '-Rns (Purge Package & Orphans)', '-Qdt (List Orphan Packages)', '-Sc (Clean Cache)']
    },
    {
      name: 'targets',
      label: 'Package Target(s)',
      description: 'One or more package names to install, remove, or query.',
      type: 'package',
      required: false,
      placeholder: 'gamescope mangohud linux-cachyos',
      detectionMethod: 'detect_packages',
      suggestions: ['gamescope', 'mangohud', 'linux-cachyos', 'vulkan-radeon', 'wine-cachyos', 'steam']
    }
  ],
  commonOptions: [
    { flag: '--needed', label: 'Skip Up-To-Date', description: 'Do not reinstall packages that are already current.', type: 'boolean' },
    { flag: '--noconfirm', label: 'Non-Interactive', description: 'Bypass all confirmation prompts (scripting only).', type: 'boolean' }
  ],
  realWorldExamples: [
    {
      title: 'Full System Upgrade on CachyOS',
      scenario: 'Synchronizing CachyOS repository mirrors and updating kernel, mesa drivers, and system packages.',
      command: 'sudo pacman -Syu',
      argumentsExplanation: '-S (Sync), -y (refresh mirror database lists), -u (upgrade all installed packages to newest version).',
      potentialPitfall: 'Never cancel pacman during package unpacking or kernel initramfs generation to avoid unbootable state.',
      verificationStep: 'pacman -Q linux-cachyos'
    },
    {
      title: 'Cleanly Purge a Package and Unused Dependencies',
      scenario: 'Removing an unneeded application along with its dependencies and configuration without leaving orphan packages.',
      command: 'sudo pacman -Rns discord',
      argumentsExplanation: '-R (Remove), -n (suppress .pacsave backups), -s (remove dependencies not required by other packages).',
      verificationStep: 'pacman -Q discord || echo "Successfully removed"'
    }
  ],
  commonMistakes: [
    'Running "pacman -Sy <package>" without "u", which causes partial upgrades and can break dynamic library linking (ABI mismatch).',
    'Forcibly deleting /var/lib/pacman/db.lck while an update is actually in progress in the background.'
  ],
  commonErrors: [
    {
      error: 'error: failed to lock database: File exists (/var/lib/pacman/db.lck)',
      cause: 'Another package manager instance is running, or a previous run was abruptly terminated.',
      recovery: 'Confirm no pacman process is running with "pgrep -a pacman". If clear, run "sudo rm /var/lib/pacman/db.lck".'
    },
    {
      error: 'error: could not satisfy dependencies / conflicting files',
      cause: 'Package database conflict or unmerged file in filesystem.',
      recovery: 'Check CachyOS news for manual intervention or identify owner with "pacman -Qo <filepath>".'
    }
  ],
  cachyOsNotes: 'CachyOS compiles packages targeting x86-64-v3 and x86-64-v4 CPU microarchitectures with LTO and PGO optimizations in dedicated cachyos repos.',
  archNotes: 'Official package manager of Arch Linux.',
  gamingNotes: 'Ensure 32-bit multilib packages (e.g. lib32-vulkan-radeon or lib32-nvidia-utils) are installed for 32-bit Windows games.',
  relatedCommandIds: ['paru']
};

export const paruCommand: CommandDefinition = {
  id: 'paru',
  name: 'paru',
  executable: 'paru',
  category: 'packages',
  description: 'Fast, feature-rich AUR helper and pacman wrapper written in Rust.',
  whatItDoes: 'Provides interactive search, PKGBUILD review, and automated building from the Arch User Repository alongside official CachyOS packages.',
  whyUseIt: 'The standard AUR companion for CachyOS. Compiles packages, checks build scripts for safety, and handles package dependencies seamlessly.',
  whenNotToUseIt: 'Never run paru with sudo ("sudo paru")! Paru will prompt for sudo internally when executing pacman, keeping the build process non-root.',
  privilege: 'none',
  safetyLevel: 'low_risk',
  fixedComponents: ['paru'],
  arguments: [
    {
      name: 'query_or_target',
      label: 'Search Query or Package Name',
      description: 'Search the AUR/repos or specify package to build/install.',
      type: 'package',
      required: false,
      placeholder: 'proton-ge-custom-bin or gamescope-plus',
      suggestions: ['proton-ge-custom-bin', 'dxvk-nvapi-bin', 'heroic-games-launcher-bin', 'bottles']
    }
  ],
  commonOptions: [
    { flag: '-Sua', label: 'Upgrade AUR Only', description: 'Check and build updates specifically for installed AUR packages.', type: 'boolean' },
    { flag: '--skipreview', label: 'Skip PKGBUILD Review', description: 'Do not prompt to inspect PKGBUILD files before compilation.', type: 'boolean' }
  ],
  realWorldExamples: [
    {
      title: 'Install GloriousEggroll Proton GE for Steam & Heroic',
      scenario: 'Installing the latest community Proton GE build for maximum Windows game compatibility.',
      command: 'paru -S proton-ge-custom-bin',
      argumentsExplanation: 'Fetches the pre-compiled binary package from AUR, builds and registers it into Steam compatibility tools directory.',
      verificationStep: 'ls -ld ~/.local/share/Steam/compatibilitytools.d/GE-Proton*'
    }
  ],
  commonMistakes: [
    'Typing "sudo paru" which fails by design to prevent building untrusted code as root.',
    'Blindly skipping PKGBUILD review for unknown AUR packages.'
  ],
  commonErrors: [
    {
      error: 'Cannot find the fakeroot binary',
      cause: 'base-devel package group is not installed on the system.',
      recovery: 'Run "sudo pacman -S --needed base-devel" to install compilation tools.'
    }
  ],
  cachyOsNotes: 'CachyOS maintains dedicated pre-compiled cachyos repositories for many popular AUR gaming tools (such as proton-cachyos), reducing compilation wait times.',
  archNotes: 'Built with Rust for high memory safety and fast dependency resolution.',
  gamingNotes: 'Use paru to install proton-ge-custom-bin, heroic-games-launcher-bin, and winetricks-git easily.',
  relatedCommandIds: ['pacman']
};
