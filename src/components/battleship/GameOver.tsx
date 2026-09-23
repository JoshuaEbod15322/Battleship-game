import React, { useEffect } from "react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { Trophy, Skull, RotateCcw, Home } from "lucide-react";
import type { PlayerRole } from "../../types/battleship";
import { sound } from "../../lib/sound";

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
          colors: ["#c9a227", "#e8c84a", "#d9c9a3", "#7da05c"],
        });
      } catch {}
    }
  }, [isWinner]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg">
      <motion.div
        id="game-over-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="wr-panel w-full max-w-md p-8 text-center overflow-hidden relative"
      >
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 wr-plate px-4 py-0.5 text-[10px] font-bold tracking-[0.35em] uppercase whitespace-nowrap">
          After-Action Report
        </div>

        <div className="mt-4 mb-2 flex justify-center">
          <span
            className={`wr-stamp wr-head text-lg px-5 py-1 ${
              isWinner ? "text-[#7da05c]" : "text-[#b3352b]"
            }`}
          >
            {isWinner ? "Victory" : "Defeat"}
          </span>
        </div>

        <div className="relative mb-4 mt-4 flex justify-center">
          {isWinner ? (
            <div className="w-20 h-20 bg-[#0d0b06] border border-[#c9a227] flex items-center justify-center text-[#e8c84a]">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-[#0d0b06] border border-[#b3352b] flex items-center justify-center text-[#b3352b]">
              <Skull className="w-10 h-10 animate-pulse" />
            </div>
          )}
        </div>

        <div className="text-base font-bold text-[#efe3c2] mb-1 uppercase tracking-[0.15em]">
          {isWinner ? "Enemy fleet on the bottom" : "Our fleet is lost."}
        </div>

        <p className="text-xs text-[#a8956c] mb-8 max-w-xs mx-auto">
          {isWinner
            ? "Every hostile hull sunk. The sea lane is ours, Commander."
            : "Hostile guns found their marks. Regroup, re-chart, return."}
        </p>

        <div className="space-y-3">
          <button
            id="play-again-btn"
            type="button"
            onClick={() => {
              sound.playButton();
              onPlayAgain();
            }}
            className="wr-btn-brass w-full py-3.5 px-4 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Engagement</span>
          </button>

          <button
            id="return-home-btn"
            type="button"
            onClick={() => {
              sound.playButton();
              onReturnHome();
            }}
            className="wr-btn-steel w-full py-3 px-4 text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>War Room Door</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
