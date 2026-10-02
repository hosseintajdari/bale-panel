import fs from "node:fs";
import path from "node:path";

// Test-only values. These are never production credentials.
process.env.NODE_ENV = "test";
process.env.MOCK_OUTBOX = "true";
process.env.PANEL_API_SECRET ??= "test-only-panel-api-secret-not-for-deployment";
process.env.VAULT_MASTER_KEY ??= "test-only-vault-master-key-not-for-deployment";
process.env.BALE_WEBHOOK_SECRET ??= "test-only-bale-webhook-secret-not-for-deployment";
process.env.EVOLUTION_WEBHOOK_SECRET ??= "test-only-evolution-webhook-secret-not-for-deployment";

const testDataDir = path.resolve(process.cwd(), ".tmp");
const testDbPath = path.join(testDataDir, "embednet-test.db");
fs.mkdirSync(testDataDir, { recursive: true });
for (const suffix of ["", "-wal", "-shm"]) {
  fs.rmSync(`${testDbPath}${suffix}`, { force: true });
}
process.env.EMBEDNET_DB_PATH = testDbPath;
