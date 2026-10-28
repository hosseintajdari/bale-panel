# Embednet OS — Management Panel & Modular Middleware

Embednet OS is an executive management console and modular middleware for orchestrating multi-channel messaging flows (WhatsApp, Bale, Telegram, SMS), human-in-the-loop (HITL) shadow review queues, deterministic domain safety rules, and encrypted credential vault storage.

---

## Architectural Principles

1. **Separation of Concerns**:
   - **End-Users**: Converse strictly inside their preferred messenger (WhatsApp, Bale, Telegram). Zero panel dependency.
   - **System Administrators / Pharmacists**: Supervise, inspect logs, approve AI drafts, and manage integrations via the Apple Glassmorphic web panel.
2. **Channel-Neutral Ingestion**:
   - Webhooks are normalized into unified messages before routing through domain filters and shadow evaluation.
3. **Deterministic First, Probabilistic Second**:
   - Hard rules (safety gates, pricing, redlines) run before or alongside LLM inference to eliminate hallucinations.
4. **Zero-Trust Credential Security**:
   - Secrets and tokens are encrypted at rest with AES-256-GCM and never leaked in API payloads or version control.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons (Apple Dark Glassmorphism UI).
- **Backend / Middleware**: Node.js, Express, TypeScript (`tsx`).
- **Security**: AES-256-GCM Vault, Bearer token authentication on `/api/admin/*`.
- **Integrations**: Evolution API (WhatsApp), Bale Bot API, Telegram Bot API, Google Gemini.

---

## Quick Start

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn

### 2. Setup Environment
```bash
cp .env.example .env
```
Fill in the required values inside `.env`:
- `GEMINI_API_KEY`: Google Gemini API key.
- `PANEL_API_SECRET`: Secret key for protecting administrative endpoints.
- `VAULT_MASTER_KEY`: 32-byte hex key for encrypting stored credentials.

*(Tip: Generate strong keys with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)*

### Webhook authentication & registration

Before exposing `POST /webhook/evolution`, set `EVOLUTION_WEBHOOK_SECRET` to a random value and configure Evolution to send the same value in the `x-evolution-webhook-secret` HTTP header. Requests with a missing, invalid, or unconfigured secret are rejected with `403`; the pipeline never processes them. Do not reuse `EVOLUTION_API_KEY` for this purpose.

Before exposing `POST /webhook/bale`, set `BALE_WEBHOOK_SECRET` to a random value and configure Bale to send the same value in the `x-telegram-bot-api-secret-token` HTTP header. Requests with a missing, invalid, or unconfigured secret are rejected with `403`; the pipeline never processes them.

Webhook registration (`POST /api/admin/bale/set-webhook`) uses `BALE_WEBHOOK_SECRET` as its single source of truth. If the secret is unset or if the registration request supplies a mismatched secret, registration fails with `400` before making any provider/API call.

If the deployed Evolution version cannot add a static callback header or generate a documented signature, keep this endpoint private behind a mutually authenticated reverse proxy or equivalent network control.

### 3. Install & Run
```bash
npm install
npm run dev
```

The web console will be accessible at `http://localhost:5173` (or configured port).

---

## Project Structure

```
├── docs/                 # Architectural handoffs, security fixes, ADRs
│   ├── HANDOFF_EMBEDNET_OS.md
│   └── HANDOFF_SECURITY_FIXES.md
├── src/
│   ├── components/       # Apple Glass UI components (Header, Channels, Pipeline, Shadow, etc.)
│   ├── data/             # Bot templates, memory models, prompt presets
│   ├── utils/            # Health alerts, metrics helpers
│   ├── App.tsx           # Primary console application
│   └── types.ts          # Unified envelope and state types
├── server.ts             # Express middleware, pipeline engine, encrypted vault, admin routes
├── AGENTS.md             # AI Agent invariants, system boundaries, and design guidelines
├── CONTRIBUTING.md       # Contribution policies and testing instructions
├── SECURITY.md           # Security invariants and vulnerability reporting
└── .env.example          # Safe environment template
```

---

## Security & Compliance

See [SECURITY.md](SECURITY.md) for details on zero-credential policies and vulnerability disclosure.
