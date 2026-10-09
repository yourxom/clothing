// AES-256-GCM encryption for payment credentials at rest (merchant API key,
// API secret, webhook secret). These must never be stored in plaintext and
// must never be returned to the frontend in decrypted form.
//
// Requires PAYMENT_ENCRYPTION_KEY in .env — a 32-byte key, base64 or hex
// encoded. Generate one with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended for GCM

function getKey(): Buffer {
  const raw = process.env.PAYMENT_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "PAYMENT_ENCRYPTION_KEY is not set. Add a 32-byte base64 or hex key to .env. " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
    );
  }
  // Accept either base64 or hex encoding, whichever decodes to exactly 32 bytes.
  for (const enc of ["base64", "hex"] as const) {
    try {
      const buf = Buffer.from(raw, enc);
      if (buf.length === 32) return buf;
    } catch { /* try next encoding */ }
  }
  throw new Error("PAYMENT_ENCRYPTION_KEY must decode to exactly 32 bytes (base64 or hex).");
}

/** Encrypts a plaintext secret. Returns a single string: iv:authTag:ciphertext (all base64). */
export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv  = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(":");
}

/** Decrypts a string produced by encryptSecret(). Returns "" if input is empty/invalid. */
export function decryptSecret(encoded: string | null | undefined): string {
  if (!encoded) return "";
  try {
    const [ivB64, tagB64, dataB64] = encoded.split(":");
    if (!ivB64 || !tagB64 || !dataB64) return "";
    const key = getKey();
    const iv  = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (err) {
    console.error("[payments/crypto] Decryption failed:", err);
    return "";
  }
}

/** Masks a secret for display in the admin UI — never send the full value to the browser. */
export function maskSecret(secret: string): string {
  if (!secret) return "";
  if (secret.length <= 6) return "••••••";
  return `${secret.slice(0, 3)}••••${secret.slice(-3)}`;
}
