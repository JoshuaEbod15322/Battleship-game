import React from "react";
import { motion } from "motion/react";
import type { Player, Room } from "../../types/battleship";
import { Swords, Wifi, ArrowRight } from "lucide-react";
import { sound } from "../../lib/sound";

interface RoomLobbyProps {
  room: Room;
  localPlayer: Player;
  opponentConnected: boolean;
  onContinueToPlacement: () => void;
}

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  room,
  localPlayer,
  opponentConnected,
  onContinueToPlacement,
}) => {
  const p1 = room.player1;
  const p2 = room.player2;

  const bothPresent = Boolean(p1 && p2 && opponentConnected);

  return (
    <motion.div
      id="room-lobby-panel"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="wr-panel w-full max-w-lg mx-auto p-6 sm:p-8 text-[#e9dfc4] relative"
    >
      <div className="absolute -top-3 left-6 wr-plate px-3 py-0.5 text-[10px] font-bold tracking-[0.3em] uppercase">
        Muster Roll // {room.roomCode}
      </div>

      <div className="text-center mb-6 mt-2">
        <h2 className="wr-head text-xl sm:text-2xl tracking-wider text-[#efe3c2] uppercase">
          Officers Assembled
        </h2>
        <p className="text-xs text-[#a8956c] mt-1">
          {bothPresent
            ? "Both flagships wired to the plot table. Lay your fleets."
            : "Holding the frequency open for the second officer..."}
        </p>
      </div>

      {/* Versus Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative mb-6">
        {/* PLAYER 1 */}
        <div className="p-4 bg-[#0d0b06] border border-[#6f5d21] relative">
          <div className="text-[10px] text-[#c9a227] uppercase tracking-[0.25em] mb-1 font-bold">
            Officer One (Host)
          </div>
          <div className="text-base font-bold text-[#efe3c2] truncate uppercase tracking-wider">
            {p1
              ? `${p1.name}${localPlayer.id === p1.id ? " (You)" : ""}`
              : "Post vacant..."}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-[#7da05c] tracking-widest uppercase">
            <span className="w-2 h-2 bg-[#7da05c] animate-ping" />
            <span>At post</span>
          </div>
        </div>

        {/* VS Badge */}
        <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 rotate-45 bg-[#14110a] border border-[#c9a227] items-center justify-center shadow-md">
          <span className="-rotate-45 wr-head text-xs text-[#e8c84a]">VS</span>
        </div>

        {/* PLAYER 2 */}
        <div
          className={`p-4 border relative ${
            p2 && opponentConnected
              ? "bg-[#0d0b06] border-[#6f5d21]"
              : "bg-[#0d0b06]/60 border-[#3a3423]"
          }`}
        >
          <div className="text-[10px] text-[#c9a227] uppercase tracking-[0.25em] mb-1 font-bold">
            Officer Two (Rival)
          </div>
          <div className="text-base font-bold text-[#efe3c2] truncate uppercase tracking-wider">
            {p2
              ? `${p2.name}${localPlayer.id === p2.id ? " (You)" : ""}`
              : "Post vacant..."}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs tracking-widest uppercase">
            {p2 && opponentConnected ? (
              <span className="text-[#7da05c] flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#7da05c] animate-ping" />
                <span>At post</span>
              </span>
            ) : (
              <span className="text-[#c9a227] flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 animate-pulse" />
                <span>Awaiting wireless</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Button to proceed to placement */}
      {bothPresent ? (
        <button
          id="continue-to-placement-btn"
          type="button"
          onClick={() => {
            sound.playButton();
            onContinueToPlacement();
          }}
          className="wr-btn-brass w-full py-3.5 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer animate-pulse"
        >
          <Swords className="w-4 h-4" />
          <span>Proceed to the Plot Table</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : (
        <div className="p-3.5 bg-[#0d0b06] border border-[#3a3423] text-center text-xs text-[#a8956c] tracking-widest uppercase flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-[#c9a227] animate-ping" />
          <span>Operations unlock when both officers report.</span>
        </div>
      )}
    </motion.div>
  );
};
