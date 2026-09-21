import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type {
  Coordinate,
  Orientation,
  Player,
  ShipDefinition,
} from "../types/battleship";
import { SHIPS } from "../config/ships";
import { placeShip, randomizeFleet, rotateOrientation } from "../lib/gameLogic";
import { GameBoard } from "../components/battleship/GameBoard";
import { PlacementControls } from "../components/battleship/PlacementControls";
import { TurnIndicator } from "../components/battleship/TurnIndicator";
import { AttackResult } from "../components/battleship/AttackResult";
import { GameOver } from "../components/battleship/GameOver";
import { SoundToggle } from "../components/ui/SoundToggle";
import { useMultiplayer } from "../hooks/useMultiplayer";
import {
  WifiOff,
  Wifi,
  AlertOctagon,
  Home,
  Shield,
  Crosshair,
  HelpCircle,
  Radar,
} from "lucide-react";
import { sound } from "../lib/sound";

interface GameProps {
  roomCode: string;
  localPlayer: Player;
  initialOpponentConnected?: boolean;
  initialOpponentName?: string;
  onReturnHome: () => void;
  onOpenHowToPlay: () => void;
}

// Shared clipped-corner panel shape used across HUD chrome, in place of
// rounded "SaaS card" corners, to read as instrument panelling rather
// than generic UI chrome.
const PANEL_CLIP =
  "[clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)]";
// const PANEL_CLIP_SM =
//   "[clip-path:polygon(6px_0,100%_0,100%_calc(100%-6px),calc(100%-6px)_100%,0_100%,0_6px)]" ;

