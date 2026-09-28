/**
 * Vanguard CachyOS Host Daemon - Filesystem Operations
 * Safe, scoped path inspection and directory mutations with verification
 */

import fs from 'fs';
import path from 'path';
import { DaemonSecurity } from '../security';

export class FilesystemOperations {
  public static inspectPath(targetPath: string): any {
    const check = DaemonSecurity.validatePath(targetPath);
    if (!check.safe) {
      throw new Error(check.error || 'Path validation rejected');
    }

    if (!fs.existsSync(check.resolvedPath)) {
      return { exists: false, path: check.resolvedPath };
    }

    const stat = fs.statSync(check.resolvedPath);
    return {
      exists: true,
      path: check.resolvedPath,
      name: path.basename(check.resolvedPath),
      sizeBytes: stat.size,
      isDirectory: stat.isDirectory(),
      isFile: stat.isFile(),
      isSymbolicLink: stat.isSymbolicLink(),
      mode: '0' + (stat.mode & 0o777).toString(8),
      uid: stat.uid,
      gid: stat.gid,
      mtime: stat.mtime.toISOString()
    };
  }

  public static listDirectory(targetPath: string): any[] {
    const check = DaemonSecurity.validatePath(targetPath);
    if (!check.safe) {
      throw new Error(check.error || 'Path validation rejected');
    }

    if (!fs.existsSync(check.resolvedPath)) {
      throw new Error(`Directory '${check.resolvedPath}' does not exist`);
    }

    const stat = fs.statSync(check.resolvedPath);
    if (!stat.isDirectory()) {
      throw new Error(`Path '${check.resolvedPath}' is not a directory`);
    }

    const entries = fs.readdirSync(check.resolvedPath);
    const items: any[] = [];

    for (const name of entries) {
      try {
        const itemPath = path.join(check.resolvedPath, name);
        const itemStat = fs.lstatSync(itemPath);

        items.push({
          name,
          path: itemPath,
          isDirectory: itemStat.isDirectory(),
          isFile: itemStat.isFile(),
          isSymbolicLink: itemStat.isSymbolicLink(),
          sizeBytes: itemStat.size,
          mode: '0' + (itemStat.mode & 0o777).toString(8),
          mtime: itemStat.mtime.toISOString()
        });
      } catch {
        // Skip unreadable files
      }
    }

    return items;
  }

  public static createDirectory(params: {
    path: string;
    mode?: number;
  }): { success: boolean; path: string; verified: boolean; verificationMessage: string } {
    const check = DaemonSecurity.validatePath(params.path);
    if (!check.safe) {
      throw new Error(check.error || 'Path validation rejected');
    }

    const target = check.resolvedPath;
    fs.mkdirSync(target, { recursive: true, mode: params.mode || 0o755 });

    // VERIFICATION: Assert path exists and is a directory
    const exists = fs.existsSync(target);
    const isDir = exists ? fs.statSync(target).isDirectory() : false;
    const verified = exists && isDir;

    return {
      success: true,
      path: target,
      verified,
      verificationMessage: verified
        ? `Verified directory creation at '${target}'.`
        : 'EXECUTION_COMPLETED_BUT_VERIFICATION_FAILED: Directory creation completed but target does not exist.'
    };
  }

  public static removeDirectory(params: {
    path: string;
  }): { success: boolean; path: string; verified: boolean; verificationMessage: string } {
    const check = DaemonSecurity.validatePath(params.path);
    if (!check.safe) {
      throw new Error(check.error || 'Path validation rejected');
    }

    const target = check.resolvedPath;
    if (!fs.existsSync(target)) {
      return { success: true, path: target, verified: true, verificationMessage: 'Target does not exist (already removed).' };
    }

    // Only allow removing empty directories for safety
    const files = fs.readdirSync(target);
    if (files.length > 0) {
      throw new Error(`Directory '${target}' is not empty. Recursive directory wipe prohibited.`);
    }

    fs.rmdirSync(target);

    // VERIFICATION: Assert path no longer exists
    const stillExists = fs.existsSync(target);
    const verified = !stillExists;

    return {
      success: verified,
      path: target,
      verified,
      verificationMessage: verified
        ? `Verified removal of directory '${target}'.`
        : 'EXECUTION_COMPLETED_BUT_VERIFICATION_FAILED: Directory removal returned success but directory is still present.'
    };
  }
}
