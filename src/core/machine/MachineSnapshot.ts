/**
 * Vanguard Core - Structured Machine Snapshot
 * Complete state awareness of CachyOS host or simulated environment
 */

import { NodeConfidence } from '../graph/GraphNode';

export interface OSInfo {
  distro: string; // e.g. "CachyOS"
  distroVersion: string;
  architecture: string; // e.g. "x86-64-v4"
  kernel: string; // e.g. "6.13.4-cachyos-bore-lto"
  kernelFlavor: string; // "bore-lto"
  desktopEnvironment: string; // "KDE Plasma 6.3"
  displayServer: string; // "Wayland"
}

export interface CPUInfo {
  model: string;
  cores: number;
  threads: number;
  architecture: string;
  governor: string; // e.g. "schedutil" or "performance"
}

export interface GPUInfo {
  vendor: 'AMD' | 'NVIDIA' | 'Intel' | 'Other';
  model: string;
  driver: string; // e.g. "Mesa 24.3.4 (RADV / LLVM 19.1.7)"
  driverVersion: string;
  vulkanVersion: string;
  vulkanIcd: string;
  openGlVersion: string;
  vramTotalMb: number;
}

export interface MemoryInfo {
  totalBytes: number;
  availableBytes: number;
  usedBytes: number;
  swapBytes: number;
  zramBytes: number;
}

export interface SnapshotBlockDevice {
  name: string;
  path: string;
  serial?: string;
  wwn?: string;
  model: string;
  sizeBytes: number;
  displaySize: string;
  fsType?: string;
  uuid?: string;
  label?: string;
  mountPoint?: string;
  isMounted: boolean;
  isReadOnly: boolean;
  isSystemDisk: boolean;
  isBootDisk: boolean;
  subvolumes?: string[];
}

export interface GamingStackInfo {
  steamInstalled: boolean;
  steamLibraries: string[];
  protonVersions: { name: string; path: string; isGe: boolean }[];
  wineVersions: { name: string; path: string; hasNtsync: boolean }[];
  gamescopeAvailable: boolean;
  gamescopeVersion?: string;
  mangohudAvailable: boolean;
  dxvkVersion?: string;
  vkd3dVersion?: string;
  detectedPrefixes: { path: string; arch: string; lastUsed?: string }[];
}

export interface ServiceSnapshot {
  name: string;
  description: string;
  active: boolean;
  enabled: boolean;
  subState: string;
}

export interface MachineSnapshot {
  snapshotId: string;
  timestamp: number;
  confidence: NodeConfidence;
  source: 'simulator' | 'local_agent' | 'remote_host' | 'real_host';
  os: OSInfo;
  cpu: CPUInfo;
  gpu: GPUInfo;
  memory: MemoryInfo;
  storage: {
    devices: SnapshotBlockDevice[];
  };
  gaming: GamingStackInfo;
  services: ServiceSnapshot[];
  permissions?: {
    user: string;
    uid: number;
    groups: string[];
    sudoAvailable: boolean;
    writablePaths: string[];
  };
}
