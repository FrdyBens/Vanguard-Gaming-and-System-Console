/**
 * Vanguard Core - Memory Engine
 * Object-centric historical memory, failure tracking, and preference persistence
 */

import { StructuredExecutionRecord } from './ExecutionMemory';
import { PreferenceMemory } from './PreferenceMemory';
import { INITIAL_EXECUTION_HISTORY } from '../../services/cachyState';

export interface ObjectHistoryContext {
  target: string;
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  lastSuccessfulConfig?: {
    tool?: string;
    winePrefix?: string;
    protonVersion?: string;
    command?: string;
    timestamp: number;
  };
  recentFailures: {
    reason?: string;
    category?: string;
    command: string;
    timestamp: number;
  }[];
}

export class MemoryEngine {
  private records: StructuredExecutionRecord[] = [];
  public preferences: PreferenceMemory = new PreferenceMemory();

  constructor() {
    // Seed from existing history records
    INITIAL_EXECUTION_HISTORY.forEach((h) => {
      this.records.push({
        id: h.id,
        timestamp: h.timestamp,
        intent: `Execute ${h.executable}`,
        operationType: h.executable.endsWith('.exe') ? 'LaunchWineApplication' : 'ExecuteCommand',
        command: h.command,
        target: h.executable,
        arguments: {},
        workingDir: '/home/cachy',
        backend: 'simulation',
        user: 'cachy',
        objects: [h.executable],
        toolUsed: h.toolUsed,
        winePrefix: h.winePrefix,
        protonVersion: h.protonVersion,
        exitCode: h.exitCode,
        status: h.status,
        failureCategory: h.failureCategory,
        failureReason: h.failureReason,
        stdout: h.stdoutSnippet || '',
        stderr: '',
        durationMs: h.durationMs,
        userConfirmedSuccess: h.userConfirmedSuccess,
        userConfirmedFailure: h.userConfirmedFailure
      });
    });
  }

  public recordExecution(record: Omit<StructuredExecutionRecord, 'id'>): StructuredExecutionRecord {
    const fullRecord: StructuredExecutionRecord = {
      ...record,
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    };
    this.records.unshift(fullRecord);

    // 30 days retention policy: expire records older than 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    this.records = this.records.filter((r) => r.timestamp > thirtyDaysAgo);

    return fullRecord;
  }

  public getAllRecords(): StructuredExecutionRecord[] {
    return this.records;
  }

  /**
   * Object-centric query: what has worked and what has failed for a target entity
   */
  public getObjectHistory(targetPathOrName: string): ObjectHistoryContext {
    const normalized = targetPathOrName.toLowerCase();
    const matches = this.records.filter(
      (r) =>
        r.target.toLowerCase().includes(normalized) ||
        r.command.toLowerCase().includes(normalized) ||
        r.objects.some((obj) => obj.toLowerCase().includes(normalized))
    );

    const successes = matches.filter((m) => m.status === 'success');
    const failures = matches.filter((m) => m.status === 'failed');

    const lastSuccess = successes[0];

    return {
      target: targetPathOrName,
      totalExecutions: matches.length,
      successCount: successes.length,
      failureCount: failures.length,
      lastSuccessfulConfig: lastSuccess
        ? {
            tool: lastSuccess.toolUsed,
            winePrefix: lastSuccess.winePrefix,
            protonVersion: lastSuccess.protonVersion,
            command: lastSuccess.command,
            timestamp: lastSuccess.timestamp
          }
        : undefined,
      recentFailures: failures.slice(0, 5).map((f) => ({
        reason: f.failureReason,
        category: f.failureCategory,
        command: f.command,
        timestamp: f.timestamp
      }))
    };
  }
}