export const Game: React.FC<GameProps> = ({
  roomCode,
  localPlayer,
  initialOpponentConnected = false,
  initialOpponentName,
  onReturnHome,
  onOpenHowToPlay,
}) => {
  const {
    room,
    connectionStatus,
    opponentConnected,
    opponentLeft,
    myFleet,
    setMyFleet,
    myFleetReady,
    opponentFleetReady,
    myAttacksOnEnemy,
    enemyAttacksOnMe,
    sunkEnemyShips,
    lastAttackFeedback,
    setReady,
    launchAttack,
    requestRematch,
    leaveRoom,
  } = useMultiplayer(
    roomCode,
    localPlayer,
    undefined,
    initialOpponentConnected,
  );

  // Placement local state
  const [selectedShipDef, setSelectedShipDef] = useState<ShipDefinition | null>(
    SHIPS[0],
  );
  const [orientation, setOrientation] = useState<Orientation>("horizontal");

  // Mobile active board tab ('fleet' | 'enemy')
  const [mobileActiveTab, setMobileActiveTab] = useState<"fleet" | "enemy">(
    "enemy",
  );
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  const isWaitingForOpponent =
    !opponentConnected && room?.status !== "placement";
  const isPlacementPhase =
    room?.status === "placement" ||
    (opponentConnected && (!myFleetReady || !opponentFleetReady));
  const isBattlePhase =
    room?.status === "battle" && myFleetReady && opponentFleetReady;
  const isFinishedPhase = room?.status === "finished";

  const isMyTurn = room?.currentTurn === localPlayer.role;
  const friendlyAfloat = myFleet.filter((s) => !s.isSunk).length;

  // Handle ship placement by clicking on board cell
  const handleBoardPlace = (origin: Coordinate) => {
    if (!selectedShipDef || myFleetReady) return;

    const newFleet = placeShip(selectedShipDef, origin, orientation, myFleet);
    if (newFleet) {
      sound.playButton();
      setMyFleet(newFleet);

      // Select next unplaced ship automatically
      const nextUnplaced = SHIPS.find(
        (s) => !newFleet.some((placed) => placed.id === s.id),
      );
      if (nextUnplaced) {
        setSelectedShipDef(nextUnplaced);
      }
    } else {
      sound.playMiss(); // invalid buzzer feedback
    }
  };

  // Rotate orientation
  const handleRotate = () => {
    setOrientation((prev) => rotateOrientation(prev));
  };

  // Randomize all 5 ships
  const handleRandomize = () => {
    const randomFleet = randomizeFleet(SHIPS);
    setMyFleet(randomFleet);
    setSelectedShipDef(null);
  };

  // Reset fleet
  const handleReset = () => {
    setMyFleet([]);
    setSelectedShipDef(SHIPS[0]);
  };

  // Keyboard shortcut 'R' to rotate
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        handleRotate();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const opponentName =
    localPlayer.role === "player1"
      ? room?.player2?.name || initialOpponentName || "Challenger"
      : room?.player1?.name || initialOpponentName || "Host Admiral";

  return (
    <div className="min-h-screen flex flex-col bg-[#12100a] text-[#e9dfc4] relative overflow-x-hidden">
      {/* War-room wall: faint chart grid over oil-dark plaster */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#c9a22710_1px,transparent_1px),linear-gradient(to_bottom,#c9a22710_1px,transparent_1px)] bg-[size:3rem_3rem] -z-10 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,#000_50%,transparent_100%)]" />
      {/* Slow plot-table sweep, the single ambient motion cue */}
      <div className="fixed inset-0 -z-10 flex items-center justify-center overflow-hidden pointer-events-none">
        <div className="w-[140vmax] h-[140vmax] rounded-full opacity-[0.05] motion-safe:animate-spin [animation-duration:40s] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_300deg,#c9a227_330deg,transparent_360deg)]" />
      </div>

      {/* Top Command Strip */}
      <header className="sticky top-0 z-30 bg-[#14110a]/95 backdrop-blur-md border-b border-[#4d452c] px-2 sm:px-4 py-2.5 sm:py-3">
        <div className="max-w-7xl mx-auto flex sm:grid sm:grid-cols-[1fr_auto_1fr] items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 justify-self-start min-w-0 flex-1">
            <button
              id="game-leave-btn"
              onClick={() => {
                sound.playButton();
                setWithdrawModalOpen(true);
              }}
              className="shrink-0 p-1.5 text-[#a8956c] hover:text-[#b3352b] transition-colors"
              title="Leave the room"
            >
              <Home className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <Radar className="hidden xs:block w-4 h-4 text-[#c9a227] shrink-0 motion-safe:animate-pulse" />
              <span className="wr-head text-xs sm:text-base tracking-[0.2em] text-[#efe3c2] uppercase truncate max-w-[10rem] sm:max-w-none">
                Plot Room
              </span>
              <kbd
                className={`hidden sm:inline-flex shrink-0 md:text-sm items-center text-[10px] font-bold px-2 py-1 wr-plate tracking-[0.2em]`}
              >
                OP: {roomCode}
              </kbd>
            </div>
          </div>

          {/* Centered callsign vs opponent, color-coded to match board sides */}
          <div className="hidden sm:flex items-center gap-2 justify-self-center text-xs whitespace-nowrap tracking-[0.15em] uppercase">
            <span className="font-semibold text-[#e8c84a]">
              {localPlayer.name}
            </span>
            <span className="text-[#6e6040]">vs</span>
            <span className="font-semibold text-[#e89a90]">{opponentName}</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 justify-self-end shrink-0">
            <button
              id="combat-how-to-play-btn"
              onClick={() => {
                sound.playButton();
                onOpenHowToPlay();
              }}
              className="p-1.5 text-[#a8956c] hover:text-[#e8c84a] transition-colors"
              title="Field manual"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] tracking-[0.2em] uppercase border ${
                connectionStatus === "connected"
                  ? "bg-[#1c2415] border-[#7da05c] text-[#7da05c]"
                  : "bg-[#2a0f0c] border-[#b3352b] text-[#e89a90] motion-safe:animate-pulse"
              }`}
            >
              {connectionStatus === "connected" ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Wired</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Cut off</span>
                </>
              )}
            </div>

            <SoundToggle />
          </div>
        </div>

        {/* Mobile callsign row, centered below the main bar */}
        <div className="sm:hidden max-w-7xl mx-auto mt-1.5 flex items-center justify-center gap-2 text-[11px] truncate tracking-[0.15em] uppercase">
          <span className="font-semibold text-[#e8c84a] truncate max-w-[9rem]">
            {localPlayer.name}
          </span>
          <span className="text-[#6e6040]">vs</span>
          <span className="font-semibold text-[#e89a90] truncate max-w-[9rem]">
            {opponentName}
          </span>
        </div>
      </header>

      {/* Opponent Left Overlay */}
      <AnimatePresence>
        {opponentLeft && !isFinishedPhase && (
          <motion.div
            id="opponent-left-banner"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#2a0f0c] border-b border-[#b3352b] text-[#e89a90] px-4 py-3 text-center text-xs flex items-center justify-center gap-3 z-40"
          >
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <div>
              <strong className="tracking-[0.2em] uppercase">
                Officer gone:
              </strong>{" "}
              the rival has left the room.
            </div>
            <button
              id="opponent-left-return-home-btn"
              onClick={() => {
                sound.playButton();
                leaveRoom();
                onReturnHome();
              }}
              className="px-3 py-1 bg-[#b3352b] hover:bg-[#c9453a] text-[#efe3c2] font-bold uppercase tracking-wider text-[11px] cursor-pointer"
            >
              Fall back
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Game Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col justify-center relative">
        {/* Corner framing, brass surveyor marks */}
        <div className="hidden sm:block pointer-events-none absolute inset-4 sm:inset-6 -z-0">
          <span className="absolute top-0 left-0 w-5 h-5 border-l-2 border-t-2 border-[#6f5d21]" />
          <span className="absolute top-0 right-0 w-5 h-5 border-r-2 border-t-2 border-[#6f5d21]" />
          <span className="absolute bottom-0 left-0 w-5 h-5 border-l-2 border-b-2 border-[#6f5d21]" />
          <span className="absolute bottom-0 right-0 w-5 h-5 border-r-2 border-b-2 border-[#6f5d21]" />
        </div>

        <AnimatePresence mode="wait">
          {/* PHASE 0: WAITING FOR OPPONENT */}
          {isWaitingForOpponent && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="max-w-sm mx-auto text-center py-10"
            >
              <div className="relative mx-auto w-20 h-20 mb-6"></div>
              <h2 className="wr-head text-base text-[#e8c84a] uppercase tracking-[0.2em]">
                Holding for the second officer
              </h2>
              <p className="text-xs text-[#a8956c] mt-2 leading-relaxed">
                The plot table opens once both sides report to room{" "}
                <span className="text-[#efe3c2] tracking-[0.2em]">
                  {roomCode}
                </span>
                .
              </p>
            </motion.div>
          )}

          {/* PHASE 1: SHIP PLACEMENT */}
          {!isWaitingForOpponent && isPlacementPhase && (
            <motion.div
              key="placement"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="text-center max-w-md mx-auto">
                <p className="text-[10px] tracking-[0.4em] uppercase text-[#a8956c] mb-1">
                  Chart № {roomCode}
                </p>
                <h2 className="wr-head text-xl sm:text-2xl tracking-[0.15em] text-[#efe3c2] uppercase">
                  Lay the Fleet
                </h2>
                <div className="wr-rule my-3">
                  <span />
                </div>
                <p className="text-xs text-[#a8956c] mt-1">
                  Stamp each hull on an open square. Press{" "}
                  <kbd className="text-[#efe3c2] bg-[#0d0b06] border border-[#6f5d21] px-1.5 py-0.5 text-[10px]">
                    R
                  </kbd>{" "}
                  to turn a hull.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start max-w-4xl mx-auto">
                <GameBoard
                  title="Deployment"
                  isEnemy={false}
                  placedShips={myFleet}
                  isPlacementMode={!myFleetReady}
                  selectedShipDef={selectedShipDef}
                  orientation={orientation}
                  onPlaceShip={handleBoardPlace}
                />

                <PlacementControls
                  placedShips={myFleet}
                  selectedShip={selectedShipDef}
                  orientation={orientation}
                  onSelectShip={setSelectedShipDef}
                  onRotate={handleRotate}
                  onRandomize={handleRandomize}
                  onReset={handleReset}
                  onReady={setReady}
                  isReady={myFleetReady}
                  opponentReady={opponentFleetReady}
                />
              </div>
            </motion.div>
          )}

          {/* PHASE 2: BATTLE */}
          {(isBattlePhase || isFinishedPhase) && (
            <motion.div
              key="battle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <TurnIndicator
                currentTurn={room?.currentTurn || "player1"}
                localPlayerRole={localPlayer.role}
                opponentName={opponentName}
              />

              <AttackResult
                feedback={lastAttackFeedback}
                localPlayerRole={localPlayer.role}
              />

              {/* Mobile Tab Switcher */}
              <div
                className={`flex sm:hidden max-w-md mx-auto w-full gap-2 p-1 bg-[#14110a] border border-[#4d452c] ${PANEL_CLIP}`}
              >
                <button
                  type="button"
                  onClick={() => setMobileActiveTab("enemy")}
                  className={`flex-1 py-2 text-[11px] font-bold tracking-[0.15em] uppercase transition-all flex items-center justify-center gap-1.5 ${
                    mobileActiveTab === "enemy"
                      ? "bg-[#2a0f0c] text-[#e89a90] border border-[#b3352b]"
                      : "text-[#a8956c] hover:text-[#efe3c2]"
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Their chart</span>
                  {isMyTurn && (
                    <span className="w-1.5 h-1.5 bg-[#c9a227] motion-safe:animate-pulse" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileActiveTab("fleet")}
                  className={`flex-1 py-2 text-[11px] font-bold tracking-[0.15em] uppercase transition-all flex items-center justify-center gap-1.5 ${
                    mobileActiveTab === "fleet"
                      ? "bg-[#2b2413] text-[#e8c84a] border border-[#c9a227]"
                      : "text-[#a8956c] hover:text-[#efe3c2]"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Our chart</span>
                </button>
              </div>

              {/* Two Boards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start max-w-5xl mx-auto">
                <div
                  className={`${mobileActiveTab === "enemy" ? "hidden sm:block" : "block"}`}
                >
                  <GameBoard
                    title="Our Waters"
                    isEnemy={false}
                    placedShips={myFleet}
                    attacks={enemyAttacksOnMe}
                  />
                </div>

                <div
                  className={`${mobileActiveTab === "fleet" ? "hidden sm:block" : "block"}`}
                >
                  <GameBoard
                    title="Their Waters"
                    isEnemy={true}
                    attacks={myAttacksOnEnemy}
                    sunkShips={sunkEnemyShips}
                    canAttack={isMyTurn && !isFinishedPhase}
                    onAttack={launchAttack}
                  />
                </div>
              </div>

              {/* Fleet Status Ledger */}
              <div
                className={`max-w-md sm:max-w-2xl mx-auto flex flex-col sm:flex-row border border-[#4d452c] bg-[#14110a]`}
              >
                <div className="flex-1 flex items-center justify-between px-3 sm:px-4 py-2.5 gap-2">
                  <span className="text-[11px] text-[#a8956c] uppercase tracking-[0.2em]">
                    Their hulls
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`w-2.5 h-2.5 border ${
                            i < sunkEnemyShips.length
                              ? "bg-[#b3352b] border-[#b3352b]"
                              : "bg-[#0d0b06] border-[#4d452c]"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-[#e89a90] whitespace-nowrap tracking-widest">
                      {sunkEnemyShips.length}/5 DOWN
                    </span>
                  </div>
                </div>
                <div className="h-px w-full sm:h-auto sm:w-px bg-[#4d452c]" />
                <div className="flex-1 flex items-center justify-between px-3 sm:px-4 py-2.5 gap-2">
                  <span className="text-[11px] text-[#a8956c] uppercase tracking-[0.2em]">
                    Our hulls
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#e8c84a] whitespace-nowrap tracking-widest">
                      {friendlyAfloat}/5 AFLOAT
                    </span>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`w-2.5 h-2.5 border ${
                            i < friendlyAfloat
                              ? "bg-[#6b6238] border-[#c9a227]"
                              : "bg-[#0d0b06] border-[#4d452c]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {withdrawModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="withdraw-modal-title"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md wr-panel overflow-hidden text-[#e9dfc4]"
            >
              <div className="flex items-center gap-3 px-6 py-4 border-b border-[#b3352b] bg-[#2a0f0c]">
                <AlertOctagon className="w-6 h-6 text-[#b3352b]" />
                <div>
                  <h2
                    id="withdraw-modal-title"
                    className="wr-head text-sm tracking-[0.2em] uppercase text-[#e89a90]"
                  >
                    Strike the colours?
                  </h2>
                  <p className="text-xs text-[#a8956c] mt-1">
                    The rival room will be told you quit the field.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    sound.playButton();
                    setWithdrawModalOpen(false);
                  }}
                  className="wr-btn-steel px-4 py-2 text-xs"
                >
                  Hold post
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playButton();
                    leaveRoom();
                    onReturnHome();
                  }}
                  className="px-4 py-2 bg-[#b3352b] hover:bg-[#c9453a] text-[#efe3c2] text-xs font-bold uppercase tracking-[0.2em] transition-colors border border-[#7c231d]"
                >
                  Withdraw
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GAME OVER MODAL */}
      {isFinishedPhase && (
        <GameOver
          winner={room?.winner || null}
          localPlayerRole={localPlayer.role}
          onPlayAgain={requestRematch}
          onReturnHome={() => {
            leaveRoom();
            onReturnHome();
          }}
        />
      )}
    </div>
  );
};
