# Contributing Guidelines

## Overview

We welcome contributions to `bale-panel` (Embednet OS). Please follow these guidelines to maintain architectural integrity, safety invariants, and code hygiene.

## Principles

1. **System & Safety Invariants**:
   - High-risk domain actions require approval or deterministic rules (HITL / Shadow Review mode).
   - Ingest adapters must normalize incoming channel data into channel-neutral envelopes (`UnifiedMessage`).
   - Outbox dispatchers must remain decoupled from core domain and routing logic.

2. **Secrets & Privacy**:
   - Do NOT commit sensitive data, tokens, live credentials, or personal messages.
   - Run tests with synthetic data only.

3. **Development Workflow**:
   - Create a feature branch for changes.
   - Verify linting and build (`npm run build`) before submitting pull requests.
   - Ensure environment variables are documented in `.env.example`.
