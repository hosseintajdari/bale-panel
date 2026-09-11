import { create } from 'zustand';
import { ChannelPlatform, ChannelGatewayStatus, GlobalPrivacySettings, GatewayPulseConfig } from '../types';
import { authFetch } from '../utils/api';

const INITIAL_CHANNELS: ChannelGatewayStatus[] = [
  {
    id: 'whatsapp',
    displayName: 'WhatsApp Multi-Device Gateway',
    status: 'active',
    method: 'Evolution API v2 / Direct Webhook',
    latencyMs: 24,
    unprocessedQueue: 1,
    lastHeartbeat: 'اکنون',
  },
  {
    id: 'bale',
    displayName: 'Bale Messenger Bot Hook',
    status: 'active',
    method: 'Bale Webhook Pipeline (bale-med)',
    latencyMs: 38,
    unprocessedQueue: 1,
    lastHeartbeat: 'اکنون',
  },
  {
    id: 'telegram',
    displayName: 'Telegram Bot API',
    status: 'standby',
    method: 'Direct HTTPS Webhook',
    latencyMs: 52,
    unprocessedQueue: 0,
    lastHeartbeat: '۱ دقیقه پیش',
  },
  {
    id: 'sms',
    displayName: 'Iran SMS Fast-Alert Gateway',
    status: 'active',
    method: 'REST Provider Gate (Kavenegar/Faraz)',
    latencyMs: 110,
    unprocessedQueue: 0,
    lastHeartbeat: 'اکنون',
  },
];

interface AppState {
  activeChannel: ChannelPlatform;
  channels: ChannelGatewayStatus[];
  privacySettings: GlobalPrivacySettings;
  pulseConfig: GatewayPulseConfig;

  setActiveChannel: (channel: ChannelPlatform) => void;
  setChannels: (channels: ChannelGatewayStatus[]) => void;
  setPrivacySettings: (settings: GlobalPrivacySettings) => void;
  setPulseConfig: (config: GatewayPulseConfig) => void;

  fetchInitialState: () => Promise<void>;
  triggerPulsePing: (mode?: 'simulate_spike') => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeChannel: 'whatsapp',
  channels: INITIAL_CHANNELS,
  privacySettings: {
    retentionPolicy: 'audited',
    highPrivacyBotTypes: ['medical', 'clinical', 'professional', 'triage'],
    scrubSensitiveMedicalNotes: true,
    ephemeralSessionsCount: 52,
    loggedSessionsCount: 198,
    lastToggledAt: 'هم‌اکنون',
  },
  pulseConfig: {
    enabled: true,
    gateways: {
      whatsapp: true,
      bale: true,
      telegram: true,
      sms: true,
    },
    refreshIntervalSec: 4,
    alertOnJitterThresholdMs: 40,
    lastCheckedAt: 'هم‌اکنون',
  },

  setActiveChannel: (channel) => set({ activeChannel: channel }),
  setChannels: (channels) => set({ channels }),
  setPrivacySettings: (settings) => set({ privacySettings: settings }),
  setPulseConfig: (config) => set({ pulseConfig: config }),

  fetchInitialState: async () => {
    try {
      const res = await authFetch('/api/pipeline/state');
      const data = await res.json();
      if (data.channels) set({ channels: data.channels });
      if (data.privacySettings) set({ privacySettings: data.privacySettings });
      if (data.pulseConfig) set({ pulseConfig: data.pulseConfig });
    } catch (err) {
      console.debug('App initial state fetch error:', err);
    }
  },

  triggerPulsePing: async (mode) => {
    try {
      const res = await authFetch('/api/gateways/pulse-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.channels) set({ channels: data.channels });
        if (data.config) set({ pulseConfig: data.config });
      }
    } catch (err) {
      console.error('Pulse ping failed:', err);
    }
  },
}));
