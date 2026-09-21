import { motion, AnimatePresence } from "motion/react";
import {
  X,
  HelpCircle,
  // Shield,
  // Target,
  // Waves,
  // Flame,
  // Award,
} from "lucide-react";
import { SHIPS } from "../../config/ships";
import { sound } from "../../lib/sound";

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            id="how-to-play-modal"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg bg-slate-900/95 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/60 overflow-hidden text-slate-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-800/40 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8  flex items-center justify-center text-cyan-400">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-mono text-sm tracking-wider uppercase text-cyan-400 font-bold">
                    Naval Protocol
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Battleship Combat Instructions
                  </p>
                </div>
              </div>
              <button
                id="close-how-to-play-btn"
                onClick={() => {
                  sound.playButton();
                  onClose();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto font-sans text-sm text-slate-300">
              {/* Rules List */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono tracking-widest text-slate-400 uppercase">
                  Combat Directives
                </h4>
                <ol className="space-y-2.5 text-xs font-mono">
                  <li className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                    <span>
                      <strong className="text-slate-100">
                        1. Place your fleet:
                      </strong>{" "}
                      Position your 5 naval vessels horizontally or vertically.
                      Ships cannot overlap or cross grid boundaries.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                    <span>
                      <strong className="text-slate-100">
                        2. Wait for opponent:
                      </strong>{" "}
                      Once both commanders lock in fleet placement, combat
                      coordinates unlock.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                    <span>
                      <strong className="text-slate-100">
                        3. Take turns attacking:
                      </strong>{" "}
                      Call strikes on enemy grid sectors (A1 to J10).
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                    <span>
                      <strong className="text-slate-100">
                        4. 💥 or 🔥 means HIT:
                      </strong>{" "}
                      A strike successfully damaged an enemy warship.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                    <span>
                      <strong className="text-slate-100">
                        5. 💦 means MISS:
                      </strong>{" "}
                      The strike hit open water.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                    <span>
                      <strong className="text-slate-100">
                        6. Complete annihilation:
                      </strong>{" "}
                      Sink every enemy ship across the board to secure victory!
                    </span>
                  </li>
                </ol>
              </div>

              {/* Fleet Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono tracking-widest text-slate-400 uppercase">
                  Classified Fleet Roster
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SHIPS.map((ship) => (
                    <div
                      key={ship.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xl"
                          role="img"
                          aria-label={ship.name}
                        >
                          {ship.emoji}
                        </span>
                        <div>
                          <div className="font-mono text-xs text-slate-200 font-semibold">
                            {ship.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {ship.size} Grid Sectors
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: ship.size }).map((_, i) => (
                          <div
                            key={i}
                            className="w-2.5 h-3 bg-cyan-500/40 border border-cyan-400/60 rounded-xs"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex justify-end">
              <button
                id="dismiss-how-to-play-btn"
                onClick={() => {
                  sound.playButton();
                  onClose();
                }}
                className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Understood, Commander
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
