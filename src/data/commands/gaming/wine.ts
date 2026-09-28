import { CommandDefinition } from '../../../types';

export const wineCommand: CommandDefinition = {
  id: 'wine',
  name: 'wine',
  executable: 'wine',
  category: 'gaming',
  description: 'Compatibility layer capable of running Windows applications and games on Linux.',
  whatItDoes: 'Translates Windows API calls into POSIX calls on-the-fly, creating isolated virtual Windows environments (WINEPREFIX) with direct access to Vulkan/OpenGL.',
  whyUseIt: 'The core engine for running non-Steam Windows standalone games, mod managers, installers (.exe/.msi), and desktop tools.',
  whenNotToUseIt: 'For native Linux games or Steam games where Proton is managed automatically by Steam client.',
  privilege: 'none',
  safetyLevel: 'low_risk',
  fixedComponents: ['wine'],
  arguments: [
    {
      name: 'executable',
      label: 'Windows Executable (.exe / .msi)',
      description: 'The target Windows executable file to run.',
      type: 'win_exe',
      required: true,
      placeholder: '/home/cachy/Games/Stalker2/bin/Stalker2.exe',
      suggestions: [
        '/home/cachy/Games/Stalker2/Stalker2.exe',
        '/run/media/cachy/GamesSSD/GOG/Witcher3/bin/x64/witcher3.exe',
        '/home/cachy/Downloads/Setup.exe'
      ]
    },
    {
      name: 'arguments',
      label: 'Executable Launch Arguments',
      description: 'Command line flags passed directly to the Windows application.',
      type: 'string',
      required: false,
      placeholder: '-dx12 -fullscreen -nointro'
    }
  ],
  commonOptions: [
    { flag: 'WINEPREFIX=', label: 'Wine Prefix Directory', description: 'Specify custom isolated prefix location (defaults to ~/.wine).', type: 'wine_prefix' },
    { flag: 'WINEARCH=', label: 'Architecture', description: 'Architecture mode (win64 for 64-bit, win32 for legacy 32-bit).', type: 'enum' },
    { flag: 'WINEFSYNC=1', label: 'Fast Kernel Fsync', description: 'Enable high-performance futex-based synchronization (native in CachyOS kernel).', type: 'boolean' },
    { flag: 'WINEESYNC=1', label: 'Esync Fallback', description: 'Enable eventfd-based synchronization if fsync is unavailable.', type: 'boolean' }
  ],
  realWorldExamples: [
    {
      title: 'Run Windows Game in Dedicated Isolated Wine Prefix with Fsync',
      scenario: 'Launching a standalone GOG game in its own prefix to prevent DLL conflicts with other applications.',
      command: 'WINEPREFIX="$HOME/.local/share/wineprefixes/gog_games" WINEFSYNC=1 wine "/run/media/cachy/GamesSSD/GOG/Witcher3/bin/x64/witcher3.exe"',
      argumentsExplanation: 'Sets dedicated prefix path, enables CachyOS kernel fsync for optimal FPS, and passes absolute path to executable.',
      potentialPitfall: 'Working directory should match the executable parent directory so the game can find its local DLLs.',
      verificationStep: 'Game window launches and generates audio/graphics via DXVK.'
    }
  ],
  commonMistakes: [
    'Running all games inside default ~/.wine, leading to prefix bloat and conflicting Winetricks DLL overrides.',
    'Running "wine" with sudo, which destroys user ownership of the prefix and can corrupt user directory symlinks.'
  ],
  commonErrors: [
    {
      error: 'wine: could not load kernel32.dll, status c0000135',
      cause: 'WINEPREFIX is corrupt, partially created, or 32-bit/64-bit architecture mismatch.',
      recovery: 'Re-initialize the prefix cleanly with "WINEARCH=win64 WINEPREFIX=... wineboot -u".'
    }
  ],
  cachyOsNotes: 'CachyOS ships wine-cachyos with staging patches, NTSYNC support, and optimized compiler flags for maximum gaming frame rates.',
  archNotes: 'Available in official repositories and multilib (wine, wine-staging).',
  gamingNotes: 'Windows applications save configurations to WINEPREFIX/drive_c/users/cachy/Documents/. Vanguard provides direct redirection to ~/Documents/My Games.',
  relatedCommandIds: ['winetricks', 'protontricks', 'gamescope', 'mangohud']
};

