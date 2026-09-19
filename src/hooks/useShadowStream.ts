import { useEffect, useRef } from 'react';
import { usePipelineStore } from '../store/usePipelineStore';

/**
 * useShadowStream — SSE hook برای دریافت real-time shadow events از سرور
 *
 * به محض mount شدن، یک EventSource باز میکند به /api/pipeline/stream
 * و store را با رویدادهای جدید بهروز میکند.
 *
 * Refs: Issue #8 Phase 6a
 */
export function useShadowStream() {
  const addToQueue = usePipelineStore((s) => s.addToQueue);
  const updateQueueItem = usePipelineStore((s) => s.updateQueueItem);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (esRef.current) return; // already connected

    const es = new EventSource('/api/pipeline/stream');
    esRef.current = es;

    es.addEventListener('shadow-update', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'new' && payload.record) {
          addToQueue(payload.record);
        } else if (payload.type === 'action' && payload.id) {
          updateQueueItem(payload.id, { status: payload.status });
        }
      } catch {
        console.warn('[SSE] Failed to parse shadow-update payload', e.data);
      }
    });

    es.addEventListener('ping', () => {
      // connection alive — no action needed
    });

    es.onerror = () => {
      console.warn('[SSE] Connection lost, will auto-reconnect...');
      esRef.current = null;
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [addToQueue, updateQueueItem]);
}
