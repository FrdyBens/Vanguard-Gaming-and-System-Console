/**
 * Vanguard CachyOS Host Daemon - Audit Logger
 * Local append-only audit log for operational security and forensic traceability
 */

import fs from 'fs';
import path from 'path';
import { AUDIT_LOG_FILE, VANGUARD_HOME } from './config';

export interface AuditRecord {
  timestamp: string;
  requestId: string;
  operation: string;
  actor: string;
  riskLevel: 'READ_ONLY' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  target?: string;
  parameters?: Record<string, any>;
  success: boolean;
  exitCode: number;
  verification?: {
    verified: boolean;
    method?: string;
    message?: string;
  };
  durationMs: number;
}

export class AuditLogger {
  private static initialized = false;

  private static init(): void {
    if (!fs.existsSync(VANGUARD_HOME)) {
      fs.mkdirSync(VANGUARD_HOME, { recursive: true, mode: 0o700 });
    }
    this.initialized = true;
  }

  public static log(record: Omit<AuditRecord, 'timestamp'>): void {
    try {
      if (!this.initialized) this.init();

      // Sanitize parameters to ensure no tokens or passwords ever leak
      const sanitizedParams = record.parameters ? this.sanitize(record.parameters) : undefined;

      const fullRecord: AuditRecord = {
        ...record,
        timestamp: new Date().toISOString(),
        parameters: sanitizedParams
      };

      const line = JSON.stringify(fullRecord) + '\n';
      fs.appendFileSync(AUDIT_LOG_FILE, line, { mode: 0o600 });
    } catch (err) {
      console.error('[Vanguard Audit Log Error]', err);
    }
  }

  private static sanitize(obj: Record<string, any>): Record<string, any> {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      const lower = k.toLowerCase();
      if (lower.includes('token') || lower.includes('secret') || lower.includes('pass') || lower.includes('auth')) {
        clean[k] = '[REDACTED]';
      } else if (typeof v === 'object' && v !== null) {
        clean[k] = this.sanitize(v);
      } else {
        clean[k] = v;
      }
    }
    return clean;
  }
}
