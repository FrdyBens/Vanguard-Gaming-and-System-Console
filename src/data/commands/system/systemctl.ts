import { CommandDefinition } from '../../../types';

export const systemctlCommand: CommandDefinition = {
  id: 'systemctl',
  name: 'systemctl',
  executable: 'systemctl',
  category: 'system',
  description: 'Control the systemd system and service manager.',
  whatItDoes: 'Inspects and controls the state of systemd system services, user sessions, socket units, timers, and targets.',
  whyUseIt: 'Essential for starting, restarting, enabling, or checking status of critical services (bluetooth, network, audio, jellyfin, docker).',
  whenNotToUseIt: 'Use --user flag for user session services (e.g. pipewire, wireplumber) rather than running systemctl with sudo.',
  privilege: 'sudo',
  safetyLevel: 'privileged',
  fixedComponents: ['systemctl'],
  arguments: [
    {
      name: 'verb',
      label: 'Operation / Verb',
      description: 'The service action to perform (status, start, restart, stop, enable, disable, is-active).',
      type: 'enum',
      required: true,
      defaultValue: 'status',
      allowedValues: ['status', 'start', 'stop', 'restart', 'enable --now', 'disable --now', 'is-active', 'reload']
    },
    {
      name: 'unit',
      label: 'Unit Name / Service',
      description: 'The target systemd service, timer, or socket unit.',
      type: 'service',
      required: true,
      placeholder: 'bluetooth.service or jellyfin.service',
      detectionMethod: 'detect_services',
      suggestions: ['bluetooth.service', 'NetworkManager.service', 'jellyfin.service', 'sshd.service', 'systemd-resolved.service', 'coolercontrol.service']
    }
  ],
  commonOptions: [
    { flag: '--user', label: 'User Session Unit', description: 'Control per-user units without root privileges (e.g. pipewire.service).', type: 'boolean' },
    { flag: '--no-pager', label: 'Disable Pager', description: 'Do not pipe output into a pager like less, printing directly to terminal.', type: 'boolean' }
  ],
  realWorldExamples: [
    {
      title: 'Inspect Service Health and Failure Logs',
      scenario: 'Checking why Bluetooth or Jellyfin media service stopped responding.',
      command: 'systemctl status jellyfin.service --no-pager',
      argumentsExplanation: 'Shows current state (active/running or failed), PID, memory usage, and the latest journal lines.',
      verificationStep: 'Look for "Active: active (running)" in green text.'
    },
    {
      title: 'Restart and Enable a Gaming Fan / Pump Controller',
      scenario: 'Starting coolercontrol service immediately and enabling it on boot.',
      command: 'sudo systemctl enable --now coolercontrol.service',
      argumentsExplanation: 'Applies both enable (creates symlink in /etc/systemd/system) and start in a single atomic invocation.',
      verificationStep: 'systemctl is-active coolercontrol.service'
    }
  ],
  commonMistakes: [
    'Running "sudo systemctl --user start pipewire" which creates user runtime sockets with root permissions, breaking desktop audio.',
    'Forgetting to run "systemctl daemon-reload" after manually modifying a .service unit file in /etc/systemd/system/.'
  ],
  commonErrors: [
    {
      error: 'Unit jellyfin.service could not be found.',
      cause: 'The package providing the service is not installed, or the service name has a typo.',
      recovery: 'Search installed unit files with "systemctl list-unit-files | grep -i jellyfin".'
    }
  ],
  cachyOsNotes: 'CachyOS optimizes default systemd services and timers (e.g. fstrim.timer, btrfs-scrub.timer) for NVMe durability.',
  archNotes: 'Standard service supervisor for Arch Linux.',
  gamingNotes: 'Ensure gamemoded.service or feral-gamemode is active for automatic CPU governor switching.',
  relatedCommandIds: ['journalctl']
};

export const journalctlCommand: CommandDefinition = {
  id: 'journalctl',
  name: 'journalctl',
  executable: 'journalctl',
  category: 'system',
  description: 'Query and view the systemd journal logs.',
  whatItDoes: 'Extracts indexed system, kernel (dmesg), service, and user logs with rich filtering by unit, boot, priority, and time.',
  whyUseIt: 'The definitive tool for diagnosing system crashes, hardware driver errors, Game crash traces, and service failures.',
  whenNotToUseIt: 'Not needed for standalone application logs that write to text files in ~/.local/share or Steam log directories.',
  privilege: 'sudo',
  safetyLevel: 'read_only',
  fixedComponents: ['journalctl'],
  arguments: [
    {
      name: 'unit',
      label: 'Filter by Unit (Optional)',
      description: 'Filter logs strictly to a specific service or unit.',
      type: 'service',
      required: false,
      placeholder: '-u jellyfin.service or -u bluetooth.service',
      suggestions: ['-u jellyfin.service', '-u NetworkManager.service', '-u systemd-resolved.service']
    }
  ],
  commonOptions: [
    { flag: '-xe', label: 'Extended Errors', description: 'Show explanatory help catalog messages and jump to newest entries.', type: 'boolean' },
    { flag: '-b', label: 'Current Boot Only', description: 'Limit log entries strictly to the current system boot session.', type: 'boolean' },
    { flag: '-k', label: 'Kernel Logs (dmesg)', description: 'Show kernel messages only (GPU resets, storage I/O errors, page faults).', type: 'boolean' },
    { flag: '-f', label: 'Follow (Live Tail)', description: 'Stream log output in real-time as new events arrive.', type: 'boolean' },
    { flag: '-p err', label: 'Filter Priority', description: 'Show only error, critical, or emergency level events.', type: 'string' }
  ],
  realWorldExamples: [
    {
      title: 'Diagnose Recent Service Startup Failure',
      scenario: 'Inspecting exact failure reason and stack trace when a service fails to start.',
      command: 'journalctl -xeu jellyfin.service --no-pager',
      argumentsExplanation: '-x (catalogs), -e (end of buffer), -u (filter by unit), --no-pager (stdout output).',
      verificationStep: 'Read the error lines highlighting port conflicts or missing storage directory.'
    },
    {
      title: 'Inspect GPU Crash & Vulkan Resets on Current Boot',
      scenario: 'Diagnosing whether AMDGPU or NVIDIA kernel module reset during a game crash.',
      command: 'journalctl -k -b -p err --no-pager',
      argumentsExplanation: 'Filters kernel messages (-k) from the current boot (-b) with error priority (-p err).',
      verificationStep: 'Check for "ring gfx timeout" or GPU page fault traces.'
    }
  ],
  commonMistakes: [
    'Running "journalctl" without arguments on a system with months of logs, getting stuck paging through thousands of lines.'
  ],
  commonErrors: [],
  cachyOsNotes: 'CachyOS uses persistent journal storage with standard size limits in /etc/systemd/journald.conf.',
  archNotes: 'Standard tool in systemd.',
  gamingNotes: 'When a game freezes the desktop, "journalctl -b -k" reveals if a GPU driver hang occurred or if the kernel OOM killer terminated the game.',
  relatedCommandIds: ['systemctl']
};
