import { useState, useEffect, useRef } from "react";
import { Home } from "./pages/Home";
import { Game } from "./pages/Game";
import { CreateGame } from "./components/lobby/CreateGame";
import { JoinGame } from "./components/lobby/JoinGame";
import { RoomLobby } from "./components/lobby/RoomLobby";
import { HowToPlayModal } from "./components/ui/HowToPlayModal";
import { SupabaseConfigModal } from "./components/ui/SupabaseConfigModal";
import { generateRoomCode } from "./lib/roomCode";
import { createRoom, getSupabaseClient, joinRoom } from "./lib/supabase";
import type { GamePhase, Player, Room } from "./types/battleship";

const DEFAULT_RANKS = [
  "Admiral",
  "Captain",
  "Commander",
  "Commodore",
  "Lieutenant",
];

export default function App() {
  const [phase, setPhase] = useState<GamePhase>("home");
  const [roomCode, setRoomCode] = useState<string>("");
  const [invitedCode, setInvitedCode] = useState<string | null>(null);

  // Modals
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [supabaseConfigOpen, setSupabaseConfigOpen] = useState(false);

  // Player state
  const [playerName, setPlayerName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("battleship_player_name");
      if (saved) return saved;
    }
    const rank =
      DEFAULT_RANKS[Math.floor(Math.random() * DEFAULT_RANKS.length)];
    return `${rank} Joshua`;
  });

  const [playerId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("battleship_player_id");
      if (saved) return saved;
      const newId = "plr_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("battleship_player_id", newId);
      return newId;
    }
    return "plr_" + Math.random().toString(36).substring(2, 9);
  });

  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [lobbyOpponentConnected, setLobbyOpponentConnected] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const activeRoomRef = useRef<Room | null>(null);
  activeRoomRef.current = activeRoom;

  // Keep the host reachable while the create screen is open. Gameplay mounts later.
  useEffect(() => {
    if (phase !== "create" || !localPlayer || !roomCode) return;

    const channel = getSupabaseClient()?.channel(
      `battleship-room:${roomCode}`,
      {
        config: {
          broadcast: { self: false },
          presence: { key: localPlayer.id },
        },
      },
    );
    let broadcastChannel: BroadcastChannel | null = null;

    const startListening = () => {
      channel
        ?.on("broadcast", { event: "GUEST_JOINED" }, ({ payload }) => {
          const guest = payload?.player as Player | undefined;
          if (!guest) return;
          const updatedRoom = activeRoomRef.current
            ? {
                ...activeRoomRef.current,
                player2: guest,
                status: "placement" as const,
              }
            : null;
          if (!updatedRoom) return;
          setLobbyOpponentConnected(true);
          setActiveRoom(updatedRoom);
          channel?.send({
            type: "broadcast",
            event: "ROOM_SYNC",
            payload: { room: updatedRoom },
          });
          setPhase("game");
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            channel.track({ id: localPlayer.id, role: localPlayer.role });
          }
        });
    };

    if (channel) {
      startListening();
    } else if (typeof BroadcastChannel !== "undefined") {
      broadcastChannel = new BroadcastChannel(`battleship_relay_${roomCode}`);
      broadcastChannel.onmessage = (event) => {
        if (event.data?.event !== "GUEST_JOINED") return;
        const guest = event.data.payload?.player as Player | undefined;
        if (!guest) return;
        const updatedRoom = activeRoomRef.current
          ? {
              ...activeRoomRef.current,
              player2: guest,
              status: "placement" as const,
            }
          : null;
        if (!updatedRoom) return;
        setLobbyOpponentConnected(true);
        setActiveRoom(updatedRoom);
        broadcastChannel?.postMessage({
          event: "ROOM_SYNC",
          payload: { room: updatedRoom },
        });
        setPhase("game");
      };
    }

    return () => {
      if (channel) getSupabaseClient()?.removeChannel(channel);
      broadcastChannel?.close();
    };
  }, [phase, localPlayer, roomCode]);

  // Save player name when changed
  const handlePlayerNameChange = (name: string) => {
    setPlayerName(name);
    if (typeof window !== "undefined") {
      localStorage.setItem("battleship_player_name", name);
    }
  };

  // Check URL for invite code on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check query param e.g. ?join=A7K9P2
    const params = new URLSearchParams(window.location.search);
    const joinParam = params.get("join");

    // Check pathname e.g. /join/A7K9P2
    const pathMatch = window.location.pathname.match(/\/join\/([A-Za-z0-9]+)/);
    const pathCode = pathMatch ? pathMatch[1] : null;

    const detectedCode = (joinParam || pathCode)?.toUpperCase();
    if (detectedCode) {
      setInvitedCode(detectedCode);
      setRoomCode(detectedCode);
      setPhase("join");
    }
  }, []);

  // Action: Create Game
  const handleStartCreateGame = async () => {
    const newCode = generateRoomCode();
    setCreateError(null);

    try {
      await createRoom(newCode, playerId);
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? `Unable to create online room: ${error.message}`
          : "Unable to create online room.",
      );
      return;
    }

    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", `/?join=${newCode}`);
    }
    setInvitedCode(null);
    setRoomCode(newCode);

    const hostPlayer: Player = {
      id: playerId,
      name: playerName || "Admiral Joshua",
      role: "player1",
      isReady: false,
      isConnected: true,
    };
    setLocalPlayer(hostPlayer);

    const room: Room = {
      roomId: `room_${newCode}`,
      roomCode: newCode,
      player1: hostPlayer,
      player2: null,
      status: "waiting",
      currentTurn: "player1",
      winner: null,
      createdAt: Date.now(),
    };
    setActiveRoom(room);
    setPhase("create");
  };

  // Action: Join Game screen
  const handleOpenJoinGame = () => {
    setPhase("join");
  };

  // Action: Execute Join Room
  const handleExecuteJoin = async (codeToJoin: string) => {
    setIsJoining(true);
    setJoinError(null);
    try {
      await joinRoom(codeToJoin, playerId);
    } catch (error) {
      setJoinError(
        error instanceof Error ? error.message : "Unable to join this room.",
      );
      setIsJoining(false);
      return;
    }

    const guestPlayer: Player = {
      id: playerId,
      name: playerName || "Captain Drake",
      role: "player2",
      isReady: false,
      isConnected: true,
    };
    setLocalPlayer(guestPlayer);
    setRoomCode(codeToJoin.toUpperCase());

    const room: Room = {
      roomId: `room_${codeToJoin}`,
      roomCode: codeToJoin.toUpperCase(),
      player1: null,
      player2: guestPlayer,
      status: "placement",
      currentTurn: "player1",
      winner: null,
      createdAt: Date.now(),
    };
    setActiveRoom(room);

    // Enter directly into active game / lobby
    setPhase("game");
    setIsJoining(false);
  };

  // When Host sees Challenger connect, can move to Lobby or directly into placement
  const handleHostTransitionToGame = () => {
    setPhase("game");
  };

  const handleReturnHome = () => {
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/");
    }
    setPhase("home");
    setRoomCode("");
    setInvitedCode(null);
    setLocalPlayer(null);
    setActiveRoom(null);
    setLobbyOpponentConnected(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* 1. HOME PHASE */}
      {phase === "home" && (
        <Home
          onCreateGame={handleStartCreateGame}
          onJoinGame={handleOpenJoinGame}
          onOpenHowToPlay={() => setHowToPlayOpen(true)}
          onOpenSupabaseConfig={() => setSupabaseConfigOpen(true)}
          invitedRoomCode={invitedCode}
        />
      )}

      {/* 2. CREATE GAME PHASE */}
      {phase === "create" && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <CreateGame
            roomCode={roomCode}
            playerName={playerName}
            onPlayerNameChange={handlePlayerNameChange}
            onBack={handleReturnHome}
            opponentConnected={lobbyOpponentConnected}
            error={createError}
          />
        </div>
      )}

      {/* 3. JOIN GAME PHASE */}
      {phase === "join" && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <JoinGame
            initialRoomCode={roomCode || invitedCode || ""}
            playerName={playerName}
            onPlayerNameChange={handlePlayerNameChange}
            onJoin={handleExecuteJoin}
            onBack={handleReturnHome}
            error={joinError}
            isJoining={isJoining}
          />
        </div>
      )}

      {/* 4. LOBBY PHASE (Optional transitional view) */}
      {phase === "lobby" && activeRoom && localPlayer && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <RoomLobby
            room={activeRoom}
            localPlayer={localPlayer}
            opponentConnected={lobbyOpponentConnected}
            onContinueToPlacement={handleHostTransitionToGame}
          />
        </div>
      )}

      {/* 5. ACTIVE GAME (Placement, Battle, Finished) */}
      {phase === "game" && localPlayer && (
        <Game
          roomCode={roomCode}
          localPlayer={localPlayer}
          initialOpponentConnected={Boolean(
            activeRoom?.player1 && activeRoom.player2,
          )}
          onReturnHome={handleReturnHome}
          onOpenHowToPlay={() => setHowToPlayOpen(true)}
        />
      )}

      {/* GLOBAL MODALS */}
      <HowToPlayModal
        isOpen={howToPlayOpen}
        onClose={() => setHowToPlayOpen(false)}
      />

      <SupabaseConfigModal
        isOpen={supabaseConfigOpen}
        onClose={() => setSupabaseConfigOpen(false)}
      />
    </div>
  );
}
