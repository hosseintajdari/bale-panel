import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Key,
  Lock,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  FileCode,
  Eye,
  EyeOff,
  GitBranch,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Terminal,
  Cpu,
  Layers,
  ChevronDown
} from 'lucide-react';
import { AuthCredentialItem, AuthCredentialService, AuthVaultStatus } from '../types';
import { authFetch } from '../utils/api';

interface AuthManagerProps {
  onCredentialsCountChange?: (count: number) => void;
}

export const AuthManager: React.FC<AuthManagerProps> = ({ onCredentialsCountChange }) => {
  const [credentials, setCredentials] = useState<AuthCredentialItem[]>([]);
  const [vaultStatus, setVaultStatus] = useState<AuthVaultStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [envExportText, setEnvExportText] = useState('');
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [testResult, setTestResult] = useState<{ id: string; message: string; success: boolean } | null>(null);
  const [isTesting, setIsTesting] = useState<string | null>(null);

  // Form State
  const [service, setService] = useState<AuthCredentialService>('github');
  const [label, setLabel] = useState('');
  const [secret, setSecret] = useState('');
  const [agentId, setAgentId] = useState('agent-devops');
  const [agentName, setAgentName] = useState('دستیار کدنویسی و DevOps');
  const [taskScope, setTaskScope] = useState('همگام‌سازی کدهای مخزن، ایجاد PR و بازبینی کامیت‌ها');
  const [showSecret, setShowSecret] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch stored credentials from secure backend vault
  const fetchCredentials = async () => {
    try {
      setIsLoading(true);
      const res = await authFetch('/api/admin/auth-credentials');
      const data = await res.json();
      if (data.success) {
        setCredentials(data.credentials || []);
        setVaultStatus(data.vaultStatus || null);
        if (onCredentialsCountChange) {
          onCredentialsCountChange(data.credentials?.length || 0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch auth credentials:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  // Update presets when service changes
  const handleServiceChange = (newService: AuthCredentialService) => {
    setService(newService);
    if (newService === 'github') {
      setLabel('GitHub Token - همگام‌سازی مخازن و خودکارسازی');
      setAgentId('agent-devops');
      setAgentName('دستیار کدنویسی و DevOps');
      setTaskScope('همگام‌سازی کدهای مخزن، ثبت Release و بازبینی کامیت‌ها');
    } else if (newService === 'notion') {
      setLabel('Notion API Secret - پایگاه اسناد و Work Ledger');
      setAgentId('agent-ledger');
      setAgentName('ایجنت مستندسازی و تسک‌ها');
      setTaskScope('ثبت خودکار گزارشات سشن‌ها و وظایف در دیتابیس نوشن');
    } else if (newService === 'openai') {
      setLabel('OpenAI API Key - استدلال پشتیبان و مدل‌های مکمل');
      setAgentId('agent-reasoning');
      setAgentName('ایجنت استدلال عمیق ও فال‌بک');
      setTaskScope('تولید امبدینگ، تحلیل پیچیده و فال‌بک زمان اختلال شبکه');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!secret.trim()) {
      setErrorMessage('لطفاً کلید یا توکن محرمانه را وارد نمایید.');
      return;
    }
    if (!label.trim()) {
      setErrorMessage('لطفاً یک عنوان برای این اعتبارنامه تعیین کنید.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await authFetch('/api/admin/auth-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service,
          label,
          agentId,
          agentName,
          secret,
          taskScope,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در ثبت کلید');
      }

      setSuccessMessage(data.message || 'کلید با موفقیت رمزنگاری و در پیکربندی ذخیره شد.');
      setCredentials(data.credentials || []);
      setSecret('');
      setIsFormOpen(false);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'خطای غیرمنتظره در رمزنگاری کلید');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, itemLabel: string) => {
    if (!window.confirm(`آیا از حذف اعتبارنامه «${itemLabel}» از مخزن و متغیرهای محیطی اطمینان دارید؟`)) {
      return;
    }

    try {
      const res = await authFetch(`/api/admin/auth-credentials/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setCredentials(data.credentials || []);
      }
    } catch (err) {
      console.error('Failed to delete credential:', err);
    }
  };

  const handleTestCredential = async (id: string) => {
    try {
      setIsTesting(id);
      setTestResult(null);
      const res = await authFetch(`/api/admin/auth-credentials/test/${id}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          id,
          message: `${data.message} (${data.formatDetail})`,
          success: true,
        });
      } else {
        setTestResult({
          id,
          message: data.error || 'خطا در اعتبارسنجی',
          success: false,
        });
      }
    } catch (err: any) {
      setTestResult({
        id,
        message: 'خطا در اتصال به سرور جهت تست کلید',
        success: false,
      });
    } finally {
      setIsTesting(null);
    }
  };

  const handleOpenExport = async () => {
    try {
      const res = await authFetch('/api/admin/auth-credentials/env-export');
      const data = await res.json();
      if (data.success) {
        setEnvExportText(data.envText);
        setIsExportOpen(true);
      }
    } catch (err) {
      console.error('Failed to export env:', err);
    }
  };

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envExportText);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  return (
    <div className="p-5 rounded-3xl bg-[#0A0C10] border border-[#1C202B] shadow-2xl space-y-5" dir="rtl">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-sky-400" />
              <span>AES-256-GCM Secure Vault</span>
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Env Config Storage</span>
            </span>
          </div>

          <h2 className="text-base font-semibold text-white tracking-tight font-sans flex items-center gap-2">
            <Key className="w-4 h-4 text-zinc-300" />
            <span>مدیریت کلیدهای امن ایجنت‌ها (Agent Auth Manager)</span>
          </h2>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleOpenExport}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs text-zinc-300 hover:text-white font-mono flex items-center gap-1.5 transition-all cursor-pointer"
            title="مشاهده متغیرهای رمزشده برای قرار دادن در .env"
          >
            <FileCode className="w-3.5 h-3.5 text-zinc-400" />
            <span>خروجی متغیرهای محیطی</span>
          </button>

          <button
            onClick={() => {
              setIsFormOpen(!isFormOpen);
              setErrorMessage('');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-sky-600/30 hover:bg-sky-600/40 border border-sky-500/40 text-xs font-semibold text-sky-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.15)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن اعتبارنامه جدید</span>
          </button>
        </div>
      </div>

      {/* Success notification banner */}
      {successMessage && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 font-sans animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Collapsible Add Credential Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-black/40 border border-sky-500/30 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <span className="text-xs font-semibold text-white flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-sky-400" />
              <span>پیکربندی کلید محرمانه برای ایجنت اختصاصی</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              کلید خام هرگز در دیتابیس بدون رمز ذخیره نخواهد شد
            </span>
          </div>

          {/* Service Selector Chips */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-300 font-sans block">انتخاب سرویس مقصد:</label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleServiceChange('github')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-sans transition-all cursor-pointer ${
                  service === 'github'
                    ? 'bg-purple-600/20 border-purple-500/40 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                    : 'bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                <span>GitHub PAT / Token</span>
              </button>

              <button
                type="button"
                onClick={() => handleServiceChange('notion')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-sans transition-all cursor-pointer ${
                  service === 'notion'
                    ? 'bg-amber-600/20 border-amber-500/40 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Notion Internal Secret</span>
              </button>

              <button
                type="button"
                onClick={() => handleServiceChange('openai')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-sans transition-all cursor-pointer ${
                  service === 'openai'
                    ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>OpenAI API Key</span>
              </button>
            </div>
          </div>

          {/* Grid of Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Label Input */}
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-300 font-sans block">عنوان اعتبارنامه:</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="مثال: GitHub Token - همگام‌سازی هسته"
                className="w-full bg-black/50 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500/50 font-sans"
              />
            </div>

            {/* Target Agent Selection */}
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-300 font-sans block">ایجنت منتسب (Agent Assignment):</label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="مثال: دستیار کدنویسی و DevOps"
                className="w-full bg-black/50 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500/50 font-sans"
              />
            </div>
          </div>

          {/* Task Scope */}
          <div className="space-y-1">
            <label className="text-[11px] text-zinc-300 font-sans block">ماموریت و تسک‌های مجاز برای این کلید (Task Scope):</label>
            <input
              type="text"
              value={taskScope}
              onChange={(e) => setTaskScope(e.target.value)}
              placeholder="مثال: همگام‌سازی کدهای مخزن، بررسی Pull Requestها و انتشار Release"
              className="w-full bg-black/50 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500/50 font-sans"
            />
          </div>

          {/* Secret Token Input with Visibility Toggle */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-zinc-300 font-sans block">
                {service === 'github' && 'توکن شخصی گیت‌هاب (Personal Access Token - ghp_...):'}
                {service === 'notion' && 'توکن اینتگریشن داخلی نوشن (Internal Secret - secret_...):'}
                {service === 'openai' && 'کلید محرمانه OpenAI (sk-proj-... یا sk-...):'}
              </label>
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono cursor-pointer"
              >
                {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showSecret ? 'مخفی‌سازی' : 'نمایش کاراکترها'}</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder={
                  service === 'github'
                    ? 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
                    : service === 'notion'
                    ? 'secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
                    : 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
                }
                className="w-full bg-black/60 border border-white/[0.1] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500/60"
              />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono block">
              فرمت ذخیره‌سازی در پیکربندی: <span className="text-zinc-400">AGENT_AUTH_{service.toUpperCase()}_{agentId.toUpperCase()}="enc:aes-256-gcm:..."</span>
            </span>
          </div>

          {/* Error display */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2 font-sans">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-zinc-400 hover:text-white text-xs font-sans transition-all cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold font-sans transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(2,132,199,0.3)] disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال رمزنگاری با AES-256-GCM...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>رمزنگاری و ذخیره در پیکربندی محیط</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Credentials List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-sans px-1">
          <span>کلیدهای رمزنگاری‌شده فعال برای ایجنت‌ها ({credentials.length}):</span>
          <span className="text-[11px] font-mono text-zinc-500">
            الگوریتم رمزنگاری: AES-256-GCM با تگ احراز اصالت ۱۶ بایتی
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-400 font-sans flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-zinc-300" />
            <span>در حال بارگذاری کلیدهای امن مخزن...</span>
          </div>
        ) : credentials.length === 0 ? (
          <div className="p-8 rounded-2xl bg-black/20 border border-dashed border-white/[0.08] text-center space-y-2">
            <Lock className="w-6 h-6 text-zinc-500 mx-auto" />
            <p className="text-xs text-zinc-400 font-sans">هیچ کلید رمزنگاری‌شده‌ای هنوز اضافه نشده است.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="text-xs text-sky-400 hover:text-sky-300 font-sans cursor-pointer underline"
            >
              افزودن اولین اعتبارنامه امن
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {credentials.map((cred) => {
              const isItemTesting = isTesting === cred.id;
              const hasTestResult = testResult && testResult.id === cred.id;

              return (
                <div
                  key={cred.id}
                  className="p-4 rounded-2xl bg-black/30 border border-white/[0.06] hover:border-white/[0.12] transition-all space-y-3"
                >
                  {/* Top Row: Service, Label, Agent, Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {/* Service Icon Badge */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                        cred.service === 'github'
                          ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                          : cred.service === 'notion'
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      }`}>
                        {cred.service === 'github' && <GitBranch className="w-4 h-4" />}
                        {cred.service === 'notion' && <FileText className="w-4 h-4" />}
                        {cred.service === 'openai' && <Sparkles className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-white font-sans">{cred.label}</h4>
                          <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full border ${
                            cred.service === 'github'
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                              : cred.service === 'notion'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          }`}>
                            {cred.service.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400 font-sans block">
                          ایجنت مجاز: <span className="text-zinc-200">{cred.agentName}</span>
                        </span>
                      </div>
                    </div>

                    {/* Actions: Test Decryption, Delete */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleTestCredential(cred.id)}
                        disabled={isItemTesting}
                        className="px-2.5 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[11px] font-sans text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        title="تست رمزگشایی و اصالت احراز هویت با Auth Tag"
                      >
                        <RefreshCw className={`w-3 h-3 ${isItemTesting ? 'animate-spin text-sky-400' : 'text-zinc-400'}`} />
                        <span>{isItemTesting ? 'در حال تست...' : 'تست اعتبار'}</span>
                      </button>

                      <button
                        onClick={() => handleDelete(cred.id, cred.label)}
                        className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 border border-white/[0.06] hover:border-rose-500/30 text-zinc-400 hover:text-rose-300 transition-all cursor-pointer"
                        title="حذف و پاکسازی از متغیرهای محیطی"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Task Scope */}
                  <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[11px] text-zinc-300 font-sans flex items-start gap-2">
                    <span className="text-zinc-500 text-[10px] shrink-0 font-mono mt-0.5">دامنه وظایف:</span>
                    <span>{cred.taskScope}</span>
                  </div>

                  {/* Encrypted Telemetry Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-mono">
                    <div className="p-2 rounded-xl bg-black/40 border border-white/[0.04] flex items-center justify-between">
                      <span className="text-zinc-500">کلید ماسک‌شده:</span>
                      <span className="text-zinc-300 font-semibold">{cred.maskedSecret}</span>
                    </div>

                    <div className="p-2 rounded-xl bg-black/40 border border-white/[0.04] flex items-center justify-between">
                      <span className="text-zinc-500">متغیر محیطی:</span>
                      <span className="text-sky-300 font-semibold truncate max-w-[140px]" title={cred.envKeyName}>
                        {cred.envKeyName}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-black/40 border border-white/[0.04] flex items-center justify-between">
                      <span className="text-zinc-500">مشخصه اصالت:</span>
                      <span className="text-purple-300 font-semibold">
                        Tag: {cred.authTagPreview}… | IV: {cred.ivPreview}…
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Test Result Box */}
                  {hasTestResult && (
                    <div className={`p-2.5 rounded-xl border text-xs font-sans flex items-center gap-2 animate-fade-in ${
                      testResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                    }`}>
                      {testResult.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
                      )}
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Export .env Encrypted Modal / Drawer */}
      {isExportOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-[#0D1117] border border-white/[0.12] rounded-3xl p-5 space-y-4 shadow-2xl animate-fade-in text-right">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-white font-sans">
                  خروجی متغیرهای رمزنگاری‌شده محیطی (.env)
                </h3>
              </div>
              <button
                onClick={() => setIsExportOpen(false)}
                className="text-xs text-zinc-400 hover:text-white font-sans px-2 py-1 rounded-lg bg-white/[0.05] cursor-pointer"
              >
                بستن
              </button>
            </div>

            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              این قطعه‌کد حاوی متغیرهای محیطی با فرمت کاملاً رمزنگاری‌شده <span className="text-zinc-200 font-mono">enc:aes-256-gcm</span> برای کانتینر یا سرور است. هیچ متن خامی در آن وجود ندارد و افشای فایل `.env` نیز کلیدهای اصلی شما را لو نخواهد داد.
            </p>

            <div className="relative">
              <textarea
                readOnly
                rows={9}
                value={envExportText}
                className="w-full bg-black/60 border border-white/[0.08] rounded-xl p-3 text-[11px] font-mono text-emerald-300 focus:outline-none resize-none leading-relaxed"
                dir="ltr"
              />
              <button
                onClick={handleCopyEnv}
                className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-lg bg-white/[0.1] hover:bg-white/[0.18] text-white text-xs font-sans flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedEnv ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>کپی کد</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-2 border-t border-white/[0.06]">
              <span>تعداد کلیدهای رمزشده: {credentials.length}</span>
              <span>کلید اصلی: VAULT_MASTER_KEY (Sha256 Derived)</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
