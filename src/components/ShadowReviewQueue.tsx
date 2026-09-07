import React, { useState } from 'react';
import { ShadowReviewItem, ChannelPlatform } from '../types';
import { Check, X, Edit3, ShieldCheck, AlertOctagon, Clock, User, PhoneCall, Radio, Send, MessageSquare } from 'lucide-react';

interface ShadowReviewQueueProps {
  queue: ShadowReviewItem[];
  onAction: (id: string, action: 'approve' | 'reject' | 'modify', editedReply?: string) => void;
}

export const ShadowReviewQueue: React.FC<ShadowReviewQueueProps> = ({
  queue,
  onAction,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [filterChannel, setFilterChannel] = useState<string>('all');

  const filteredQueue = queue.filter(
    (item) => filterChannel === 'all' || item.channel === filterChannel
  );

  const handleStartEdit = (item: ShadowReviewItem) => {
    setEditingId(item.id);
    setEditText(item.editedReply || item.proposedReply);
  };

  const handleSaveEdit = (id: string) => {
    onAction(id, 'modify', editText);
    setEditingId(null);
  };

  const getChannelBadge = (ch: ChannelPlatform) => {
    switch (ch) {
      case 'whatsapp':
        return (
          <span className="flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <PhoneCall className="w-2.5 h-2.5 mr-1" /> WhatsApp
          </span>
        );
      case 'bale':
        return (
          <span className="flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
            <Radio className="w-2.5 h-2.5 mr-1" /> Bale
          </span>
        );
      case 'telegram':
        return (
          <span className="flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
            <Send className="w-2.5 h-2.5 mr-1" /> Telegram
          </span>
        );
      case 'sms':
        return (
          <span className="flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <MessageSquare className="w-2.5 h-2.5 mr-1" /> SMS
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Pill Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight font-sans">
            صف بازبینی و تایید سایه (Shadow Review & Audit Queue)
          </h2>
        </div>

        {/* Channel Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-black/30 p-1 rounded-2xl border border-white/[0.06] text-xs">
          {['all', 'whatsapp', 'bale', 'telegram'].map((ch) => (
            <button
              key={ch}
              onClick={() => setFilterChannel(ch)}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer text-xs font-mono uppercase ${
                filterChannel === ch
                  ? 'bg-white/[0.12] text-white border border-white/[0.12]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {ch === 'all' ? 'همه کانال‌ها' : ch}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Items */}
      {filteredQueue.length === 0 ? (
        <div className="p-12 text-center rounded-3xl backdrop-blur-2xl bg-white/[0.02] border border-white/[0.05] text-zinc-500 text-xs">
          صف بازبینی خالی است. تمام پاسخ‌های اخیر ارسال یا بازبینی شده‌اند.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQueue.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-3xl backdrop-blur-2xl border transition-all ${
                item.status === 'approved'
                  ? 'bg-emerald-950/10 border-emerald-500/20'
                  : item.status === 'rejected'
                  ? 'bg-rose-950/10 border-rose-500/20 opacity-60'
                  : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.14]'
              }`}
            >
              {/* Row Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
                <div className="flex items-center space-x-2.5">
                  {getChannelBadge(item.channel)}
                  <span className="text-xs font-medium text-zinc-200">{item.senderDisplay}</span>
                  <span className="text-[10px] font-mono text-zinc-400">({item.sessionId})</span>
                </div>

                <div className="flex items-center space-x-2 text-[10px] font-mono">
                  <span className="text-zinc-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {item.timestamp}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full border ${
                    item.riskLevel === 'safe'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      : item.riskLevel === 'high_redline'
                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                  }`}>
                    اطمینان: {(item.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Message Exchange Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-3.5">
                {/* User Inbound */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.05]">
                  <div className="text-[10px] font-mono text-zinc-400 mb-1.5 flex items-center space-x-1">
                    <User className="w-3 h-3 inline mr-1" />
                    <span>پیام دریافتی از کاربر ({item.channel.toUpperCase()}):</span>
                  </div>
                  <div className="text-xs text-zinc-200 leading-relaxed font-sans">{item.userMessage}</div>
                </div>

                {/* AI / Rule Output */}
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="text-[10px] font-mono text-zinc-400 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3 inline mr-1 text-sky-400" />
                      <span>پاسخ تولیدی مدل (Shadow Inference):</span>
                    </span>
                    {item.deterministicRuleApplied && (
                      <span className="text-[10px] font-mono text-amber-300">قاعده قطعی فعال</span>
                    )}
                  </div>

                  {editingId === item.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-black/60 border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none font-sans resize-none"
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs cursor-pointer"
                        >
                          ذخیره و تایید
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 rounded-lg bg-white/10 text-zinc-300 text-xs cursor-pointer"
                        >
                          انصراف
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-200 leading-relaxed font-sans">
                      {item.editedReply || item.proposedReply}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.05]">
                <div className="text-[11px] text-zinc-400 font-mono">
                  {item.auditNote || 'در انتظار تصمیم مدیر'}
                </div>

                {item.status === 'pending' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onAction(item.id, 'approve')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-200 text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>تایید و ارسال به {item.channel.toUpperCase()}</span>
                    </button>

                    <button
                      onClick={() => handleStartEdit(item)}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-zinc-200 text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>ویرایش</span>
                    </button>

                    <button
                      onClick={() => onAction(item.id, 'reject')}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>رد کردن</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
