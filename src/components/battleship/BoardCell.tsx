import React from 'react';
import { motion } from 'motion/react';
import { Flame, Target } from 'lucide-react';

interface BoardCellProps {
  row: number;
  col: number;
  isEnemy: boolean;
  hasShip?: boolean;
  shipEmoji?: string;
  isHit?: boolean;
  isMiss?: boolean;
  isSunk?: boolean;
  isPlacementHover?: boolean;
  isPlacementValid?: boolean;
  canAttack?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const BoardCell: React.FC<BoardCellProps> = ({
  row,
  col,
  isEnemy,
  hasShip = false,
  shipEmoji,
  isHit = false,
  isMiss = false,
  isSunk = false,
  isPlacementHover = false,
  isPlacementValid = true,
  canAttack = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const isTargetable = isEnemy && canAttack && !isHit && !isMiss;

  return (
    <button
      id={`cell-${isEnemy ? 'enemy' : 'fleet'}-${row}-${col}`}
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={isEnemy ? !isTargetable : !onClick}
      className={`relative w-full aspect-square rounded-md flex items-center justify-center transition-all duration-150 select-none overflow-hidden ${
        // Hit state
        isHit
          ? isSunk
            ? 'bg-rose-950/90 border border-rose-500/80 shadow-inner shadow-rose-600/40 text-rose-300'
            : 'bg-red-950/80 border border-red-500/70 shadow-inner shadow-red-600/30 text-red-300'
          : // Miss state
          isMiss
          ? 'bg-sky-950/60 border border-sky-600/40 text-sky-400'
          : // Placement preview
          isPlacementHover
          ? isPlacementValid
            ? 'bg-emerald-500/30 border-2 border-emerald-400 shadow-md shadow-emerald-500/20'
            : 'bg-rose-500/30 border-2 border-rose-500 shadow-md shadow-rose-500/20'
          : // Friendly ship
          hasShip && !isEnemy
          ? 'bg-cyan-950/80 border border-cyan-500/50 shadow-sm shadow-cyan-900/40'
          : // Targetable enemy cell
          isTargetable
          ? 'bg-slate-900/70 border border-cyan-900/40 hover:bg-cyan-950/70 hover:border-cyan-400/80 hover:shadow-md hover:shadow-cyan-500/20 cursor-crosshair'
          : // Default empty
            'bg-slate-900/50 border border-slate-800/80 text-slate-600 cursor-default'
      }`}
    >
      {/* 1. Hit Animation & Graphic */}
      {isHit && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="flex flex-col items-center justify-center"
        >
          <span className="text-sm sm:text-base leading-none select-none filter drop-shadow">
            💥
          </span>
          {isSunk && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-1 -right-1"
            >
              <Flame className="w-3 h-3 text-amber-400 animate-pulse fill-amber-400" />
            </motion.div>
          )}
        </motion.div>
      )}

      {/* 2. Miss Ripple & Splash Graphic */}
      {isMiss && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="relative flex items-center justify-center"
        >
          <span className="text-xs sm:text-sm select-none">💦</span>
          {/* Subtle water ripple ring */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0.8 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1 }}
            className="absolute w-5 h-5 rounded-full border border-sky-400 pointer-events-none"
          />
        </motion.div>
      )}

      {/* 3. Friendly Ship Display */}
      {!isEnemy && hasShip && !isHit && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center w-full h-full"
        >
          <span className="text-xs sm:text-sm select-none filter drop-shadow">
            {shipEmoji || '🚢'}
          </span>
        </motion.div>
      )}

      {/* 4. Crosshair indicator on hover when targetable */}
      {isTargetable && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <Target className="w-3.5 h-3.5 text-cyan-400/90 animate-spin-slow" />
        </div>
      )}

      {/* Subtle grid corner coordinates dot */}
      <div className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-slate-700/30 pointer-events-none" />
    </button>
  );
};
