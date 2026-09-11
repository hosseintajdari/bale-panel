export interface EvolutionInstanceState {
  instanceName: string;
  status: string;
  mode: "personal_notebook" | "pharmacy_inbound";
  connectedPhone: string;
  pairingCode: string;
  qrCodeData: string;
  qrExpiresInSec: number;
  antiBan: {
    strictInboundOnly: boolean;
    persistLedgerFirst: boolean;
    humanJitterMinSec: number;
    humanJitterMaxSec: number;
    simulateComposingPresence: boolean;
    dailyRateLimit: number;
    messagesSentToday: number;
  };
  lastInboundAt: string;
  lastPersistedLedgerId: string;
}

export const evolutionInstanceState: EvolutionInstanceState = {
  instanceName: "embednet-wa-primary",
  status: "connected",
  mode: "pharmacy_inbound",
  connectedPhone: "+98 912 845 1020",
  pairingCode: "8K3M-9P4W",
  qrCodeData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  qrExpiresInSec: 20,
  antiBan: {
    strictInboundOnly: true,
    persistLedgerFirst: true,
    humanJitterMinSec: 2,
    humanJitterMaxSec: 5,
    simulateComposingPresence: true,
    dailyRateLimit: 250,
    messagesSentToday: 18,
  },
  lastInboundAt: "۲ دقیقه پیش",
  lastPersistedLedgerId: "wld-102",
};
