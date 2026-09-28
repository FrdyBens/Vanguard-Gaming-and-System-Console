/**
 * Vanguard CachyOS Host Daemon - Configuration
 * Strict localhost binding and security paths
 */

import os from 'os';
import path from 'path';

// Daemon binds ONLY to IPv4 loopback
export const DAEMON_HOST = '127.0.0.1';
export const DAEMON_PORT = parseInt(process.env.VANGUARD_DAEMON_PORT || '9090', 10);

// Restrictive security directories
export const VANGUARD_HOME = path.join(os.homedir(), '.config', 'vanguard');
export const DAEMON_CONFIG_DIR = path.join(VANGUARD_HOME, 'daemon');
export const DAEMON_TOKEN_FILE = path.join(DAEMON_CONFIG_DIR, 'auth.token');
export const AUDIT_LOG_FILE = path.join(VANGUARD_HOME, 'audit.log');

// Allowed web origins (strict CORS, never '*')
export const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

export function getAllowedOrigins(): string[] {
  const allowed = [...DEFAULT_ALLOWED_ORIGINS];
  if (process.env.APP_URL) {
    allowed.push(process.env.APP_URL.trim());
  }
  const custom = process.env.VANGUARD_ALLOWED_ORIGINS;
  if (custom) {
    allowed.push(...custom.split(',').map((s) => s.trim()));
  }
  return allowed;
}

// Approved filesystem operating boundaries (prevents wandering outside safe boundaries)
export function getAllowedPathRoots(): string[] {
  const userHome = os.homedir();
  const roots = [
    userHome,
    '/run/media',
    '/mnt',
    '/tmp/vanguard',
    '/tmp'
  ];
  return roots;
}
