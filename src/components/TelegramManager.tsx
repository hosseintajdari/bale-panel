import React, { useState, useEffect } from 'react';
import { Send, LayoutGrid, Globe, Plus, Trash2, Save, LayoutTemplate, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { telegramApi } from '../utils/api';

export const TelegramManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'keyboards' | 'webapps'>('keyboards');
  const [keyboards, setKeyboards] = useState<any[]>([]);
  const [webapps, setWebapps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newKbName, setNewKbName] = useState('');
  const [newWaName, setNewWaName] = useState('');
  const [newWaUrl, setNewWaUrl] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const kbRes = await telegramApi.getKeyboards();
      if (kbRes.success) setKeyboards(kbRes.keyboards);
      const waRes = await telegramApi.getWebApps();
      if (waRes.success) setWebapps(waRes.webapps);
    } catch (err) {
      console.error('Error fetching telegram data', err);
    }
    setIsLoading(false);
  };

  const handleCreateKeyboard = async () => {
    if (!newKbName) return;
    const defaultSchema = JSON.stringify({
      inline_keyboard: [[{ text: "Button 1", callback_data: "btn1" }]]
    });
    try {
      const res = await telegramApi.saveKeyboard({ name: newKbName, schemaJson: defaultSchema });
      if (res.success) {
        setKeyboards([res.keyboard, ...keyboards]);
        setNewKbName('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteKeyboard = async (id: string) => {
    try {
      const res = await telegramApi.deleteKeyboard(id);
      if (res.success) {
        setKeyboards(keyboards.filter(k => k.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateWebApp = async () => {
    if (!newWaName || !newWaUrl) return;
    try {
      const res = await telegramApi.saveWebApp({ name: newWaName, url: newWaUrl });
      if (res.success) {
        setWebapps([res.webapp, ...webapps]);
        setNewWaName('');
        setNewWaUrl('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWebApp = async (id: string) => {
    try {
      const res = await telegramApi.deleteWebApp(id);
      if (res.success) {
        setWebapps(webapps.filter(w => w.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0A0C10] text-zinc-300">
      <header className="shrink-0 h-14 border-b border-[#1C202B] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Send className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h1 className="text-sm font-medium text-zinc-100">Telegram Bot API</h1>
            <div className="text-[11px] text-zinc-500 flex items-center gap-2">
              <span>Inline Keyboards & WebApp Integration</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 bg-[#12151C] rounded-lg border border-[#1C202B]">
          <button
            onClick={() => setActiveTab('keyboards')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'keyboards' ? 'bg-[#1C202B] text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Visual Builder
          </button>
          <button
            onClick={() => setActiveTab('webapps')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'webapps' ? 'bg-[#1C202B] text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            WebApps
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'keyboards' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-[#12151C] border border-[#1C202B] rounded-xl p-5">
              <h2 className="text-sm font-medium text-zinc-100 mb-4 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-emerald-400" />
                Create New Inline Keyboard
              </h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Keyboard Internal Name (e.g., MainMenu)"
                  value={newKbName}
                  onChange={(e) => setNewKbName(e.target.value)}
                  className="flex-1 bg-[#0A0C10] border border-[#1C202B] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50"
                />
                <button
                  onClick={handleCreateKeyboard}
                  disabled={!newKbName}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-10 flex flex-col items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-zinc-600 animate-spin" />
                  <span className="text-xs text-zinc-500">Loading keyboards...</span>
                </div>
              ) : keyboards.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#1C202B] rounded-xl">
                  <LayoutTemplate className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">No keyboards configured yet.</p>
                </div>
              ) : (
                keyboards.map((kb) => (
                  <div key={kb.id} className="bg-[#12151C] border border-[#1C202B] rounded-xl p-4 flex items-start justify-between group">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-100">{kb.name}</span>
                        <span className="text-[10px] font-mono bg-[#1C202B] text-zinc-400 px-2 py-0.5 rounded-full">{kb.id}</span>
                      </div>
                      <div className="bg-[#0A0C10] rounded-lg border border-[#1C202B] p-3 text-xs font-mono text-zinc-500 overflow-hidden text-ellipsis whitespace-nowrap mr-8">
                        {kb.schemaJson}
                      </div>
                      <div dir="rtl" className="text-xs text-zinc-500 pt-1">
                        آخرین ویرایش: {new Date(kb.updatedAt * 1000).toLocaleString('fa-IR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        title="Edit visual schema"
                        className="p-2 bg-[#1C202B] text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteKeyboard(kb.id)}
                        title="Delete keyboard"
                        className="p-2 bg-[#1C202B] text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'webapps' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-[#12151C] border border-[#1C202B] rounded-xl p-5">
              <h2 className="text-sm font-medium text-zinc-100 mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                Register WebApp URL
              </h2>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="WebApp Title (e.g., Patient Portal)"
                  value={newWaName}
                  onChange={(e) => setNewWaName(e.target.value)}
                  className="bg-[#0A0C10] border border-[#1C202B] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50"
                />
                <div className="flex gap-3">
                  <div className="relative flex-1 flex items-center">
                    <LinkIcon className="w-4 h-4 text-zinc-500 absolute left-3" />
                    <input
                      type="url"
                      placeholder="https://app.embednet.internal/..."
                      value={newWaUrl}
                      onChange={(e) => setNewWaUrl(e.target.value)}
                      className="w-full bg-[#0A0C10] border border-[#1C202B] rounded-lg pl-9 pr-3 py-2 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <button
                    onClick={handleCreateWebApp}
                    disabled={!newWaName || !newWaUrl}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                  >
                    <Save className="w-4 h-4" />
                    Register
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-10 flex flex-col items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-zinc-600 animate-spin" />
                  <span className="text-xs text-zinc-500">Loading WebApps...</span>
                </div>
              ) : webapps.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#1C202B] rounded-xl">
                  <Globe className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">No WebApps registered.</p>
                </div>
              ) : (
                webapps.map((wa) => (
                  <div key={wa.id} className="bg-[#12151C] border border-[#1C202B] rounded-xl p-4 flex items-center justify-between group">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-100">{wa.name}</span>
                        <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">Active</span>
                      </div>
                      <a href={wa.url} target="_blank" rel="noreferrer" className="text-xs font-mono text-zinc-400 hover:text-blue-400 transition-colors">
                        {wa.url}
                      </a>
                    </div>
                    <button
                      onClick={() => handleDeleteWebApp(wa.id)}
                      title="Delete WebApp"
                      className="p-2 bg-[#1C202B] text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
