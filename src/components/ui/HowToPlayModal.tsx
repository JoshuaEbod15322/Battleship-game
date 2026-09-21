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
            className="w-full max-w-lg wr-panel overflow-hidden text-[#e9dfc4] relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#4d452c] bg-[#0d0b06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 border border-[#6f5d21] bg-[#14110a] flex items-center justify-center text-[#c9a227]">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="wr-head text-sm tracking-[0.2em] uppercase text-[#e8c84a]">
                    Field Manual
                  </h3>
                  <p className="text-xs text-[#a8956c]">
                    Standing orders for fleet action
                  </p>
                </div>
              </div>
              <button
                id="close-how-to-play-btn"
                onClick={() => {
                  sound.playButton();
                  onClose();
                }}
                className="p-1.5 text-[#a8956c] hover:text-[#efe3c2] hover:bg-[#2b2413] transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-sm text-[#e9dfc4]">
              {/* Rules List */}
              <div className="space-y-3">
                <h4 className="text-xs tracking-[0.3em] text-[#a8956c] uppercase">
                  Combat Directives
                </h4>
                <ol className="space-y-2.5 text-xs">
                  <li className="flex items-start gap-2.5 p-2 bg-[#0d0b06] border border-[#3a3423]">
                    <span>
                      <strong className="text-[#efe3c2]">
                        1. Lay your fleet:
                      </strong>{" "}
                      Set 5 hulls straight along the chart. No overlapping, no
                      hanging off the edge.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 p-2 bg-[#0d0b06] border border-[#3a3423]">
                    <span>
                      <strong className="text-[#efe3c2]">
                        2. Sign your orders:
                      </strong>{" "}
                      When both commanders sign, the guns are released.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 p-2 bg-[#0d0b06] border border-[#3a3423]">
                    <span>
                      <strong className="text-[#efe3c2]">
                        3. Fire by turns:
                      </strong>{" "}
                      Call one square per turn, A1 to J10.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 p-2 bg-[#0d0b06] border border-[#3a3423]">
                    <span>
                      <strong className="text-[#efe3c2]">
                        4. Fire &amp; smoke means STRUCK:
                      </strong>{" "}
                      Your shell found enemy steel.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 p-2 bg-[#0d0b06] border border-[#3a3423]">
                    <span>
                      <strong className="text-[#efe3c2]">
                        5. Splash means WIDE:
                      </strong>{" "}
                      Open sea. Correct your aim.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 p-2 bg-[#0d0b06] border border-[#3a3423]">
                    <span>
                      <strong className="text-[#efe3c2]">
                        6. Sink them all:
                      </strong>{" "}
                      Put every enemy hull on the bottom to win the day!
                    </span>
                  </li>
                </ol>
              </div>

              {/* Fleet Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs tracking-[0.3em] text-[#a8956c] uppercase">
                  Registered Hulls
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SHIPS.map((ship) => (
                    <div
                      key={ship.id}
                      className="flex items-center justify-between p-2.5 bg-[#0d0b06] border border-[#3a3423]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xl"
                          role="img"
                          aria-label={ship.name}
                        ></span>
                        <div>
                          <div className="text-xs text-[#efe3c2] font-semibold uppercase tracking-wider">
                            {ship.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: ship.size }).map((_, i) => (
                          <div
                            key={i}
                            className="w-2.5 h-3 bg-[#6b6238] border border-[#c9a227]/60"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-[#4d452c] bg-[#0d0b06] flex justify-end">
              <button
                id="dismiss-how-to-play-btn"
                onClick={() => {
                  sound.playButton();
                  onClose();
                }}
                className="wr-btn-brass px-5 py-2 text-xs cursor-pointer"
              >
                Understood, Sir
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
