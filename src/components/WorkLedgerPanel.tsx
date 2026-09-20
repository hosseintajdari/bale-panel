import React, { useState, useEffect } from 'react';
import { WorkLedgerItem, GlobalPrivacySettings } from '../types';
import { authFetch } from '../utils/api';
import {
  BookMarked,
  Clock,
  Plus,
  ShieldCheck,
  Database,
  Sliders,
  Search,
  ChevronDown,
  ChevronUp,
  Cpu,
  CheckCircle2,
  X,
} from 'lucide-react';

interface WorkLedgerPanelProps {
  privacySettings?: GlobalPrivacySettings;
  onOpenSettings?: () => void;
}

const INITIAL_LEDGER: WorkLedgerItem[] = [
  {
    id: 'wld-101',
    title: 'بررسی معماری میان‌افزار Embednet OS و لانگ‌بات',
    domainCategory: 'Executive',
    summary: 'جداسازی لایه وب‌هوک واتساپ (Evolution API v2) از هسته محاسباتی و تعیین گیت‌های تایید Shadow Mode.',
    activeContext: 'جلسه بازبینی سیستم / ارزیابی جایگزینی OpenClaw با لانگ‌بات',
    tasksPending: 2,
    lastUpdated: 'امروز، ۱۰:۴۵',
    tokenLoad: '1,420 توکن',
  },
  {
    id: 'wld-102',
    title: 'توسعه موتور قوانین قطعی قیمت دارو (Qanoon-Price)',
    domainCategory: 'Clinical',
    summary: 'استخراج ضرایب ارزش افزوده و سقف قیمت‌های مصوب سازمان غذا و دارو بدون اتکا به توهمات مدل زبانی.',
    activeContext: 'سرویس کاتالوگ و استعلام کد IRC',
    tasksPending: 1,
    lastUpdated: 'امروز، ۰۹:۱۵',
    tokenLoad: '3,890 توکن',
  },
  {
    id: 'wld-103',
    title: 'هماهنگی ابزارهای جانبی و دسترسی ربات bale-auto',
    domainCategory: 'Operations',
    summary: 'صدور توکن‌های دسترسی کنترل‌شده برای اسکریپت‌های اتوماتیک بله جهت پایش لاگ‌ها.',
    activeContext: 'تفویض اختیارات و دسترسی‌های گزینشی',
    tasksPending: 0,
    lastUpdated: 'دیروز، ۱۸:۲۰',
    tokenLoad: '850 توکن',
  },
  {
    id: 'wld-104',
    title: 'ارتقای فرآیند بازبینی سایه (HITL Pharmacist Review)',
    domainCategory: 'Clinical',
    summary: 'تثبیت ADR-0001 و ADR-0002 جهت پیشگیری از ارسال پاسخ‌های پرریسک به بیماران بدون تایید ناظر.',
    activeContext: 'بایگانی و استخراج شواهد تریاژ',
    tasksPending: 3,
    lastUpdated: 'دیروز، ۱۵:۰۰',
    tokenLoad: '2,100 توکن',
  },
];

