/**
 * Vanguard Gaming & System Console - Core Types & Schemas
 */

export type PrivilegeLevel = 'none' | 'sudo' | 'wheel';
export type SafetyLevel = 'read_only' | 'low_risk' | 'privileged' | 'destructive' | 'critical';

export type ArgumentType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'path'
  | 'file'
  | 'directory'
  | 'device'
  | 'partition'
  | 'mount_point'
  | 'package'
  | 'process'
  | 'service'
  | 'user'
  | 'group'
  | 'enum'
  | 'win_exe'
  | 'wine_prefix'
  | 'proton_version'
  | 'filesystem'
  | 'env_var';

export interface CommandArgument {
  name: string;
  label: string;
  description: string;
  type: ArgumentType;
  required: boolean;
  isFlag?: boolean;
  flagName?: string; // e.g. -o, --type, -m
  defaultValue?: string | boolean | number;
  placeholder?: string;
  allowedValues?: string[];
  suggestions?: string[];
  detectionMethod?: 'detect_block_devices' | 'detect_mount_points' | 'detect_services' | 'detect_packages' | 'detect_wine_prefixes' | 'detect_proton_versions' | 'detect_gpus';
  validationRegex?: string;
  affectedPathIndex?: boolean;
}

export interface RealWorldExample {
  title: string;
  scenario: string;
  command: string;
  argumentsExplanation: string;
  potentialPitfall?: string;
  verificationStep: string;
}

export interface CommandDefinition {
  id: string;
  name: string;
  executable: string;
  category: 'storage' | 'filesystem' | 'gaming' | 'packages' | 'system' | 'networking' | 'permissions';
  description: string;
  whatItDoes: string;
  whyUseIt: string;
  whenNotToUseIt: string;
  privilege: PrivilegeLevel;
  safetyLevel: SafetyLevel;
  subcommands?: { name: string; description: string }[];
  fixedComponents?: string[];
  arguments: CommandArgument[];
  commonOptions: { flag: string; label: string; description: string; type?: ArgumentType }[];
  advancedOptions?: { flag: string; label: string; description: string }[];
  realWorldExamples: RealWorldExample[];
  commonMistakes: string[];
  commonErrors: { error: string; cause: string; recovery: string }[];
  cachyOsNotes?: string;
  archNotes?: string;
  gamingNotes?: string;
  relatedCommandIds: string[];
}

export type ObjectType =
  | 'file'
  | 'directory'
  | 'device'
  | 'partition'
  | 'mount'
  | 'package'
  | 'command'
  | 'service'
  | 'process'
  | 'wine_prefix'
  | 'proton_prefix'
  | 'steam_game'
  | 'win_exe'
  | 'workflow';

export type ConfidenceSource = 'verified' | 'detected' | 'remembered' | 'inferred';

export interface ExecutionRecord {
  id: string;
  timestamp: number;
  command: string;
  executable: string;
  toolUsed?: string;
  winePrefix?: string;
  protonVersion?: string;
  exitCode: number;
  status: 'success' | 'failed' | 'cancelled';
  failureCategory?: 'process_failure' | 'config_mismatch' | 'dependency_missing' | 'permission_denied' | 'user_abort';
  failureReason?: string;
  durationMs: number;
  userConfirmedSuccess?: boolean;
  userConfirmedFailure?: boolean;
  stdoutSnippet?: string;
}

export interface UniversalContextObject {
  id: string;
  type: ObjectType;
  stableId: string; // UUID, serial, hash, appid
  label: string;
  path: string;
  displayPath?: string;
  resolvedPath?: string;
  confidence: ConfidenceSource;
  lastDetectedTimestamp: number;
  metadata: {
    size?: string;
    owner?: string;
    group?: string;
    permissions?: string;
    isReadOnly?: boolean;
    fsType?: string;
    uuid?: string;
    deviceModel?: string;
    mountPoint?: string;
    architecture?: string;
    runtimeVersion?: string;
    status?: 'active' | 'inactive' | 'failed' | 'mounted' | 'unmounted';
    wineVersion?: string;
    protonVersion?: string;
    appId?: number;
    saveDirectory?: string;
    configDirectory?: string;
    targetDirectory?: string;
    [key: string]: any;
  };
  relationships: {
    targetId?: string;
    packageId?: string;
    prefixId?: string;
    serviceId?: string;
    mountDeviceId?: string;
    gameSavePath?: string;
    [key: string]: any;
  };
  availableActions: {
    id: string;
    label: string;
    description: string;
    risk: SafetyLevel;
    recommended?: boolean;
    commandTemplate?: string;
  }[];
  recentHistory: ExecutionRecord[];
}

export interface FileSystemItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory' | 'device' | 'symlink' | 'win_exe' | 'wine_prefix' | 'steam_lib';
  sizeBytes?: number;
  displaySize?: string;
  owner: string;
  group: string;
  permissions: string;
  modified: string;
  isReadOnly?: boolean;
  fsType?: string;
  target?: string; // For symlinks
  isMountPoint?: boolean;
  contextObjectId?: string;
}

export interface ExecutionContext {
  id: string;
  commandString: string;
  executable: string;
  effectiveUser: string;
  privilegeLevel: PrivilegeLevel;
  workingDir: string;
  envVars: Record<string, string>;
  affectedPaths: string[];
  riskLevel: SafetyLevel;
  dryRun: boolean;
  status: 'idle' | 'preparing' | 'running' | 'success' | 'failed' | 'cancelled';
  exitCode?: number;
  stdout: string[];
  stderr: string[];
  durationMs?: number;
  timestamp: number;
  failureAnalysis?: {
    symptom: string;
    category: string;
    troubleshootingId?: string;
    suggestedFix?: string;
  };
}

export interface WorkflowStep {
  stepNumber: number;
  name: string;
  description: string;
  commandTemplate: string;
  privilege: PrivilegeLevel;
  risk: SafetyLevel;
  verifyCondition?: string;
  rollbackCommand?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  category: 'storage' | 'gaming' | 'system' | 'maintenance';
  riskLevel: SafetyLevel;
  requiredPrivilege: PrivilegeLevel;
  inputs: {
    key: string;
    label: string;
    type: ArgumentType;
    defaultValue?: string;
    placeholder?: string;
    isConfiguredPermanent?: boolean;
  }[];
  steps: WorkflowStep[];
  successCount: number;
  failureCount: number;
}

export interface TroubleshootingEntry {
  id: string;
  title: string;
  errorPattern: string;
  category: 'storage' | 'gaming' | 'packages' | 'system' | 'drivers';
  symptom: string;
  likelyCauses: string[];
  diagnosticCommand: string;
  outputInterpretation: string;
  safeFixCommand: string;
  safeFixDescription: string;
  dangerousFixCommand?: string;
  dangerousFixWarning?: string;
  verificationCommand: string;
  cachySpecificNote?: string;
}

export type GatewayMode = 'simulated' | 'live_daemon';
