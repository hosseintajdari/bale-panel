export interface AdminIntegrationState {
  notion: { connected: boolean; workspace: string; lastSync: string };
  github: { connected: boolean; repo: string; branch: string; lastSync: string };
  activeAiProvider: "gemini_direct" | "codex_account_proxy" | "chatgpt_subscription";
  pipelinePermissions: {
    allowDeterministicPricing: boolean;
    allowWebScraping: boolean;
    allowDatabaseMutation: boolean;
  };
  guestSandboxes: Array<{
    id: string;
    guestName: string;
    assignedBot: string;
    quotaUsed: string;
    isolatedMemoryPath: string;
    status: "active" | "paused";
  }>;
}

export const adminIntegrationState: AdminIntegrationState = {
  notion: {
    connected: true,
    workspace: "Embednet-Personal-Workspace",
    lastSync: "۱۰ دقیقه پیش",
  },
  github: {
    connected: true,
    repo: "sgwteam/embednet-os-core",
    branch: "main",
    lastSync: "۲۵ دقیقه پیش",
  },
  activeAiProvider: "gemini_direct",
  pipelinePermissions: {
    allowDeterministicPricing: true,
    allowWebScraping: false,
    allowDatabaseMutation: true,
  },
  guestSandboxes: [
    {
      id: "sbx-01",
      guestName: "علی (دستیار شخصی)",
      assignedBot: "Telegram @ali_assistant_bot",
      quotaUsed: "۱۴٪ از سهمیه",
      isolatedMemoryPath: "/sandboxes/tenant_ali_db",
      status: "active",
    },
    {
      id: "sbx-02",
      guestName: "همکار تیم تست (کارهای روزمره)",
      assignedBot: "Bale @colleague_test_bot",
      quotaUsed: "۲۸٪ از سهمیه",
      isolatedMemoryPath: "/sandboxes/tenant_colleague_db",
      status: "active",
    },
  ],
};
