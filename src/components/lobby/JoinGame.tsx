import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, LogIn, AlertTriangle, User, Hash } from 'lucide-react';
import { isValidRoomCode } from '../../lib/roomCode';
import { sound } from '../../lib/sound';

interface JoinGameProps {
  initialRoomCode?: string;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onJoin: (roomCode: string) => void;
  onBack: () => void;
  error?: string | null;
  isJoining?: boolean;
}

export const JoinGame: React.FC<JoinGameProps> = ({
  initialRoomCode = '',
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
    const clean = code.trim().toUpperCase();

    if (!clean) {
      setValidationError('Please enter a room code to join.');
      return;
    }

    if (!isValidRoomCode(clean)) {
      setValidationError('Invalid code format. Codes are 6 alphanumeric characters (e.g. A7K9P2).');
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
      className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-2xl backdrop-blur-md font-mono text-slate-100"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <button
          id="join-game-back-btn"
          type="button"
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
          CHALLENGER OPERATION
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3">
          <LogIn className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold tracking-wider text-slate-100 uppercase">
          JOIN GAME
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Enter the room code issued by the host commander
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Commander Name */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            Your Commander Name
          </label>
          <input
            id="guest-commander-name-input"
            type="text"
            maxLength={15}
            value={playerName}
            onChange={(e) => onPlayerNameChange(e.target.value)}
            placeholder="e.g. Captain Drake"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* Room Code Input */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-cyan-400" />
            Enter Room Code
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
            placeholder="e.g. A7K9P2"
            className="w-full text-center tracking-widest text-xl sm:text-2xl font-bold uppercase px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-cyan-400 font-mono focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* Error message */}
        {activeError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-rose-950/70 border border-rose-600 text-rose-300 text-xs flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{activeError}</span>
          </motion.div>
        )}

        <button
          id="submit-join-game-btn"
          type="submit"
          disabled={isJoining}
          className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer mt-4"
        >
          <LogIn className="w-4 h-4" />
          <span>{isJoining ? 'CONNECTING...' : 'JOIN GAME'}</span>
        </button>
      </form>
    </motion.div>
  );
};
