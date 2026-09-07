export type BotPlatform = 'telegram' | 'whatsapp';

export type TelegramFramework = 'telegraf' | 'node-telegram-bot-api' | 'grammy';
export type WhatsAppFramework = 'baileys' | 'whatsapp-web.js' | 'meta-cloud-api';

export type BotFramework = TelegramFramework | WhatsAppFramework;

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  image?: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  senderName?: string;
  toolCall?: {
    name: string;
    args: Record<string, any>;
    result?: string;
  };
  structuredNote?: StructuredNote;
  stageTransition?: {
    from: string;
    to: string;
    reason: string;
  };
}

export interface BotPreset {
  id: string;
  name: string;
  platform: BotPlatform;
  description: string;
  icon: string;
  systemInstruction: string;
  temperature: number;
  sampleQuestions: string[];
}

export interface CodeTemplate {
  id: string;
  title: string;
  platform: BotPlatform;
  framework: BotFramework;
  description: string;
  filename: string;
  code: string;
  envSnippet: string;
  packageJsonSnippet: string;
  highlights: string[];
}

export interface StepGuide {
  step: number;
  title: string;
  description: string;
  code?: string;
  tip?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  category: 'Support' | 'Engineering' | 'Creative' | 'Productivity' | 'Sales' | 'Coaching';
  personaTitle: string;
  description: string;
  systemPrompt: string;
  recommendedTemp: number;
  sampleInputs: string[];
}

// ----------------------------------------------------
// NOTE TAKER & LONG-TERM MEMORY DATABASE TYPES
// ----------------------------------------------------

export type NotePriority = 'High' | 'Medium' | 'Low';
export type NoteCategory = 'Meeting' | 'Product' | 'Engineering' | 'Strategy' | 'Personal' | 'Brainstorm';

export interface ActionItem {
  id: string;
  task: string;
  priority: NotePriority;
  assignee?: string;
  dueDate?: string;
  completed: boolean;
}

export interface KeyEntity {
  name: string;
  type: 'Person' | 'Project' | 'Tool' | 'Metric' | 'Date' | 'Company';
  context: string;
}

export interface StructuredNote {
  id: string;
  title: string;
  rawInput: string;
  category: NoteCategory;
  tags: string[];
  summary: string;
  expandedContent: string;
  actionItems: ActionItem[];
  keyEntities: KeyEntity[];
  createdAt: string;
  stageContext: string;
  similarityScore?: number;
}

export interface ConversationStage {
  id: string;
  code: string;
  name: string;
  description: string;
  color: string;
  activeContext: string;
  keyGoals: string[];
  suggestedPrompt: string;
}

export interface MemoryDatabaseLayer {
  layer: 'L1_HOT_CACHE' | 'L2_VECTOR_SEMANTIC' | 'L3_RELATIONAL_ACID';
  technology: string;
  latency: string;
  capacity: string;
  purpose: string;
  bestFor: string;
  indexingMethod: string;
}

export interface MemoryBenchmarkMetric {
  metric: string;
  redisL1: string;
  sqliteVector: string;
  pgvectorL2: string;
  cloudRestApi: string;
}

// ----------------------------------------------------
// EMBEDNET OS - UNIFIED MIDDLEWARE & GOVERNANCE TYPES
// ----------------------------------------------------

export type ChannelPlatform = 'whatsapp' | 'bale' | 'telegram' | 'sms';

export interface UnifiedMessage {
  id: string;
  platform: ChannelPlatform;
  senderId: string;
  senderName?: string;
  chatId: string;
  text: string;
  timestamp: number;
  hasMedia?: boolean;
  mediaType?: 'image' | 'audio' | 'document';
  mediaUrl?: string;
  metadata?: Record<string, any>;
}

export interface PipelineTraceStep {
  stage: 'GATEWAY_INGEST' | 'ENVELOPE_NORMALIZE' | 'DETERMINISTIC_RULES' | 'MEMORY_LOOKUP' | 'SHADOW_EVALUATION' | 'LLM_INFERENCE' | 'OUTBOX_DISPATCH';
  title: string;
  status: 'passed' | 'intercepted' | 'warning' | 'skipped';
  detail: string;
  durationMs: number;
}

export interface ShadowReviewItem {
  id: string;
  sessionId: string;
  channel: ChannelPlatform;
  senderDisplay: string;
  userMessage: string;
  proposedReply: string;
  timestamp: string;
  confidenceScore: number; // 0.0 - 1.0
  riskLevel: 'safe' | 'medium_risk' | 'high_redline';
  status: 'pending' | 'approved' | 'rejected' | 'modified';
  deterministicRuleApplied?: string;
  auditNote?: string;
  editedReply?: string;
}

export interface ChannelGatewayTelemetry {
  pingMs: number;
  jitterMs: number;
  packetLossPct: number;
  throughputKbs: number;
  webhookAckRatePct: number;
  keepAliveSec: number;
  protocol: string;
  healthScore: number;
  lastPulseAt: string;
  dnsResolutionMs?: number;
  tlsHandshakeMs?: number;
}

