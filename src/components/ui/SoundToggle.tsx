import { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { sound } from "../../lib/sound";

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
      className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-[11px] font-bold tracking-[0.2em] uppercase border transition-colors cursor-pointer ${
        muted
          ? "bg-[#0d0b06] border-[#3a3423] text-[#6e6040] hover:text-[#a8956c]"
          : "bg-[#0d0b06] border-[#6f5d21] text-[#e8c84a] hover:bg-[#2b2413]"
      }`}
      title={muted ? "Unmute the wireless" : "Mute the wireless"}
      aria-label="Toggle sound"
    >
      {muted ? (
        <>
          <VolumeX className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Silent</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden sm:inline">Wireless</span>
        </>
      )}
    </button>
  );
}
