import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Database, CheckCircle2, AlertTriangle, Key, Globe, ShieldCheck } from 'lucide-react';
import { getStoredSupabaseConfig, saveStoredSupabaseConfig, isSupabaseConfigured } from '../../lib/supabase';
import { sound } from '../../lib/sound';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function SupabaseConfigModal({ isOpen, onClose, onSaved }: SupabaseConfigModalProps) {
  const currentConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playButton();
    saveStoredSupabaseConfig(url, anonKey);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      if (onSaved) onSaved();
      onClose();
    }, 900);
  };

  const configured = isSupabaseConfigured();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            id="supabase-config-modal"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-800/40 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-mono text-sm tracking-wider uppercase text-emerald-400 font-bold">
                    Supabase Realtime
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">Cross-Network Multiplayer Sync</p>
                </div>
              </div>
              <button
                id="close-supabase-modal-btn"
                onClick={() => {
                  sound.playButton();
                  onClose();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Status banner */}
              <div
                className={`p-3 rounded-xl border flex items-start gap-3 ${
                  configured
                    ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-700/50 text-amber-300'
                }`}
              >
                {configured ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="text-xs font-mono">
                  <div className="font-bold">
                    {configured ? 'Supabase Realtime Active' : 'Local Relay Relay Active'}
                  </div>
                  <div className="text-slate-400 mt-0.5 text-[11px]">
                    {configured
                      ? 'Worldwide cross-device multiplayer is fully operational via Supabase Realtime Channels.'
                      : 'Multi-tab browser testing is active. Provide your Supabase project credentials to enable cross-device internet gameplay!'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  Supabase Anon Key
                </label>
                <textarea
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  rows={3}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  Deployment Note (Vercel):
                </div>
                <div>Set environment variables in your deployment dashboard:</div>
                <div className="text-cyan-300/80 font-mono text-[10px]">VITE_SUPABASE_URL &amp; VITE_SUPABASE_ANON_KEY</div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playButton();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  id="save-supabase-config-btn"
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {savedSuccess ? 'Saved & Connected!' : 'Save & Connect'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
