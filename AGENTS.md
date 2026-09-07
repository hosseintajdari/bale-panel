# User Profile & System Design Guidelines (Persona & Mental Model)

## 1. Role & Identity
- **User Role**: System & Product Designer (طراح سیستم و محصول). Prioritizes system boundaries, real user personas, product-market fit, and operational maintainability over fragile raw code.
- **Assistant Role**: Strategic Systems Architect & Lead Engineer aligned with the user's high-level domain models, ADRs, clinical safety requirements, and Embednet OS product vision.

## 2. Platform & Messaging Priorities
1. **Primary Target**: WhatsApp (End-user facing surface, inspired by proven prior art such as India WhatsApp Pharmacy automation).
2. **Secondary Target**: Bale (بله) & Telegram (due to architectural similarity, bot API compatibility, and local accessibility).
3. **Tertiary / Fallback**: Iranian local messengers & SMS gateways (پنل پیامکی).
4. **Interaction Separation**:
   - **End-Users**: Converse strictly inside WhatsApp / Messengers (zero panel dependency).
   - **System Owner / Admin / Pharmacist**: Controls, monitors, audits, annotates, and configures everything via a Web Management Panel (similar to LangBot / Shadow Review UI).
   - **External Clients / Stakeholders**: Can be granted selective panel access (e.g., automated tools like bale-auto).

## 3. Architecture & Ecosystem Preferences (Embednet OS)
- **Middleware Layer**: LangBot-inspired modular middleware (Pipelines, Universal Adapters, decoupled from direct messaging fragile sockets). Avoid OpenClaw-like fragility, state collapses, and maintenance burdens.
- **Extensibility & Integrations**:
  - Support for **Plugins**, **MCP (Model Context Protocol)**, and **Tools**.
  - Dual AI consumption: Direct API keys (Gemini, etc.) AND Account/Subscription interfaces (e.g., Codex / Copilot style accounts).
- **Core Domain Patterns & Invariants**:
  - **Shadow Mode & Evaluation** (from `bale-med` ADR 0001/0002): Safe evaluation of AI responses before direct live delivery, review workflows, safety gates (`BALE_LLM_MODE=shadow`).
  - **Pharmacist-in-the-loop / Human-in-the-loop (HITL)**: High-risk decisions (drug dispensing, clinical triage redlines, regulatory pricing) require approval/oversight or deterministic validation.
  - **Deterministic Rules + Probabilistic LLMs**: Pure domain calculation engines for strict rules (pricing calculation `qanoon-price`, TTAC identity, Persian drug fuzzy lexicon) separate from conversational LLMs.
  - **Conversational Work Ledger** (from P0 Sistan project): Context-aware session ledger, synthetic flows, evidence-backed contracts, local persona nuances.
  - **Channel-Neutral Normalized Envelope**: Incoming messages from WhatsApp, Bale, or Telegram are parsed into a unified envelope, run through governance pipelines, and delivered via the appropriate channel outbox without business logic entanglement.

