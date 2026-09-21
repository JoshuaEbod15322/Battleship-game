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
          className={`p-3 rounded-xl border font-mono flex items-center justify-between shadow-lg ${
            hasSunk
              ? "bg-rose-950/90 border-rose-500 text-rose-200 shadow-rose-950/50"
              : isHit
                ? "bg-amber-950/80 border-amber-500 text-amber-200 shadow-amber-950/50"
                : "bg-sky-950/70 border-sky-600/50 text-sky-200 shadow-sky-950/40"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">
              {hasSunk ? "🔥" : isHit ? "💥" : "💦"}
            </span>
            <div>
              <div className="text-xs sm:text-sm font-bold tracking-wider flex items-center gap-1.5">
                {hasSunk ? (
                  <>
                    <Flame className="w-4 h-4 text-rose-400 fill-rose-400 animate-pulse" />
                    <span>
                      SHIP SUNK: {feedback.sunkShipName?.toUpperCase()}!
                    </span>
                  </>
                ) : isHit ? (
                  <span> HIT at {coordLabel}!</span>
                ) : (
                  <span> MISS at {coordLabel}</span>
                )}
              </div>
              <div className="text-[11px] text-slate-300/80">
                {isLocalAttacker
                  ? hasSunk
                    ? "Target warship completely neutralized."
                    : isHit
                      ? "Direct strike confirmed on enemy hull."
                      : "Target missed. Warhead detonated in open water."
                  : hasSunk
                    ? `Your ${feedback.sunkShipName} was sunk by enemy fire!`
                    : isHit
                      ? "Damage sustained to your fleet."
                      : "Enemy strike splashed wide into the ocean."}
              </div>
            </div>
          </div>

          <div className="text-right text-[11px] font-bold px-2 py-0.5 rounded bg-black/40 border border-white/10">
            {coordLabel}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
