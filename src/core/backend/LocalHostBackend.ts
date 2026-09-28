/**
 * Vanguard Core - Local Host Daemon Backend
 * Structured HTTP/WebSocket client communicating with the local CachyOS Vanguard Agent
 */

import { VanguardBackend, BackendType } from './VanguardBackend';
import { MachineSnapshot } from '../machine/MachineSnapshot';
import { OperationPlan } from '../planning/OperationPlan';
import { PlanStep } from '../planning/PlanStep';

export class LocalHostBackend implements VanguardBackend {
  public readonly type: BackendType = 'cachyos_local';
  public isConnected: boolean = false;
  private daemonUrl: string;

  constructor(daemonUrl = 'http://localhost:9090') {
    this.daemonUrl = daemonUrl;
  }

  public setDaemonUrl(url: string) {
    this.daemonUrl = url;
  }

  public async discoverMachine(): Promise<MachineSnapshot> {
    try {
      const res = await fetch(`${this.daemonUrl}/api/snapshot`);
      if (!res.ok) throw new Error(`Host agent returned ${res.status}`);
      const data = await res.json();
      this.isConnected = true;
      return data;
    } catch (err) {
      this.isConnected = false;
      throw new Error(`Failed to connect to local Vanguard Agent at ${this.daemonUrl}: ${err}`);
    }
  }

  public async inspectPath(path: string): Promise<any> {
    try {
      const res = await fetch(`${this.daemonUrl}/api/inspect?path=${encodeURIComponent(path)}`);
      return await res.json();
    } catch {
      return null;
    }
  }

  public async inspectDevice(devicePath: string): Promise<any> {
    try {
      const res = await fetch(`${this.daemonUrl}/api/device?path=${encodeURIComponent(devicePath)}`);
      return await res.json();
    } catch {
      return null;
    }
  }

  public async executePlan(
    plan: OperationPlan,
    onStepProgress?: (step: PlanStep) => void
  ): Promise<OperationPlan> {
    plan.status = 'executing';

    try {
      const res = await fetch(`${this.daemonUrl}/api/plan/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan)
      });

      if (!res.ok) {
        throw new Error(`Agent execution rejected: ${res.statusText}`);
      }

      const executedPlan: OperationPlan = await res.json();
      return executedPlan;
    } catch (err: any) {
      plan.status = 'failed';
      if (plan.steps.length > 0) {
        plan.steps[0].status = 'failed';
        plan.steps[0].result = {
          exitCode: 1,
          stdout: '',
          stderr: `Failed to communicate with host agent: ${err.message}`,
          durationMs: 0,
          verified: false,
          verificationMessage: 'Agent connection failure'
        };
      }
      return plan;
    }
  }

  public async cancelOperation(planId: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.daemonUrl}/api/plan/${planId}/cancel`, { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  }
}
