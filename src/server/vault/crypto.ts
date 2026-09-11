import crypto from "crypto";
import { VAULT_MASTER_KEY } from "../config.js";

function getVaultKeyBuffer(): Buffer {
  const masterKey = process.env.VAULT_MASTER_KEY || VAULT_MASTER_KEY || "";
  return crypto.createHash("sha256").update(masterKey).digest();
}

export function encryptSecret(plaintext: string): {
  encryptedBlob: string;
  ivPreview: string;
  authTagPreview: string;
  cipherHashPreview: string;
} {
  const keyBuffer = getVaultKeyBuffer();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const ivHex = iv.toString("hex");
  const authTagHex = authTag.toString("hex");
  const cipherHex = encrypted.toString("hex");
  const encryptedBlob = `enc:aes-256-gcm:${ivHex}:${authTagHex}:${cipherHex}`;
  const cipherHashPreview = crypto.createHash("sha256").update(cipherHex).digest("hex").slice(0, 12);

  return {
    encryptedBlob,
    ivPreview: ivHex.slice(0, 8),
    authTagPreview: authTagHex.slice(0, 8),
    cipherHashPreview,
  };
}

export function decryptSecret(encryptedBlob: string): string {
  const parts = encryptedBlob.split(":");
  if (parts.length !== 5 || parts[0] !== "enc" || parts[1] !== "aes-256-gcm") {
    throw new Error("Invalid encrypted format");
  }
  const keyBuffer = getVaultKeyBuffer();
  const iv = Buffer.from(parts[2], "hex");
  const authTag = Buffer.from(parts[3], "hex");
  const ciphertext = Buffer.from(parts[4], "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}

export function maskSecret(service: string, secret: string): string {
  if (!secret || secret.length < 6) return "••••••";
  if (service === "github") {
    const prefix = secret.startsWith("ghp_") ? "ghp_" : secret.startsWith("github_pat_") ? "github_pat_" : "";
    const core = secret.slice(prefix.length);
    return `${prefix}••••••••••••${core.slice(-4)}`;
  }
  if (service === "notion") {
    const prefix = secret.startsWith("secret_") ? "secret_" : secret.startsWith("ntn_") ? "ntn_" : "";
    const core = secret.slice(prefix.length);
    return `${prefix}••••••••••••${core.slice(-4)}`;
  }
  if (service === "openai") {
    const prefix = secret.startsWith("sk-proj-") ? "sk-proj-" : secret.startsWith("sk-") ? "sk-" : "";
    const core = secret.slice(prefix.length);
    return `${prefix}••••••••••••${core.slice(-4)}`;
  }
  return `${secret.slice(0, 3)}••••••••${secret.slice(-3)}`;
}
