# Handoff: Phase 6 — Full Backend Engines Integration
**Date**: September 2026
**Status**: Pending (Next Session)

---

## 1. Core Intent
In Phase 5, `bale-panel` was successfully transformed into a stateless, Hermes-style "Control Tower" UI with Zustand state management.
However, it currently relies on mocked API calls or disconnected endpoints.
The goal of Phase 6 is to physically connect the actual Backend Engines (`bale-med`, `bale-auto`, `Bale-EMS`, `Bale-Med-Prices`) to this panel so that the *Execution Trace* and *Shadow Review Queue* reflect real, live data.

## 2. Execution Method (Step-by-Step)
1. **API Contract Definition**: Define a strict, unified JSON contract (Envelope) for `ShadowReviewItem` and `PipelineTraceStep` that all backend engines must adhere to.
2. **Backend Adaptation**: Go into `bale-med` (for medical/pricing) and `bale-auto` (for ledger/operations) and update their output pipelines to emit this exact JSON format.
3. **Gateway Middleware**: Set up a centralized API Gateway or WebSockets in `bale-panel`'s backend (Node/Next.js) to ingest payloads from the various backend engines.
4. **Remove Mocks**: Replace the current `authFetch` stub responses in `bale-panel/src/utils/api.ts` with real requests to the live backend services.

## 3. Required Skills for Next Session
> [!IMPORTANT]
> The agent working on this must load the following skills:
> - **`senior-architect`**: To design the cross-repository API contracts and ensure microservice decoupling.
> - **`architecture-patterns`**: To implement Ports & Adapters so the Panel doesn't care if data comes from Bale, WhatsApp, or Telegram.
> - **`quality-harness`**: To use the Chain-of-Draft workflow and verify each API endpoint before integrating it into the UI.
> - **`openviking-memory`**: To deeply analyze the existing logic inside `bale-med` and `bale-auto` before modifying them.
