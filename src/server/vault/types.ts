export interface EncryptedVaultRecord {
  id: string;
  service: "github" | "notion" | "openai";
  label: string;
  agentId: string;
  agentName: string;
  taskScope: string;
  maskedSecret: string;
  envKeyName: string;
  encryptionAlgorithm: "AES-256-GCM";
  encryptedBlob: string; // format: enc:aes-256-gcm:iv:tag:ciphertext
  ivPreview: string;
  authTagPreview: string;
  cipherHashPreview: string;
  createdAt: string;
  lastUsed?: string;
  status: "active" | "revoked" | "untested";
}
