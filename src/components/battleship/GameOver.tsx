import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, Skull, RotateCcw, Home } from 'lucide-react';
import type { PlayerRole } from '../../types/battleship';
import { sound } from '../../lib/sound';

interface GameOverProps {
  winner: PlayerRole | null;
  localPlayerRole: PlayerRole;
  onPlayAgain: () => void;
  onReturnHome: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  winner,
  localPlayerRole,
  onPlayAgain,
  onReturnHome,
}) => {
  const isWinner = winner === localPlayerRole;

  useEffect(() => {
    if (isWinner) {
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#38bdf8', '#fbbf24', '#ffffff'],
        });
      } catch {}
    }
  }, [isWinner]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg">
      <motion.div
        id="game-over-modal"
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`w-full max-w-md p-8 rounded-3xl border text-center shadow-2xl font-mono overflow-hidden relative ${
          isWinner
            ? 'bg-slate-900/95 border-amber-500/60 shadow-amber-950/50'
            : 'bg-slate-900/95 border-rose-600/60 shadow-rose-950/50'
        }`}
      >
        {/* Glow ambient header */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-30 ${
            isWinner ? 'bg-amber-400' : 'bg-rose-600'
          }`}
        />

        {/* Icon */}
        <div className="relative mb-4 flex justify-center">
          {isWinner ? (
            <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/20">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/20">
              <Skull className="w-10 h-10 animate-pulse" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2
          className={`text-2xl sm:text-3xl font-extrabold tracking-wider uppercase mb-2 ${
            isWinner ? 'text-amber-400' : 'text-rose-400'
          }`}
        >
          {isWinner ? '🏆 VICTORY' : '💀 DEFEAT'}
        </h2>

        <div className="text-base font-bold text-slate-100 mb-1">
          {isWinner ? 'Enemy Fleet Destroyed' : 'Your fleet has been destroyed.'}
        </div>

        <p className="text-xs text-slate-400 mb-8 max-w-xs mx-auto">
          {isWinner
            ? 'You dominated the battlefield and sank every hostile warship.'
            : 'Hostile forces overwhelmed your naval defenses. Regroup and plan your return.'}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            id="play-again-btn"
            type="button"
            onClick={() => {
              sound.playButton();
              onPlayAgain();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            id="return-home-btn"
            type="button"
            onClick={() => {
              sound.playButton();
              onReturnHome();
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>RETURN HOME</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
