import type { ShadowRecord } from "../../lib/db/database.js";

export type PipelineChannel = "whatsapp" | "bale" | "telegram" | "sms";

export interface PipelineTraceStep {
  stage: string;
  title: string;
  status: "passed" | "warning" | "intercepted" | "failed";
  detail: string;
  durationMs: number;
}

export interface PipelineResult {
  record: ShadowRecord;
  trace: PipelineTraceStep[];
}
