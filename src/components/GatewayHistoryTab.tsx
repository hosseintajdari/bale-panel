import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Activity,
  RefreshCw,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  Download,
  Copy,
  Check,
  Radio,
  Send,
  PhoneCall,
  MessageSquare,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
} from 'lucide-react';
import {
  GatewayAuditEvent,
  GatewayAuditEventType,
  GatewayAuditSeverity,
  GatewayAuditStats,
  ChannelPlatform,
} from '../types';
import { getLatencyHealth } from '../utils/healthAlerts';
import { authFetch } from '../utils/api';

interface GatewayHistoryTabProps {
  onRefreshChannels?: () => void;
}

export const GatewayHistoryTab: React.FC<GatewayHistoryTabProps> = ({ onRefreshChannels }) => {
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
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
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
      if (selectedEventType !== 'all') params.append('eventType', selectedEventType);
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
  }, [selectedChannel, selectedEventType, selectedSeverity]);

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
          reason: 'سوئیچ دستی توسط اپراتور در تب تاریخچه و حسابرسی',
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
    if (!window.confirm('آیا از بازنشانی و پاکسازی لاگ‌های حسابرسی اطمینان دارید؟ رویداد پاکسازی به عنوان رکورد جدید ثبت خواهد شد.')) {
      return;
    }
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
        ev.id.toLowerCase().includes(q) ||
        (ev.previousStatus && ev.previousStatus.toLowerCase().includes(q)) ||
        (ev.newStatus && ev.newStatus.toLowerCase().includes(q))
    );
  }, [events, searchQuery]);

  // Channel helper icon and color
  const getChannelBadge = (channelId: string) => {
    switch (channelId) {
      case 'whatsapp':
        return {
          icon: PhoneCall,
          label: 'واتساپ (WhatsApp)',
          colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        };
      case 'bale':
        return {
          icon: Radio,
          label: 'بله (Bale Hook)',
          colorClass: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
        };
      case 'telegram':
        return {
          icon: Send,
          label: 'تلگرام (Telegram)',
          colorClass: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
        };
      case 'sms':
        return {
          icon: MessageSquare,
          label: 'پیامک (Iran SMS)',
          colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        };
      default:
        return {
          icon: ShieldCheck,
          label: 'کل درگاه‌ها (System Core)',
          colorClass: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
        };
    }
  };

  const getSeverityBadge = (sev: GatewayAuditSeverity) => {
    switch (sev) {
      case 'critical':
        return {
          label: 'بحرانی (Critical)',
          classes: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        };
      case 'warning':
        return {
          label: 'هشدار (Warning)',
          classes: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      case 'success':
        return {
          label: 'موفق (Healthy)',
          classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        };
      default:
        return {
          label: 'اطلاعیه (Info)',
          classes: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40',
        };
    }
  };

  const getEventTypeLabel = (type: GatewayAuditEventType) => {
    switch (type) {
      case 'heartbeat':
        return { label: 'ضربان قلب / پالس', icon: Activity, color: 'text-emerald-400' };
      case 'status_change':
        return { label: 'تغییر وضعیت گیت‌وی', icon: RefreshCw, color: 'text-sky-400' };
      case 'latency_alert':
        return { label: 'هشدار تاخیر و نوسان', icon: AlertTriangle, color: 'text-amber-400' };
      case 'config_change':
        return { label: 'تغییر پیکربندی پالس', icon: SlidersHorizontal, color: 'text-indigo-400' };
      default:
        return { label: 'رویداد سیستم', icon: History, color: 'text-zinc-400' };
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-[#0f131a] border border-white/[0.08] shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center space-x-4 space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  تاریخچه و حسابرسی گیت‌وی‌ها (Channel Gateway Audit Log)
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Immutable Audit Ledger
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  زنده (Real-time)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
                ثبت تاریخ‌دار، قابل جستجو و تغییرناپذیر از کلیه رویدادهای ضربان قلب (Heartbeat)، تغییر وضعیت درگاه‌ها (Active / Standby / Disconnected)، هشدارهای لتنسی و تنظیمات تله‌متری برای مقاصد نظارتی و پزشکی.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => handleManualHeartbeat()}
              disabled={isPinging}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all text-xs font-medium cursor-pointer disabled:opacity-50"
            >
              <Activity className={`w-4 h-4 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'ارزیابی پالس...' : 'پالس دستی (Heartbeat)'}</span>
            </button>

            <button
              onClick={() => handleManualHeartbeat('simulate_spike')}
              disabled={isPinging}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition-all text-xs font-medium cursor-pointer disabled:opacity-50"
              title="ایجاد اسپایک لتنسی برای تست ثبت خودکار هشدارهای بحرانی در تاریخچه"
            >
              <Flame className="w-4 h-4 text-rose-400" />
              <span>شبیه‌سازی اسپایک تاخیر</span>
            </button>

            <button
              onClick={() => setShowStatusModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 transition-all text-xs font-medium cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-sky-400" />
              <span>تغییر وضعیت گیت‌وی</span>
            </button>

            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] text-zinc-300 border border-white/[0.1] hover:bg-white/[0.12] transition-all text-xs font-medium cursor-pointer"
            >
              {copiedId === 'all' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
              <span>{copiedId === 'all' ? 'کپی شد!' : 'خروجی JSON'}</span>
            </button>
          </div>
        </div>

        {/* Metric KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/[0.06]">
          <div className="p-3.5 rounded-2xl bg-black/30 border border-white/[0.06]">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span>کل رویدادهای ثبت‌شده</span>
              <History className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white">
              {stats.totalEvents}
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">سوابق فعال حسابرسی</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/30 border border-white/[0.06]">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span>پالس‌های ضربان قلب (Heartbeat)</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
              {stats.heartbeats}
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">تایید سلامت سوکت‌ها</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/30 border border-white/[0.06]">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span>تغییرات وضعیت گیت‌وی</span>
              <RefreshCw className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-sky-400">
              {stats.statusChanges}
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">سوئیچ خطوط رله</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/30 border border-white/[0.06]">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span>هشدارهای تاخیر و گلوگاه</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">
              {stats.latencyAlerts}
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">گلوگاه‌های رهگیری‌شده</span>
          </div>
        </div>
      </div>

      {/* Interactive Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-[#0e121a] border border-white/[0.08] shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی زنده در لاگ‌ها: نام درگاه، شناسه، وضعیت، شرح خطا یا متن پیام..."
              className="w-full pr-9 pl-4 py-2 text-xs bg-black/40 border border-white/[0.1] rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Refresh and Clear buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={fetchHistory}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="تازه‌سازی لیست رویدادها"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>تازه‌سازی</span>
            </button>

            <button
              onClick={handleClearHistory}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="پاکسازی تاریخچه حسابرسی"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>پاکسازی</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.04] text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400 ml-2">
            <Filter className="w-3.5 h-3.5" />
            <span>فیلتر درگاه:</span>
          </div>

          {[
            { id: 'all', label: 'همه درگاه‌ها' },
            { id: 'whatsapp', label: 'واتساپ' },
            { id: 'bale', label: 'پیام‌رسان بله' },
            { id: 'telegram', label: 'تلگرام' },
            { id: 'sms', label: 'سامانه پیامک' },
          ].map((ch) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChannel(ch.id)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs ${
                selectedChannel === ch.id
                  ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-500/40 font-semibold'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              {ch.label}
            </button>
          ))}

          <div className="h-4 w-px bg-white/[0.08] mx-1" />

          <div className="flex items-center gap-1.5 text-zinc-400 ml-1">
            <span>نوع رویداد:</span>
          </div>

          {[
            { id: 'all', label: 'همه رویدادها' },
            { id: 'heartbeat', label: 'ضربان قلب' },
            { id: 'status_change', label: 'تغییر وضعیت' },
            { id: 'latency_alert', label: 'هشدار تاخیر' },
            { id: 'config_change', label: 'پیکربندی' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedEventType(type.id)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs ${
                selectedEventType === type.id
                  ? 'bg-white/[0.12] text-white border border-white/[0.15] font-semibold'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              {type.label}
            </button>
          ))}

          <div className="h-4 w-px bg-white/[0.08] mx-1" />

          <div className="flex items-center gap-1.5 text-zinc-400 ml-1">
            <span>سطح:</span>
          </div>

          {[
            { id: 'all', label: 'همه' },
            { id: 'critical', label: 'بحرانی' },
            { id: 'warning', label: 'هشدار' },
            { id: 'success', label: 'موفق' },
          ].map((sev) => (
            <button
              key={sev.id}
              onClick={() => setSelectedSeverity(sev.id)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs ${
                selectedSeverity === sev.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              {sev.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chronological Audit Log List */}
      <div className="rounded-3xl bg-[#0c1017] border border-white/[0.08] shadow-xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">
              دفتر زمانی رویدادهای مانیتورینگ گیت‌وی
            </h2>
            <span className="text-[11px] font-mono text-zinc-400">
              ({filteredEvents.length} رویداد منطبق)
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono">
            مرتب‌سازی: جدیدترین رویدادها در ابتدا
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-12 h-12 text-zinc-600 mx-auto mb-3 stroke-[1.5]" />
            <p className="text-sm font-medium text-zinc-300 mb-1">
              هیچ رویدادی با فیلترهای فعلی یافت نشد.
            </p>
            <p className="text-xs text-zinc-400 mb-4">
              می‌توانید فیلترها را ریست کنید یا با دکمه «پالس دستی» یک تست جدید ثبت نمایید.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedChannel('all');
                setSelectedEventType('all');
                setSelectedSeverity('all');
              }}
              className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs text-white border border-white/[0.1] transition-all cursor-pointer"
            >
              پاک کردن همه فیلترها
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filteredEvents.map((ev) => {
              const chInfo = getChannelBadge(ev.channelId);
              const ChannelIcon = chInfo.icon;
              const sevBadge = getSeverityBadge(ev.severity);
              const typeInfo = getEventTypeLabel(ev.eventType);
              const TypeIcon = typeInfo.icon;
              const isExpanded = expandedEventId === ev.id;
              const health = getLatencyHealth(ev.latencyMs || 25, ev.jitterMs);

              return (
                <div
                  key={ev.id}
                  className={`p-4 sm:p-5 transition-colors hover:bg-white/[0.02] ${
                    ev.severity === 'critical' ? 'bg-rose-950/10' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left: Event Icon + Main Content */}
                    <div className="flex items-start gap-3.5 flex-1">
                      {/* Icon */}
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                          ev.severity === 'critical'
                            ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                            : ev.severity === 'warning'
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                            : ev.severity === 'success'
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-zinc-500/15 border-zinc-500/30 text-zinc-300'
                        }`}
                      >
                        <TypeIcon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Channel Badge */}
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg border ${chInfo.colorClass}`}
                          >
                            <ChannelIcon className="w-3 h-3" />
                            <span>{ev.channelName}</span>
                          </span>

                          {/* Event Type */}
                          <span className="text-[11px] font-mono text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
                            {typeInfo.label}
                          </span>

                          {/* Severity Badge */}
                          <span
                            className={`text-[10px] font-mono px-2 py-0.2 rounded-full border ${sevBadge.classes}`}
                          >
                            {sevBadge.label}
                          </span>

                          {/* Latency Health Badge if available */}
                          {ev.latencyMs !== undefined && (
                            <span
                              className={`text-[10px] font-mono px-2 py-0.2 rounded-md border ${health.badgeClass}`}
                            >
                              {ev.latencyMs}ms ({health.persianLabel})
                            </span>
                          )}

                          {/* Status Transition Badges */}
                          {ev.previousStatus && ev.newStatus && (
                            <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-300 bg-black/40 px-2 py-0.5 rounded-md border border-white/[0.08]">
                              <span className="text-zinc-400">{ev.previousStatus}</span>
                              <span className="text-indigo-400">←</span>
                              <span className="text-emerald-400 font-bold">{ev.newStatus}</span>
                            </div>
                          )}
                        </div>

                        {/* Title Summary */}
                        <div className="text-sm font-semibold text-white leading-snug">
                          {ev.summary}
                        </div>

                        {/* Detailed Description */}
                        {ev.details && (
                          <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">
                            {ev.details}
                          </p>
                        )}

                        {/* Telemetry Metrics Snapshot */}
                        {(ev.jitterMs !== undefined || ev.packetLossPct !== undefined) && (
                          <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-zinc-400 flex-wrap">
                            {ev.jitterMs !== undefined && (
                              <span className="bg-black/20 px-2 py-0.5 rounded border border-white/[0.04]">
                                نوسان جیتر: <strong className="text-zinc-200">{ev.jitterMs}ms</strong>
                              </span>
                            )}
                            {ev.packetLossPct !== undefined && (
                              <span className="bg-black/20 px-2 py-0.5 rounded border border-white/[0.04]">
                                افت بسته: <strong className="text-emerald-300">{ev.packetLossPct}%</strong>
                              </span>
                            )}
                            {ev.webhookAckRatePct !== undefined && (
                              <span className="bg-black/20 px-2 py-0.5 rounded border border-white/[0.04]">
                                تایید وب‌هوک: <strong className="text-sky-300">{ev.webhookAckRatePct}%</strong>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Timestamp & Details Toggle */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/[0.04]">
                      <div className="text-right">
                        <div className="text-xs font-mono font-medium text-zinc-200">
                          {ev.timeFormatted}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {ev.dateFormatted}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-zinc-300 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>{isExpanded ? 'بستن ردیابی' : 'جزئیات تله‌متری'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable JSON / Audit Payload Viewer */}
                  {isExpanded && (
                    <div className="mt-3.5 p-3.5 rounded-2xl bg-black/50 border border-white/[0.08] font-mono text-xs text-left" dir="ltr">
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/[0.06] text-zinc-400 text-[11px]">
                        <span className="flex items-center gap-1 text-indigo-300">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Audit Record ID: {ev.id}</span>
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(ev, null, 2));
                            setCopiedId(ev.id);
                            setTimeout(() => setCopiedId(null), 1500);
                          }}
                          className="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 flex items-center gap-1 transition-colors text-[10px] cursor-pointer"
                        >
                          {copiedId === ev.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === ev.id ? 'Copied' : 'Copy JSON'}</span>
                        </button>
                      </div>
                      <pre className="text-[11px] text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {JSON.stringify(ev, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Channel Status Transition Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#121620] border border-white/[0.12] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white">
                  تغییر کنترل‌شده وضعیت گیت‌وی و ثبت حسابرسی
                </h3>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-zinc-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              تغییر وضعیت هر درگاه بلافاصله در پایپ‌لاین اعمال شده و رکورد تغییر وضعیت (Status Change) در جدول حسابرسی ثبت خواهد شد.
            </p>

            {/* Select Channel */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">درگاه هدف:</label>
              <select
                value={statusChangeChannel}
                onChange={(e) => setStatusChangeChannel(e.target.value as ChannelPlatform)}
                className="w-full px-3 py-2 text-xs bg-black/40 border border-white/[0.1] rounded-xl text-white focus:outline-none focus:border-sky-500"
              >
                <option value="whatsapp">واتساپ (WhatsApp Multi-Device Gateway)</option>
                <option value="bale">پیام‌رسان بله (Bale Hook)</option>
                <option value="telegram">تلگرام (Telegram Bot API)</option>
                <option value="sms">سامانه پیامک (Iran SMS Alert)</option>
              </select>
            </div>

            {/* Select Target Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">وضعیت جدید:</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusChangeTarget('active')}
                  className={`py-2 rounded-xl border font-medium cursor-pointer transition-all ${
                    statusChangeTarget === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                      : 'bg-white/[0.04] text-zinc-400 border-transparent hover:text-white'
                  }`}
                >
                  فعال (Active)
                </button>
                <button
                  type="button"
                  onClick={() => setStatusChangeTarget('standby')}
                  className={`py-2 rounded-xl border font-medium cursor-pointer transition-all ${
                    statusChangeTarget === 'standby'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                      : 'bg-white/[0.04] text-zinc-400 border-transparent hover:text-white'
                  }`}
                >
                  آماده‌باش (Standby)
                </button>
                <button
                  type="button"
                  onClick={() => setStatusChangeTarget('disconnected')}
                  className={`py-2 rounded-xl border font-medium cursor-pointer transition-all ${
                    statusChangeTarget === 'disconnected'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                      : 'bg-white/[0.04] text-zinc-400 border-transparent hover:text-white'
                  }`}
                >
                  قطع (Disconnected)
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs text-zinc-300 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={isUpdatingStatus}
                className="px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-500/40 text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {isUpdatingStatus ? 'در حال اعمال و ثبت...' : 'تایید و ثبت در حسابرسی'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
