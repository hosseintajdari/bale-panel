import React, { useState, useEffect, useMemo, memo } from 'react';
import {
  History,
  Activity,
  RefreshCw,
  AlertTriangle,
  Search,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import {
  GatewayAuditEvent,
  GatewayAuditStats,
  ChannelPlatform,
} from '../types';
import { authFetch } from '../utils/api';

interface GatewayHistoryTabProps {
  onRefreshChannels?: () => void;
}

export const GatewayHistoryTab = memo<GatewayHistoryTabProps>(({ onRefreshChannels }) => {
  const [events, setEvents] = useState<GatewayAuditEvent[]>([]);
  const [stats, setStats] = useState<GatewayAuditStats>({
    totalEvents: 0,
    heartbeats: 0,
    statusChanges: 0,
    latencyAlerts: 0,
    configChanges: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Quick Status Switch Modal / State
  const [statusChangeChannel, setStatusChangeChannel] = useState<ChannelPlatform>('telegram');
  const [statusChangeTarget, setStatusChangeTarget] = useState<'active' | 'standby' | 'disconnected'>('active');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);

  // Fetch History from Backend
  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedChannel !== 'all') params.append('channel', selectedChannel);
      if (selectedSeverity !== 'all') params.append('severity', selectedSeverity);

      const res = await authFetch(`/api/gateways/history?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to fetch gateway history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedChannel, selectedSeverity]);

  // Trigger manual ping/heartbeat and record audit entry
  const handleManualHeartbeat = async (mode?: 'simulate_spike') => {
    try {
      setIsPinging(true);
      const res = await authFetch('/api/gateways/pulse-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (data.success) {
        if (onRefreshChannels) onRefreshChannels();
        await fetchHistory();
      }
    } catch (err) {
      console.error('Error triggering heartbeat ping:', err);
    } finally {
      setIsPinging(false);
    }
  };

  // Switch channel status and record audit entry
  const handleUpdateStatus = async () => {
    try {
      setIsUpdatingStatus(true);
      const res = await authFetch('/api/gateways/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: statusChangeChannel,
          status: statusChangeTarget,
          reason: 'Manual switch by operator in Audit Ledger',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowStatusModal(false);
        if (onRefreshChannels) onRefreshChannels();
        await fetchHistory();
      }
    } catch (err) {
      console.error('Error updating channel status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Clear Audit Log
  const handleClearHistory = async () => {
    if (!window.confirm('Clear audit ledger history?')) return;
    try {
      const res = await authFetch('/api/gateways/history/clear', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchHistory();
      }
    } catch (err) {
      console.error('Error clearing audit history:', err);
    }
  };

  // Export / Copy to JSON
  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(events, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered in client if searching dynamically
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase().trim();
    return events.filter(
      (ev) =>
        ev.summary.toLowerCase().includes(q) ||
        (ev.details && ev.details.toLowerCase().includes(q)) ||
        ev.channelName.toLowerCase().includes(q) ||
        ev.channelId.toLowerCase().includes(q) ||
        ev.id.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  return (
    <div className="space-y-3 font-sans">
      {/* Top Telemetry Metric Bar (Linear-style 4-column compact strip) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="p-3 rounded-lg bg-[#0A0C10] border border-[#1C202B] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-zinc-500 uppercase">Total Audit Records</div>
            <div className="text-base font-semibold font-mono text-zinc-100">{stats.totalEvents}</div>
          </div>
          <History className="w-4 h-4 text-zinc-500" />
        </div>

        <div className="p-3 rounded-lg bg-[#0A0C10] border border-[#1C202B] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-zinc-500 uppercase">Heartbeat Pulses</div>
            <div className="text-base font-semibold font-mono text-emerald-400">{stats.heartbeats}</div>
          </div>
          <Activity className="w-4 h-4 text-emerald-400/60" />
        </div>

        <div className="p-3 rounded-lg bg-[#0A0C10] border border-[#1C202B] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-zinc-500 uppercase">Status Switches</div>
            <div className="text-base font-semibold font-mono text-sky-400">{stats.statusChanges}</div>
          </div>
          <RefreshCw className="w-4 h-4 text-sky-400/60" />
        </div>

        <div className="p-3 rounded-lg bg-[#0A0C10] border border-[#1C202B] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-zinc-500 uppercase">Latency Alerts</div>
            <div className="text-base font-semibold font-mono text-amber-400">{stats.latencyAlerts}</div>
          </div>
          <AlertTriangle className="w-4 h-4 text-amber-400/60" />
        </div>
      </div>

      {/* Action Toolbar & Filters */}
      <div className="p-3 rounded-lg bg-[#0A0C10] border border-[#1C202B] space-y-2.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit events by summary, channel, ID, or detail..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-black/40 border border-[#1C202B] rounded-md text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-sans"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => handleManualHeartbeat()}
              disabled={isPinging}
              className="px-2.5 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Activity className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Ping</span>
            </button>

            <button
              onClick={() => setShowStatusModal(true)}
              className="px-2.5 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
              <span>Switch Status</span>
            </button>

            <button
              onClick={handleCopyJson}
              className="px-2.5 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedId === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>JSON</span>
            </button>

            <button
              onClick={fetchHistory}
              disabled={isLoading}
              className="p-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Refresh logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleClearHistory}
              className="p-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 transition-colors cursor-pointer"
              title="Clear audit logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-2 border-t border-[#1C202B]">
          <span className="text-zinc-500 font-mono">Gateway:</span>
          {['all', 'whatsapp', 'bale', 'telegram', 'sms'].map((ch) => (
            <button
              key={ch}
              onClick={() => setSelectedChannel(ch)}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer capitalize font-mono ${
                selectedChannel === ch
                  ? 'bg-zinc-100 text-zinc-950 font-medium'
                  : 'bg-white/[0.02] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
              }`}
            >
              {ch}
            </button>
          ))}

          <div className="h-3 w-px bg-[#1C202B] mx-1" />

          <span className="text-zinc-500 font-mono">Severity:</span>
          {['all', 'critical', 'warning', 'info', 'success'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer capitalize font-mono ${
                selectedSeverity === sev
                  ? 'bg-zinc-100 text-zinc-950 font-medium'
                  : 'bg-white/[0.02] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Main Audit Table (High Density Linear-style Rows) */}
      <div className="bg-[#0A0C10] border border-[#1C202B] rounded-lg overflow-hidden shadow-sm">
        {isLoading && events.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-zinc-400" />
            Loading audit records...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500">
            No audit records matching criteria.
          </div>
        ) : (
          <div className="divide-y divide-[#1C202B]">
            {filteredEvents.map((ev) => {
              const isExpanded = expandedEventId === ev.id;
              const isCritical = ev.severity === 'critical';
              const isWarning = ev.severity === 'warning';

              return (
                <div key={ev.id} className="transition-colors hover:bg-white/[0.01]">
                  {/* Dense Single-Line Item Header */}
                  <div
                    onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                    className="flex items-center justify-between px-3 py-2 text-xs cursor-pointer select-none gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      )}

                      {/* Status Dot Indicator */}
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isCritical
                            ? 'bg-rose-400 animate-pulse'
                            : isWarning
                            ? 'bg-amber-400'
                            : ev.severity === 'success'
                            ? 'bg-emerald-400'
                            : 'bg-zinc-500'
                        }`}
                      />

                      {/* Timestamp */}
                      <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                        {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>

                      {/* Channel Badge */}
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/[0.04] border border-white/[0.06] text-zinc-300 shrink-0">
                        {ev.channelId}
                      </span>

                      {/* Event Type */}
                      <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                        {ev.eventType}
                      </span>

                      {/* Event Summary */}
                      <span className="text-zinc-200 truncate font-sans">
                        {ev.summary}
                      </span>
                    </div>

                    {/* Right Telemetry info */}
                    <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                      {ev.latencyMs !== undefined && (
                        <span className={`px-1.5 py-0.2 rounded ${
                          ev.latencyMs > 200 ? 'text-rose-300 bg-rose-500/10' : 'text-zinc-400 bg-white/[0.02]'
                        }`}>
                          {ev.latencyMs}ms
                        </span>
                      )}
                      <span className="text-zinc-600 hidden sm:inline">#{ev.id.slice(0, 7)}</span>
                    </div>
                  </div>

                  {/* Expanded Audit Details Panel */}
                  {isExpanded && (
                    <div className="px-8 pb-3 pt-1 text-xs border-t border-[#161A24] bg-black/30 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="text-zinc-400">
                          <span className="text-zinc-600">Event ID: </span>{ev.id}
                        </div>
                        <div className="text-zinc-400">
                          <span className="text-zinc-600">Full ISO: </span>{ev.timestamp}
                        </div>
                        {ev.previousStatus && ev.newStatus && (
                          <div className="text-zinc-400">
                            <span className="text-zinc-600">Transition: </span>{ev.previousStatus} &rarr; {ev.newStatus}
                          </div>
                        )}
                        {ev.jitterMs !== undefined && (
                          <div className="text-zinc-400">
                            <span className="text-zinc-600">Jitter: </span>{ev.jitterMs}ms
                          </div>
                        )}
                      </div>

                      {ev.details && (
                        <div dir="rtl" className="p-2 rounded bg-black/40 border border-[#1C202B] text-zinc-300 text-xs font-sans leading-relaxed">
                          {ev.details}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Channel Status Transition Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowStatusModal(false)}>
          <div
            className="w-full max-w-sm rounded-xl bg-[#0A0C10] border border-[#1C202B] p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#1C202B]">
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-100">
                <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                <span>Switch Channel Status</span>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-zinc-400 text-[11px] font-mono block mb-1">Target Gateway:</label>
                <select
                  value={statusChangeChannel}
                  onChange={(e) => setStatusChangeChannel(e.target.value as ChannelPlatform)}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#10131A] border border-[#1C202B] rounded-md text-zinc-200 focus:outline-none focus:border-zinc-500 font-sans"
                >
                  <option value="whatsapp">WhatsApp Gateway</option>
                  <option value="bale">Bale Messenger</option>
                  <option value="telegram">Telegram Bot</option>
                  <option value="sms">SMS Gateway</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 text-[11px] font-mono block mb-1">New Status:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['active', 'standby', 'disconnected'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusChangeTarget(st)}
                      className={`py-1.5 rounded-md border text-xs capitalize transition-all cursor-pointer font-mono ${
                        statusChangeTarget === st
                          ? 'bg-zinc-100 text-zinc-950 font-medium border-zinc-100'
                          : 'bg-white/[0.02] text-zinc-400 border-white/[0.06] hover:text-zinc-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1C202B]">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-3 py-1.5 rounded-md bg-white/[0.04] text-zinc-400 hover:text-zinc-200 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={isUpdatingStatus}
                className="px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium cursor-pointer disabled:opacity-40"
              >
                {isUpdatingStatus ? 'Applying...' : 'Apply & Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

GatewayHistoryTab.displayName = 'GatewayHistoryTab';