export interface ChannelGatewayStatus {
  id: ChannelPlatform;
  displayName: string;
  status: 'active' | 'standby' | 'disconnected';
  method: string;
  latencyMs: number;
  unprocessedQueue: number;
  lastHeartbeat: string;
  telemetry?: ChannelGatewayTelemetry;
}

export type LatencyHealthLevel = 'optimal' | 'stable' | 'warning' | 'critical';

export interface LatencyHealthDetails {
  level: LatencyHealthLevel;
  label: string;
  persianLabel: string;
  iconColorClass: string;
  containerBgClass: string;
  containerBorderClass: string;
  statusDotClass: string;
  badgeClass: string;
  cardBorderHighlight: string;
  isAlert: boolean;
}

export interface GatewayPulseConfig {
  enabled: boolean;
  gateways: Record<ChannelPlatform, boolean>;
  refreshIntervalSec: number;
  alertOnJitterThresholdMs: number;
  lastCheckedAt?: string;
}

export type GatewayAuditEventType =
  | 'heartbeat'
  | 'status_change'
  | 'latency_alert'
  | 'config_change';

export type GatewayAuditSeverity = 'info' | 'success' | 'warning' | 'critical';

export interface GatewayAuditEvent {
  id: string;
  timestamp: string;
  timeFormatted: string;
  dateFormatted: string;
  channelId: ChannelPlatform | 'all';
  channelName: string;
  eventType: GatewayAuditEventType;
  severity: GatewayAuditSeverity;
  summary: string;
  details?: string;
  latencyMs?: number;
  jitterMs?: number;
  healthLevel?: LatencyHealthLevel;
  previousStatus?: string;
  newStatus?: string;
  packetLossPct?: number;
  webhookAckRatePct?: number;
  triggeredBy?: 'system_heartbeat' | 'manual_ping' | 'spike_simulation' | 'operator_toggle' | 'inbound_webhook';
  metadata?: Record<string, any>;
}

export interface GatewayAuditStats {
  totalEvents: number;
  heartbeats: number;
  statusChanges: number;
  latencyAlerts: number;
  configChanges: number;
}

export interface WorkLedgerItem {
  id: string;
  title: string;
  domainCategory: 'Executive' | 'Operations' | 'Clinical' | 'Personal';
  summary: string;
  activeContext: string;
  tasksPending: number;
  lastUpdated: string;
  tokenLoad: string;
}

export interface McpIntegrationItem {
  id: string;
  name: string;
  type: 'MCP_STDIO' | 'ACCOUNT_PROXY' | 'DIRECT_API' | 'DETERMINISTIC_ENGINE';
  endpointOrCommand: string;
  capabilities: string[];
  status: 'ready' | 'idle' | 'warning';
  authType: 'codex_account' | 'api_key' | 'token';
}

// ----------------------------------------------------
// ENCRYPTED CREDENTIALS & AGENT AUTH VAULT TYPES
// ----------------------------------------------------

export type AuthCredentialService = 'github' | 'notion' | 'openai';

export interface AuthCredentialItem {
  id: string;
  service: AuthCredentialService;
  label: string;
  agentId: string;
  agentName: string;
  taskScope: string;
  maskedSecret: string;
  envKeyName: string;
  encryptionAlgorithm: 'AES-256-GCM';
  ivPreview: string;
  authTagPreview: string;
  cipherHashPreview: string;
  createdAt: string;
  lastUsed?: string;
  status: 'active' | 'revoked' | 'untested';
}

export interface AuthVaultStatus {
  masterKeyConfigured: boolean;
  algorithm: 'AES-256-GCM';
  totalEncryptedCredentials: number;
  environmentFileStatus: 'synced' | 'pending';
  lastEncryptedAt: string;
}

// ----------------------------------------------------
// EVOLUTION API & WHATSAPP ANTI-BAN ARCHITECTURE
// ----------------------------------------------------

export type WhatsAppInstanceMode = 'personal_notebook' | 'pharmacy_inbound';

export interface EvolutionAntiBanConfig {
  strictInboundOnly: boolean; // First message must be sent by user/patient
  persistLedgerFirst: boolean; // Must record to work ledger before generating response
  humanJitterMinSec: number; // 2s
  humanJitterMaxSec: number; // 5s
  simulateComposingPresence: boolean; // Send WhatsApp composing presence
  dailyRateLimit: number; // 200 messages/day
  messagesSentToday: number;
}

export interface EvolutionInstanceState {
  instanceName: string;
  status: 'connected' | 'connecting' | 'qrcode_ready' | 'disconnected';
  mode: WhatsAppInstanceMode;
  connectedPhone?: string;
  pairingCode?: string;
  qrCodeData?: string;
  qrExpiresInSec?: number;
  antiBan: EvolutionAntiBanConfig;
  lastInboundAt?: string;
  lastPersistedLedgerId?: string;
}

// ----------------------------------------------------
// GLOBAL DATA PRIVACY & RETENTION POLICY
// ----------------------------------------------------

export type DataRetentionPolicy = 'audited' | 'ephemeral';

export interface GlobalPrivacySettings {
  retentionPolicy: DataRetentionPolicy;
  highPrivacyBotTypes: string[];
  scrubSensitiveMedicalNotes: boolean;
  ephemeralSessionsCount: number;
  loggedSessionsCount: number;
  lastToggledAt: string;
}


