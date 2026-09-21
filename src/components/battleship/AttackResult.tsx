import React from "react";
import { motion, AnimatePresence } from "motion/react";
import type { AttackFeedback } from "../../hooks/useMultiplayer";
import type { PlayerRole } from "../../types/battleship";
import { Flame } from "lucide-react";
import { getCoordinateLabel } from "../../lib/gameLogic";

interface AttackResultProps {
  feedback: AttackFeedback | null;
  localPlayerRole: PlayerRole;
}

export const AttackResult: React.FC<AttackResultProps> = ({
  feedback,
  localPlayerRole,
}) => {
  if (!feedback) return null;

  const isLocalAttacker = feedback.attackerRole === localPlayerRole;
  const isHit = feedback.result === "hit";
  const hasSunk = Boolean(feedback.sunkShipName);
  const coordLabel = getCoordinateLabel(feedback.row, feedback.col);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${feedback.timestamp}-${feedback.row}-${feedback.col}`}
        initial={{ opacity: 0, scale: 0.9, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -8 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md mx-auto my-2"
      >
        <div
          className={`p-3 border flex items-center justify-between ${
            hasSunk
              ? "bg-[#2a0f0c] border-[#b3352b] text-[#e89a90]"
              : isHit
                ? "bg-[#241a08] border-[#c9a227] text-[#efe3c2]"
                : "bg-[#141a13] border-[#4a4f3c] text-[#a8956c]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">
              {hasSunk ? "🔥" : isHit ? "💥" : "💦"}
            </span>
            <div>
              <div className="text-xs sm:text-sm font-bold tracking-[0.15em] flex items-center gap-1.5 uppercase">
                {hasSunk ? (
                  <>
                    <Flame className="w-4 h-4 text-[#b3352b] fill-[#b3352b] animate-pulse" />
                    <span>
                      Hull lost: {feedback.sunkShipName?.toUpperCase()}!
                    </span>
                  </>
                ) : isHit ? (
                  <span> Struck at {coordLabel}!</span>
                ) : (
                  <span> Splash at {coordLabel} — wide</span>
                )}
              </div>
              <div className="text-[11px] opacity-80">
                {isLocalAttacker
                  ? hasSunk
                    ? "Enemy hull confirmed on the bottom."
                    : isHit
                      ? "Shell struck enemy steel."
                      : "Shell fell in open sea."
                  : hasSunk
                    ? `We lost the ${feedback.sunkShipName} to enemy guns!`
                    : isHit
                      ? "One of our hulls is hit."
                      : "Enemy shell fell wide of our line."}
              </div>
            </div>
          </div>

          <div className="text-right text-[11px] font-bold px-2 py-0.5 wr-plate">
            {coordLabel}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
