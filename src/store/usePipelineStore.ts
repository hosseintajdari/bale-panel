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

  addToQueue: (record) =>
    set((state) => ({ shadowQueue: [record, ...state.shadowQueue] })),

  updateQueueItem: (id, patch) =>
    set((state) => ({
      shadowQueue: state.shadowQueue.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    })),

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
    try {
      const res = await authFetch('/api/pipeline/state');
      const data = await res.json();
      if (data.shadowQueue) {
        set({ shadowQueue: data.shadowQueue });
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
