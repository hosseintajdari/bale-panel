import React, { useState } from 'react';
import { WorkLedgerItem, GlobalPrivacySettings } from '../types';
import { BookMarked, CheckCircle2, Clock, Sparkles, Filter, Plus, ArrowUpRight, Shield, ShieldCheck, Database, Sliders } from 'lucide-react';

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
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newCategory, setNewCategory] = useState<'Executive' | 'Operations' | 'Clinical' | 'Personal'>('Executive');
  const [isAdding, setIsAdding] = useState(false);

  const fetchLedger = async () => {
    try {
      const res = await fetch('/api/ledger/items');
      const data = await res.json();
      if (data.success && data.items) {
        setLedger(data.items);
      }
    } catch (e) {
      console.error('Error fetching ledger items:', e);
    }
  };

  React.useEffect(() => {
    fetchLedger();
  }, []);

  const filtered = ledger.filter(
    (item) => selectedCategory === 'all' || item.domainCategory === selectedCategory
  );

  const handleAddSession = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch('/api/ledger/items', {
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

  return (
    <div className="space-y-4">
      {/* Top Banner & Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight font-sans flex items-center space-x-2">
            <BookMarked className="w-4 h-4 text-zinc-300 ml-2" />
            <span>دفتر کار و زمینه سشن‌ها (Executive Work Ledger)</span>
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {/* Category Filter */}
          <div className="flex items-center space-x-1 bg-black/30 p-1 rounded-2xl border border-white/[0.06] text-xs">
            {['all', 'Executive', 'Clinical', 'Operations', 'Personal'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer text-xs font-sans ${
                  selectedCategory === cat
                    ? 'bg-white/[0.12] text-white border border-white/[0.12]'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {cat === 'all' ? 'همه حوزه‌ها' : cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-white text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>سشن جدید</span>
          </button>
        </div>
      </div>

      {/* Global Data Retention & Privacy Status Strip in WorkLedger */}
      {privacySettings && (
        <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
          privacySettings.retentionPolicy === 'ephemeral'
            ? 'bg-emerald-500/[0.06] border-emerald-500/25 text-emerald-300'
            : 'bg-indigo-500/[0.06] border-indigo-500/25 text-indigo-300'
        }`}>
          <div className="flex items-center space-x-2.5 space-x-reverse">
            {privacySettings.retentionPolicy === 'ephemeral' ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <Database className="w-5 h-5 text-indigo-400 shrink-0" />
            )}
            <div className="text-xs">
              <span className="font-semibold text-white block">
                {privacySettings.retentionPolicy === 'ephemeral'
                  ? 'سیاست سشن‌های موقت (Ephemeral Mode - Zero Retention) فعال است'
                  : 'سیاست ثبت متادیتا در دفتر کار (WorkLedger Audit Logging) فعال است'}
              </span>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {privacySettings.retentionPolicy === 'ephemeral'
                  ? 'تعاملات ربات‌های پزشکی و مشاوره‌های حساس در دیتابیس پایدار نمی‌شوند و تنها در RAM اجرا شده‌اند.'
                  : 'متادیتا، خلاصه استعلام و بار محاسباتی توکن‌های خط لوله به‌صورت خودکار در این دفتر کار نمایه می‌شوند.'}
              </p>
            </div>
          </div>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-1 space-x-reverse text-xs bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1.5 rounded-xl border border-white/[0.1] text-zinc-200 transition-colors shrink-0 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-zinc-400" />
              <span>مدیریت سیاست نگهداری</span>
            </button>
          )}
        </div>
      )}

      {/* New Session Drawer/Form */}
      {isAdding && (
        <div className="p-4 rounded-3xl backdrop-blur-2xl bg-white/[0.04] border border-white/[0.12] shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white font-sans">ثبت مدخل جدید در دفتر کار سشن‌ها</span>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="bg-black/50 border border-white/10 rounded-xl px-3 py-1 text-xs text-zinc-200"
            >
              <option value="Executive">Executive (مدیریت ارشد)</option>
              <option value="Clinical">Clinical (بالینی و سلامت)</option>
              <option value="Operations">Operations (عملیات و لاجستیک)</option>
              <option value="Personal">Personal (اتوماسیون فردی)</option>
            </select>
          </div>

          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="عنوان سشن یا تسک کاری..."
            className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20 font-sans"
          />

          <textarea
            rows={2}
            value={newSummary}
            onChange={(e) => setNewSummary(e.target.value)}
            placeholder="خلاصه بافت و نیازمندی‌های این نشست..."
            className="w-full bg-black/40 border border-white/[0.08] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-white/20 font-sans resize-none"
          />

          <div className="flex items-center justify-end space-x-2 pt-1">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 rounded-xl bg-white/[0.05] text-zinc-400 text-xs cursor-pointer"
            >
              انصراف
            </button>
            <button
              onClick={handleAddSession}
              disabled={!newTitle.trim()}
              className="px-4 py-1 rounded-xl bg-white/[0.15] hover:bg-white/[0.25] text-white text-xs font-medium cursor-pointer disabled:opacity-50"
            >
              افزودن به دفتر کار
            </button>
          </div>
        </div>
      )}

      {/* Grid of Work Ledger Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.14] transition-all space-y-3"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
                {item.domainCategory}
              </span>
              <div className="flex items-center space-x-2 text-[11px] font-mono text-zinc-400">
                <Clock className="w-3 h-3 mr-1 inline" />
                <span>{item.lastUpdated}</span>
              </div>
            </div>

            {/* Title & Summary */}
            <div>
              <h3 className="text-xs font-semibold text-white tracking-tight font-sans">
                {item.title}
              </h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans mt-1.5">
                {item.summary}
              </p>
            </div>

            {/* Context & Metadata Footer */}
            <div className="pt-2.5 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span className="truncate max-w-[200px]">بافت: {item.activeContext}</span>
              <div className="flex items-center space-x-2">
                <span className="text-zinc-400">تسک‌ها: {item.tasksPending}</span>
                <span className="text-zinc-300 font-semibold">{item.tokenLoad}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
