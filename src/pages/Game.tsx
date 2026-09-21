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
    <div className="min-h-screen flex flex-col bg-[#04070a] text-slate-100 font-mono relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      {/* Background Navy Radar ambiance */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black -z-10" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#082f4912_1px,transparent_1px),linear-gradient(to_bottom,#082f4912_1px,transparent_1px)] bg-[size:3rem_3rem] -z-10" />
      {/* Slow radar sweep, the single ambient motion cue for the whole screen */}
      <div className="fixed inset-0 -z-10 flex items-center justify-center overflow-hidden pointer-events-none">
        <div className="w-[140vmax] h-[140vmax] rounded-full opacity-[0.05] motion-safe:animate-spin [animation-duration:18s] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_300deg,#22d3ee_330deg,transparent_360deg)]" />
      </div>

      {/* Top Combat Bar */}
      <header className="sticky top-0 z-30 bg-[#04070a]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-7xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex items-center gap-3 justify-self-start min-w-0">
            <button
              id="game-leave-btn"
              onClick={() => {
                sound.playButton();
                setWithdrawModalOpen(true);
              }}
              className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
              title="Leave Room"
            >
              <Home className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <Radar className="hidden xs:block w-4 h-4 text-cyan-400 shrink-0 motion-safe:animate-pulse" />
              <span className="text-sm sm:text-base font-bold tracking-wide text-cyan-300 uppercase truncate">
                Battleship Combat
              </span>
              <kbd
                className={`hidden sm:inline-flex rounded-md shrink-0 md:text-sm items-center text-[10px] font-bold px-2 py-1 bg-cyan-950/80 border border-cyan-800 text-cyan-300 `}
              >
                ROOM: {roomCode}
              </kbd>
            </div>
          </div>

          {/* Centered callsign vs opponent, color-coded to match board sides */}
          <div className="hidden sm:flex items-center gap-2 justify-self-center text-xs whitespace-nowrap">
            <span className="font-semibold text-cyan-300">
              {localPlayer.name}
            </span>
            <span className="text-slate-600">vs</span>
            <span className="font-semibold text-rose-300">{opponentName}</span>
          </div>

          <div className="flex items-center gap-2 justify-self-end">
            <button
              id="combat-how-to-play-btn"
              onClick={() => {
                sound.playButton();
                onOpenHowToPlay();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"
              title="How to Play"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs border font-mono ${
                connectionStatus === "connected"
                  ? "bg-emerald-950/60 border-emerald-800/60 text-emerald-400"
                  : "bg-rose-950/60 border-rose-800/60 text-rose-400 motion-safe:animate-pulse"
              }`}
            >
              {connectionStatus === "connected" ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CONNECTED</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>RECONNECTING</span>
                </>
              )}
            </div>

            <SoundToggle />
          </div>
        </div>

        {/* Mobile callsign row, centered below the main bar */}
        <div className="sm:hidden max-w-7xl mx-auto mt-1.5 flex items-center justify-center gap-2 text-xs">
          <span className="font-semibold text-cyan-300">
            {localPlayer.name}
          </span>
          <span className="text-slate-600">vs</span>
          <span className="font-semibold text-rose-300">{opponentName}</span>
        </div>
      </header>

      {/* Opponent Left Overlay */}
      <AnimatePresence>
        {opponentLeft && !isFinishedPhase && (
          <motion.div
            id="opponent-left-banner"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-950 border-b border-rose-600 text-rose-200 px-4 py-3 text-center text-xs flex items-center justify-center gap-3 z-40"
          >
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <strong>OPPONENT LEFT:</strong> The opponent has disconnected from
              the match.
            </div>
            <button
              id="opponent-left-return-home-btn"
              onClick={() => {
                sound.playButton();
                leaveRoom();
                onReturnHome();
              }}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-wider text-[11px] cursor-pointer"
            >
              RETURN HOME
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Game Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col justify-center relative">
        {/* Corner framing, echoes a targeting reticle without competing with the boards */}
        <div className="hidden sm:block pointer-events-none absolute inset-4 sm:inset-6 -z-0">
          <span className="absolute top-0 left-0 w-5 h-5 border-l-2 border-t-2 border-cyan-900/60" />
          <span className="absolute top-0 right-0 w-5 h-5 border-r-2 border-t-2 border-cyan-900/60" />
          <span className="absolute bottom-0 left-0 w-5 h-5 border-l-2 border-b-2 border-cyan-900/60" />
          <span className="absolute bottom-0 right-0 w-5 h-5 border-r-2 border-b-2 border-cyan-900/60" />
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
              <div className="relative mx-auto w-20 h-20 mb-6">
                <span className="absolute inset-0 rounded-full border border-amber-500/40 motion-safe:animate-ping" />
                <span className="absolute inset-2 rounded-full border border-amber-500/50" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <Radar className="w-7 h-7 text-amber-400" />
                </span>
              </div>
              <h2 className="text-base font-bold text-amber-300 uppercase tracking-wide">
                Awaiting second commander
              </h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Fleet deployment opens once both sides have joined room{" "}
                <span className="text-slate-300">{roomCode}</span>.
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
                <h2 className="text-xl sm:text-2xl font-bold tracking-wider text-slate-100 uppercase">
                  Strategic Fleet Deployment
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Click a sector to position warships. Press{" "}
                  <kbd className="text-slate-200 bg-slate-800 border border-slate-600 px-1.5 py-0.5 rounded font-mono text-[10px]">
                    R
                  </kbd>{" "}
                  to rotate.
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
                className={`flex sm:hidden max-w-md mx-auto w-full gap-2 p-1 bg-slate-900 border border-slate-800 ${PANEL_CLIP}`}
              >
                <button
                  type="button"
                  onClick={() => setMobileActiveTab("enemy")}
                  className={`flex-1 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    mobileActiveTab === "enemy"
                      ? "bg-rose-950 text-rose-300 border border-rose-500/50"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                  <span>Enemy waters</span>
                  {isMyTurn && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 motion-safe:animate-pulse" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileActiveTab("fleet")}
                  className={`flex-1 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    mobileActiveTab === "fleet"
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-500/50"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>My fleet</span>
                </button>
              </div>

              {/* Two Boards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start max-w-5xl mx-auto">
                <div
                  className={`${mobileActiveTab === "enemy" ? "hidden sm:block" : "block"}`}
                >
                  <GameBoard
                    title="MY FLEET"
                    isEnemy={false}
                    placedShips={myFleet}
                    attacks={enemyAttacksOnMe}
                  />
                </div>

                <div
                  className={`${mobileActiveTab === "fleet" ? "hidden sm:block" : "block"}`}
                >
                  <GameBoard
                    title="ENEMY WATERS"
                    isEnemy={true}
                    attacks={myAttacksOnEnemy}
                    sunkShips={sunkEnemyShips}
                    canAttack={isMyTurn && !isFinishedPhase}
                    onAttack={launchAttack}
                  />
                </div>
              </div>

              {/* Fleet Status Bar, ship pips make the count legible at a glance */}
              <div
                className={`max-w-md sm:max-w-2xl mx-auto flex border border-slate-800 bg-slate-900/60 ${PANEL_CLIP}`}
              >
                <div className="flex-1 flex items-center justify-between px-4 py-2.5 gap-2">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wide">
                    Enemy fleet
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`w-2.5 h-2.5 ${
                            i < sunkEnemyShips.length
                              ? "bg-rose-500"
                              : "bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-rose-400 whitespace-nowrap">
                      {sunkEnemyShips.length}/5 sunk
                    </span>
                  </div>
                </div>
                <div className="w-px bg-slate-800" />
                <div className="flex-1 flex items-center justify-between px-4 py-2.5 gap-2">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wide">
                    Your fleet
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-400 whitespace-nowrap">
                      {friendlyAfloat}/5 afloat
                    </span>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`w-2.5 h-2.5 ${
                            i < friendlyAfloat ? "bg-cyan-500" : "bg-slate-700"
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
              className="w-full max-w-md bg-slate-900/95 border border-rose-500/40 rounded-2xl shadow-2xl shadow-rose-950/50 overflow-hidden text-slate-100"
            >
              <div className="flex items-center gap-3 px-6 py-4 border-b border-rose-800/40 bg-slate-950/60">
                <AlertOctagon className="w-6 h-6 text-rose-400" />
                <div>
                  <h2
                    id="withdraw-modal-title"
                    className="font-mono text-sm tracking-wider uppercase text-rose-300 font-bold"
                  >
                    Withdraw from match?
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Your opponent will be notified that you left the room.
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
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playButton();
                    leaveRoom();
                    onReturnHome();
                  }}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider transition-colors"
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
