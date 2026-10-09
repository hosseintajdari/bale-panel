import { create } from 'zustand';
import { ChannelPlatform, ShadowReviewItem, PipelineTraceStep } from '../types';
import { authFetch } from '../utils/api';

interface PipelineState {
  environmentMode: 'shadow' | 'live';
  activeSessionId: string;
  shadowQueue: ShadowReviewItem[];
  latestPipelineTrace: PipelineTraceStep[] | null;
  latestPipelineRecord: ShadowReviewItem | null;

  setEnvironmentMode: (mode: 'shadow' | 'live') => void;
  setActiveSessionId: (id: string) => void;
  setShadowQueue: (queue: ShadowReviewItem[]) => void;
  /** SSE: prepend a new record received from the stream */
  addToQueue: (record: ShadowReviewItem) => void;
  /** SSE: partially update an existing record by id */
  updateQueueItem: (id: string, patch: Partial<ShadowReviewItem>) => void;
  setLatestPipelineTrace: (trace: PipelineTraceStep[] | null) => void;
  setLatestPipelineRecord: (record: ShadowReviewItem | null) => void;

  processMessage: (channel: ChannelPlatform, senderDisplay: string, text: string) => Promise<void>;
  handleShadowAction: (id: string, action: 'approve' | 'reject' | 'modify', editedReply?: string) => Promise<void>;
  fetchInitialState: () => Promise<void>;
}

// Tracks record ids with local updates (SSE events, operator actions) so a stale
// in-flight poll snapshot can't clobber them (#64).
const localWriteAt = new Map<string, number>();
const LOCAL_WRITE_TTL_MS = 60_000;

function markLocalWrite(id: string): void {
  localWriteAt.set(id, Date.now());
}

function pruneLocalWrites(now: number): void {
  for (const [id, at] of localWriteAt) {
    if (now - at > LOCAL_WRITE_TTL_MS) localWriteAt.delete(id);
  }
}

/**
 * Merge a poll snapshot into the local queue by id (upsert) instead of
 * wholesale-replacing it. The local record wins when it was updated after the
 * poll started (an SSE patch or operator action racing the poll); local-only
 * records with recent writes are preserved, everything else follows the snapshot.
 */
function mergeQueue(
  local: ShadowReviewItem[],
  incoming: ShadowReviewItem[],
  pollStartedAt: number
): ShadowReviewItem[] {
  pruneLocalWrites(pollStartedAt);
  const localById = new Map(local.map((r) => [r.id, r]));
  const merged: ShadowReviewItem[] = [];
  for (const rec of incoming) {
    const existing = localById.get(rec.id);
    const writtenAt = localWriteAt.get(rec.id) ?? 0;
    merged.push(existing && writtenAt >= pollStartedAt ? existing : rec);
    localById.delete(rec.id);
  }
  for (const rec of localById.values()) {
    if (localWriteAt.has(rec.id)) {
      merged.unshift(rec);
    }
  }
  return merged;
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  environmentMode: 'shadow',
  activeSessionId: 'tg-gateway-migration',
  shadowQueue: [],
  latestPipelineTrace: null,
  latestPipelineRecord: null,

  setEnvironmentMode: (mode) => set({ environmentMode: mode }),
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  setShadowQueue: (queue) => set({ shadowQueue: queue }),
  setLatestPipelineTrace: (trace) => set({ latestPipelineTrace: trace }),
  setLatestPipelineRecord: (record) => set({ latestPipelineRecord: record }),

  addToQueue: (record) => {
    markLocalWrite(record.id);
    set((state) => ({ shadowQueue: [record, ...state.shadowQueue] }));
  },

  updateQueueItem: (id, patch) => {
    markLocalWrite(id);
    set((state) => ({
      shadowQueue: state.shadowQueue.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
  },

  processMessage: async (channel, senderDisplay, text) => {
    const { activeSessionId, environmentMode } = get();
    try {
      const res = await authFetch('/api/pipeline/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          senderId: activeSessionId,
          senderDisplay,
          text,
          environmentMode,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.shadowRecord) {
          set((state) => ({
            shadowQueue: [data.shadowRecord, ...state.shadowQueue],
            latestPipelineRecord: data.shadowRecord,
          }));
        }
        if (data.trace) {
          set({ latestPipelineTrace: data.trace });
        }
      }
    } catch (err) {
      console.error('Pipeline process error:', err);
    }
  },

  handleShadowAction: async (id, action, editedReply) => {
    try {
      const res = await authFetch('/api/pipeline/shadow/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, editedReply }),
      });
      const data = await res.json();
      if (data.success) {
        markLocalWrite(id);
        set((state) => ({
          shadowQueue: state.shadowQueue.map((item) =>
            item.id === id ? { ...item, ...data.item } : item
          ),
        }));
      }
    } catch (err) {
      console.error('Shadow action failed:', err);
    }
  },

  fetchInitialState: async () => {
    const pollStartedAt = Date.now();
    try {
      const res = await authFetch('/api/pipeline/state');
      const data = await res.json();
      if (data.shadowQueue) {
        set((state) => ({
          shadowQueue: mergeQueue(state.shadowQueue, data.shadowQueue, pollStartedAt),
        }));
      }
      if (data.latestPipelineTrace) {
        set({ latestPipelineTrace: data.latestPipelineTrace });
      }
      if (data.latestPipelineRecord) {
        set({ latestPipelineRecord: data.latestPipelineRecord });
      }
    } catch (err) {
      console.debug('Pipeline initial state fetch error:', err);
    }
  },
}));
