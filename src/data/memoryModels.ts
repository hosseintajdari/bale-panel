import { StructuredNote, ConversationStage, MemoryDatabaseLayer, MemoryBenchmarkMetric } from '../types';

export const CONVERSATION_STAGES: ConversationStage[] = [
  {
    id: 'stage-capture',
    code: 'STAGE_CAPTURE',
    name: '1. Fast Capture & Ingestion',
    description: 'Rapid intake of messy stream-of-consciousness thoughts, voice audio transcripts, meeting rambles, and telegram forwards.',
    color: '#3B82F6',
    activeContext: 'User is dumping initial raw thoughts. Focus on active listening, extracting core intent, and minimizing conversational friction.',
    keyGoals: [
      'Parse unstructured timestamps, names, deadlines',
      'Filter conversational filler and transcribe audio',
      'Assign preliminary categorization tag'
    ],
    suggestedPrompt: 'Take note: Team sync with Sarah and David. Need to finish the Gemini 3.7 migration by Friday. David handles database indexing.'
  },
  {
    id: 'stage-synthesis',
    code: 'STAGE_SYNTHESIS',
    name: '2. Expansion & Structuring',
    description: 'Gemini expands sparse notes into executive summaries, background context, risks, and structured action items with assignees.',
    color: '#8B5CF6',
    activeContext: 'Transform raw inputs into structured documentation. Identify missing details, ask clarifying questions, and generate entity graph.',
    keyGoals: [
      'Extract High/Medium/Low priority action items',
      'Map entities (people, tools, dates, dependencies)',
      'Generate bulleted executive summary & markdown'
    ],
    suggestedPrompt: 'Expand our discussion about shifting from REST to WebSockets for real-time Telegram bot responses.'
  },
  {
    id: 'stage-execution',
    code: 'STAGE_EXECUTION',
    name: '3. Task & Action Execution',
    description: 'Track deliverables, send proactive reminder pings on WhatsApp/Telegram, and update status of pending note commitments.',
    color: '#10B981',
    activeContext: 'Action-oriented mode. Check off completed items, schedule follow-ups, and alert on impending deadlines.',
    keyGoals: [
      'Query SQLite/PostgreSQL for pending tasks',
      'Provide daily/weekly standup summaries',
      'Flag overdue deliverables'
    ],
    suggestedPrompt: 'What action items are pending for David from our backend sync notes?'
  },
  {
    id: 'stage-knowledge-recall',
    code: 'STAGE_RECALL',
    name: '4. Semantic Recall & Knowledge Graph',
    description: 'Cosine similarity vector search across all historical notes and memory nodes to answer cross-session contextual queries.',
    color: '#F59E0B',
    activeContext: 'User is querying past decisions or historical knowledge. Perform semantic vector retrieval (pgvector/sqlite-vec) and synthesize findings.',
    keyGoals: [
      'Sub-5ms semantic similarity retrieval',
      'Synthesize context across multiple meetings',
      'Explain rationale behind past architectural decisions'
    ],
    suggestedPrompt: 'Recall what we decided about Redis caching vs in-memory LRU in last week\'s architecture review.'
  }
];

