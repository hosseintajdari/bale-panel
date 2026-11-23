# Working rules (owner)
- Infer intent from the request and context; never ask for a rephrase. Take safe, reversible defaults instead of asking; ask ONE short question only when only the owner can decide.
- Plan in 3 lines or fewer, then execute in the same turn. Verify with real checks (tests, grep) before calling anything done; report evidence.
- Small commits; push at session end; never force-push main. Handoffs go in TASKS.md or SESSION-REPORT.md.
- Work only inside this repo. Never commit data/, secrets, tokens, cookies, or local state.
- After two failed attempts with one approach, change the approach.
- Close out with a short summary: what changed, the evidence, what remains.

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

## 4. Work Tracking and GitHub Evidence
- Before non-trivial code, configuration, deployment, or documentation work, locate an existing GitHub Issue or create one. State the scope, acceptance evidence, deployment target (local, `ct`, `balemed`, mobile, or ChatGPT workspace), and any human-approval or safety boundary.
- Use a focused branch and pull request for changes intended for the shared remote. Commit messages must describe the actual change and reference the Issue when one exists (for example, `Refs #123`). A pushed commit is not a substitute for an Issue or PR.
- Do not silently commit directly to `main`. An exception is permitted only for a tiny, reversible emergency fix when the user explicitly directs it; record the reason, validation, and a follow-up Issue in the commit or immediately afterward.
- For server work, do not put secrets, raw user messages, patient data, tokens, or private network details in commits, PRs, Issues, logs, or screenshots. Record only the target host, non-sensitive release identifier, commands/tests at a high level, observed result, rollback point, and what remains unverified.
- For mobile, ChatGPT-workspace, Cursor, Codex, or other-agent work, create or update the same Issue with the repository/branch (if any), artifact or commit link, validation result, and ownership. Never claim that another agent's change is verified merely because it is mentioned in chat.
- Before declaring work complete, update the Issue/PR with the final commit(s), tests/checks actually run, deployment status, uncertainties, and one safe next action. Close the Issue only when its acceptance criteria are met.

