import React from 'react';
import { motion } from 'motion/react';
import { Target, Hourglass } from 'lucide-react';
import type { PlayerRole } from '../../types/battleship';

interface TurnIndicatorProps {
  currentTurn: PlayerRole;
  localPlayerRole: PlayerRole;
  opponentName?: string;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  currentTurn,
  localPlayerRole,
  opponentName = 'Opponent',
}) => {
  const isMyTurn = currentTurn === localPlayerRole;

  return (
    <div className="w-full max-w-md mx-auto my-2">
      <motion.div
        key={currentTurn}
        initial={{ scale: 0.96, opacity: 0, y: -4 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className={`px-4 py-2.5 rounded-xl border flex items-center justify-between font-mono shadow-lg backdrop-blur-md ${
          isMyTurn
            ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 shadow-cyan-950/50'
            : 'bg-slate-900/80 border-slate-700 text-slate-300 shadow-black/40'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isMyTurn
                ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-400'
                : 'bg-slate-800 border border-slate-700 text-slate-400'
            }`}
          >
            {isMyTurn ? (
              <Target className="w-4 h-4 animate-spin-slow" />
            ) : (
              <Hourglass className="w-4 h-4 animate-pulse" />
            )}
          </div>
          <div>
            <div
              className={`text-xs sm:text-sm font-bold tracking-wider uppercase flex items-center gap-1.5 ${
                isMyTurn ? 'text-cyan-300' : 'text-slate-300'
              }`}
            >
              <span>{isMyTurn ? 'YOUR TURN' : "OPPONENT'S TURN"}</span>
              <span className="text-xs">{isMyTurn ? '🎯' : '⏳'}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {isMyTurn ? 'Select a target on Enemy Waters' : `Waiting for ${opponentName}...`}
            </div>
          </div>
        </div>

        <div className="text-right">
          <span
            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              isMyTurn
                ? 'bg-cyan-400 text-slate-950 animate-pulse'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isMyTurn ? 'FIRE READY' : 'DEFENDING'}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
