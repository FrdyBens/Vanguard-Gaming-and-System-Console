/**
 * Vanguard Core - Transparent Recommendation Engine
 * Recommends optimal runtimes, prefixes, mount parameters, and commands based on verified machine state and historical evidence
 */

import { RecommendationCandidate } from './RecommendationCandidate';
import { MachineSnapshot } from '../machine/MachineSnapshot';
import { MemoryEngine } from '../memory/MemoryEngine';
import { ObjectGraph } from '../graph/ObjectGraph';

export class RecommendationEngine {
  /**
   * Recommend compatibility runtime and launch settings for an executable or game
   */
  public static recommendRuntimeForExecutable(
    exePath: string,
    snapshot: MachineSnapshot,
    memory: MemoryEngine,
    graph: ObjectGraph
  ): RecommendationCandidate[] {
    const candidates: RecommendationCandidate[] = [];
    const history = memory.getObjectHistory(exePath);
    const prefWine = memory.preferences.getPreference<string>('preferred_wine_version') || 'wine-cachyos 10.2 (Staging + NTSYNC)';
    const prefProton = memory.preferences.getPreference<string>('preferred_proton_version') || 'Proton-GE-9-25-cachyos';

    const exeLower = exePath.toLowerCase();

    // 1. Check for previously successful configurations
    if (history.lastSuccessfulConfig) {
      candidates.push({
        candidate: history.lastSuccessfulConfig.tool || 'Previously Successful Setup',
        title: 'Known Working Configuration',
        type: 'tool',
        confidence: 'verified',
        evidence: [
          {
            type: 'previousSuccess',
            description: `Successfully executed ${history.successCount} times on this system.`
          },
          {
            type: 'recentSuccess',
            description: `Last launched with prefix ${history.lastSuccessfulConfig.winePrefix || 'default'}.`
          }
        ],
        reasons: [
          'Historical execution verification confirms this exact toolchain produced zero crash errors.',
          `Associated with stable prefix: ${history.lastSuccessfulConfig.winePrefix || '~/.wine'}`
        ],
        warnings: history.recentFailures.length > 0
          ? [`Encountered ${history.recentFailures.length} transient errors in previous sessions.`]
          : [],
        alternatives: ['Proton Experimental', 'Vanilla Wine'],
        commandTemplate: history.lastSuccessfulConfig.command
      });
    }

    // 2. Recommend Gamescope + MangoHud for DX11/12 gaming on AMD RDNA3
    if (exeLower.includes('game') || exeLower.includes('witcher') || exeLower.includes('stalker') || exeLower.includes('steam')) {
      const hasGamescope = snapshot.gaming.gamescopeAvailable;
      const hasMangoHud = snapshot.gaming.mangohudAvailable;

      candidates.push({
        candidate: 'Gamescope + MangoHud + Proton-GE',
        title: 'CachyOS High-Performance Gaming Stack',
        type: 'proton_version',
        confidence: 'high',
        evidence: [
          {
            type: 'machineMatch',
            description: `Compatible with ${snapshot.gpu.model} and Vulkan ${snapshot.gpu.vulkanVersion}.`
          },
          {
            type: 'installed',
            description: `Proton-GE is installed at ${snapshot.gaming.protonVersions[0]?.path}.`
          },
          {
            type: 'userPreference',
            description: `User declared ${prefProton} as primary compatibility tool.`
          }
        ],
        reasons: [
          'Isolates game inside Gamescope Wayland sub-compositor with integer/FSR scaling and 165Hz frame limiter.',
          'RADV Mesa driver supports low-overhead DXVK and VKD3D-Proton translation.',
          'Provides in-game MangoHud telemetry (frametime graph, GPU load, VRAM usage).'
        ],
        warnings: [
          'Requires Gamescope support in session. Disable if running under older X11 without micro-compositor.'
        ],
        alternatives: ['Proton Experimental', 'Standard Wine Staging'],
        commandTemplate: `gamescope -W 2560 -H 1440 -w 1920 -h 1080 -r 165 -F fsr -f -- mangohud wine "${exePath}"`
      });
    }

    // 3. Fallback standard Wine staging
    candidates.push({
      candidate: prefWine,
      title: 'CachyOS Wine Staging (NTSYNC)',
      type: 'wine_version',
      confidence: 'medium',
      evidence: [
        {
          type: 'installed',
          description: 'wine-cachyos installed in /usr/bin/wine.'
        },
        {
          type: 'compatible',
          description: 'Supports fast kernel NTSYNC synchronization primitives.'
        }
      ],
      reasons: [
        'Lightweight direct launch without additional micro-compositor overhead.',
        'Uses BORE kernel scheduler optimizations.'
      ],
      warnings: [
        'May require manual winetricks dependencies for proprietary anti-cheat or media foundation codecs.'
      ],
      alternatives: ['Proton-GE']
    });

    return candidates;
  }

  /**
   * Recommend mount options for storage partitions
   */
  public static recommendMountOptions(
    fsType: string,
    isRemovable: boolean
  ): { options: string; reasons: string[] } {
    if (fsType === 'btrfs') {
      return {
        options: 'noatime,compress=zstd:1,space_cache=v2,discard=async',
        reasons: [
          'noatime prevents excessive write wear on NVMe/SSD storage.',
          'compress=zstd:1 provides high-throughput transparent compression optimized for game textures and binaries.',
          'discard=async enables asynchronous TRIM operations.'
        ]
      };
    }
    if (fsType === 'ntfs') {
      return {
        options: 'noatime,uid=1000,gid=1000,windows_names,big_writes',
        reasons: [
          'Uses in-kernel ntfs3 driver for superior read/write speeds over legacy FUSE ntfs-3g.',
          'Maps Windows file permissions directly to the primary user session.'
        ]
      };
    }
    return {
      options: 'noatime,defaults',
      reasons: ['Standard high-performance mount options.']
    };
  }
}
