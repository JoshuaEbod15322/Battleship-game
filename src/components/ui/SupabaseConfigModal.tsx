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
            className="w-full max-w-md wr-panel overflow-hidden text-[#e9dfc4]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#4d452c] bg-[#0d0b06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#1c2415] border border-[#7da05c] flex items-center justify-center text-[#7da05c]">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="wr-head text-sm tracking-[0.2em] uppercase text-[#7da05c]">
                    Wireless Set
                  </h3>
                  <p className="text-xs text-[#a8956c]">Long-range signal hookup</p>
                </div>
              </div>
              <button
                id="close-supabase-modal-btn"
                onClick={() => {
                  sound.playButton();
                  onClose();
                }}
                className="p-1.5 text-[#a8956c] hover:text-[#efe3c2] hover:bg-[#2b2413] transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Status banner */}
              <div
                className={`p-3 border flex items-start gap-3 ${
                  configured
                    ? 'bg-[#1c2415] border-[#7da05c] text-[#a9c48f]'
                    : 'bg-[#241a08] border-[#c9a227] text-[#e9dfc4]'
                }`}
              >
                {configured ? (
                  <CheckCircle2 className="w-4 h-4 text-[#7da05c] shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#c9a227] shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <div className="font-bold tracking-[0.15em] uppercase">
                    {configured ? 'Wireless live' : 'Local runner active'}
                  </div>
                  <div className="text-[#a8956c] mt-0.5 text-[11px]">
                    {configured
                      ? 'Worldwide cross-device play is live over the wireless set.'
                      : 'Same-table testing only. Enter wireless credentials for cross-device play!'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-[#a8956c] mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#c9a227]" />
                  Wireless Station URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="wr-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-[#a8956c] mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#c9a227]" />
                  Signal Pass Key
                </label>
                <textarea
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  rows={3}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  className="wr-input w-full px-3 py-2 text-xs resize-none"
                />
              </div>

              <div className="p-3 bg-[#0d0b06] border border-[#3a3423] text-[11px] text-[#a8956c] space-y-1">
                <div className="flex items-center gap-1.5 text-[#e9dfc4] font-semibold tracking-[0.15em] uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#c9a227]" />
                  Depot note (Vercel):
                </div>
                <div>File these in your deployment depot:</div>
                <div className="text-[#e8c84a] text-[10px]">VITE_SUPABASE_URL &amp; VITE_SUPABASE_ANON_KEY</div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playButton();
                    onClose();
                  }}
                  className="px-4 py-2 text-[#a8956c] hover:text-[#efe3c2] text-xs tracking-[0.2em] uppercase"
                >
                  Cancel
                </button>
                <button
                  id="save-supabase-config-btn"
                  type="submit"
                  className="wr-btn-brass px-5 py-2 text-xs cursor-pointer"
                >
                  {savedSuccess ? 'Wired & Live!' : 'Wire It Up'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
