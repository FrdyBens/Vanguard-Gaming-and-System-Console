/**
 * Vanguard Core - Machine Capabilities
 * Granular capability-based access control rather than naive sudo binary flags
 */

export type VanguardCapability =
  | 'filesystem.read'
  | 'filesystem.write'
  | 'filesystem.create'
  | 'filesystem.move'
  | 'filesystem.copy'
  | 'filesystem.delete'
  | 'device.inspect'
  | 'device.modify'
  | 'filesystem.mount'
  | 'filesystem.unmount'
  | 'package.read'
  | 'package.install'
  | 'package.remove'
  | 'service.read'
  | 'service.start'
  | 'service.stop'
  | 'service.restart'
  | 'process.read'
  | 'process.control'
  | 'command.execute'
  | 'command.execute_elevated'
  | 'network.inspect'
  | 'network.modify'
  | 'gaming.launch'
  | 'wine.launch'
  | 'steam.launch';

export interface CapabilityGrant {
  capability: VanguardCapability;
  granted: boolean;
  requiresElevation: boolean;
  reason?: string;
  scope?: string; // e.g. path prefix or device
}

export const ALL_CAPABILITIES: VanguardCapability[] = [
  'filesystem.read',
  'filesystem.write',
  'filesystem.create',
  'filesystem.move',
  'filesystem.copy',
  'filesystem.delete',
  'device.inspect',
  'device.modify',
  'filesystem.mount',
  'filesystem.unmount',
  'package.read',
  'package.install',
  'package.remove',
  'service.read',
  'service.start',
  'service.stop',
  'service.restart',
  'process.read',
  'process.control',
  'command.execute',
  'command.execute_elevated',
  'network.inspect',
  'network.modify',
  'gaming.launch',
  'wine.launch',
  'steam.launch'
];
