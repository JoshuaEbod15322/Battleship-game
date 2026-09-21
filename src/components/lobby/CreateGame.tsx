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
      className="wr-panel w-full max-w-md mx-auto p-6 sm:p-8 text-[#e9dfc4] relative"
    >
      <div className="absolute -top-3 left-6 wr-plate px-3 py-0.5 text-[10px] font-bold tracking-[0.3em] uppercase">
        Host Operation
      </div>

      <div className="flex items-center justify-between border-b border-[#4d452c] pb-4 mb-6 mt-2">
        <button
          id="create-game-back-btn"
          onClick={() => {
            sound.playButton();
            onBack();
          }}
          className="flex items-center gap-1.5 text-[11px] tracking-[0.2em] text-[#a8956c] hover:text-[#e8c84a] transition-colors cursor-pointer uppercase"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="wr-stamp text-[10px] text-[#c9a227]">Orders Cut</div>
      </div>

      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-[#0d0b06] border border-[#6f5d21] flex items-center justify-center text-[#c9a227] mx-auto mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="wr-head text-2xl tracking-wider text-[#efe3c2] uppercase">
          Operation Opened
        </h2>
        <p className="text-xs text-[#a8956c] mt-1">
          Pass this cipher to your rival commander
        </p>
      </div>

      {/* Commander Call Sign */}
      <div className="mb-5">
        <label className="block text-[11px] uppercase tracking-[0.2em] text-[#a8956c] mb-1.5 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-[#c9a227]" />
          Your Rank &amp; Name
        </label>
        <input
          id="host-commander-name-input"
          type="text"
          maxLength={15}
          value={playerName}
          onChange={(e) => onPlayerNameChange(e.target.value)}
          placeholder="e.g. ADM. NIMITZ"
          className="wr-input w-full px-3.5 py-2.5 text-sm uppercase tracking-widest"
        />
      </div>

      {/* Big Room Code Box */}
      <div className="p-4 bg-[#0d0b06] border border-[#6f5d21] text-center mb-5 relative">
        <div className="absolute top-1 left-2 text-[9px] tracking-[0.3em] text-[#6e6040] uppercase">
          Cipher
        </div>
        <div className="absolute top-1 right-2 text-[9px] tracking-[0.3em] text-[#6e6040] uppercase">
          Eyes Only
        </div>
        <div className="text-3xl sm:text-4xl font-bold tracking-[0.3em] text-[#e8c84a] select-all mt-2">
          {roomCode}
        </div>
      </div>

      {/* Copy Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button
          id="copy-room-code-btn"
          type="button"
          onClick={handleCopyCode}
          className="wr-btn-steel py-2.5 px-3 text-[11px] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {copiedCode ? (
            <>
              <Check className="w-4 h-4 text-[#7da05c]" />
              <span className="text-[#7da05c]">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-[#c9a227]" />
              <span>Copy Cipher</span>
            </>
          )}
        </button>

        <button
          id="copy-invite-link-btn"
          type="button"
          onClick={handleCopyLink}
          className="wr-btn-steel py-2.5 px-3 text-[11px] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4 text-[#7da05c]" />
              <span className="text-[#7da05c]">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-[#c9a227]" />
              <span>Sealed Letter</span>
            </>
          )}
        </button>
      </div>

      {/* Waiting Status Panel */}
      {error && (
        <div className="p-3 bg-[#2a0f0c] border border-[#b3352b] text-[#e89a90] text-xs mb-4">
          {error}
        </div>
      )}
      <div className="p-4 bg-[#0d0b06] border border-[#4d452c] text-center">
        <div className="flex items-center justify-center gap-2 text-xs font-bold tracking-[0.15em] text-[#e9dfc4] mb-1 uppercase">
          <Users className="w-4 h-4 text-[#c9a227]" />
          <span>
            {opponentConnected
              ? "Rival officer arrived!"
              : "Awaiting rival officer..."}
          </span>
        </div>
        <div className="text-[11px] text-[#a8956c] flex items-center justify-center gap-1.5">
          <span>
            {opponentConnected
              ? "Synchronizing charts with the enemy..."
              : "Stand by at your battlestation"}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
