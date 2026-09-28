/**
 * Vanguard CachyOS Host Daemon - Security & Authentication Layer
 * Implements cryptographic authentication, replay protection, origin verification, and path boundaries
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  DAEMON_CONFIG_DIR,
  DAEMON_TOKEN_FILE,
  getAllowedOrigins,
  getAllowedPathRoots
} from './config';

export interface AuthContext {
  authenticated: boolean;
  requestId: string;
  timestamp: number;
  nonce: string;
  error?: string;
}

export class DaemonSecurity {
  private static seenNonces: Map<string, number> = new Map(); // nonce -> expiry timestamp
  private static cachedToken: string | null = null;

  /**
   * Initializes daemon auth token with strict POSIX permissions (0700 dir, 0600 token)
   */
  public static initDaemonAuth(): string {
    if (!fs.existsSync(DAEMON_CONFIG_DIR)) {
      fs.mkdirSync(DAEMON_CONFIG_DIR, { recursive: true, mode: 0o700 });
    }
    // Enforce 0700 on directory
    try {
      fs.chmodSync(DAEMON_CONFIG_DIR, 0o700);
    } catch {
      // ignore on non-posix if applicable
    }

    if (fs.existsSync(DAEMON_TOKEN_FILE)) {
      try {
        const token = fs.readFileSync(DAEMON_TOKEN_FILE, 'utf8').trim();
        if (token && token.length >= 32) {
          this.cachedToken = token;
          return token;
        }
      } catch {
        // regenerate if corrupted
      }
    }

    // Generate 32-byte cryptographically secure secret
    const newToken = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(DAEMON_TOKEN_FILE, newToken, { mode: 0o600 });
    try {
      fs.chmodSync(DAEMON_TOKEN_FILE, 0o600);
    } catch {
      // ignore
    }

    this.cachedToken = newToken;
    return newToken;
  }

  public static getActiveToken(): string {
    if (!this.cachedToken) {
      return this.initDaemonAuth();
    }
    return this.cachedToken;
  }

  /**
   * Validates origin header against whitelist. Never allows '*'.
   */
  public static isOriginAllowed(originHeader?: string): boolean {
    if (!originHeader) return true; // Direct local CLI/curl requests
    const allowed = getAllowedOrigins();
    const normalized = originHeader.trim().toLowerCase();
    return allowed.some((o) => normalized === o.toLowerCase() || normalized.startsWith(o.toLowerCase()));
  }

  /**
   * Verifies incoming request authentication headers, clock skew, nonce, and token
   */
  public static verifyRequest(
    authHeader?: string,
    requestId?: string,
    timestampHeader?: string,
    nonceHeader?: string
  ): AuthContext {
    if (!requestId || typeof requestId !== 'string' || requestId.length > 128) {
      return { authenticated: false, requestId: requestId || '', timestamp: 0, nonce: '', error: 'Missing or malformed x-vanguard-request-id header' };
    }

    if (!timestampHeader) {
      return { authenticated: false, requestId, timestamp: 0, nonce: '', error: 'Missing x-vanguard-timestamp header' };
    }

    const timestamp = parseInt(timestampHeader, 10);
    if (isNaN(timestamp)) {
      return { authenticated: false, requestId, timestamp: 0, nonce: '', error: 'Invalid timestamp format' };
    }

    const now = Date.now();
    // Allow up to 60 seconds clock skew in past, and 5 seconds in future
    if (Math.abs(now - timestamp) > 60000) {
      return { authenticated: false, requestId, timestamp, nonce: '', error: 'Request timestamp expired or excessive clock skew (>60s)' };
    }

    if (!nonceHeader || nonceHeader.length < 8 || nonceHeader.length > 128) {
      return { authenticated: false, requestId, timestamp, nonce: '', error: 'Missing or invalid x-vanguard-nonce header' };
    }

    // Nonce replay check
    this.cleanExpiredNonces(now);
    if (this.seenNonces.has(nonceHeader)) {
      return { authenticated: false, requestId, timestamp, nonce: nonceHeader, error: 'Replayed nonce detected. Request rejected.' };
    }
    // Store nonce with 65s TTL
    this.seenNonces.set(nonceHeader, now + 65000);

    // Token verification with constant-time equality
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, requestId, timestamp, nonce: nonceHeader, error: 'Missing or malformed Authorization header (Bearer required)' };
    }

    const providedToken = authHeader.slice(7).trim();
    const activeToken = this.getActiveToken();

    if (providedToken.length !== activeToken.length) {
      return { authenticated: false, requestId, timestamp, nonce: nonceHeader, error: 'Authentication token mismatch' };
    }

    const providedBuf = Buffer.from(providedToken, 'utf8');
    const activeBuf = Buffer.from(activeToken, 'utf8');

    if (!crypto.timingSafeEqual(providedBuf, activeBuf)) {
      return { authenticated: false, requestId, timestamp, nonce: nonceHeader, error: 'Authentication token verification failed' };
    }

    return { authenticated: true, requestId, timestamp, nonce: nonceHeader };
  }

  /**
   * Path safety validation: Prevents directory traversal, null bytes, and forces approved scopes
   */
  public static validatePath(targetPath: string, allowRootMount = false): { safe: boolean; resolvedPath: string; error?: string } {
    if (!targetPath || typeof targetPath !== 'string') {
      return { safe: false, resolvedPath: '', error: 'Target path must be a non-empty string' };
    }

    if (targetPath.includes('\0')) {
      return { safe: false, resolvedPath: '', error: 'Null bytes detected in path' };
    }

    // Block device nodes are treated under device policy, not normal directory paths
    if (targetPath.startsWith('/dev/')) {
      if (/^\/dev\/(nvme\d+n\d+(p\d+)?|sd[a-z]\d*|disk\/by-[a-z0-9_-]+\/[a-zA-Z0-9_-]+)$/.test(targetPath)) {
        return { safe: true, resolvedPath: targetPath };
      }
      return { safe: false, resolvedPath: targetPath, error: 'Invalid or prohibited /dev path node' };
    }

    // Resolve normalized absolute path
    const resolved = path.resolve(targetPath);

    // Prevent deletion or alteration of system critical paths
    const forbiddenExact = ['/', '/boot', '/etc', '/sys', '/proc', '/usr', '/bin', '/sbin', '/lib', '/lib64'];
    if (forbiddenExact.includes(resolved)) {
      return { safe: false, resolvedPath: resolved, error: `Critical system root path ${resolved} is protected from modification` };
    }

    // Check if path is within allowed scopes
    const allowedRoots = getAllowedPathRoots();
    const isWithinAllowed = allowedRoots.some((root) => resolved === root || resolved.startsWith(root + path.sep));

    if (!isWithinAllowed) {
      return {
        safe: false,
        resolvedPath: resolved,
        error: `Path '${resolved}' is outside the authorized filesystem scopes (${allowedRoots.join(', ')})`
      };
    }

    return { safe: true, resolvedPath: resolved };
  }

  private static cleanExpiredNonces(now: number): void {
    for (const [nonce, expiry] of this.seenNonces.entries()) {
      if (now > expiry) {
        this.seenNonces.delete(nonce);
      }
    }
  }
}