export const WorkLedgerPanel: React.FC<WorkLedgerPanelProps> = ({
  privacySettings,
  onOpenSettings,
}) => {
  const [ledger, setLedger] = useState<WorkLedgerItem[]>(INITIAL_LEDGER);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New Session State
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newCategory, setNewCategory] = useState<'Executive' | 'Operations' | 'Clinical' | 'Personal'>('Executive');
  const [isAdding, setIsAdding] = useState(false);

  const fetchLedger = async () => {
    try {
      const res = await authFetch('/api/ledger/items');
      const data = await res.json();
      if (data.success && data.items) {
        setLedger(data.items);
      }
    } catch (e) {
      console.error('Error fetching ledger items:', e);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const filtered = ledger.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.domainCategory === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.summary.toLowerCase().includes(query) ||
      item.activeContext.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query);
    return matchesCat && matchesSearch;
  });

  const handleAddSession = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await authFetch('/api/ledger/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          domainCategory: newCategory,
          summary: newSummary.trim() || 'سشن جدید ثبت‌شده توسط مدیر سیستم',
          activeContext: 'ثبت دستی در پنل حاکمیتی',
        }),
      });
      const data = await res.json();
      if (data.success && data.items) {
        setLedger(data.items);
      }
    } catch (e) {
      console.error('Failed to add ledger item:', e);
    }
    setNewTitle('');
    setNewSummary('');
    setIsAdding(false);
  };

  const getDomainBadge = (category: WorkLedgerItem['domainCategory']) => {
    switch (category) {
      case 'Executive':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/25';
      case 'Clinical':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25';
      case 'Operations':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/25';
      case 'Personal':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/25';
      default:
        return 'bg-zinc-500/15 text-zinc-300 border-zinc-500/25';
    }
  };

  const totalPendingTasks = filtered.reduce((sum, item) => sum + (item.tasksPending || 0), 0);

  return (
    <div className="space-y-2.5" dir="rtl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-[#0D111A] border border-[#1E2538]">
        <div className="flex items-center gap-2.5">
          <BookMarked className="w-4 h-4 text-sky-400" />
          <div>
            <h2 className="text-xs font-semibold text-white tracking-tight">
              دفتر کارکرد و حسابرسی سشن‌ها (Executive WorkLedger Audit)
            </h2>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
            {filtered.length} سشن • {totalPendingTasks} تسک در جریان
          </span>
        </div>

        {/* Search & Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3 h-3 text-zinc-500 absolute right-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در عناوین و لاگ‌ها..."
              className="bg-black/50 border border-white/[0.08] rounded-lg pr-7 pl-2.5 py-1 text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-sky-500/40 w-44 sm:w-56"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/[0.06] text-xs">
            {['all', 'Executive', 'Clinical', 'Operations', 'Personal'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                  selectedCategory === cat
                    ? 'bg-white/[0.12] text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {cat === 'all' ? 'همه' : cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] text-white text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>سشن جدید</span>
          </button>
        </div>
      </div>

      {/* Retention Policy Mini Strip */}
      {privacySettings && (
        <div className="px-3 py-2 rounded-xl bg-[#0A0E17] border border-white/[0.06] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {privacySettings.retentionPolicy === 'ephemeral' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            )}
            <span className="text-[11px] text-zinc-300 font-mono">
              سیاست داده: <strong className="text-white">{privacySettings.retentionPolicy === 'ephemeral' ? 'سشن موقت (Zero-Retention)' : 'ثبت کامل در دفتر کار (Audited)'}</strong>
            </span>
          </div>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono transition-colors cursor-pointer"
            >
              <Sliders className="w-2.5 h-2.5" />
              <span>تنظیم سیاست</span>
            </button>
          )}
        </div>
      )}

      {/* Add New Session Drawer */}
      {isAdding && (
        <div className="p-3 rounded-xl bg-[#0F131E] border border-sky-500/30 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white text-[11px]">ثبت مدخل جدید در دفتر کار سشن‌ها</span>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="bg-black/60 border border-white/10 rounded px-2 py-0.5 text-[11px] text-zinc-200"
            >
              <option value="Executive">Executive</option>
              <option value="Clinical">Clinical</option>
              <option value="Operations">Operations</option>
              <option value="Personal">Personal</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="عنوان سشن یا تسک کاری..."
              className="bg-black/50 border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500/40"
            />
            <input
              type="text"
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              placeholder="خلاصه اقدامات یا نیازمندی‌های این سشن..."
              className="bg-black/50 border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500/40"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setIsAdding(false)}
              className="px-2.5 py-0.5 rounded bg-white/5 text-zinc-400 text-[11px] hover:bg-white/10 cursor-pointer"
            >
              انصراف
            </button>
            <button
              onClick={handleAddSession}
              disabled={!newTitle.trim()}
              className="px-3 py-1 rounded bg-sky-600/30 hover:bg-sky-600/50 border border-sky-500/40 text-sky-200 text-[11px] font-medium cursor-pointer disabled:opacity-50"
            >
              ثبت در دیتابیس
            </button>
          </div>
        </div>
      )}

      {/* Data-Dense Tabular Audit View */}
      <div className="rounded-xl bg-[#0D111A] border border-[#1E2538] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-black/40 text-zinc-400 text-[10px] font-mono">
                <th className="py-2 px-3 font-medium">شناسه</th>
                <th className="py-2 px-3 font-medium">حوزه</th>
                <th className="py-2 px-3 font-medium">عنوان سشن / شرح</th>
                <th className="py-2 px-3 font-medium hidden md:table-cell">بافت فعال</th>
                <th className="py-2 px-3 font-medium text-center">تسک‌ها</th>
                <th className="py-2 px-3 font-medium text-center">بار محاسباتی</th>
                <th className="py-2 px-3 font-medium text-left">آخرین به‌روزرسانی</th>
                <th className="py-2 px-2 text-center w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500 text-xs font-mono">
                    هیچ سشنی مطابق با فیلتر فعلی یافت نشد.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isExpanded = expandedId === item.id;
                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className={`transition-colors cursor-pointer hover:bg-white/[0.03] ${
                          isExpanded ? 'bg-[#111726]' : ''
                        }`}
                      >
                        {/* ID */}
                        <td className="py-2 px-3 font-mono text-[10px] text-zinc-400 whitespace-nowrap">
                          {item.id}
                        </td>

                        {/* Domain Category Badge */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded border text-[10px] font-mono ${getDomainBadge(
                              item.domainCategory
                            )}`}
                          >
                            {item.domainCategory}
                          </span>
                        </td>

                        {/* Title & Preview */}
                        <td className="py-2 px-3 max-w-xs sm:max-w-md">
                          <div className="font-medium text-zinc-100 text-[11px] truncate">
                            {item.title}
                          </div>
                          <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                            {item.summary}
                          </div>
                        </td>

                        {/* Context */}
                        <td className="py-2 px-3 hidden md:table-cell text-zinc-400 text-[11px] truncate max-w-[180px]">
                          {item.activeContext}
                        </td>

                        {/* Pending Tasks */}
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          {item.tasksPending > 0 ? (
                            <span className="inline-block px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25 font-mono text-[10px] font-bold">
                              {item.tasksPending}
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.2 rounded bg-white/[0.04] text-zinc-500 font-mono text-[10px]">
                              ۰
                            </span>
                          )}
                        </td>

                        {/* Token Load */}
                        <td className="py-2 px-3 text-center whitespace-nowrap font-mono text-[11px] text-zinc-300">
                          {item.tokenLoad}
                        </td>

                        {/* Last Updated */}
                        <td className="py-2 px-3 text-left whitespace-nowrap text-zinc-500 font-mono text-[10px]">
                          {item.lastUpdated}
                        </td>

                        {/* Expand Chevron */}
                        <td className="py-2 px-2 text-center text-zinc-500">
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-[#0B0F19] border-t border-b border-sky-500/20">
                          <td colSpan={8} className="p-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div className="space-y-1 p-2.5 rounded bg-black/40 border border-white/[0.05]">
                                <span className="text-[10px] font-mono text-zinc-400 block">شرح کامل سشن:</span>
                                <p className="text-[11px] text-zinc-200 leading-relaxed font-sans select-text">
                                  {item.summary}
                                </p>
                              </div>
                              <div className="space-y-1 p-2.5 rounded bg-black/40 border border-white/[0.05]">
                                <span className="text-[10px] font-mono text-zinc-400 block">بافت و ارجاع اجرایی:</span>
                                <p className="text-[11px] text-zinc-200 leading-relaxed font-sans select-text">
                                  {item.activeContext}
                                </p>
                                <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                                  <span>شناسه رهگیری: {item.id}</span>
                                  <span>تسک‌های باز: {item.tasksPending} مورد</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

