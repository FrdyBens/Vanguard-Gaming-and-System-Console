/**
 * Vanguard CachyOS Host Daemon - Package Operations
 * Queries local package manager (pacman on CachyOS/Arch, with standard fallbacks)
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export class PackageOperations {
  public static async getPackageInfo(packageName: string): Promise<any> {
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(packageName)) {
      throw new Error(`Invalid package name '${packageName}'`);
    }

    // Try pacman first (CachyOS primary package manager)
    try {
      const { stdout } = await execFileAsync('pacman', ['-Qi', packageName], { shell: false });
      const info: Record<string, string> = {};
      stdout.split('\n').forEach((line) => {
        const idx = line.indexOf(':');
        if (idx > -1) {
          const key = line.slice(0, idx).trim().toLowerCase().replace(/\s+/g, '_');
          const val = line.slice(idx + 1).trim();
          info[key] = val;
        }
      });
      return {
        manager: 'pacman',
        installed: true,
        name: info['name'] || packageName,
        version: info['version'] || 'unknown',
        description: info['description'] || '',
        architecture: info['architecture'] || 'x86_64'
      };
    } catch {
      // Try dpkg if in debian environment
      try {
        const { stdout } = await execFileAsync('dpkg', ['-s', packageName], { shell: false });
        const isInstalled = stdout.includes('Status: install ok installed');
        return {
          manager: 'dpkg',
          installed: isInstalled,
          name: packageName,
          version: stdout.match(/^Version:\s*(.*)$/m)?.[1] || 'unknown',
          description: stdout.match(/^Description:\s*(.*)$/m)?.[1] || ''
        };
      } catch {
        return {
          manager: 'pacman',
          installed: false,
          name: packageName,
          version: null
        };
      }
    }
  }

  public static async installPackage(params: {
    packageName: string;
  }): Promise<{ success: boolean; exitCode: number; stdout: string; stderr: string; verified: boolean; verificationMessage: string }> {
    const { packageName } = params;
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(packageName)) {
      throw new Error(`Invalid package name '${packageName}'`);
    }

    const isRoot = process.getuid ? process.getuid() === 0 : false;
    const cmdBin = isRoot ? 'pacman' : 'sudo';
    const cmdArgs = isRoot ? ['-S', '--noconfirm', packageName] : ['pacman', '-S', '--noconfirm', packageName];

    let exitCode = 0;
    let stdout = '';
    let stderr = '';

    try {
      const res = await execFileAsync(cmdBin, cmdArgs, { shell: false });
      stdout = res.stdout;
      stderr = res.stderr;
    } catch (err: any) {
      exitCode = err.code || 1;
      stderr = err.stderr || err.message;
    }

    // VERIFICATION: Check with pacman -Qi
    const info = await this.getPackageInfo(packageName);
    const verified = exitCode === 0 && info.installed;

    return {
      success: exitCode === 0,
      exitCode,
      stdout,
      stderr,
      verified,
      verificationMessage: verified
        ? `Verified installation of package '${packageName}' (version: ${info.version}).`
        : exitCode === 0
        ? 'Package manager reported success but pacman -Qi did not confirm installation.'
        : `Package installation failed with exit code ${exitCode}: ${stderr}`
    };
  }

  public static async removePackage(params: {
    packageName: string;
  }): Promise<{ success: boolean; exitCode: number; stdout: string; stderr: string; verified: boolean; verificationMessage: string }> {
    const { packageName } = params;
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(packageName)) {
      throw new Error(`Invalid package name '${packageName}'`);
    }

    // Protect essential system packages
    const criticalSystemPackages = ['base', 'linux', 'linux-cachyos', 'systemd', 'glibc', 'pacman', 'sudo'];
    if (criticalSystemPackages.includes(packageName.toLowerCase())) {
      throw new Error(`Package '${packageName}' is a protected core system component and cannot be removed.`);
    }

    const isRoot = process.getuid ? process.getuid() === 0 : false;
    const cmdBin = isRoot ? 'pacman' : 'sudo';
    const cmdArgs = isRoot ? ['-R', '--noconfirm', packageName] : ['pacman', '-R', '--noconfirm', packageName];

    let exitCode = 0;
    let stdout = '';
    let stderr = '';

    try {
      const res = await execFileAsync(cmdBin, cmdArgs, { shell: false });
      stdout = res.stdout;
      stderr = res.stderr;
    } catch (err: any) {
      exitCode = err.code || 1;
      stderr = err.stderr || err.message;
    }

    // VERIFICATION: pacman -Qi should report not installed
    const info = await this.getPackageInfo(packageName);
    const verified = exitCode === 0 && !info.installed;

    return {
      success: exitCode === 0,
      exitCode,
      stdout,
      stderr,
      verified,
      verificationMessage: verified
        ? `Verified complete removal of package '${packageName}'.`
        : `Removal completed with status ${exitCode}.`
    };
  }
}
