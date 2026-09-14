import React, { useState, memo } from 'react';
import {
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Terminal,
} from 'lucide-react';
import { usePipelineStore } from '../store/usePipelineStore';
import { PersianPayloadCard } from './PersianPayloadCard';

interface PipelineConsoleProps {
  onOpenShadowReview: () => void;
}

export const PipelineConsole = memo<PipelineConsoleProps>(({
  onOpenShadowReview,
}) => {
  const [isTraceOpen, setIsTraceOpen] = useState(false);
  // Select stable store values independently. Returning a new object here makes
  // Zustand's React subscription see every render as a changed snapshot.
  const latestTrace = usePipelineStore((state) => state.latestPipelineTrace);
  const latestRecord = usePipelineStore((state) => state.latestPipelineRecord);

  return (
    <div className="space-y-3 h-full flex flex-col justify-end">
      {/* Dynamic Inspector */}
      <div className={`grid grid-cols-1 ${isTraceOpen ? 'lg:grid-cols-12' : 'lg:grid-cols-1'} gap-3`}>
        
        {/* Left: Execution Trace (Collapsible) */}
        {isTraceOpen && (
          <div className="lg:col-span-7 bg-[#0A0C10] border border-[#1C202B] rounded-xl p-3.5 shadow-sm space-y-2.5 flex flex-col max-h-[300px]">
            <div className="flex items-center justify-between pb-2 border-b border-[#1C202B]">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                <h3 className="text-xs font-medium text-zinc-200">Execution Trace</h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                {latestTrace ? `${latestTrace.length} stages completed` : 'Awaiting execution'}
              </span>
            </div>

            <div className="space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
              {(latestTrace || [
                { stage: 'GATEWAY_INGEST', title: 'Gateway Ingest & Signature', status: 'passed', detail: 'Header verification & token validated', durationMs: 2 },
                { stage: 'ENVELOPE_NORMALIZE', title: 'Normalize UnifiedMessage', status: 'passed', detail: 'Messenger-agnostic envelope wrapping', durationMs: 1 },
                { stage: 'DETERMINISTIC_RULES', title: 'Deterministic Rules & Redlines', status: 'passed', detail: 'Catalog check & redlines passed', durationMs: 4 },
                { stage: 'SHADOW_EVALUATION', title: 'Shadow Mode Evaluation', status: 'warning', detail: 'BALE_LLM_MODE=shadow (Queued for review)', durationMs: 3 },
              ]).map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs"
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {step.status === 'passed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {step.status === 'intercepted' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
                      {step.status === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div>
                      <div className="font-medium text-zinc-200">{step.title}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5 font-mono">{step.detail}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.5 rounded bg-white/[0.04]">
                    {step.durationMs}ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right: Response Preview */}
        <div className={`${isTraceOpen ? 'lg:col-span-5' : 'col-span-1 lg:max-w-4xl mx-auto w-full'} bg-[#0A0C10] border border-[#1C202B] rounded-xl p-3.5 shadow-sm flex flex-col justify-between space-y-3`}>
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#1C202B] mb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <h3 className="text-xs font-medium text-zinc-200">Response Preview</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTraceOpen(!isTraceOpen)}
                  className="px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Terminal className="w-3 h-3" />
                  {isTraceOpen ? 'Hide Trace' : 'Show Trace'}
                </button>
                {latestRecord && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    latestRecord.riskLevel === 'safe'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : latestRecord.riskLevel === 'high_redline'
                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}>
                    {latestRecord.riskLevel === 'safe' ? 'SAFE' : latestRecord.riskLevel === 'high_redline' ? 'REDLINE' : 'MODERATE'}
                  </span>
                )}
              </div>
            </div>

            <PersianPayloadCard content={latestRecord?.proposedReply || ''} />

            {latestRecord?.deterministicRuleApplied && (
              <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-1.5 font-mono">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>Deterministic: {latestRecord.deterministicRuleApplied}</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[#1C202B] flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 font-mono">
              Status: <span className="text-zinc-300">{latestRecord?.status === 'approved' ? 'Approved (Live)' : 'Queued (Shadow)'}</span>
            </span>

            <button
              onClick={onOpenShadowReview}
              className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Shadow Queue</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
});

PipelineConsole.displayName = 'PipelineConsole';
