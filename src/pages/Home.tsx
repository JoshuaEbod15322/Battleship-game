import React from "react";
import { motion } from "motion/react";
import {
  Anchor,
  ShieldAlert,
  PlusCircle,
  LogIn,
  HelpCircle,
  Radar,
} from "lucide-react";
import { sound } from "../lib/sound";
import { SoundToggle } from "../components/ui/SoundToggle";

interface HomeProps {
  onCreateGame: () => void;
  onJoinGame: () => void;
  onOpenHowToPlay: () => void;
  onOpenSupabaseConfig: () => void;
  invitedRoomCode?: string | null;
}

export const Home: React.FC<HomeProps> = ({
  onCreateGame,
  onJoinGame,
  onOpenHowToPlay,
  invitedRoomCode,
}) => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden font-sans">
      {/* Background Naval Radar Grid Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black -z-10" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f4915_1px,transparent_1px),linear-gradient(to_bottom,#082f4915_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] -z-10" />

      {/* Top Controls Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between max-w-5xl mx-auto z-20">
        <div className="flex items-center gap-1">
          <div className="w-8 h-8 flex items-center justify-center text-cyan-400">
            <Anchor className="w-6 h-6" />
          </div>
          <span className="font-mono text-lg tracking-wider text-cyan-400/80 font-bold hidden sm:inline">
            USN TACTICAL GRID
          </span>
        </div>

        <div className="flex items-center gap-2">
          <SoundToggle />
        </div>
      </div>

      {/* Main Home Card */}
      <motion.div
        id="home-main-card"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/85 border border-cyan-500/30 shadow-2xl shadow-cyan-950/60 backdrop-blur-xl text-center relative z-10 font-mono"
      >
        {/* Radar Icon Emblem */}
        <div className="relative w-20 h-20 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full bg-cyan-500/10 border border-cyan-400/40 animate-pulse" />
          <div className="w-full h-full rounded-full border border-cyan-500/60 flex items-center justify-center text-cyan-400">
            <Radar className="w-9 h-9 animate-spin-slow" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-widest text-slate-100 uppercase">
          BATTLESHIP
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm font-semibold text-cyan-400 tracking-wider mt-2 mb-8 uppercase">
          Command your fleet. Sink theirs.
        </p>

        {/* If invited room code detected from URL */}
        {invitedRoomCode && (
          <div className="mb-6 p-3.5 rounded-2xl bg-cyan-950/80 border border-cyan-400 text-cyan-200 text-xs text-left flex items-start gap-2.5 shadow-md">
            <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Incoming Combat Invite!</div>
              <div className="text-[11px] text-cyan-300/80 mt-0.5">
                You've been invited to join match{" "}
                <strong className="text-white tracking-wider">
                  {invitedRoomCode}
                </strong>
                .
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            id="home-create-game-btn"
            type="button"
            onClick={() => {
              sound.playButton();
              onCreateGame();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>CREATE GAME</span>
          </button>

          <button
            id="home-join-game-btn"
            type="button"
            onClick={() => {
              sound.playButton();
              onJoinGame();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-cyan-500 text-slate-100 font-bold text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-cyan-400" />
            <span>JOIN GAME</span>
          </button>

          <button
            id="home-how-to-play-btn"
            type="button"
            onClick={() => {
              sound.playButton();
              onOpenHowToPlay();
            }}
            className="w-full py-2.5 px-4 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>HOW TO PLAY</span>
          </button>
        </div>

        {/* Fleet Preview Badges */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-center gap-3 text-slate-400 text-sm">
          <span>Create by: Joshua Ebod</span>
        </div>
      </motion.div>
    </div>
  );
};
