import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Key,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Lock,
  GitBranch,
  FileText,
  UserPlus,
  RefreshCw,
  Sliders,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Database,
  ExternalLink,
  ShieldAlert,
  HardDrive,
  Layers
} from 'lucide-react';
import { AuthManager } from './AuthManager';

interface AdminIntegrationState {
  notion: { connected: boolean; workspace: string; lastSync: string };
  github: { connected: boolean; repo: string; branch: string; lastSync: string };
  activeAiProvider: 'gemini_direct' | 'codex_account_proxy' | 'chatgpt_subscription';
  pipelinePermissions: {
    allowDeterministicPricing: boolean;
    allowWebScraping: boolean;
    allowDatabaseMutation: boolean;
  };
  guestSandboxes: Array<{
    id: string;
    guestName: string;
    assignedBot: string;
    quotaUsed: string;
    isolatedMemoryPath: string;
    status: 'active' | 'paused';
  }>;
}

export const McpAccountsGrid: React.FC = () => {
  const [data, setData] = useState<AdminIntegrationState>({
    notion: { connected: true, workspace: "Embednet-Personal-Workspace", lastSync: "۱۰ دقیقه پیش" },
    github: { connected: true, repo: "sgwteam/embednet-os-core", branch: "main", lastSync: "۲۵ دقیقه پیش" },
    activeAiProvider: 'gemini_direct',
    pipelinePermissions: {
      allowDeterministicPricing: true,
      allowWebScraping: false,
      allowDatabaseMutation: true,
    },
    guestSandboxes: [
      {
        id: "sbx-01",
        guestName: "علی (دستیار شخصی تلگرام)",
        assignedBot: "Telegram @ali_assistant_bot",
        quotaUsed: "۱۴٪ از سهمیه ماهانه",
        isolatedMemoryPath: "/sandboxes/tenant_ali_db",
        status: "active"
      },
      {
        id: "sbx-02",
        guestName: "همکار تیم تست (کارهای روزمره بله)",
        assignedBot: "Bale @colleague_test_bot",
        quotaUsed: "۲۸٪ از سهمیه ماهانه",
        isolatedMemoryPath: "/sandboxes/tenant_colleague_db",
        status: "active"
      }
    ]
  });

  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestBot, setNewGuestBot] = useState('');
  const [isCreatingSandbox, setIsCreatingSandbox] = useState(false);
  const [integrationsSubView, setIntegrationsSubView] = useState<'auth-vault' | 'ai-providers' | 'guest-sandboxes'>('auth-vault');
  const [credentialsCount, setCredentialsCount] = useState<number>(3);

  useEffect(() => {
    fetch('/api/admin/integrations')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) setData(res.data);
      })
      .catch(err => console.error("Error fetching integrations:", err));
  }, []);

  const handleToggleProvider = async (provider: 'gemini_direct' | 'codex_account_proxy' | 'chatgpt_subscription') => {
    try {
      const res = await fetch('/api/admin/integrations/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'activeAiProvider', value: provider })
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePermission = async (permKey: keyof AdminIntegrationState['pipelinePermissions']) => {
    try {
      const currentVal = data.pipelinePermissions[permKey];
      const res = await fetch('/api/admin/integrations/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: permKey, value: !currentVal })
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSandbox = async () => {
    if (!newGuestName.trim()) return;
    setIsCreatingSandbox(true);
    try {
      const res = await fetch('/api/admin/sandbox/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestName: newGuestName, assignedBot: newGuestBot })
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setNewGuestName('');
        setNewGuestBot('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingSandbox(false);
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      
      {/* 1. Header & System Architecture Summary */}
      <div className="p-5 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Admin Personal Studio
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Multi-Tenant Isolated
            </span>
          </div>
          <h2 className="text-base font-semibold text-white tracking-tight font-sans flex items-center gap-2">
            <Cpu className="w-4 h-4 text-zinc-300" />
            <span>استودیوی اختصاصی مدیر، ارکستراسیون منابع هوش مصنوعی و حریم خصوصی</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>هسته آماده و ایمن</span>
        </div>
      </div>

      {/* Sub-Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/[0.08] backdrop-blur-xl">
        <button
          onClick={() => setIntegrationsSubView('auth-vault')}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium font-sans flex items-center gap-2 transition-all cursor-pointer ${
            integrationsSubView === 'auth-vault'
              ? 'bg-white/[0.12] text-white shadow-[0_0_15px_rgba(255,255,255,0.06)] border border-white/[0.15]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
          }`}
        >
          <ShieldCheck className={`w-3.5 h-3.5 ${integrationsSubView === 'auth-vault' ? 'text-sky-400' : 'text-zinc-400'}`} />
          <span>مدیریت کلیدهای امن و احراز هویت (Auth Manager)</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
            {credentialsCount} کلید
          </span>
        </button>

        <button
          onClick={() => setIntegrationsSubView('ai-providers')}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium font-sans flex items-center gap-2 transition-all cursor-pointer ${
            integrationsSubView === 'ai-providers'
              ? 'bg-white/[0.12] text-white shadow-[0_0_15px_rgba(255,255,255,0.06)] border border-white/[0.15]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${integrationsSubView === 'ai-providers' ? 'text-emerald-400' : 'text-zinc-400'}`} />
          <span>ارکستراسیون منابع و حریم خصوصی (AI & Privacy)</span>
        </button>

        <button
          onClick={() => setIntegrationsSubView('guest-sandboxes')}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium font-sans flex items-center gap-2 transition-all cursor-pointer ${
            integrationsSubView === 'guest-sandboxes'
              ? 'bg-white/[0.12] text-white shadow-[0_0_15px_rgba(255,255,255,0.06)] border border-white/[0.15]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
          }`}
        >
          <UserPlus className={`w-3.5 h-3.5 ${integrationsSubView === 'guest-sandboxes' ? 'text-purple-400' : 'text-zinc-400'}`} />
          <span>سندباکس دوستان و گیت‌هاب / نوشن (Sandboxes & Sync)</span>
        </button>
      </div>

      {/* VIEW 1: AUTH MANAGER */}
      {integrationsSubView === 'auth-vault' && (
        <AuthManager onCredentialsCountChange={setCredentialsCount} />
      )}

      {/* VIEW 2: AI PROVIDERS & PRIVACY ARCHITECTURE */}
      {integrationsSubView === 'ai-providers' && (
        <>
          {/* 2. Privacy Architecture: Resolving bale-auto vs bale-med */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* bale-auto Zero-Retention Card */}
        <div className="p-4 rounded-3xl backdrop-blur-2xl bg-gradient-to-br from-emerald-950/20 to-white/[0.02] border border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white font-sans">دامنه یادداشت و حساب‌کتاب شخصی (bale-auto)</h3>
                <span className="text-[10px] font-mono text-emerald-400">سیاست حریم خصوصی صفر (Zero-Retention Ephemeral)</span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              کاملاً خصوصی
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
            در این دامنه، هیچ داده‌ای خارج از عرف ثبت نمی‌شود. پردازش در حافظه فرار رم با TTL صورت گرفته، صف بازبینی سایه بایپس می‌شود تا پاسخ به سرعت برسد و متن خام بلافاصله پاکسازی می‌گردد.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] font-mono">
            <div className="p-2 rounded-xl bg-black/40 border border-white/[0.04]">
              <span className="text-zinc-500 block">لاگ در پایگاه داده:</span>
              <span className="text-emerald-400 font-semibold">مسدود (No-Log)</span>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-white/[0.04]">
              <span className="text-zinc-500 block">رفتار سایه:</span>
              <span className="text-emerald-400 font-semibold">ارسال آنی (Bypass)</span>
            </div>
          </div>
        </div>

        {/* bale-med Audited Clinical Card */}
        <div className="p-4 rounded-3xl backdrop-blur-2xl bg-gradient-to-br from-sky-950/20 to-white/[0.02] border border-sky-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-300">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white font-sans">دامنه بالینی و استعلام دارو (bale-med)</h3>
                <span className="text-[10px] font-mono text-sky-400">سیاست حسابرسی و رگولاتوری (Audited Clinical Ledger)</span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono">
              الزام رگولاتوری
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
            به علت قوانین درمان و سلامت، خطوط قرمز تریاژ و قیمت مصوب با موتورهای قطعی (Qanoon-Price) محاسبه شده و برای پاسخ‌های پرریسک، تایید داروساز (HITL) در صف سایه الزامی است.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] font-mono">
            <div className="p-2 rounded-xl bg-black/40 border border-white/[0.04]">
              <span className="text-zinc-500 block">ردپای حسابرسی:</span>
              <span className="text-sky-300 font-semibold">ثبت رویداد (Audit Trail)</span>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-white/[0.04]">
              <span className="text-zinc-500 block">تایید داروساز:</span>
              <span className="text-amber-300 font-semibold">الزامی در خطر بالا</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. AI Providers: Direct API vs Flat-fee Subscriptions + Pipeline Permissions */}
      <div className="p-5 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white font-sans flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>ارکستراسیون منابع هوش مصنوعی (Dual AI Provider)</span>
            </h3>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              امکان انتخاب میان کلیدهای مستقیم API (هزینه به ازای مصرف) و اکانت‌های اشتراکی ماهانه (Codex / ChatGPT Plus) برای کاهش هزینه‌ها.
            </p>
          </div>
        </div>

        {/* Provider Switcher Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleToggleProvider('gemini_direct')}
            className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
              data.activeAiProvider === 'gemini_direct'
                ? 'bg-purple-600/15 border-purple-500/40 text-white shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                : 'bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-white">Google GenAI Direct API</span>
              {data.activeAiProvider === 'gemini_direct' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
            </div>
            <p className="text-[11px] text-zinc-400 font-sans">
              اتصال مستقیم به Gemini 3.7 / 2.5 Flash با سرعت بالا و تاخیر حداقل.
            </p>
            <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-purple-300">
              process.env.GEMINI_API_KEY
            </span>
          </button>

          <button
            onClick={() => handleToggleProvider('codex_account_proxy')}
            className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
              data.activeAiProvider === 'codex_account_proxy'
                ? 'bg-purple-600/15 border-purple-500/40 text-white shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                : 'bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-white">Codex / Copilot Account Proxy</span>
              {data.activeAiProvider === 'codex_account_proxy' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
            </div>
            <p className="text-[11px] text-zinc-400 font-sans">
              استفاده از اشتراک ماهانه متصل، بدون کسر توکن شخصی از API.
            </p>
            <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-purple-300">
              OAuth Token / Subscription Bridge
            </span>
          </button>

          <button
            onClick={() => handleToggleProvider('chatgpt_subscription')}
            className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
              data.activeAiProvider === 'chatgpt_subscription'
                ? 'bg-purple-600/15 border-purple-500/40 text-white shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                : 'bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-white">ChatGPT Plus / Session Account</span>
              {data.activeAiProvider === 'chatgpt_subscription' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
            </div>
            <p className="text-[11px] text-zinc-400 font-sans">
              پل ارتباطی نشست وب برای انجام تسک‌های عمومی دوستان و دستیاران.
            </p>
            <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-purple-300">
              Session Cookie / Reverse Proxy
            </span>
          </button>
        </div>

        {/* Pipeline Permissions Gate */}
        <div className="pt-2">
          <span className="text-[11px] font-semibold text-zinc-300 block mb-2 font-sans">
            کنترل مجوزهای خط لوله برای ایجنت‌ها (Pipeline Permission Gate):
          </span>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleTogglePermission('allowDeterministicPricing')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-2 cursor-pointer transition-all ${
                data.pipelinePermissions.allowDeterministicPricing
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-black/30 border-white/[0.06] text-zinc-500'
              }`}
            >
              <span>موتور قیمت‌گذاری قطعی (Qanoon-Price)</span>
              <span className="text-[10px]">{data.pipelinePermissions.allowDeterministicPricing ? 'مجاز' : 'مسدود'}</span>
            </button>

            <button
              onClick={() => handleTogglePermission('allowDatabaseMutation')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-2 cursor-pointer transition-all ${
                data.pipelinePermissions.allowDatabaseMutation
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-black/30 border-white/[0.06] text-zinc-500'
              }`}
            >
              <span>تغییر در پایگاه داده سشن‌ها</span>
              <span className="text-[10px]">{data.pipelinePermissions.allowDatabaseMutation ? 'مجاز' : 'مسدود'}</span>
            </button>

            <button
              onClick={() => handleTogglePermission('allowWebScraping')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-2 cursor-pointer transition-all ${
                data.pipelinePermissions.allowWebScraping
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-black/30 border-white/[0.06] text-zinc-500'
              }`}
            >
              <span>ابزارهای وب‌اسکرپینگ و جستجو</span>
              <span className="text-[10px]">{data.pipelinePermissions.allowWebScraping ? 'مجاز' : 'مسدود'}</span>
            </button>
          </div>
        </div>
      </div>
      </>
      )}

      {/* VIEW 3: GUEST SANDBOXES & REPO/NOTION STUDIO */}
      {integrationsSubView === 'guest-sandboxes' && (
        <>
          {/* 4. Manager Studio: Notion & GitHub Integrations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* GitHub OAuth Connection */}
        <div className="p-4 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white">
                <GitBranch className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white font-sans">اتصال مخزن گیت‌هاب (GitHub OAuth)</h4>
                <p className="text-[10px] text-zinc-400 font-mono">همگام‌سازی ADRها، پایپ‌لاین‌ها و داکر فایل‌ها</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              متصل
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.05] text-xs font-mono text-zinc-300 flex items-center justify-between">
            <span>{data.github.repo} ({data.github.branch})</span>
            <span className="text-[10px] text-zinc-500">آخرین سینک: {data.github.lastSync}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-zinc-400 font-sans">روش احراز: توکن امن OAuth کلاینت</span>
            <button className="text-sky-400 hover:text-sky-300 font-mono text-[11px] flex items-center gap-1 cursor-pointer">
              <span>تست سینک</span>
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Notion Workspace Connection */}
        <div className="p-4 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white font-sans">اتصال فضای کار نوشن (Notion OAuth)</h4>
                <p className="text-[10px] text-zinc-400 font-mono">ثبت خودکار گزارشات اجرایی و پایگاه یادداشت‌ها</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              متصل
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.05] text-xs font-mono text-zinc-300 flex items-center justify-between">
            <span>{data.notion.workspace}</span>
            <span className="text-[10px] text-zinc-500">آخرین سینک: {data.notion.lastSync}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-zinc-400 font-sans">پایگاه داده متصل: Work Ledger & Tasks</span>
            <button className="text-sky-400 hover:text-sky-300 font-mono text-[11px] flex items-center gap-1 cursor-pointer">
              <span>سینک جداول</span>
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* 5. Guest Sandboxes: Isolated Agents for Friends & Colleague Bots */}
      <div className="p-5 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white font-sans flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>سندباکس ایجنت‌های دوستان و مهمانان (Multi-Tenant Sandboxes)</span>
            </h3>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              ایجاد بات و ایجنت اختصاصی برای دوستان و همکاران. داده‌ها، حافظه و تنظیمات آن‌ها در پارتیشن کاملاً ایزوله ذخیره شده و به هیچ‌وجه به داده‌ها، پرامپت‌ها و اطلاعات شما دسترسی ندارند.
            </p>
          </div>
        </div>

        {/* Existing Sandboxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.guestSandboxes.map((sbx) => (
            <div
              key={sbx.id}
              className="p-3.5 rounded-2xl bg-black/30 border border-white/[0.06] space-y-2 text-right"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white font-sans">{sbx.guestName}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {sbx.status === 'active' ? 'فعال' : 'متوقف'}
                </span>
              </div>
              <div className="text-[11px] font-mono text-zinc-300">{sbx.assignedBot}</div>
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-white/[0.04]">
                <span>مسیر حافظه ایزوله: {sbx.isolatedMemoryPath}</span>
                <span className="text-purple-300">{sbx.quotaUsed}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Add Guest Sandbox */}
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row items-center gap-2.5">
          <input
            type="text"
            placeholder="نام دوست یا مهمان (مثلاً نیما دستیار شخصی)"
            value={newGuestName}
            onChange={(e) => setNewGuestName(e.target.value)}
            className="flex-1 bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 font-sans"
          />
          <input
            type="text"
            placeholder="شناسه بات (مثلاً Telegram @nima_bot)"
            value={newGuestBot}
            onChange={(e) => setNewGuestBot(e.target.value)}
            className="flex-1 bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 font-sans"
          />
          <button
            onClick={handleCreateSandbox}
            disabled={isCreatingSandbox || !newGuestName.trim()}
            className="px-4 py-2 rounded-xl bg-white/[0.12] hover:bg-white/[0.18] text-white text-xs font-semibold font-sans transition-all cursor-pointer whitespace-nowrap disabled:opacity-40"
          >
            {isCreatingSandbox ? 'در حال ایجاد...' : 'ایجاد ایجنت ایزوله'}
          </button>
        </div>
      </div>
      </>
      )}

    </div>
  );
};

