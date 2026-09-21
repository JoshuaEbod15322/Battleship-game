import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Copy,
  Check,
  Share2,
  Users,
  ArrowLeft,
  Shield,
  User,
} from "lucide-react";
import { getInviteUrl } from "../../lib/roomCode";
import { sound } from "../../lib/sound";

interface CreateGameProps {
  roomCode: string;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onBack: () => void;
  opponentConnected: boolean;
  error?: string | null;
}

export const CreateGame: React.FC<CreateGameProps> = ({
  roomCode,
  playerName,
  onPlayerNameChange,
  onBack,
  opponentConnected,
  error,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const inviteUrl = getInviteUrl(roomCode);

  const handleCopyCode = () => {
    sound.playButton();
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    sound.playButton();
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <motion.div
      id="create-game-panel"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-2xl backdrop-blur-md font-mono text-slate-100"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <button
          id="create-game-back-btn"
          onClick={() => {
            sound.playButton();
            onBack();
          }}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK</span>
        </button>
        <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/40">
          HOST OPERATION
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold tracking-wider text-slate-100 uppercase">
          GAME CREATED
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Share this security code with your rival commander
        </p>
      </div>

      {/* Commander Call Sign */}
      <div className="mb-5">
        <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-cyan-400" />
          Your Commander Name
        </label>
        <input
          id="host-commander-name-input"
          type="text"
          maxLength={15}
          value={playerName}
          onChange={(e) => onPlayerNameChange(e.target.value)}
          placeholder="Your call sign"
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-400 transition-colors"
        />
      </div>

      {/* Big Room Code Box */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 text-center mb-5">
        <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">
          Room Code
        </div>
        <div className="text-3xl sm:text-4xl font-extrabold tracking-widest text-cyan-400 font-mono select-all">
          {roomCode}
        </div>
      </div>

      {/* Copy Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button
          id="copy-room-code-btn"
          type="button"
          onClick={handleCopyCode}
          className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-cyan-500 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {copiedCode ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">COPIED!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-cyan-400" />
              <span>COPY CODE</span>
            </>
          )}
        </button>

        <button
          id="copy-invite-link-btn"
          type="button"
          onClick={handleCopyLink}
          className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-cyan-500 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">COPIED LINK!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-cyan-400" />
              <span>INVITE LINK</span>
            </>
          )}
        </button>
      </div>

      {/* Waiting Status Panel */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-600 text-rose-300 text-xs mb-4">
          {error}
        </div>
      )}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300 mb-1">
          <Users className="w-4 h-4 text-cyan-400" />
          <span>
            {opponentConnected ? "Opponent Joined!" : "Waiting for opponent..."}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>
            {opponentConnected
              ? "Synchronizing tactical grid with rival..."
              : "Stand by at your battlestation"}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
