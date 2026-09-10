import React, { useState, useEffect, useCallback } from 'react';
import { ShadowReviewItem, ChannelPlatform } from '../types';
import {
  Check,
  X,
  Edit3,
  ShieldCheck,
  Clock,
  User,
  PhoneCall,
  Radio,
  Send,
  MessageSquare,
  AlertTriangle,
  Keyboard,
  CornerDownLeft,
} from 'lucide-react';

interface ShadowReviewQueueProps {
  queue: ShadowReviewItem[];
  onAction: (id: string, action: 'approve' | 'reject' | 'modify', editedReply?: string) => void;
}

export const ShadowReviewQueue: React.FC<ShadowReviewQueueProps> = ({
  queue,
  onAction,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [filterChannel, setFilterChannel] = useState<string>('all');

  const filteredQueue = queue.filter(
    (item) => filterChannel === 'all' || item.channel === filterChannel
  );

  // Keep selected index in range
  useEffect(() => {
    if (selectedIndex >= filteredQueue.length && filteredQueue.length > 0) {
      setSelectedIndex(filteredQueue.length - 1);
    }
  }, [filteredQueue.length, selectedIndex]);

  const handleStartEdit = (item: ShadowReviewItem) => {
    setEditingId(item.id);
    setEditText(item.editedReply || item.proposedReply);
  };

  const handleSaveEdit = (id: string) => {
    if (!editText.trim()) return;
    onAction(id, 'modify', editText.trim());
    setEditingId(null);
  };

  // Keyboard navigation shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // If editing in textarea, don't trigger global J/K/A/R navigation
      if (editingId) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          handleSaveEdit(editingId);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setEditingId(null);
        }
        return;
      }

      // Ignore when focusing other input elements
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (filteredQueue.length === 0) return;
      const currentItem = filteredQueue[selectedIndex];

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredQueue.length - 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (currentItem && currentItem.status === 'pending') {
          onAction(currentItem.id, 'approve');
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (currentItem && currentItem.status === 'pending') {
          onAction(currentItem.id, 'reject');
        }
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        if (currentItem) {
          handleStartEdit(currentItem);
        }
      }
    },
    [editingId, editText, filteredQueue, selectedIndex, onAction]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getChannelBadge = (ch: ChannelPlatform) => {
    switch (ch) {
      case 'whatsapp':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <PhoneCall className="w-2.5 h-2.5" /> WhatsApp
          </span>
        );
      case 'bale':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
            <Radio className="w-2.5 h-2.5" /> Bale
          </span>
        );
      case 'telegram':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
            <Send className="w-2.5 h-2.5" /> Telegram
          </span>
        );
      case 'sms':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <MessageSquare className="w-2.5 h-2.5" /> SMS
          </span>
        );
    }
  };

  const getRiskBadge = (risk: ShadowReviewItem['riskLevel'], confidence: number) => {
    const pct = (confidence * 100).toFixed(0);
    switch (risk) {
      case 'safe':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            ایمن ({pct}%)
          </span>
        );
      case 'high_redline':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <AlertTriangle className="w-2.5 h-2.5" /> ریسک قرمز ({pct}%)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            احتیاط ({pct}%)
          </span>
        );
    }
  };

  return (
    <div className="space-y-2.5" dir="rtl">
      {/* Top Header & Keyboard Short-Cuts Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-[#0D111A] border border-[#1E2538]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-xs font-semibold text-white tracking-tight">
              صف بررسی نظارت انسانی (HITL Shadow Review Queue)
            </h2>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
            {filteredQueue.length} سشن
          </span>
        </div>

        {/* Keyboard Hints & Channel Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Keyboard Badges */}
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 bg-black/40 px-2 py-1 rounded border border-white/[0.05]">
            <Keyboard className="w-3 h-3 text-zinc-500" />
            <span>میانبرها:</span>
            <kbd className="px-1 py-0.2 bg-white/10 text-zinc-200 rounded text-[9px]">J/K</kbd>
            <span>انتخاب</span>
            <kbd className="px-1 py-0.2 bg-emerald-500/20 text-emerald-300 rounded text-[9px]">A</kbd>
            <span>تایید</span>
            <kbd className="px-1 py-0.2 bg-rose-500/20 text-rose-300 rounded text-[9px]">R</kbd>
            <span>رد</span>
            <kbd className="px-1 py-0.2 bg-white/10 text-zinc-200 rounded text-[9px]">E</kbd>
            <span>ویرایش</span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/[0.06] text-xs">
            {['all', 'whatsapp', 'bale', 'telegram'].map((ch) => (
              <button
                key={ch}
                onClick={() => setFilterChannel(ch)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                  filterChannel === ch
                    ? 'bg-white/[0.12] text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {ch === 'all' ? 'همه' : ch.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Queue Items */}
      {filteredQueue.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-[#0D111A] border border-[#1E2538] text-zinc-500 text-xs font-mono">
          صف بازبینی خالی است. تمامی پاسخ‌های مشروط ارسال یا تعیین تکلیف شده‌اند.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredQueue.map((item, idx) => {
            const isSelected = selectedIndex === idx;
            const isItemEditing = editingId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedIndex(idx)}
                className={`p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-[#111726] border-sky-500/40 ring-1 ring-sky-500/20 shadow-md'
                    : 'bg-[#0D111A] border-[#1E2538] hover:border-white/[0.12]'
                } ${
                  item.status === 'approved'
                    ? 'opacity-80 border-emerald-500/30'
                    : item.status === 'rejected'
                    ? 'opacity-60 border-rose-500/30'
                    : ''
                }`}
              >
                {/* Meta Header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
                  <div className="flex items-center gap-2">
                    {getChannelBadge(item.channel)}
                    <span className="font-medium text-zinc-200 text-[11px]">{item.senderDisplay}</span>
                    <span className="text-[10px] font-mono text-zinc-500">[{item.sessionId}]</span>
                    {item.deterministicRuleApplied && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {item.deterministicRuleApplied}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-mono text-[10px] flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {item.timestamp}
                    </span>
                    {getRiskBadge(item.riskLevel, item.confidenceScore)}
                    {item.status !== 'pending' && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                        item.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Dense Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 my-2.5 text-xs">
                  {/* Inbound Message */}
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04]">
                    <div className="text-[10px] font-mono text-zinc-400 mb-1 flex items-center gap-1">
                      <User className="w-2.5 h-2.5 text-zinc-500" />
                      <span>ورودی کاربر ({item.channel.toUpperCase()}):</span>
                    </div>
                    <p className="text-[11px] text-zinc-200 leading-relaxed font-sans select-text">
                      {item.userMessage}
                    </p>
                  </div>

                  {/* Outbound Inference / Edit */}
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <div className="text-[10px] font-mono text-zinc-400 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5 text-sky-400" />
                        <span>پاسخ پیشنهادی مدل / ناظر:</span>
                      </span>
                      {isItemEditing && (
                        <span className="text-[9px] text-zinc-400 font-mono">
                          Ctrl+Enter برای تایید و ارسال
                        </span>
                      )}
                    </div>

                    {isItemEditing ? (
                      <div className="space-y-1.5">
                        <textarea
                          rows={2}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full bg-black/80 border border-sky-500/40 rounded p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-400 font-sans resize-none"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-0.5 rounded bg-white/10 text-zinc-300 text-[10px] hover:bg-white/20 cursor-pointer"
                          >
                            انصراف (Esc)
                          </button>
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="px-2.5 py-0.5 rounded bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 text-[10px] hover:bg-emerald-600/50 cursor-pointer flex items-center gap-1"
                          >
                            <CornerDownLeft className="w-2.5 h-2.5" />
                            <span>ذخیره و تایید</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-200 leading-relaxed font-sans select-text">
                        {item.editedReply || item.proposedReply}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.04]">
                  <div className="text-[10px] text-zinc-500 font-mono truncate max-w-sm">
                    {item.auditNote || 'در انتظار تصمیم اپراتور انسانی (HITL)'}
                  </div>

                  {item.status === 'pending' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onAction(item.id, 'approve')}
                        className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors focus-visible:ring-1 focus-visible:ring-emerald-400"
                        title="تایید پاسخ [A]"
                      >
                        <Check className="w-3 h-3" />
                        <span>تایید [A]</span>
                      </button>

                      <button
                        onClick={() => handleStartEdit(item)}
                        className="px-2.5 py-1 rounded bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-zinc-200 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors focus-visible:ring-1 focus-visible:ring-sky-400"
                        title="ویرایش متن پاسخ [E]"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>ویرایش [E]</span>
                      </button>

                      <button
                        onClick={() => onAction(item.id, 'reject')}
                        className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors focus-visible:ring-1 focus-visible:ring-rose-400"
                        title="رد کردن پاسخ [R]"
                      >
                        <X className="w-3 h-3" />
                        <span>رد [R]</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
