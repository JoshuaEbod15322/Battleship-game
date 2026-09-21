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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-lg mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900/95 border border-cyan-500/30 shadow-2xl backdrop-blur-md font-mono text-slate-100"
    >
      <div className="text-center mb-6">
        <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/50 inline-block mb-2">
          COMBAT LOBBY • ROOM {room.roomCode}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-wider text-slate-100 uppercase">
          FLEET COMMANDERS ASSEMBLED
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {bothPresent
            ? "Both flagships linked. Proceeding to fleet positioning."
            : "Awaiting challenger link on tactical frequency..."}
        </p>
      </div>

      {/* Versus Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative mb-6">
        {/* PLAYER 1 */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/40 relative overflow-hidden">
          <div className="text-[10px] text-cyan-400 uppercase tracking-widest mb-1 font-bold">
            PLAYER 1 (HOST)
          </div>
          <div className="text-base font-bold text-slate-100 truncate">
            {p1
              ? `${p1.name}${localPlayer.id === p1.id ? " (You)" : ""}`
              : "Waiting for Host..."}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Connected</span>
          </div>
        </div>

        {/* VS Badge */}
        <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-slate-900 border border-cyan-500/50 items-center justify-center text-xs font-extrabold text-cyan-300 shadow-md">
          VS
        </div>

        {/* PLAYER 2 */}
        <div
          className={`p-4 rounded-2xl border relative overflow-hidden ${
            p2 && opponentConnected
              ? "bg-slate-950/80 border-cyan-500/40"
              : "bg-slate-950/40 border-slate-800/80"
          }`}
        >
          <div className="text-[10px] text-cyan-400 uppercase tracking-widest mb-1 font-bold">
            PLAYER 2 (CHALLENGER)
          </div>
          <div className="text-base font-bold text-slate-100 truncate">
            {p2
              ? `${p2.name}${localPlayer.id === p2.id ? " (You)" : ""}`
              : "Waiting for Opponent..."}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            {p2 && opponentConnected ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Connected</span>
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Awaiting Signal</span>
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
          className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer animate-pulse"
        >
          <Swords className="w-4 h-4" />
          <span>PROCEED TO SHIP PLACEMENT</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Combat operations will unlock once both players connect.</span>
        </div>
      )}
    </motion.div>
  );
};
