import React, { useState, useEffect, memo } from 'react';
import {
  Key,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Lock,
  GitBranch,
  FileText,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Server,
  AlertCircle,
  Cpu,
  Terminal,
  Radio,
} from 'lucide-react';
import { authFetch } from '../utils/api';

interface ApiKeyItem {
  id: string;
  name: string;
  role: 'admin' | 'operator' | 'auditor';
  tenant_id: string;
  created_at: string;
  last_used_at: string | null;
}

interface VaultCredential {
  id: string;
  service: string;
  label: string;
  maskedSecret?: string;
  status: string;
}

export const McpAccountsGrid = memo(() => {
  // API Keys (Phase 4 RBAC)
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [isKeysLoading, setIsKeysLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRole, setNewKeyRole] = useState<'admin' | 'operator' | 'auditor'>('operator');
  const [newKeyTenant, setNewKeyTenant] = useState('default');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isCreatingKey, setIsCreatingKey] = useState(false);

  // Bale Webhook
  const [baleWebhookUrl, setBaleWebhookUrl] = useState('');
  const [baleSecretToken, setBaleSecretToken] = useState('');
  const [isSettingWebhook, setIsSettingWebhook] = useState(false);
  const [webhookFeedback, setWebhookFeedback] = useState<{ msg: string; success: boolean } | null>(null);

  // Fetch API Keys
  const fetchKeys = async () => {
    try {
      setIsKeysLoading(true);
      const res = await authFetch('/api/admin/keys');
      const data = await res.json();
      if (data.success && data.keys) {
        setApiKeys(data.keys);
      }
    } catch (e) {
      console.error('Failed to fetch api keys:', e);
    } finally {
      setIsKeysLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || isCreatingKey) return;

    setIsCreatingKey(true);
    setGeneratedToken(null);
    try {
      const res = await authFetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName.trim(),
          role: newKeyRole,
          tenant_id: newKeyTenant.trim() || 'default',
        }),
      });
      const data = await res.json();
      if (data.success && data.rawToken) {
        setGeneratedToken(data.rawToken);
        setNewKeyName('');
        fetchKeys();
      }
    } catch (e) {
      console.error('Key creation failed:', e);
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/keys/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setApiKeys((prev) => prev.filter((k) => k.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete key:', e);
    }
  };

  const handleSetBaleWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baleWebhookUrl.trim() || isSettingWebhook) return;

    setIsSettingWebhook(true);
    setWebhookFeedback(null);
    try {
      const res = await authFetch('/api/admin/bale/set-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: baleWebhookUrl.trim(),
          secret_token: baleSecretToken.trim() || undefined,
        }),
      });
      const data = await res.json();
      setWebhookFeedback({
        msg: data.message || (data.success ? 'وب‌هوک بله با موفقیت ثبت شد' : 'خطا در ثبت وب‌هوک'),
        success: !!data.success,
      });
    } catch (e: any) {
      setWebhookFeedback({ msg: 'خطا در ارتباط با سرور: ' + e.message, success: false });
    } finally {
      setIsSettingWebhook(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Top Telemetry Summary Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="p-3 rounded-lg bg-[#0A0C10] border border-[#1C202B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-zinc-500 uppercase">Vault Security</div>
              <div className="text-xs font-semibold text-zinc-200">AES-256-GCM</div>
            </div>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>

        <div className="p-3 rounded-lg bg-[#0A0C10] border border-[#1C202B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <Key className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-zinc-500 uppercase">Active Keys</div>
              <div className="text-xs font-semibold text-zinc-200">{apiKeys.length} Scoped Keys</div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-sky-400">RBAC</span>
        </div>

        <div className="p-3 rounded-lg bg-[#0A0C10] border border-[#1C202B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-zinc-500 uppercase">AI Pipeline</div>
              <div className="text-xs font-semibold text-zinc-200">Gemini 2.5 Flash</div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400">Live</span>
        </div>

        <div className="p-3 rounded-lg bg-[#0A0C10] border border-[#1C202B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <Server className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-zinc-500 uppercase">Persistence</div>
              <div className="text-xs font-semibold text-zinc-200">SQLite (WAL)</div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">Sync</span>
        </div>
      </div>

      {/* Generated Token Banner (If any) */}
      {generatedToken && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>New API key generated. Make sure to copy it now; you won't be able to see it again:</span>
            </div>
            <button
              onClick={() => setGeneratedToken(null)}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Dismiss
            </button>
          </div>

          <div className="flex items-center gap-2 bg-black/50 p-2 rounded-md border border-emerald-500/20 font-mono text-xs text-emerald-200" dir="ltr">
            <span className="flex-1 select-all break-all">{generatedToken}</span>
            <button
              onClick={() => handleCopy(generatedToken)}
              className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 flex items-center gap-1 shrink-0 transition-all cursor-pointer"
            >
              {copiedToken ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedToken ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Section 1: Multi-Role RBAC API Keys Table */}
      <div className="bg-[#0A0C10] border border-[#1C202B] rounded-lg p-3.5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#1C202B]">
          <div>
            <h3 className="text-xs font-medium text-zinc-100 flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-zinc-400" />
              <span>Multi-Role RBAC API Keys</span>
            </h3>
            <p className="text-[11px] text-zinc-500">
              Manage scoped API credentials for operators, pipeline dispatchers, and external telemetry agents.
            </p>
          </div>

          <button
            onClick={fetchKeys}
            disabled={isKeysLoading}
            className="p-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/[0.06] text-xs self-end sm:self-auto cursor-pointer"
            title="Refresh keys list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isKeysLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleCreateKey} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-md bg-white/[0.02] border border-white/[0.04]">
          <div className="sm:col-span-5">
            <input
              type="text"
              placeholder="Key identifier (e.g. bale-bot-prod)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="w-full bg-[#10131A] border border-[#1C202B] rounded-md px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-sans"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={newKeyRole}
              onChange={(e) => setNewKeyRole(e.target.value as any)}
              className="w-full bg-[#10131A] border border-[#1C202B] rounded-md px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer font-mono"
            >
              <option value="operator">Operator (Shadow Actions)</option>
              <option value="admin">Admin (Full Control)</option>
              <option value="auditor">Auditor (Read-Only)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Tenant (default)"
              value={newKeyTenant}
              onChange={(e) => setNewKeyTenant(e.target.value)}
              className="w-full bg-[#10131A] border border-[#1C202B] rounded-md px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isCreatingKey || !newKeyName.trim()}
              className="w-full h-full py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Key</span>
            </button>
          </div>
        </form>

        {/* Keys Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1C202B] text-zinc-500 font-mono text-[11px]">
                <th className="pb-2 font-medium">Identifier</th>
                <th className="pb-2 font-medium">Role</th>
                <th className="pb-2 font-medium">Tenant ID</th>
                <th className="pb-2 font-medium">Created</th>
                <th className="pb-2 font-medium">Last Used</th>
                <th className="pb-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C202B]">
              {apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-zinc-500 font-mono">
                    No scoped API keys found. Use form above to generate one.
                  </td>
                </tr>
              ) : (
                apiKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 font-medium text-zinc-200 font-sans">{key.name}</td>
                    <td className="py-2.5">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase font-medium ${
                        key.role === 'admin'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : key.role === 'operator'
                          ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {key.role}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-zinc-400">{key.tenant_id}</td>
                    <td className="py-2.5 font-mono text-zinc-500 text-[11px]">
                      {key.created_at ? new Date(key.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-2.5 font-mono text-zinc-500 text-[11px]">
                      {key.last_used_at ? new Date(key.last_used_at).toLocaleTimeString() : 'Never'}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Revoke and delete key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Bale Official Bot Webhook Registration */}
      <div className="bg-[#0A0C10] border border-[#1C202B] rounded-lg p-3.5 shadow-sm space-y-3">
        <div className="pb-2.5 border-b border-[#1C202B]">
          <h3 className="text-xs font-medium text-zinc-100 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-zinc-400" />
            <span>Bale Bot Webhook Registration</span>
          </h3>
          <p className="text-[11px] text-zinc-500">
            Send setWebhook payload to official Bale server with signature token verification.
          </p>
        </div>

        <form onSubmit={handleSetBaleWebhook} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <div className="sm:col-span-6">
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">Webhook URL:</label>
            <input
              type="url"
              placeholder="https://your-domain.com/api/webhooks/bale"
              value={baleWebhookUrl}
              onChange={(e) => setBaleWebhookUrl(e.target.value)}
              className="w-full bg-[#10131A] border border-[#1C202B] rounded-md px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">Secret Token (optional):</label>
            <input
              type="text"
              placeholder="bale_secret_hash"
              value={baleSecretToken}
              onChange={(e) => setBaleSecretToken(e.target.value)}
              className="w-full bg-[#10131A] border border-[#1C202B] rounded-md px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={isSettingWebhook || !baleWebhookUrl.trim()}
              className="w-full py-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.08] text-xs font-medium transition-all cursor-pointer disabled:opacity-40"
            >
              {isSettingWebhook ? 'Registering...' : 'Set Webhook'}
            </button>
          </div>
        </form>

        {webhookFeedback && (
          <div className={`p-2 rounded-md border text-xs flex items-center gap-2 ${
            webhookFeedback.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            {webhookFeedback.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            <span>{webhookFeedback.msg}</span>
          </div>
        )}
      </div>

      {/* Section 3: Integrations & MCP Studio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* GitHub Repository */}
        <div className="p-3 rounded-lg bg-[#0A0C10] border border-[#1C202B] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-medium text-zinc-200 font-mono">GitHub Integration</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Synced
            </span>
          </div>
          <div className="p-2 rounded-md bg-black/40 border border-[#1C202B] text-[11px] font-mono text-zinc-300 flex justify-between" dir="ltr">
            <span>hosseintajdari/bale-panel</span>
            <span className="text-zinc-500">branch: main</span>
          </div>
        </div>

        {/* Notion Workspace */}
        <div className="p-3 rounded-lg bg-[#0A0C10] border border-[#1C202B] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-medium text-zinc-200 font-mono">Notion MCP Proxy</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Connected
            </span>
          </div>
          <div className="p-2 rounded-md bg-black/40 border border-[#1C202B] text-[11px] font-mono text-zinc-300 flex justify-between" dir="ltr">
            <span>Embednet Workspace</span>
            <span className="text-zinc-500">OAuth Local Proxy</span>
          </div>
        </div>
      </div>
    </div>
  );
});

McpAccountsGrid.displayName = 'McpAccountsGrid';
