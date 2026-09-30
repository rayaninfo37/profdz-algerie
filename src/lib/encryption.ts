/**
 * PROF DZ — Cryptographic Encryption Service for Sensitive Tokens
 * 
 * Provides AES-256-GCM authenticated encryption at rest for sensitive credentials
 * (Google OAuth Refresh & Access tokens, etc.)
 */

import crypto from 'crypto';

const SECRET = process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || 'kryty_encryption_master_key_algeria_2026_dz_education';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(SECRET).digest(); // 32 bytes for AES-256

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const PREFIX = 'enc:v1:';

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: enc:v1:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>
 */
export function encryptSecret(plaintext: string | null | undefined): string | null {
  if (!plaintext || typeof plaintext !== 'string') return null;
  const trimmed = plaintext.trim();
  if (!trimmed) return null;

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    let ciphertext = cipher.update(trimmed, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    const ivHex = iv.toString('hex');

    return `${PREFIX}${ivHex}:${authTag}:${ciphertext}`;
  } catch (error: any) {
    console.error('[Encryption] Failed to encrypt secret:', error?.message);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypts an encrypted string.
 * If the string does not match the enc:v1: prefix (e.g. legacy plain text),
 * it returns the input safely.
 */
export function decryptSecret(encrypted: string | null | undefined): string | null {
  if (!encrypted || typeof encrypted !== 'string') return null;
  const trimmed = encrypted.trim();
  if (!trimmed) return null;

  if (!trimmed.startsWith(PREFIX)) {
    // Legacy or plaintext fallback (prevents breaking existing unencrypted records)
    return trimmed;
  }

  try {
    const parts = trimmed.slice(PREFIX.length).split(':');
    if (parts.length !== 3) {
      throw new Error('Malformed encrypted payload');
    }

    const [ivHex, authTagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error: any) {
    console.error('[Encryption] Failed to decrypt secret:', error?.message);
    return null;
  }
}
