/**
 * Vanguard Core - Execution Memory Record
 * Structured historical audit & operational memory
 */

export interface StructuredExecutionRecord {
  id: string;
  timestamp: number;
  intent: string;
  operationType: string;
  command: string;
  target: string;
  arguments: Record<string, any>;
  workingDir: string;
  backend: 'simulation' | 'cachyos_local' | 'remote_host';
  user: string;
  objects: string[];
  toolUsed?: string;
  winePrefix?: string;
  protonVersion?: string;
  steamAppId?: number;
  exitCode: number;
  status: 'success' | 'failed' | 'cancelled';
  failureCategory?: 'process_failure' | 'config_mismatch' | 'dependency_missing' | 'permission_denied' | 'user_abort';
  failureReason?: string;
  stdout: string;
  stderr: string;
  durationMs: number;
  userConfirmedSuccess?: boolean;
  userConfirmedFailure?: boolean;
}
