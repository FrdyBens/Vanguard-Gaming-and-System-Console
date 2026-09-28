import React, { useState } from 'react';
import {
  Gamepad2,
  Sliders,
  Folder,
  FileCode,
  Layers,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Monitor
} from 'lucide-react';
import { cachyState } from '../services/cachyState';
import { UniversalContextObject } from '../types';

interface GamingCockpitProps {
  onOpenContextCard: (obj: UniversalContextObject) => void;
  onLaunchGame: (commandString: string) => void;
}

export const GamingCockpit: React.FC<GamingCockpitProps> = ({
  onOpenContextCard,
  onLaunchGame
}) => {
  const telemetry = cachyState.getTelemetry();
  const history = cachyState.getExecutionHistory();

  // Executables in system
  const executables = [
    {
      name: 'witcher3.exe',
      title: 'The Witcher 3: Wild Hunt (GOG)',
      path: '/run/media/cachy/GamesSSD/GOG/Witcher3/bin/x64/witcher3.exe',
      prefix: '/home/cachy/.local/share/wineprefixes/gog_games',
      runtime: 'Wine-CachyOS 10.2 + Gamescope FSR',
      savesPath: '/home/cachy/Documents/My Games/Witcher 3',
      lastExit: 0,
      confidence: 'High (Verified Success)'
    },
    {
      name: 'Stalker2.exe',
      title: 'S.T.A.L.K.E.R. 2: Heart of Chornobyl',
      path: '/home/cachy/Games/Stalker2/Stalker2.exe',
      prefix: '/home/cachy/.wine',
      runtime: 'Proton-GE-9-25 (DirectX 12 / VKD3D)',
      savesPath: '/home/cachy/Documents/My Games/Stalker2',
      lastExit: 135,
      confidence: 'Requires Proton-GE & VKD3D'
    }
  ];

  // Gamescope Settings
  const [gamescopeRes, setGamescopeRes] = useState<'1440p' | '1080p' | '4k'>('1440p');
  const [enableFsr, setEnableFsr] = useState(true);
  const [refreshRate, setRefreshRate] = useState(165);
  const [enableMangoHud, setEnableMangoHud] = useState(true);
  const [enableHdr, setEnableHdr] = useState(false);

  // Quick launch synthesizer
  const handleLaunchWithSettings = (exe: typeof executables[0]) => {
    let outW = 2560;
    let outH = 1440;
    let inW = 1920;
    let inH = 1080;

    if (gamescopeRes === '4k') {
      outW = 3840;
      outH = 2160;
      inW = 2560;
      inH = 1440;
    } else if (gamescopeRes === '1080p') {
      outW = 1920;
      outH = 1080;
      inW = 1280;
      inH = 720;
    }

    const fsrFlag = enableFsr ? '-F fsr' : '';
    const hdrFlag = enableHdr ? '--hdr-enabled' : '';
    const mangoFlag = enableMangoHud ? 'mangohud' : '';

    const cmd = `WINEPREFIX="${exe.prefix}" WINEFSYNC=1 gamescope -W ${outW} -H ${outH} -w ${inW} -h ${inH} -r ${refreshRate} ${fsrFlag} ${hdrFlag} -f -- ${mangoFlag} wine "${exe.path}"`.replace(/\s+/g, ' ');
    onLaunchGame(cmd);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-y-auto bg-[#070a12] p-4 md:p-6 space-y-6 text-slate-100">
      {/* Cockpit Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-[#0d1527] to-[#0a101f] border border-[#00d4ff]/30 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-[#00d4ff]" />
            <h1 className="text-lg font-bold text-white tracking-tight">
              CachyOS Gaming & Compatibility Cockpit
            </h1>
            <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
              RADV Vulkan 1.3 Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Wine-CachyOS NTSYNC, Proton-GE runtimes, Gamescope FSR compositor, and Windows Documents redirection.
          </p>
        </div>

        {/* Telemetry Snapshot */}
        <div className="flex items-center gap-4 text-xs font-mono bg-black/40 px-3 py-2 rounded-lg border border-slate-800">
          <div>
            <span className="text-slate-400 text-[10px] block">Wine Engine</span>
            <span className="text-[#00d4ff] font-semibold">{telemetry.activeWineVersion.slice(0, 15)}</span>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <span className="text-slate-400 text-[10px] block">Proton Compatibility</span>
            <span className="text-emerald-400 font-semibold">{telemetry.activeProtonVersion}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Executables & Gamescope Tuning */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Windows Executable Intelligence */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
              <Sparkles className="w-4 h-4 text-[#00d4ff]" />
              Identified Windows Executables & Games ({executables.length})
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Standardized Save Target: <strong className="text-slate-200">~/Documents/My Games</strong>
            </span>
          </div>

          <div className="space-y-3">
            {executables.map((exe) => (
              <div
                key={exe.path}
                className="p-4 rounded-xl bg-[#0a0f1d] border border-slate-800 hover:border-slate-700 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                      <Gamepad2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-white truncate">{exe.title}</h3>
                      <div className="font-mono text-xs text-slate-400 truncate mt-0.5">{exe.path}</div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-1.5">
                        <span className="text-emerald-400">Prefix: {exe.prefix.split('/').pop()}</span>
                        <span>·</span>
                        <span>Saves: ~/Documents/My Games/{exe.name.replace('.exe', '')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        const ctx = cachyState.resolveContextObject(exe.path);
                        onOpenContextCard(ctx);
                      }}
                      className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
                    >
                      Inspect Card
                    </button>
                    <button
                      onClick={() => handleLaunchWithSettings(exe)}
                      className="px-3.5 py-1.5 rounded bg-[#00d4ff] hover:bg-[#00d4ff]/90 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-[#00d4ff]/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Run Game
                    </button>
                  </div>
                </div>

                {/* Compatibility Assessment */}
                <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {exe.lastExit === 0 ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="text-slate-300 font-mono text-[11px]">
                      Historical Profile: {exe.confidence}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    Last Exit Code: {exe.lastExit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Gamescope & MangoHud Hardware Profiler */}
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
            <Sliders className="w-4 h-4 text-[#00d4ff]" />
            Gamescope & Overlay Settings
          </div>

          <div className="p-4 rounded-xl bg-[#0a0f1d] border border-slate-800 space-y-4 text-xs">
            {/* Resolution Preset */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Target Display Resolution:
              </label>
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                {(['1080p', '1440p', '4k'] as const).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setGamescopeRes(res)}
                    className={`py-1.5 rounded border text-center font-bold ${
                      gamescopeRes === res
                        ? 'bg-[#00d4ff]/20 border-[#00d4ff] text-[#00d4ff]'
                        : 'border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {res.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Refresh Rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Refresh Rate Cap:</span>
                <span className="font-mono text-[#00d4ff] font-bold">{refreshRate} Hz</span>
              </div>
              <input
                type="range"
                min="60"
                max="240"
                step="15"
                value={refreshRate}
                onChange={(e) => setRefreshRate(Number(e.target.value))}
                className="w-full accent-[#00d4ff]"
              />
            </div>

            {/* FSR & MangoHud Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="flex items-center justify-between p-2 rounded bg-[#070b14] border border-slate-800/80 cursor-pointer">
                <div>
                  <span className="font-semibold text-white block">AMD FSR Upscaling</span>
                  <span className="text-[10px] text-slate-400">Renders internally at lower res and upscales</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableFsr}
                  onChange={(e) => setEnableFsr(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-[#00d4ff]"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-[#070b14] border border-slate-800/80 cursor-pointer">
                <div>
                  <span className="font-semibold text-white block">MangoHud Overlay</span>
                  <span className="text-[10px] text-slate-400">Real-time FPS, frametime, VRAM, and temps</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableMangoHud}
                  onChange={(e) => setEnableMangoHud(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-[#00d4ff]"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-[#070b14] border border-slate-800/80 cursor-pointer">
                <div>
                  <span className="font-semibold text-white block">HDR Display Output</span>
                  <span className="text-[10px] text-slate-400">Enable wide color gamut & HDR metadata</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableHdr}
                  onChange={(e) => setEnableHdr(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-[#00d4ff]"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
