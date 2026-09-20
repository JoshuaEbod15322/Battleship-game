import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sound } from '../../lib/sound';

export function SoundToggle() {
  const [muted, setMuted] = useState(sound.getMuted());

  useEffect(() => {
    setMuted(sound.getMuted());
  }, []);

  const toggle = () => {
    const next = sound.toggleMute();
    setMuted(next);
    if (!next) {
      sound.playButton();
    }
  };

  return (
    <button
      id="sound-toggle-btn"
      onClick={toggle}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
        muted
          ? 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-slate-200'
          : 'bg-cyan-950/60 border-cyan-700/60 text-cyan-300 hover:bg-cyan-900/60 shadow-sm shadow-cyan-900/30'
      }`}
      title={muted ? 'Unmute tactical audio' : 'Mute tactical audio'}
      aria-label="Toggle sound"
    >
      {muted ? (
        <>
          <VolumeX className="w-3.5 h-3.5 text-slate-500" />
          <span>AUDIO OFF</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>AUDIO ON</span>
        </>
      )}
    </button>
  );
}
