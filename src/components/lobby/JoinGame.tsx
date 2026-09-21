import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, LogIn, AlertTriangle, User, Hash } from "lucide-react";
import { isValidRoomCode } from "../../lib/roomCode";
import { sound } from "../../lib/sound";

interface JoinGameProps {
  initialRoomCode?: string;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onJoin: (roomCode: string) => void | Promise<void>;
  onBack: () => void;
  error?: string | null;
  isJoining?: boolean;
}

export const JoinGame: React.FC<JoinGameProps> = ({
  initialRoomCode = "",
  playerName,
  onPlayerNameChange,
  onJoin,
  onBack,
  error,
  isJoining = false,
}) => {
  const [code, setCode] = useState(initialRoomCode.toUpperCase());
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playButton();
    const cleanName = playerName.trim();
    const clean = code.trim().toUpperCase();

    if (!cleanName) {
      setValidationError("State your rank and name before reporting in.");
      return;
    }

    if (!clean) {
      setValidationError("Enter the operation cipher to report in.");
      return;
    }

    if (!isValidRoomCode(clean)) {
      setValidationError(
        "Cipher rejected. Ciphers run 6 letters and figures (e.g. A7K9P2).",
      );
      return;
    }

    setValidationError(null);
    onJoin(clean);
  };

  const activeError = validationError || error;

  return (
    <motion.div
      id="join-game-panel"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="wr-panel w-full max-w-md mx-auto p-6 sm:p-8 text-[#e9dfc4] relative"
    >
      <div className="absolute -top-3 left-6 wr-plate px-3 py-0.5 text-[10px] font-bold tracking-[0.3em] uppercase">
        Report In
      </div>

      <div className="flex items-center justify-between border-b border-[#4d452c] pb-4 mb-6 mt-2">
        <button
          id="join-game-back-btn"
          type="button"
          onClick={() => {
            sound.playButton();
            onBack();
          }}
          className="flex items-center gap-1.5 text-[11px] tracking-[0.2em] text-[#a8956c] hover:text-[#e8c84a] transition-colors cursor-pointer uppercase"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="wr-stamp text-[10px] text-[#c9a227]">Challenger</div>
      </div>

      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-[#0d0b06] border border-[#6f5d21] flex items-center justify-center text-[#c9a227] mx-auto mb-3">
          <LogIn className="w-6 h-6" />
        </div>
        <h2 className="wr-head text-2xl tracking-wider text-[#efe3c2] uppercase">
          Join Operation
        </h2>
        <p className="text-xs text-[#a8956c] mt-1">
          Present the cipher issued by the host commander
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Commander Name */}
        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-[#a8956c] mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#c9a227]" />
            Your Rank &amp; Name
          </label>
          <input
            id="guest-commander-name-input"
            type="text"
            maxLength={15}
            value={playerName}
            onChange={(e) => onPlayerNameChange(e.target.value)}
            placeholder="e.g. CAPT. HALSEY"
            className="wr-input w-full px-3.5 py-2.5 text-sm uppercase tracking-widest"
          />
        </div>

        {/* Room Code Input */}
        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-[#a8956c] mb-1.5 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-[#c9a227]" />
            Operation Cipher
          </label>
          <input
            id="room-code-input"
            type="text"
            maxLength={8}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (activeError) setValidationError(null);
            }}
            placeholder="A7K9P2"
            className="wr-input w-full text-center tracking-[0.4em] text-xl sm:text-2xl font-bold uppercase px-4 py-3 text-[#e8c84a]"
          />
        </div>

        {/* Error message */}
        {activeError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-[#2a0f0c] border border-[#b3352b] text-[#e89a90] text-xs flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-[#b3352b] shrink-0 mt-0.5" />
            <span>{activeError}</span>
          </motion.div>
        )}

        <button
          id="submit-join-game-btn"
          type="submit"
          disabled={isJoining}
          className="wr-btn-brass w-full py-3.5 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer mt-4"
        >
          <LogIn className="w-4 h-4" />
          <span>{isJoining ? "Signalling..." : "Report for Duty"}</span>
        </button>
      </form>
    </motion.div>
  );
};
