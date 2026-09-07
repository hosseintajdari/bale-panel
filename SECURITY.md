# Security Policy

## Overview

`bale-panel` (Embednet OS Web Console & Modular Middleware) handles system integrations, channel orchestration, and shadow evaluation.
This repository strictly enforces zero credentials in version control.

## Secrets and Credentials Protection

1. **Never Commit Secrets**: Never commit `.env`, private keys, API keys (`GEMINI_API_KEY`, `PANEL_API_SECRET`, `VAULT_MASTER_KEY`), or messenger bot tokens.
2. **Encrypted Vault Storage**: All external credentials are encrypted at rest using AES-256-GCM via the master vault key.
3. **Environment Separation**: Always use `.env.example` as a template. Local values belong strictly in unversioned `.env`.
4. **Access Control**: Administrative routes (`/api/admin/*`) require a valid `Bearer <PANEL_API_SECRET>` token.

## Reporting a Vulnerability

If you discover a security vulnerability or accidental credential exposure:

- **Do NOT open a public issue.**
- Report privately to the repository owner via GitHub or authorized private channels.
- Provide a clear description of the vulnerability, affected components, reproduction steps, and potential mitigations.