export const INITIAL_STRUCTURED_NOTES: StructuredNote[] = [
  {
    id: 'note-001',
    title: 'Gemini 3.7 Migration & High-Performance Node Architecture',
    rawInput: 'Quick sync with Sarah and Alex: need to upgrade bot server to @google/genai SDK with gemini-3.7-flash before Friday. Alex will set up pgvector on PostgreSQL for long term memory. Need to keep p99 latency under 200ms.',
    category: 'Engineering',
    tags: ['#Gemini37', '#NodeJS', '#pgvector', '#Latency'],
    summary: 'Executive roadmap for upgrading production bot middleware to Gemini 3.7 Flash and establishing a pgvector-backed semantic memory database.',
    expandedContent: `### Architectural Decision Record (ADR)
- **Primary Model**: \`gemini-3.7-flash\` via the modern \`@google/genai\` SDK.
- **Memory Subsystem**: Dual-tier storage with L1 Redis cache (<1ms) and L2 PostgreSQL + pgvector for semantic knowledge retrieval.
- **SLA Target**: p99 round-trip latency under 200ms across Telegram webhook pipelines.

### Next Technical Milestones
1. Refactor server handlers from legacy endpoints to lazy-initialized GoogleGenAI instances.
2. Index conversation embeddings using HNSW index with cosine distance.
3. Stress test 5,000 concurrent WhatsApp Webhook payloads.`,
    actionItems: [
      {
        id: 'act-1',
        task: 'Upgrade @google/genai package and migrate systemInstruction configs',
        priority: 'High',
        assignee: 'Sarah',
        dueDate: 'Tomorrow, 5:00 PM',
        completed: true
      },
      {
        id: 'act-2',
        task: 'Provision PostgreSQL with pgvector extension and create HNSW index on note_embeddings',
        priority: 'High',
        assignee: 'Alex',
        dueDate: 'Friday, 12:00 PM',
        completed: false
      },
      {
        id: 'act-3',
        task: 'Benchmark p99 latency with k6 load testing suite',
        priority: 'Medium',
        assignee: 'Alex',
        dueDate: 'Monday',
        completed: false
      }
    ],
    keyEntities: [
      { name: 'Sarah', type: 'Person', context: 'Lead Engineer driving SDK migration' },
      { name: 'Alex', type: 'Person', context: 'Database & Infrastructure Specialist' },
      { name: 'gemini-3.7-flash', type: 'Tool', context: 'Primary multimodal LLM engine' },
      { name: 'pgvector', type: 'Tool', context: 'PostgreSQL vector similarity extension' },
      { name: '200ms', type: 'Metric', context: 'Target p99 latency SLA' }
    ],
    createdAt: '2 hours ago',
    stageContext: 'STAGE_SYNTHESIS',
    similarityScore: 0.96
  },
  {
    id: 'note-002',
    title: 'Customer Onboarding & WhatsApp Business Flow Strategy',
    rawInput: 'Marketing team sync. Users are dropping off at stage 2 of WhatsApp onboarding. We should let Gemini summarize product catalog automatically and send dynamic interactive list buttons.',
    category: 'Product',
    tags: ['#WhatsApp', '#Onboarding', '#Growth', '#UX'],
    summary: 'UX enhancement proposal to streamline WhatsApp bot onboarding using automated catalog summarization and interactive quick-reply menus.',
    expandedContent: `### Problem Statement
Funnel analytics indicate a 28% drop-off rate during step 2 of customer registration when prompted for free-form business info.

### Proposed Solution
- Implement Gemini-driven adaptive parsing: accept voice notes or messy unstructured text and let the bot auto-fill the customer profile.
- Return WhatsApp interactive list messages instead of lengthy plain text blocks.`,
    actionItems: [
      {
        id: 'act-4',
        task: 'Design interactive WhatsApp list templates for Meta Cloud API',
        priority: 'Medium',
        assignee: 'Elena',
        dueDate: 'Next Wednesday',
        completed: false
      },
      {
        id: 'act-5',
        task: 'Add voice note transcription pipeline with Gemini Multimodal input',
        priority: 'High',
        assignee: 'Sarah',
        dueDate: 'This Thursday',
        completed: false
      }
    ],
    keyEntities: [
      { name: 'Elena', type: 'Person', context: 'Product Designer' },
      { name: 'Meta Cloud API', type: 'Tool', context: 'Official WhatsApp messaging API' },
      { name: '28%', type: 'Metric', context: 'Current onboarding drop-off rate' }
    ],
    createdAt: 'Yesterday',
    stageContext: 'STAGE_CAPTURE',
    similarityScore: 0.88
  }
];

export const MEMORY_DATABASE_LAYERS: MemoryDatabaseLayer[] = [
  {
    layer: 'L1_HOT_CACHE',
    technology: 'Redis 7 / In-Memory LRU Map',
    latency: '0.4ms - 1.2ms',
    capacity: 'Recent 50 exchanges / Active Stage Session',
    purpose: 'Instant context hydration before invoking Gemini. Stores active workflow stage state machine, rate limits, and short-term dialogue window.',
    bestFor: 'High-frequency webhook handlers in Node.js (Telegram & WhatsApp webhook bursts).',
    indexingMethod: 'Key-Value (O(1)) with TTL expiration (12-24 hours)'
  },
  {
    layer: 'L2_VECTOR_SEMANTIC',
    technology: 'PostgreSQL + pgvector / sqlite-vec (HNSW Index)',
    latency: '3.5ms - 8.0ms',
    capacity: '1,000,000+ Note Chunks & Conversation Memories',
    purpose: 'Semantic similarity search. Embeds user notes and historical messages using text-embedding-004 to recall past stages, decisions, and relevant context.',
    bestFor: 'Cross-session memory recall, answering "What did we decide?", and intelligent note retrieval.',
    indexingMethod: 'HNSW / IVFFlat (Cosine Similarity <=> Distance)'
  },
  {
    layer: 'L3_RELATIONAL_ACID',
    technology: 'PostgreSQL 16 / SQLite (WAL mode)',
    latency: '1.5ms - 4.0ms',
    capacity: 'Terabytes of structured records',
    purpose: 'ACID-compliant storage for users, structured notes, action items, assignees, stage audit logs, and entity relational graphs.',
    bestFor: 'Task status updates, SQL reporting, filtered querying by priority/dates/tags.',
    indexingMethod: 'B-Tree indexes on user_id, stage_id, created_at, is_completed'
  }
];

