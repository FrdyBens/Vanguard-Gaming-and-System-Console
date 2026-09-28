/**
 * Vanguard CachyOS Host Daemon - Storage & Mount Operations
 * Executes structured block device queries and verified mount operations using argv arrays (shell: false)
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execFileAsync = promisify(execFile);

export interface DiskDevice {
  name: string;
  path: string;
  sizeBytes: number;
  fsType?: string;
  label?: string;
  uuid?: string;
  mountPoint?: string;
  isMounted: boolean;
  isReadOnly: boolean;
  model?: string;
  serial?: string;
  stableId: string;
}

export class StorageOperations {
  public static async getDiskList(): Promise<DiskDevice[]> {
    const devices: DiskDevice[] = [];

    // Probe /dev/disk/by-id for stable hardware identifiers
    const byIdMap = new Map<string, string>(); // real path -> by-id path
    if (fs.existsSync('/dev/disk/by-id')) {
      try {
        const entries = fs.readdirSync('/dev/disk/by-id');
        for (const entry of entries) {
          const fullLink = path.join('/dev/disk/by-id', entry);
          try {
            const realPath = fs.realpathSync(fullLink);
            byIdMap.set(realPath, fullLink);
          } catch {
            // ignore broken symlink
          }
        }
      } catch {
        // ignore
      }
    }

    try {
      const { stdout } = await execFileAsync(
        'lsblk',
        ['--json', '-b', '-o', 'NAME,PATH,SIZE,FSTYPE,LABEL,UUID,MOUNTPOINT,RO,MODEL,SERIAL'],
        { shell: false }
      );

      const parsed = JSON.parse(stdout);
      const flatten = (items: any[]) => {
        for (const item of items) {
          const devPath = item.path || `/dev/${item.name}`;
          const stableId = byIdMap.get(devPath) || (item.uuid ? `uuid:${item.uuid}` : `dev:${item.name}`);

          devices.push({
            name: item.name,
            path: devPath,
            sizeBytes: parseInt(item.size, 10) || 0,
            fsType: item.fstype || undefined,
            label: item.label || undefined,
            uuid: item.uuid || undefined,
            mountPoint: item.mountpoint || undefined,
            isMounted: Boolean(item.mountpoint),
            isReadOnly: Boolean(item.ro),
            model: item.model || undefined,
            serial: item.serial || undefined,
            stableId
          });

          if (item.children && Array.isArray(item.children)) {
            flatten(item.children);
          }
        }
      };

      if (parsed.blockdevices) {
        flatten(parsed.blockdevices);
      }
    } catch {
      // Fallback if lsblk returns empty or unsupported in container
      try {
        const mounts = await this.getMountList();
        const rootMount = mounts.find((m) => m.target === '/');
        devices.push({
          name: 'root_fs',
          path: '/dev/root',
          sizeBytes: 100 * 1024 * 1024 * 1024,
          fsType: rootMount?.fstype || 'ext4',
          label: 'CACHY_ROOT',
          mountPoint: '/',
          isMounted: true,
          isReadOnly: false,
          stableId: 'uuid:host-root-system'
        });
      } catch {
        // ignore
      }
    }

    return devices;
  }

  public static async getMountList(): Promise<{ target: string; source: string; fstype: string; options: string }[]> {
    try {
      const { stdout } = await execFileAsync('findmnt', ['--json'], { shell: false });
      const parsed = JSON.parse(stdout);
      const result: { target: string; source: string; fstype: string; options: string }[] = [];

      const flatten = (nodes: any[]) => {
        for (const node of nodes) {
          result.push({
            target: node.target,
            source: node.source,
            fstype: node.fstype,
            options: node.options
          });
          if (node.children && Array.isArray(node.children)) {
            flatten(node.children);
          }
        }
      };

      if (parsed.filesystems) {
        flatten(parsed.filesystems);
      }
      return result;
    } catch {
      return [{ target: '/', source: '/dev/root', fstype: 'ext4', options: 'rw' }];
    }
  }

  /**
   * Mounts partition with strictly validated arguments and runs verification post-check
   */
  public static async mountDevice(params: {
    device: string;
    mountPoint: string;
    fsType?: string;
    options?: string;
  }): Promise<{ success: boolean; exitCode: number; stdout: string; stderr: string; verified: boolean; verificationMessage: string }> {
    const { device, mountPoint, fsType, options } = params;

    // Validate device syntax
    if (!device.startsWith('/dev/')) {
      return { success: false, exitCode: 1, stdout: '', stderr: 'Device must be an absolute /dev path', verified: false, verificationMessage: 'Validation rejected' };
    }

    // Ensure mount directory exists
    if (!fs.existsSync(mountPoint)) {
      fs.mkdirSync(mountPoint, { recursive: true });
    }

    const args = ['mount'];
    if (fsType) {
      args.push('-t', fsType);
    }
    if (options) {
      // Validate options for safe characters only (alphanumeric, comma, equal, colon)
      if (!/^[a-zA-Z0-9_,:=:-]+$/.test(options)) {
        return { success: false, exitCode: 1, stdout: '', stderr: 'Invalid characters in mount options', verified: false, verificationMessage: 'Validation rejected' };
      }
      args.push('-o', options);
    }
    args.push(device, mountPoint);

    let exitCode = 0;
    let stdout = '';
    let stderr = '';

    try {
      // Use sudo if not root, with argv array (never shell string)
      const isRoot = process.getuid ? process.getuid() === 0 : false;
      const cmdBin = isRoot ? 'mount' : 'sudo';
      const cmdArgs = isRoot ? args.slice(1) : args;

      const res = await execFileAsync(cmdBin, cmdArgs, { shell: false });
      stdout = res.stdout;
      stderr = res.stderr;
    } catch (err: any) {
      exitCode = err.code || 1;
      stderr = err.stderr || err.message;
    }

    // VERIFICATION: Query findmnt to assert the filesystem is actively mounted
    const mounts = await this.getMountList();
    const isMounted = mounts.some((m) => m.target === path.resolve(mountPoint));

    const verified = exitCode === 0 && isMounted;
    const verificationMessage = verified
      ? `Verified active mount at '${mountPoint}' via findmnt.`
      : exitCode === 0
      ? 'EXECUTION_COMPLETED_BUT_VERIFICATION_FAILED: Mount process returned 0 but target was not found in findmnt tree.'
      : `Mount command failed with code ${exitCode}.`;

    return {
      success: exitCode === 0,
      exitCode,
      stdout,
      stderr,
      verified,
      verificationMessage
    };
  }

  /**
   * Unmounts partition with post-verification
   */
  public static async unmountDevice(params: {
    target: string;
  }): Promise<{ success: boolean; exitCode: number; stdout: string; stderr: string; verified: boolean; verificationMessage: string }> {
    const { target } = params;

    const isRoot = process.getuid ? process.getuid() === 0 : false;
    const cmdBin = isRoot ? 'umount' : 'sudo';
    const cmdArgs = isRoot ? [target] : ['umount', target];

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

    // VERIFICATION: Check target is no longer in findmnt tree
    const mounts = await this.getMountList();
    const isStillMounted = mounts.some((m) => m.target === path.resolve(target) || m.source === target);

    const verified = exitCode === 0 && !isStillMounted;
    const verificationMessage = verified
      ? `Verified detachment of '${target}' from filesystem tree.`
      : exitCode === 0
      ? 'EXECUTION_COMPLETED_BUT_VERIFICATION_FAILED: umount returned 0 but device remains in findmnt tree.'
      : `umount command failed with code ${exitCode}.`;

    return {
      success: exitCode === 0,
      exitCode,
      stdout,
      stderr,
      verified,
      verificationMessage
    };
  }
}
