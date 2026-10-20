import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CONFIG_DIR = path.join(os.homedir(), '.vibe-inspector');
const TOKEN_FILE = path.join(CONFIG_DIR, 'token.json');

export interface AuthConfig {
  token: string;
  allowedExtensionId?: string;
}

/**
 * Generates or resolves the authentication token:
 * 1. CLI parameter / env variable
 * 2. Cached in ~/.vibe-inspector/token.json
 * 3. Freshly generated cryptographically secure random token (48 chars hex)
 */
export function getOrCreateAuthToken(cliToken?: string): string {
  if (cliToken && cliToken.trim().length >= 16) {
    return cliToken.trim();
  }

  if (process.env.VIBE_INSPECTOR_TOKEN && process.env.VIBE_INSPECTOR_TOKEN.trim().length >= 16) {
    return process.env.VIBE_INSPECTOR_TOKEN.trim();
  }

  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const data = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
      if (data?.token && typeof data.token === 'string' && data.token.length >= 16) {
        return data.token;
      }
    }
  } catch {
    // If reading fails, generate fresh token
  }

  const freshToken = crypto.randomBytes(24).toString('hex');
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token: freshToken, createdAt: new Date().toISOString() }, null, 2), {
      mode: 0o600,
    });
  } catch (err) {
    console.warn('[Vibe Inspector Bridge] Could not persist token to disk, using in-memory token:', err);
  }

  return freshToken;
}

/**
 * Validates incoming WebSocket connection request against security rules:
 * 1. Token must match exactly
 * 2. Origin must be a valid Chrome Extension (chrome-extension://...)
 * 3. If allowedExtensionId is set, origin ID must match
 */
export function validateConnection(
  reqUrl: string | undefined,
  originHeader: string | undefined,
  expectedToken: string,
  allowedExtensionId?: string
): { authorized: boolean; reason?: string } {
  // 1. Origin header validation
  if (!originHeader) {
    return { authorized: false, reason: 'Missing Origin header. Non-extension clients rejected.' };
  }

  if (!originHeader.startsWith('chrome-extension://')) {
    return {
      authorized: false,
      reason: `Forbidden Origin '${originHeader}'. Only chrome-extension:// origins are permitted.`,
    };
  }

  if (allowedExtensionId) {
    const expectedOrigin = `chrome-extension://${allowedExtensionId}`;
    if (originHeader !== expectedOrigin) {
      return {
        authorized: false,
        reason: `Extension ID mismatch. Expected '${allowedExtensionId}', received '${originHeader}'.`,
      };
    }
  }

  // 2. Token validation via URL query param (?token=...)
  if (!reqUrl) {
    return { authorized: false, reason: 'Missing request URL.' };
  }

  let providedToken = '';
  try {
    const parsed = new URL(reqUrl, 'http://127.0.0.1');
    providedToken = parsed.searchParams.get('token') || '';
  } catch {
    return { authorized: false, reason: 'Malformed request URL.' };
  }

  if (!providedToken) {
    return { authorized: false, reason: 'Missing token in connection query parameters.' };
  }

  // Constant-time comparison to prevent timing attacks (trimmed of accidental copy-paste whitespace)
  const cleanProvided = providedToken.trim();
  const cleanExpected = expectedToken.trim();
  const expectedBuf = Buffer.from(cleanExpected);
  const providedBuf = Buffer.from(cleanProvided);

  if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
    return { authorized: false, reason: 'Invalid authentication token.' };
  }

  return { authorized: true };
}