export const MEMORY_BENCHMARK_METRICS: MemoryBenchmarkMetric[] = [
  {
    metric: 'Context Lookup Latency (p99)',
    redisL1: '0.8 ms',
    sqliteVector: '2.4 ms',
    pgvectorL2: '6.1 ms',
    cloudRestApi: '120.0 ms'
  },
  {
    metric: 'Max Queries Per Second (QPS)',
    redisL1: '95,000 / sec',
    sqliteVector: '18,500 / sec',
    pgvectorL2: '8,200 / sec',
    cloudRestApi: '450 / sec'
  },
  {
    metric: 'Memory Recall Accuracy / Precision',
    redisL1: 'Exact Match',
    sqliteVector: '97.4% (Cosine)',
    pgvectorL2: '98.8% (HNSW Cosine)',
    cloudRestApi: '89.2%'
  },
  {
    metric: 'Token Cost Reduction (%)',
    redisL1: 'N/A (Windowed)',
    sqliteVector: '78% Token Savings',
    pgvectorL2: '84% Token Savings',
    cloudRestApi: '40% Token Savings'
  }
];

export const SQL_SCHEMA_PGVECTOR = `-- ==========================================================
-- HIGH-PERFORMANCE HYBRID MEMORY & STRUCTURED NOTE SCHEMA
-- PostgreSQL 16 + pgvector (HNSW Indexing) for Gemini Bots
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. User & Bot Platform State
CREATE TABLE IF NOT EXISTS bot_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform VARCHAR(20) NOT NULL, -- 'telegram' | 'whatsapp'
  platform_user_id VARCHAR(100) NOT NULL UNIQUE,
  username VARCHAR(100),
  display_name VARCHAR(150),
  current_stage VARCHAR(50) DEFAULT 'STAGE_CAPTURE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Structured Notes Engine (Expanded by Gemini)
CREATE TABLE IF NOT EXISTS structured_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES bot_users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  raw_input TEXT NOT NULL,
  summary TEXT NOT NULL,
  expanded_content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'General',
  tags TEXT[] DEFAULT '{}',
  stage_at_creation VARCHAR(50) NOT NULL,
  embedding vector(768), -- text-embedding-004 output dimension
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- High-performance HNSW vector index for sub-5ms semantic search
CREATE INDEX IF NOT EXISTS idx_notes_vector_hnsw 
ON structured_notes USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 3. Action Items Extracted from Notes
CREATE TABLE IF NOT EXISTS note_action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID REFERENCES structured_notes(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'Medium', -- 'High' | 'Medium' | 'Low'
  assignee VARCHAR(100),
  due_date TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_items_due ON note_action_items(due_date, is_completed);

-- 4. Conversation Stage & Decision Memory Log (Helps Agent Remember Context)
CREATE TABLE IF NOT EXISTS conversation_stage_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES bot_users(id) ON DELETE CASCADE,
  stage_code VARCHAR(50) NOT NULL,
  decision_summary TEXT NOT NULL,
  context_metadata JSONB DEFAULT '{}',
  embedding vector(768),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Semantic Memory Retrieval Function
CREATE OR REPLACE FUNCTION match_user_notes(
  p_user_id UUID,
  query_embedding vector(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  summary TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.summary,
    1 - (n.embedding <=> query_embedding) AS similarity
  FROM structured_notes n
  WHERE n.user_id = p_user_id
    AND 1 - (n.embedding <=> query_embedding) > match_threshold
  ORDER BY n.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;`;

export const SQL_SCHEMA_SQLITE = `-- ==========================================================
-- ULTRA-LIGHTWEIGHT SQLITE EMBEDDED MEMORY & NOTE SCHEMA
-- Ideal for zero-dependency local Node.js bot deployments (better-sqlite3)
-- ==========================================================

PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  platform_id TEXT UNIQUE NOT NULL,
  current_stage TEXT DEFAULT 'STAGE_CAPTURE',
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  raw_input TEXT NOT NULL,
  summary TEXT NOT NULL,
  expanded_content TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  tags TEXT DEFAULT '[]', -- JSON Array
  stage_context TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS action_items (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  task TEXT NOT NULL,
  priority TEXT DEFAULT 'Medium',
  assignee TEXT,
  due_date TEXT,
  completed INTEGER DEFAULT 0,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS memory_decisions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  stage_code TEXT NOT NULL,
  key_fact TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_pending ON action_items(completed, priority);
`;
