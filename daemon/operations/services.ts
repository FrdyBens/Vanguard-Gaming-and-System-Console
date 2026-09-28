/**
 * Vanguard CachyOS Host Daemon - Systemd Services Operations
 * Manages systemd unit state using argv arrays (shell: false) with post-verification
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export class ServiceOperations {
  private static validateUnitName(unit: string): void {
    if (!/^[a-zA-Z0-9_\-@\.]+\.(service|timer|socket|mount)$/.test(unit)) {
      throw new Error(`Invalid systemd unit name '${unit}'`);
    }
  }

  public static async getServiceStatus(unit: string): Promise<any> {
    this.validateUnitName(unit);
    let active = false;
    let enabled = false;
    let subState = 'unknown';

    try {
      const { stdout } = await execFileAsync('systemctl', ['is-active', unit], { shell: false });
      active = stdout.trim() === 'active';
    } catch {
      active = false;
    }

    try {
      const { stdout } = await execFileAsync('systemctl', ['is-enabled', unit], { shell: false });
      enabled = stdout.trim() === 'enabled';
    } catch {
      enabled = false;
    }

    return {
      unit,
      active,
      enabled,
      subState: active ? 'running' : 'inactive'
    };
  }

  public static async controlService(params: {
    unit: string;
    action: 'start' | 'stop' | 'restart' | 'enable' | 'disable';
  }): Promise<{ success: boolean; exitCode: number; verified: boolean; verificationMessage: string }> {
    const { unit, action } = params;
    this.validateUnitName(unit);

    if (!['start', 'stop', 'restart', 'enable', 'disable'].includes(action)) {
      throw new Error(`Unsupported service control action '${action}'`);
    }

    const isRoot = process.getuid ? process.getuid() === 0 : false;
    const cmdBin = isRoot ? 'systemctl' : 'sudo';
    const cmdArgs = isRoot ? [action, unit] : ['systemctl', action, unit];

    let exitCode = 0;
    try {
      await execFileAsync(cmdBin, cmdArgs, { shell: false });
    } catch (err: any) {
      exitCode = err.code || 1;
    }

    // VERIFICATION: Check updated state via is-active / is-enabled
    const updated = await this.getServiceStatus(unit);
    let verified = false;

    if (action === 'start' || action === 'restart') {
      verified = updated.active;
    } else if (action === 'stop') {
      verified = !updated.active;
    } else if (action === 'enable') {
      verified = updated.enabled;
    } else if (action === 'disable') {
      verified = !updated.enabled;
    }

    const verificationMessage = verified
      ? `Verified ${action} of service '${unit}' (state: ${updated.active ? 'active' : 'inactive'}).`
      : 'EXECUTION_COMPLETED_BUT_VERIFICATION_FAILED: systemctl command completed but unit did not reach desired state.';

    return {
      success: exitCode === 0,
      exitCode,
      verified,
      verificationMessage
    };
  }
}
