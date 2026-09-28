/**
 * Vanguard Core - Graph Node Definition
 * Stable object identity and typed graph vertices for OS & Gaming resources
 */

export type GraphNodeType =
  | 'file'
  | 'directory'
  | 'device'
  | 'partition'
  | 'filesystem'
  | 'mount'
  | 'executable'
  | 'package'
  | 'command'
  | 'service'
  | 'process'
  | 'wine_prefix'
  | 'proton_prefix'
  | 'steam_game'
  | 'steam_library'
  | 'workflow'
  | 'environment'
  | 'config_file'
  | 'network_resource'
  | 'user'
  | 'runtime_version'
  | 'gpu'
  | 'vulkan'
  | 'driver'
  | 'kernel';

export type NodeConfidence = 'verified' | 'detected' | 'remembered' | 'inferred' | 'unknown' | 'stale';

export type NodeSource =
  | 'kernel'
  | 'udev'
  | 'btrfs'
  | 'pacman'
  | 'systemd'
  | 'steam'
  | 'wine'
  | 'user'
  | 'simulator'
  | 'agent';

export interface GraphNodeAction {
  id: string;
  label: string;
  description: string;
  risk: 'read_only' | 'low_risk' | 'modify' | 'privileged' | 'destructive' | 'critical';
  recommended?: boolean;
  commandTemplate?: string;
  operationType?: string;
}

export interface GraphNode<TProps = Record<string, any>> {
  id: string;
  stableId: string;
  type: GraphNodeType;
  displayName: string;
  path?: string;
  confidence: NodeConfidence;
  source: NodeSource;
  properties: TProps;
  availableActions: GraphNodeAction[];
  timestamps: {
    detectedAt: number;
    updatedAt: number;
    expiresAt?: number;
  };
}