export const gamescopeCommand: CommandDefinition = {
  id: 'gamescope',
  name: 'gamescope',
  executable: 'gamescope',
  category: 'gaming',
  description: 'SteamOS micro-compositor for resolution upscaling (FSR/NIS), frame pacing, and HDR rendering.',
  whatItDoes: 'Isolates the game into its own nested Wayland or XWayland surface, allowing the user to render at lower internal resolutions with AMD FSR upscaling and lock refresh rates.',
  whyUseIt: 'The ultimate tool for smooth frame pacing, upscaling 1080p to 1440p/4K, bypassing Wayland windowing glitches, and enabling HDR on compatible monitors.',
  whenNotToUseIt: 'Avoid for simple desktop utilities that do not require fullscreen gaming composition or when running multi-monitor desktop capture.',
  privilege: 'none',
  safetyLevel: 'low_risk',
  fixedComponents: ['gamescope'],
  arguments: [
    {
      name: 'command',
      label: 'Wrapped Command',
      description: 'The game or launcher command to execute inside the Gamescope session (after the -- separator).',
      type: 'string',
      required: true,
      placeholder: 'mangohud wine /path/to/game.exe or %command%',
      suggestions: ['mangohud wine /run/media/cachy/GamesSSD/game.exe', 'steam -applaunch 1091500']
    }
  ],
  commonOptions: [
    { flag: '-W', label: 'Output Width', description: 'Monitor physical display width (e.g. 2560 or 3840).', type: 'number' },
    { flag: '-H', label: 'Output Height', description: 'Monitor physical display height (e.g. 1440 or 2160).', type: 'number' },
    { flag: '-w', label: 'Internal Render Width', description: 'Game internal resolution width (e.g. 1920).', type: 'number' },
    { flag: '-h', label: 'Internal Render Height', description: 'Game internal resolution height (e.g. 1080).', type: 'number' },
    { flag: '-r', label: 'Refresh Rate', description: 'Target refresh rate / FPS cap (e.g. 60, 144, 165).', type: 'number' },
    { flag: '-F fsr', label: 'AMD FSR Upscaling', description: 'Enable AMD FidelityFX Super Resolution upscaling.', type: 'boolean' },
    { flag: '--hdr-enabled', label: 'Enable HDR', description: 'Pass High Dynamic Range metadata to supported displays.', type: 'boolean' },
    { flag: '-f', label: 'Fullscreen Mode', description: 'Launch Gamescope in borderless fullscreen on target display.', type: 'boolean' }
  ],
  realWorldExamples: [
    {
      title: 'Run Game with 1080p -> 1440p FSR Upscaling at 165Hz with MangoHud',
      scenario: 'Boosting framerate on a 1440p monitor by rendering internally at 1080p with AMD FSR and hardware overlay.',
      command: 'gamescope -W 2560 -H 1440 -w 1920 -h 1080 -r 165 -F fsr -f -- mangohud wine game.exe',
      argumentsExplanation: 'Scales 1920x1080 up to 2560x1440 using FSR, caps refresh rate at 165Hz, and renders fullscreen.',
      verificationStep: 'Press Super+U inside game to verify Gamescope FSR status overlay.'
    }
  ],
  commonMistakes: [
    'Forgetting the "--" separator before the target game command.',
    'Setting internal resolution (-w, -h) higher than physical output resolution (-W, -H).'
  ],
  commonErrors: [],
  cachyOsNotes: 'CachyOS includes gamescope-plus with enhanced HDR color management, VRR support, and PipeWire audio integration.',
  archNotes: 'Available in official Arch repositories.',
  gamingNotes: 'In Steam launch options, enter: "gamescope -W 2560 -H 1440 -r 165 -f -- %command%".',
  relatedCommandIds: ['mangohud', 'wine']
};

