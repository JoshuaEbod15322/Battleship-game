import React from "react";
import { motion } from "motion/react";
import { Target, Hourglass } from "lucide-react";
import type { PlayerRole } from "../../types/battleship";

interface TurnIndicatorProps {
  currentTurn: PlayerRole;
  localPlayerRole: PlayerRole;
  opponentName?: string;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  currentTurn,
  localPlayerRole,
  opponentName = "Opponent",
}) => {
  const isMyTurn = currentTurn === localPlayerRole;

  return (
    <div className="w-full max-w-md mx-auto my-2">
      <motion.div
        key={currentTurn}
        initial={{ scale: 0.96, opacity: 0, y: -4 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className={`px-4 py-2.5 flex items-center justify-between border ${
          isMyTurn
            ? "wr-panel border-[#c9a227]"
            : "bg-[#14110a] border-[#3a3423]"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 flex items-center justify-center border ${
              isMyTurn
                ? "bg-[#0d0b06] border-[#c9a227] text-[#e8c84a]"
                : "bg-[#0d0b06] border-[#3a3423] text-[#a8956c]"
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
              className={`wr-head text-xs sm:text-sm tracking-[0.2em] uppercase ${
                isMyTurn ? "text-[#e8c84a]" : "text-[#a8956c]"
              }`}
            >
              <span>{isMyTurn ? "Your guns — fire" : "Rival's guns"}</span>
            </div>
            <div className="text-[11px] text-[#a8956c]">
              {isMyTurn
                ? "Name a square on the enemy chart"
                : `Holding while ${opponentName} aims...`}
            </div>
          </div>
        </div>

        <div className="text-right">
          <span
            className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] border ${
              isMyTurn
                ? "bg-[#c9a227] text-[#1d1607] border-[#c9a227] animate-pulse"
                : "bg-[#0d0b06] text-[#a8956c] border-[#3a3423]"
            }`}
          >
            {isMyTurn ? "Fire" : "Stand by"}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
