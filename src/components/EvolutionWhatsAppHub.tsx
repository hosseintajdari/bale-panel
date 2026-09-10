import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  QrCode,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Send,
  BookMarked,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { EvolutionInstanceState, WhatsAppInstanceMode } from '../types';
import { authFetch } from '../utils/api';

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
      const res = await authFetch('/api/evolution/status');
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
      const res = await authFetch('/api/evolution/pair-code', {
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
      const res = await authFetch('/api/evolution/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (data.success && instance) {
        setInstance({ ...instance, mode });
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
    setTimeout(() => setPairingCopied(false), 2000);
  };

  const handleSimulateInbound = async () => {
    if (!simMessage.trim() || simRunning) return;
    setSimRunning(true);
    setSimResult(null);

    try {
      const res = await authFetch('/api/evolution/inbound-message', {
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
      setSimResult({ error: err.message || 'خطای ارتباط با سرور' });
    } finally {
      setSimRunning(false);
    }
  };

  const isPharmacyMode = instance?.mode === 'pharmacy_inbound';

  return (
    <div className="space-y-2.5 font-sans">
      {/* Top Banner: Status & Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0A0C10] border border-[#1C202B]">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-zinc-100 font-mono">
            WhatsApp Gateway (Evolution API v2)
          </span>
          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{instance?.instanceName || 'embednet-wa-primary'}</span>
          </span>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="flex items-center p-0.5 rounded-md bg-black/40 border border-white/[0.06] text-xs">
          <button
            onClick={() => handleSwitchMode('personal_notebook')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
              !isPharmacyMode
                ? 'bg-white/[0.12] text-white font-medium'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <BookMarked className="w-3 h-3 text-sky-400" />
            <span>Personal Notebook</span>
          </button>

          <button
            onClick={() => handleSwitchMode('pharmacy_inbound')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
              isPharmacyMode
                ? 'bg-white/[0.12] text-white font-medium'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Pharmacy Inbound (Anti-Ban)</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#0A0C10] border border-[#1C202B] text-xs font-mono">
        <button
          onClick={() => setActiveTab('pairing-code')}
          className={`px-2.5 py-1 rounded text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'pairing-code'
              ? 'bg-white/[0.1] text-white font-medium'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <KeyRound className="w-3 h-3 text-amber-400" />
          <span>8-Digit Pairing Code</span>
        </button>

        <button
          onClick={() => setActiveTab('qr-code')}
          className={`px-2.5 py-1 rounded text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'qr-code'
              ? 'bg-white/[0.1] text-white font-medium'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <QrCode className="w-3 h-3 text-sky-400" />
          <span>QR Code</span>
        </button>

        <button
          onClick={() => setActiveTab('antiban-settings')}
          className={`px-2.5 py-1 rounded text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'antiban-settings'
              ? 'bg-white/[0.1] text-white font-medium'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ShieldAlert className="w-3 h-3 text-emerald-400" />
          <span>Anti-Ban Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('simulate-chat')}
          className={`px-2.5 py-1 rounded text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'simulate-chat'
              ? 'bg-white/[0.1] text-white font-medium'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Send className="w-3 h-3 text-purple-400" />
          <span>Inbound Simulator</span>
        </button>
      </div>

      {/* TAB 1: PAIRING CODE */}
      {activeTab === 'pairing-code' && (
        <div className="p-3 rounded-lg bg-[#0A0C10] border border-[#1C202B] space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Input & Code Display */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-300 block font-mono">
                WhatsApp Phone Number (E.164 with country code):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+98 912 000 0000"
                  className="flex-1 bg-[#10131A] border border-[#1C202B] rounded-md px-2.5 py-1.5 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  dir="ltr"
                />
                <button
                  onClick={handleRequestPairingCode}
                  disabled={isRequestingCode}
                  className="px-3 py-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-zinc-200 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 shrink-0 font-mono"
                >
                  {isRequestingCode ? <RefreshCw className="w-3 h-3 animate-spin" /> : <KeyRound className="w-3 h-3" />}
                  <span>Generate</span>
                </button>
              </div>

              {/* Code Box */}
              <div className="p-2.5 rounded-md bg-black/50 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 font-mono block">8-digit Device Code:</span>
                  <span className="text-lg font-mono tracking-widest text-emerald-300 font-bold" dir="ltr">
                    {pairingCode}
                  </span>
                </div>
                <button
                  onClick={handleCopyPairingCode}
                  className="px-2.5 py-1 rounded bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-200 text-xs flex items-center gap-1 transition-colors cursor-pointer font-mono"
                  title="Copy code"
                >
                  {pairingCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300 text-[10px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-2.5 rounded-md bg-black/40 border border-[#1C202B] space-y-1.5 text-xs">
              <span className="font-semibold text-zinc-200 text-[11px] block font-mono">Quick Device Pairing (10 seconds):</span>
              <ol className="space-y-1 text-zinc-400 font-sans list-decimal list-inside leading-relaxed text-[11px]">
                <li>Open WhatsApp on phone → <strong className="text-zinc-200">Settings</strong> (or 3-dots menu).</li>
                <li>Tap <strong className="text-zinc-200">Linked Devices</strong>.</li>
                <li>Tap <strong className="text-zinc-200">Link a Device</strong>.</li>
                <li>Tap <strong className="text-emerald-300">Link with phone number instead</strong>.</li>
                <li>Enter code <span className="font-mono text-emerald-300 font-bold">{pairingCode}</span> on phone.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QR CODE */}
      {activeTab === 'qr-code' && (
        <div className="p-3 rounded-lg bg-[#0A0C10] border border-[#1C202B] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="space-y-2">
            <span className="font-semibold text-zinc-200 text-xs block font-mono">Scan Multi-Device QR Code</span>
            <p className="text-zinc-400 leading-relaxed font-sans max-w-md text-[11px]">
              Point your WhatsApp camera at the QR code. The token refreshes automatically every 20 seconds.
            </p>
            <button
              onClick={async () => {
                await authFetch('/api/evolution/qr-refresh', { method: 'POST' });
                fetchStatus();
              }}
              className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer font-mono"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh QR</span>
            </button>
          </div>

          <div className="p-3 rounded-lg bg-white flex flex-col items-center justify-center shrink-0">
            <div className="w-28 h-28 bg-zinc-950 rounded p-2 flex items-center justify-center relative">
              <QrCode className="w-16 h-16 text-emerald-400" />
            </div>
            <span className="text-[9px] text-zinc-700 font-mono mt-1">Multi-Device QR</span>
          </div>
        </div>
      )}

      {/* TAB 3: ANTI-BAN RULES */}
      {activeTab === 'antiban-settings' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-[#0A0C10] border border-emerald-500/20 space-y-1 text-xs">
            <div className="flex items-center justify-between text-emerald-300 font-mono text-[11px]">
              <span>1. Strict Inbound Only</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
              Outbound unsolicited messages are locked. Conversations must strictly initiate from customer/patient.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0A0C10] border border-emerald-500/20 space-y-1 text-xs">
            <div className="flex items-center justify-between text-emerald-300 font-mono text-[11px]">
              <span>2. Persist Ledger First</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
              Immediate audit logging into WorkLedger prior to dispatch prevents state loss on connection drop.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0A0C10] border border-emerald-500/20 space-y-1 text-xs">
            <div className="flex items-center justify-between text-emerald-300 font-mono text-[11px]">
              <span>3. Human Jitter + Typing</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
              Random 2-5s human response delay simulation accompanied by <code>composing...</code> typing event.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: SIMULATION */}
      {activeTab === 'simulate-chat' && (
        <div className="p-3 rounded-lg bg-[#0A0C10] border border-[#1C202B] space-y-2.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Input Form */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-200 text-[11px] font-mono">Inbound User Message:</span>
                <label className="text-[10px] text-zinc-400 flex items-center gap-1 cursor-pointer font-mono">
                  <input
                    type="checkbox"
                    checked={isCounterpartyInitiated}
                    onChange={(e) => setIsCounterpartyInitiated(e.target.checked)}
                    className="rounded accent-emerald-500"
                  />
                  <span>User-Initiated (Strict Inbound)</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={simSenderName}
                  onChange={(e) => setSimSenderName(e.target.value)}
                  placeholder="Sender name"
                  className="bg-[#10131A] border border-[#1C202B] rounded-md px-2.5 py-1 text-xs text-zinc-100 placeholder-zinc-500 font-sans"
                />
                <input
                  type="text"
                  value={simSenderPhone}
                  onChange={(e) => setSimSenderPhone(e.target.value)}
                  placeholder="+98912..."
                  className="bg-[#10131A] border border-[#1C202B] rounded-md px-2.5 py-1 text-xs text-zinc-100 font-mono placeholder-zinc-500"
                  dir="ltr"
                />
              </div>

              <textarea
                rows={2}
                value={simMessage}
                onChange={(e) => setSimMessage(e.target.value)}
                placeholder="Incoming message text..."
                className="w-full bg-[#10131A] border border-[#1C202B] rounded-md p-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500 resize-none font-sans"
                dir="rtl"
              />

              <button
                onClick={handleSimulateInbound}
                disabled={simRunning || !simMessage.trim()}
                className="w-full py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 font-mono"
              >
                {simRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Execute Inbound Pipeline</span>
              </button>
            </div>

            {/* Result Box */}
            <div className="p-2.5 rounded-md bg-black/40 border border-[#1C202B] flex flex-col justify-between text-xs min-h-[140px]">
              <div>
                <span className="font-semibold text-zinc-400 text-[10px] font-mono block mb-1.5">
                  Pipeline & Anti-Ban Evaluation:
                </span>

                {simResult ? (
                  simResult.error ? (
                    <div className="p-2 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300 text-[11px] space-y-1">
                      <div className="flex items-center gap-1 font-bold font-mono">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Blocked by Guard:</span>
                      </div>
                      <p className="font-sans">{simResult.error}</p>
                    </div>
                  ) : (
                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="flex items-center justify-between p-1.5 rounded bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
                        <span>Anti-Ban Check:</span>
                        <span className="font-bold">Strict Inbound Passed</span>
                      </div>
                      <div className="flex items-center justify-between p-1 rounded bg-white/[0.02] border border-white/[0.04] text-zinc-300">
                        <span>Ledger Item ID:</span>
                        <span className="text-zinc-100">{simResult.persistedInLedgerId}</span>
                      </div>
                      <div className="flex items-center justify-between p-1 rounded bg-white/[0.02] border border-white/[0.04] text-zinc-300">
                        <span>Human Jitter:</span>
                        <span className="text-amber-300">{simResult.humanJitterDelaySec}s + Typing event</span>
                      </div>
                      <div className="p-2 rounded bg-white/[0.03] border border-white/[0.06] text-zinc-200">
                        <span className="text-[9px] text-zinc-400 font-mono block">Proposed Reply:</span>
                        <div dir="rtl">
                          <p className="text-[11px] leading-relaxed select-text mt-0.5 font-sans">{simResult.reply}</p>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="h-28 flex items-center justify-center text-zinc-500 text-center text-[11px] font-mono">
                    Send test message to evaluate anti-ban guard and ledger persistence.
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
