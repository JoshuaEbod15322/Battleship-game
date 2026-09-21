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
} from "lucide-react";
import { sound } from "../lib/sound";

interface GameProps {
  roomCode: string;
  localPlayer: Player;
  initialOpponentConnected?: boolean;
  onReturnHome: () => void;
  onOpenHowToPlay: () => void;
}

export const Game: React.FC<GameProps> = ({
  roomCode,
  localPlayer,
  initialOpponentConnected = false,
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

  const isPlacementPhase =
    room?.status === "placement" ||
    (opponentConnected && (!myFleetReady || !opponentFleetReady));
  const isBattlePhase =
    room?.status === "battle" && myFleetReady && opponentFleetReady;
  const isFinishedPhase = room?.status === "finished";

  const isMyTurn = room?.currentTurn === localPlayer.role;

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
      ? room?.player2?.name || "Challenger"
      : room?.player1?.name || "Host Admiral";

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-mono relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      {/* Background Navy Radar ambiance */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black -z-10" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#082f4912_1px,transparent_1px),linear-gradient(to_bottom,#082f4912_1px,transparent_1px)] bg-[size:3rem_3rem] -z-10" />

      {/* Top Combat Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="game-leave-btn"
              onClick={() => {
                sound.playButton();
                if (
                  window.confirm(
                    "Are you sure you want to withdraw from this operation?",
                  )
                ) {
                  leaveRoom();
                  onReturnHome();
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
              title="Leave Room"
            >
              <Home className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold tracking-wider text-cyan-400 uppercase">
                  BATTLESHIP COMBAT
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                  ROOM: {roomCode}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>
                  Callsign:{" "}
                  <strong className="text-slate-200">{localPlayer.name}</strong>
                </span>
                <span>•</span>
                <span>
                  VS <strong className="text-slate-200">{opponentName}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection status tag */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border ${
                connectionStatus === "connected"
                  ? "bg-emerald-950/60 border-emerald-800/60 text-emerald-400"
                  : "bg-rose-950/60 border-rose-800/60 text-rose-400 animate-pulse"
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
                  <span>RECONNECTING...</span>
                </>
              )}
            </div>

            <button
              id="combat-how-to-play-btn"
              onClick={() => {
                sound.playButton();
                onOpenHowToPlay();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-900 transition-colors"
              title="How to Play"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <SoundToggle />
          </div>
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col justify-center">
        {/* PHASE 1: SHIP PLACEMENT */}
        {!opponentConnected && room?.status !== "placement" && (
          <div className="max-w-md mx-auto p-6 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-center">
            <h2 className="text-lg font-bold text-amber-300 uppercase tracking-wider">
              Waiting for opponent
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              Fleet placement will unlock when both commanders join this room.
            </p>
          </div>
        )}

        {isPlacementPhase && (
          <div className="space-y-6">
            <div className="text-center max-w-md mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold tracking-wider text-slate-100 uppercase">
                STRATEGIC FLEET DEPLOYMENT
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Drag or click sectors to position warships. Press{" "}
                <strong>R</strong> or [ROTATE] to toggle orientation.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start max-w-4xl mx-auto">
              {/* Board */}
              <GameBoard
                title="MY FLEET (DEPLOYMENT)"
                isEnemy={false}
                placedShips={myFleet}
                isPlacementMode={!myFleetReady}
                selectedShipDef={selectedShipDef}
                orientation={orientation}
                onPlaceShip={handleBoardPlace}
              />

              {/* Placement Controls */}
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
          </div>
        )}

        {/* PHASE 2: BATTLE */}
        {(isBattlePhase || isFinishedPhase) && (
          <div className="space-y-4">
            {/* Turn Indicator */}
            <TurnIndicator
              currentTurn={room?.currentTurn || "player1"}
              localPlayerRole={localPlayer.role}
              opponentName={opponentName}
            />

            {/* Attack Feedback Banner */}
            <AttackResult
              feedback={lastAttackFeedback}
              localPlayerRole={localPlayer.role}
            />

            {/* Mobile Tab Switcher */}
            <div className="flex sm:hidden max-w-md mx-auto w-full gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setMobileActiveTab("enemy")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mobileActiveTab === "enemy"
                    ? "bg-rose-950 text-rose-300 border border-rose-500/50 shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                <span>ENEMY WATERS {isMyTurn && "🎯"}</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileActiveTab("fleet")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mobileActiveTab === "fleet"
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>MY FLEET</span>
              </button>
            </div>

            {/* Two Boards: Side-by-side on desktop, toggleable or stacked on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start max-w-5xl mx-auto">
              {/* MY FLEET BOARD */}
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

              {/* ENEMY WATERS BOARD */}
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

            {/* Fleet Status Bar */}
            <div className="max-w-md sm:max-w-2xl mx-auto p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400 flex items-center justify-around font-mono">
              <div>
                Enemy Ships Sunk:{" "}
                <strong className="text-rose-400">
                  {sunkEnemyShips.length} / 5
                </strong>
              </div>
              <div className="w-px h-4 bg-slate-800" />
              <div>
                Friendly Ships Intact:{" "}
                <strong className="text-cyan-400">
                  {myFleet.filter((s) => !s.isSunk).length} / 5
                </strong>
              </div>
            </div>
          </div>
        )}
      </main>

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