export const mangohudCommand: CommandDefinition = {
  id: 'mangohud',
  name: 'mangohud',
  executable: 'mangohud',
  category: 'gaming',
  description: 'Vulkan and OpenGL performance overlay and telemetry monitoring tool.',
  whatItDoes: 'Hooks into the Vulkan loader layer or OpenGL pipeline to render real-time FPS, frametime graphs, CPU/GPU temperatures, VRAM, and RAM usage on top of games.',
  whyUseIt: 'The standard performance profiling tool for Linux gaming. Invaluable for tuning DXVK, checking bottleneck metrics, and verifying shader compilation smoothness.',
  whenNotToUseIt: 'When benchmarking pure latency where overlay presentation overhead must be strictly avoided.',
  privilege: 'none',
  safetyLevel: 'read_only',
  fixedComponents: ['mangohud'],
  arguments: [
    {
      name: 'command',
      label: 'Wrapped Command',
      description: 'The executable or game to execute with the MangoHud layer enabled.',
      type: 'string',
      required: true,
      placeholder: 'wine game.exe or steam %command%'
    }
  ],
  commonOptions: [
    { flag: '--dlsym', label: 'OpenGL Hook Override', description: 'Required for certain OpenGL games that load libGL dynamically.', type: 'boolean' }
  ],
  realWorldExamples: [
    {
      title: 'Launch Game with MangoHud Telemetry & Frame Limiter',
      scenario: 'Running a game while monitoring frametimes, GPU core clock, and VRAM utilization.',
      command: 'MANGOHUD_CONFIG="cpu_temp,gpu_temp,ram,vram,frametime" mangohud wine game.exe',
      argumentsExplanation: 'Passes configuration variables directly to the MangoHud Vulkan layer.',
      verificationStep: 'Overlay renders in upper-left corner of the game screen.'
    }
  ],
  commonMistakes: [
    'Attempting to run MangoHud on a 32-bit game without the lib32-mangohud multilib package installed.'
  ],
  commonErrors: [],
  cachyOsNotes: 'CachyOS bundles preconfigured MangoHud profiles with sensible defaults and minimal performance overhead.',
  archNotes: 'Install mangohud and lib32-mangohud for universal 64/32-bit game support.',
  gamingNotes: 'Toggle overlay visibility at any time during gameplay using Shift_R + F12.',
  relatedCommandIds: ['gamescope', 'wine', 'vulkaninfo']
};

export const protontricksCommand: CommandDefinition = {
  id: 'protontricks',
  name: 'protontricks',
  executable: 'protontricks',
  category: 'gaming',
  description: 'Simple wrapper for running Winetricks commands and tools on Proton-managed Steam game prefixes.',
  whatItDoes: 'Automatically locates the Proton compatdata prefix for a given Steam App ID and runs Winetricks (DLL overrides, font installations, registry tweaks, winecfg).',
  whyUseIt: 'Fixes game-specific issues (missing Visual C++ runtimes, missing Windows Media Foundation codecs, DirectX errors) without manual path hunting.',
  whenNotToUseIt: 'Do not use on non-Steam custom Wine prefixes (use standard winetricks for standalone Wine).',
  privilege: 'none',
  safetyLevel: 'low_risk',
  fixedComponents: ['protontricks'],
  arguments: [
    {
      name: 'appid',
      label: 'Steam App ID or Game Name',
      description: 'The numerical Steam App ID (or search string) of the target game.',
      type: 'number',
      required: true,
      placeholder: '1091500 (Cyberpunk 2077) or 1245620 (Elden Ring)',
      suggestions: ['1091500', '1245620', '292030']
    },
    {
      name: 'verbs',
      label: 'Winetricks Verbs / DLL Packages',
      description: 'The packages, DLLs, or utility commands to install into the game prefix.',
      type: 'string',
      required: false,
      placeholder: 'vcrun2022 d3dcompiler_47 winecfg',
      suggestions: ['vcrun2022', 'd3dcompiler_47', 'winecfg', 'dotnet48', 'corefonts']
    }
  ],
  commonOptions: [
    { flag: '-s', label: 'Search App IDs', description: 'Search installed Steam games by name to find their numerical App ID.', type: 'string' },
    { flag: '--gui', label: 'Launch GUI Picker', description: 'Open graphical Winetricks package selector for the chosen game.', type: 'boolean' }
  ],
  realWorldExamples: [
    {
      title: 'Install Visual C++ 2015-2022 Runtime into Game Prefix',
      scenario: 'Fixing runtime crash when a newly installed game reports missing MSVCP140.dll.',
      command: 'protontricks 1091500 vcrun2022',
      argumentsExplanation: 'Locates compatdata/1091500/pfx and installs the official Microsoft Visual C++ redistributable.',
      verificationStep: 'Re-launch game in Steam to verify crash is resolved.'
    },
    {
      title: 'Open winecfg Configuration for Specific Steam Game',
      scenario: 'Configuring audio driver or virtual desktop for a stubborn Steam title.',
      command: 'protontricks 1091500 winecfg',
      argumentsExplanation: 'Opens the standard Wine Configuration window mapped strictly to the game prefix.',
      verificationStep: 'Wine Configuration dialog appears.'
    }
  ],
  commonMistakes: [
    'Running protontricks before launching the game once in Steam. Steam must launch the game once to generate the initial compatdata directory structure.'
  ],
  commonErrors: [],
  cachyOsNotes: 'Available via "sudo pacman -S protontricks". Works seamlessly with proton-cachyos and proton-ge-custom.',
  archNotes: 'Maintained in official extra repository.',
  gamingNotes: 'Use "protontricks -s <gamename>" to quickly find the App ID for any game in your library.',
  relatedCommandIds: ['wine', 'gamescope']
};
