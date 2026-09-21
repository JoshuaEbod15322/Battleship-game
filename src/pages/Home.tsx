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
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* War-room wall: map grid fading into dark oil-smoke */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#c9a22714_1px,transparent_1px),linear-gradient(to_bottom,#c9a22714_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_45%,#000_60%,transparent_100%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 flex justify-center pt-10 pointer-events-none opacity-25">
        <div className="w-[130vmax] h-[130vmax] rounded-full motion-safe:animate-spin [animation-duration:60s] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_340deg,#c9a22755_355deg,transparent_360deg)]" />
      </div>

      {/* Top command strip */}
      <div className="absolute top-0 left-0 right-0 z-20 border-b border-[#4d452c] bg-[#14110a]/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center text-[#c9a227] border border-[#6f5d21] bg-[#0d0b06]">
              <Anchor className="w-5 h-5" />
            </div>
            <span className="wr-head text-sm tracking-[0.25em] text-[#d9c9a3] hidden sm:inline">
              NAVAL OPERATIONS
            </span>
            <span className="wr-head text-sm tracking-[0.25em] text-[#d9c9a3] sm:hidden">
              WAR ROOM
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SoundToggle />
          </div>
        </div>
      </div>

      {/* Main dossier */}
      <motion.div
        id="home-main-card"
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="wr-panel w-full max-w-md mt-14 p-6 sm:p-8 text-center relative z-10"
      >
        {/* File tab */}
        <div className="absolute -top-3 left-6 wr-plate px-3 py-0.5 text-[10px] font-bold tracking-[0.3em] uppercase">
          File № 1944-B
        </div>
        <div className="absolute -top-3 right-6 wr-stamp text-[10px] text-[#b3352b]">
          Top Secret
        </div>

        {/* Brass emblem */}
        <div className="relative w-20 h-20 mx-auto mb-5 mt-2">
          <div className="absolute inset-0 border border-[#6f5d21] rotate-45" />
          <div className="absolute inset-1.5 border border-[#6f5d21]/60 rotate-45" />
          <div className="absolute inset-0 flex items-center justify-center text-[#c9a227]">
            <Radar className="w-9 h-9 animate-spin-slow" />
          </div>
        </div>

        {/* Title block */}
        <p className="text-[10px] tracking-[0.4em] uppercase text-[#a8956c] mb-1">
          Admiralty Order // Two Commanders
        </p>
        <h1 className="wr-head text-4xl sm:text-5xl text-[#efe3c2] uppercase leading-none">
          Battleship
        </h1>
        <div className="wr-rule my-4">
          <span />
        </div>
        <p className="text-xs tracking-[0.2em] text-[#c9a227] uppercase mb-7">
          Command your fleet. Sink theirs.
        </p>

        {/* Incoming invite dispatch */}
        {invitedRoomCode && (
          <div className="mb-6 p-3.5 bg-[#0d0b06] border border-[#c9a227] text-[#e9dfc4] text-xs text-left flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#c9a227] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold tracking-widest uppercase">
                Sealed orders received
              </div>
              <div className="text-[11px] text-[#a8956c] mt-0.5">
                You are summoned to operation{" "}
                <strong className="text-[#efe3c2] tracking-widest">
                  {invitedRoomCode}
                </strong>
                .
              </div>
            </div>
          </div>
        )}

        {/* Orders */}
        <div className="space-y-3">
          <button
            id="home-create-game-btn"
            type="button"
            onClick={() => {
              sound.playButton();
              onCreateGame();
            }}
            className="wr-btn-brass w-full py-3.5 px-4 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Open New Operation</span>
          </button>

          <button
            id="home-join-game-btn"
            type="button"
            onClick={() => {
              sound.playButton();
              onJoinGame();
            }}
            className="wr-btn-steel w-full py-3.5 px-4 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Report to Operation</span>
          </button>

          <button
            id="home-how-to-play-btn"
            type="button"
            onClick={() => {
              sound.playButton();
              onOpenHowToPlay();
            }}
            className="w-full py-2.5 px-4 text-[#a8956c] hover:text-[#efe3c2] text-[11px] font-bold tracking-[0.25em] uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Field Manual</span>
          </button>
        </div>

        {/* Footer docket */}
        <div className="mt-8 pt-4 border-t border-[#4d452c] flex items-center justify-between text-[10px] tracking-[0.2em] uppercase text-[#a8956c]">
          <span>Battle Room # 7 </span>
          <span className="text-[#efe3c2]">
            Filed by: <span className="text-[#efe3c2]"></span>
            <a
              className="text-[#efe3c2] hover:text-[#c9a227] transition-colors"
              href="https://joshuaebodportfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Joshua Ebod
            </a>
          </span>
        </div>
      </motion.div>
    </div>
  );
};
