import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  QrCode,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Send,
  BookMarked,
  Sliders,
  Sparkles,
  AlertTriangle,
  FileText,
  UserCheck
} from 'lucide-react';
import { EvolutionInstanceState, WhatsAppInstanceMode } from '../types';

interface EvolutionWhatsAppHubProps {
  onLedgerUpdated?: () => void;
  onShadowUpdated?: () => void;
}

export const EvolutionWhatsAppHub: React.FC<EvolutionWhatsAppHubProps> = ({
  onLedgerUpdated,
  onShadowUpdated,
}) => {
  const [instance, setInstance] = useState<EvolutionInstanceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pairing-code' | 'qr-code' | 'antiban-settings' | 'simulate-chat'>('pairing-code');

  // Pairing Code inputs
  const [phoneNumber, setPhoneNumber] = useState('+98 912 845 1020');
  const [pairingCode, setPairingCode] = useState<string>('8K3M-9P4W');
  const [pairingCopied, setPairingCopied] = useState(false);
  const [isRequestingCode, setIsRequestingCode] = useState(false);

  // Inbound Simulation
  const [simSenderPhone, setSimSenderPhone] = useState('+98 935 120 4490');
  const [simSenderName, setSimSenderName] = useState('بیمار (مشتری داروخانه)');
  const [simMessage, setSimMessage] = useState('سلام خسته نباشید، کپسول کوآموکسی کلاو ۶۲۵ دارید؟ قیمتش چنده؟');
  const [isCounterpartyInitiated, setIsCounterpartyInitiated] = useState(true);
  const [simRunning, setSimRunning] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);

  // Fetch instance status
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/evolution/status');
      const data = await res.json();
      if (data.success && data.instance) {
        setInstance(data.instance);
        if (data.instance.pairingCode) setPairingCode(data.instance.pairingCode);
        if (data.instance.connectedPhone) setPhoneNumber(data.instance.connectedPhone);
      }
    } catch (err) {
      console.error('Error fetching evolution instance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRequestPairingCode = async () => {
    if (!phoneNumber.trim()) return;
    setIsRequestingCode(true);
    try {
      const res = await fetch('/api/evolution/pair-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      if (data.success) {
        setPairingCode(data.pairingCode);
        fetchStatus();
      }
    } catch (err) {
      console.error('Error getting pairing code:', err);
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleSwitchMode = async (mode: WhatsAppInstanceMode) => {
    try {
      const res = await fetch('/api/evolution/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (data.success && instance) {
        setInstance({ ...instance, mode });
        // Adjust simulation text based on mode
        if (mode === 'personal_notebook') {
          setSimSenderName('من (مالک بات شخصی)');
          setSimMessage('هزینه بنزین ۲۵۰ هزار تومن و جلسه با تیم فنی برای روز یکشنبه ساعت ۳ رو یادداشت کن.');
        } else {
          setSimSenderName('بیمار (مشتری داروخانه)');
          setSimMessage('سلام خسته نباشید، کپسول کوآموکسی کلاو ۶۲۵ دارید؟ قیمتش چنده؟');
        }
      }
    } catch (err) {
      console.error('Error switching mode:', err);
    }
  };

  const handleCopyPairingCode = () => {
    navigator.clipboard.writeText(pairingCode.replace('-', ''));
    setPairingCopied(true);
    setTimeout(() => setPairingCopied(false), 2500);
  };

  const handleSimulateInbound = async () => {
    if (!simMessage.trim() || simRunning) return;
    setSimRunning(true);
    setSimResult(null);

    try {
      const res = await fetch('/api/evolution/inbound-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderPhone: simSenderPhone,
          senderName: simSenderName,
          messageText: simMessage,
          isInitiatedByCounterparty: isCounterpartyInitiated,
        }),
      });

      const data = await res.json();
      setSimResult(data);
      if (data.success) {
        fetchStatus();
        if (onLedgerUpdated) onLedgerUpdated();
        if (onShadowUpdated) onShadowUpdated();
      }
    } catch (err: any) {
      setSimResult({ error: err.message || 'خطای شبکه' });
    } finally {
      setSimRunning(false);
    }
  };

  const isPharmacyMode = instance?.mode === 'pharmacy_inbound';

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top Banner: Status & Mode Selector */}
      <div className="p-4 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Evolution API v2</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                Instance: {instance?.instanceName || 'embednet-wa-primary'}
              </span>
            </div>

            <h2 className="text-sm font-semibold text-white tracking-tight font-sans flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>اتصال واتساپ و مدیریت سشن (WhatsApp Gateway & Anti-Ban)</span>
            </h2>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center p-1 rounded-2xl bg-black/40 border border-white/[0.08] text-xs">
            <button
              onClick={() => handleSwitchMode('personal_notebook')}
              className={`px-3.5 py-1.5 rounded-xl transition-all font-sans cursor-pointer flex items-center gap-1.5 ${
                !isPharmacyMode
                  ? 'bg-white/[0.14] text-white border border-white/[0.15] shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5 text-sky-400" />
              <span>دفترچه چت شخصی</span>
            </button>

            <button
              onClick={() => handleSwitchMode('pharmacy_inbound')}
              className={`px-3.5 py-1.5 rounded-xl transition-all font-sans cursor-pointer flex items-center gap-1.5 ${
                isPharmacyMode
                  ? 'bg-white/[0.14] text-white border border-white/[0.15] shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>واتساپ داروخانه (ضد بلاک)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-tabs: Pairing Code (No QR Pain), QR Scan, Anti-Ban Invariants, Test Simulator */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/[0.08] backdrop-blur-xl">
        <button
          onClick={() => setActiveTab('pairing-code')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium font-sans flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'pairing-code'
              ? 'bg-white/[0.12] text-white border border-white/[0.15]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
          <span>کد اتصال ۸ رقمی (Pairing Code - بدون دوربین)</span>
        </button>

        <button
          onClick={() => setActiveTab('qr-code')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium font-sans flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'qr-code'
              ? 'bg-white/[0.12] text-white border border-white/[0.15]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <QrCode className="w-3.5 h-3.5 text-sky-400" />
          <span>اسکن کیو‌آر (QR Code)</span>
        </button>

        <button
          onClick={() => setActiveTab('antiban-settings')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium font-sans flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'antiban-settings'
              ? 'bg-white/[0.12] text-white border border-white/[0.15]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
          <span>قوانین ضد مسدودی حساب (Anti-Ban Guard)</span>
        </button>

        <button
          onClick={() => setActiveTab('simulate-chat')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium font-sans flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'simulate-chat'
              ? 'bg-white/[0.12] text-white border border-white/[0.15]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Send className="w-3.5 h-3.5 text-purple-400" />
          <span>تست زنده پیام ورودی و ثبت در دفترچه</span>
        </button>
      </div>

      {/* TAB 1: PAIRING CODE (SOLVES QR FAILURES) */}
      {activeTab === 'pairing-code' && (
        <div className="p-5 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Input Side */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-zinc-300 block">شماره تلفن اکانت واتساپ (با کد کشور ۹۸):</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+98 912 000 0000"
                  className="flex-1 bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/30"
                  dir="ltr"
                />
                <button
                  onClick={handleRequestPairingCode}
                  disabled={isRequestingCode}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-xs font-medium text-emerald-200 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isRequestingCode ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                  <span>دریافت کد اتصال عددی</span>
                </button>
              </div>

              {/* Code Display Box */}
              <div className="p-4 rounded-2xl bg-black/50 border border-emerald-500/30 flex flex-col items-center justify-center space-y-2">
                <span className="text-[11px] font-sans text-zinc-400">کد جفت‌سازی ۸ رقمی (بدون نیاز به اسکن دوربین):</span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-mono tracking-widest text-emerald-300 font-bold px-3 py-1 rounded-xl bg-emerald-950/40 border border-emerald-500/20" dir="ltr">
                    {pairingCode}
                  </span>
                  <button
                    onClick={handleCopyPairingCode}
                    className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] text-zinc-200 transition-all cursor-pointer"
                    title="کپی کد"
                  >
                    {pairingCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick 3-step Instructions */}
            <div className="p-4 rounded-2xl bg-black/30 border border-white/[0.06] space-y-2.5 text-xs">
              <span className="font-semibold text-zinc-200 block">نحوه اتصال در واتساپ گوشی (کمتر از ۱۰ ثانیه):</span>
              <ul className="space-y-2 text-zinc-400 font-sans list-disc list-inside leading-relaxed">
                <li>در واتساپ گوشی به منوی <strong className="text-zinc-200">Settings</strong> یا سه نقطه بروید.</li>
                <li>گزینه <strong className="text-zinc-200">Linked Devices</strong> (دستگاه‌های متصل) را باز کنید.</li>
                <li>روی <strong className="text-zinc-200">Link a Device</strong> تپ کنید.</li>
                <li>در پایین صفحه اسکن، روی <strong className="text-emerald-300">Link with phone number instead</strong> تپ کنید.</li>
                <li>کد <span className="font-mono text-emerald-300 font-bold">{pairingCode}</span> را در گوشی وارد کنید.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QR CODE */}
      {activeTab === 'qr-code' && (
        <div className="p-5 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-xs">
            <span className="font-semibold text-zinc-200 text-sm block">اسکن تصویری کیو‌آر کد</span>
            <p className="text-zinc-400 leading-relaxed font-sans max-w-md">
              در صورت تمایل به اسکن دوربینی، دوربین واتساپ را مقابل این بارکد بگیرید. در صورت قطعی یا انقضا، دکمه تازه‌سازی را بزنید.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  await fetch('/api/evolution/qr-refresh', { method: 'POST' });
                  fetchStatus();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تجدید بارکد (Refresh QR)</span>
              </button>
              <span className="text-zinc-400 font-mono text-[11px]">
                انقضا: هر ۲۰ ثانیه
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white flex flex-col items-center justify-center shadow-2xl">
            {/* Visual QR representation */}
            <div className="w-44 h-44 bg-zinc-900 rounded-xl p-2 flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 relative overflow-hidden">
              <div className="grid grid-cols-6 gap-1 w-full h-full p-2 opacity-85">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-xs ${
                      (i % 2 === 0 && i % 3 !== 0) || i === 0 || i === 5 || i === 30
                        ? 'bg-white'
                        : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                <QrCode className="w-12 h-12 text-emerald-400" />
              </div>
            </div>
            <span className="text-[10px] text-zinc-800 font-mono mt-2">Evolution Multi-Device QR</span>
          </div>
        </div>
      )}

      {/* TAB 3: ANTI-BAN INVARIANTS (STRICT ZERO-BAN POLICY) */}
      {activeTab === 'antiban-settings' && (
        <div className="p-5 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Invariant 1 */}
            <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-300 font-sans">۱. ورود پیام از طرف مقابل (Strict Inbound)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                ارسال پیام اولیه (Cold Message) به افراد غریبه قفل است. مکالمه منحصراً با پیام بیمار یا مخاطب آغاز می‌شود.
              </p>
            </div>

            {/* Invariant 2 */}
            <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-300 font-sans">۲. ذخیره در دفترچه پیش از پاسخ</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                به محض رسیدن وب‌هوک، متن در Work Ledger پایدار می‌شود تا حتی در صورت قطعی شبکه یا خطای سرور سشن از بین نرود.
              </p>
            </div>

            {/* Invariant 3 */}
            <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-300 font-sans">۳. تاخیر انسانی و ارسال Presence</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                اعمال تاخیر تصادفی بین ۲ تا ۵ ثانیه همراه با پکت <code>composing...</code> (در حال تایپ) جهت رفتار طبیعی انسان.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SIMULATE INBOUND CHAT & LEDGER INGESTION */}
      {activeTab === 'simulate-chat' && (
        <div className="p-5 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Message Inputs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200">فرستنده پیام ورودی:</span>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-zinc-400 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCounterpartyInitiated}
                      onChange={(e) => setIsCounterpartyInitiated(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span>پیام اول از سمت کاربر است (مجاز برای ضد بلاک)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={simSenderName}
                  onChange={(e) => setSimSenderName(e.target.value)}
                  placeholder="نام فرستنده"
                  className="bg-black/40 border border-white/[0.1] rounded-xl px-3 py-1.5 text-xs text-zinc-100"
                />
                <input
                  type="text"
                  value={simSenderPhone}
                  onChange={(e) => setSimSenderPhone(e.target.value)}
                  placeholder="+98912..."
                  className="bg-black/40 border border-white/[0.1] rounded-xl px-3 py-1.5 text-xs text-zinc-100 font-mono"
                  dir="ltr"
                />
              </div>

              <textarea
                rows={3}
                value={simMessage}
                onChange={(e) => setSimMessage(e.target.value)}
                placeholder="متن پیام ورودی..."
                className="w-full bg-black/40 border border-white/[0.1] rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-white/30 resize-none font-sans"
              />

              <button
                onClick={handleSimulateInbound}
                disabled={simRunning || !simMessage.trim()}
                className="w-full py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-xs font-semibold text-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {simRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>اجرای شبیه‌سازی دریافت پیام و خط لوله ضد بلاک</span>
              </button>
            </div>

            {/* Results Box */}
            <div className="p-4 rounded-2xl bg-black/50 border border-white/[0.08] flex flex-col justify-between text-xs space-y-3">
              <div>
                <span className="font-semibold text-zinc-300 block mb-2">نتیجه اجرای خط لوله و محافظت ضد مسدودی:</span>
                
                {simResult ? (
                  simResult.error ? (
                    <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>رد شده توسط سپر ضد بلاک:</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{simResult.error}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-[11px] font-mono">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
                        <span>سپر ضد بلاک:</span>
                        <span className="font-bold">تایید شد (Strict Inbound Passed)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-zinc-300">
                        <span>شناسه ذخیره در دفترچه (Ledger):</span>
                        <span className="text-zinc-100">{simResult.persistedInLedgerId}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-zinc-300">
                        <span>تاخیر شبیه‌ساز انسان (Human Jitter):</span>
                        <span className="text-amber-300">{simResult.humanJitterDelaySec} ثانیه + پکت Typing</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-200 font-sans space-y-1">
                        <span className="text-[10px] text-zinc-400 font-mono block">پاسخ استخراج‌شده:</span>
                        <p className="leading-relaxed">{simResult.reply}</p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="h-40 flex items-center justify-center text-zinc-500 text-center">
                    پیام را ارسال کنید تا مراحل اعتبارسنجی ضد بلاک و ذخیره در دفترچه به صورت زنده نمایش داده شوند.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
