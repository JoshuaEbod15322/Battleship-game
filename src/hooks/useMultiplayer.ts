import { useEffect, useRef, useState, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase";
import type {
  AttackRecord,
  Coordinate,
  GamePhase,
  PlacedShip,
  Player,
  PlayerRole,
  Room,
  ShipType,
} from "../types/battleship";
import { sound } from "../lib/sound";

export type AttackFeedback = {
  row: number;
  col: number;
  result: "hit" | "miss";
  sunkShipName?: string;
  attackerRole: PlayerRole;
  timestamp: number;
};

export function useMultiplayer(
  roomCode: string | null,
  localPlayer: Player | null,
  onPhaseChange?: (phase: GamePhase) => void,
  initialOpponentConnected = false,
) {
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "reconnecting" | "disconnected"
  >("disconnected");
  const [opponentConnected, setOpponentConnected] = useState<boolean>(
    initialOpponentConnected,
  );
  const [opponentLeft, setOpponentLeft] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Local fleet stays private; only sunk ships are revealed.
  const [myFleet, setMyFleet] = useState<PlacedShip[]>([]);
  const [myFleetReady, setMyFleetReady] = useState<boolean>(false);
  const [opponentFleetReady, setOpponentFleetReady] = useState<boolean>(false);

  const [myAttacksOnEnemy, setMyAttacksOnEnemy] = useState<AttackRecord[]>([]);
  const [enemyAttacksOnMe, setEnemyAttacksOnMe] = useState<AttackRecord[]>([]);

  // Sunk enemy ships revealed on destruction
  const [sunkEnemyShips, setSunkEnemyShips] = useState<
    Array<{
      id: ShipType;
      name: string;
      size: number;
      emoji: string;
      orientation: "horizontal" | "vertical";
      coordinates: Coordinate[];
      imageTop?: string;
      imageDestroy?: string;
    }>
  >([]);

  const [lastAttackFeedback, setLastAttackFeedback] =
    useState<AttackFeedback | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const opponentReconnectTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const myFleetRef = useRef<PlacedShip[]>(myFleet);
  myFleetRef.current = myFleet;
  const myFleetReadyRef = useRef(myFleetReady);
  myFleetReadyRef.current = myFleetReady;
  const opponentFleetReadyRef = useRef(opponentFleetReady);
  opponentFleetReadyRef.current = opponentFleetReady;
  const enemyAttacksRef = useRef<AttackRecord[]>(enemyAttacksOnMe);
  enemyAttacksRef.current = enemyAttacksOnMe;
  const myAttacksRef = useRef<AttackRecord[]>(myAttacksOnEnemy);
  myAttacksRef.current = myAttacksOnEnemy;

  const roomRef = useRef<Room | null>(room);
  roomRef.current = room;

  const localPlayerRef = useRef<Player | null>(localPlayer);
  localPlayerRef.current = localPlayer;

  const sendEvent = useCallback((event: string, payload: unknown) => {
    if (channelRef.current) {
      channelRef.current
        .send({
          type: "broadcast",
          event,
          payload,
        })
        .catch((err) => {
          console.warn("Supabase broadcast error:", err);
        });
    }

    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ event, payload });
      } catch (err) {
        console.warn("BroadcastChannel error:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (!roomCode || !localPlayer) return;

    const normalizedCode = roomCode.toUpperCase();
    const supabase = getSupabaseClient();
    const isHost = localPlayer.role === "player1";

    setOpponentLeft(false);
    setError(null);

    const initialRoom: Room = {
      roomId: `room_${normalizedCode}`,
      roomCode: normalizedCode,
      player1: isHost ? localPlayer : null,
      player2: !isHost ? localPlayer : null,
      status: isHost ? "waiting" : "placement",
      currentTurn: "player1",
      winner: null,
      createdAt: Date.now(),
    };
    setRoom(initialRoom);

    try {
      const bc = new BroadcastChannel(`battleship_relay_${normalizedCode}`);
      broadcastChannelRef.current = bc;
      bc.onmessage = (e) => {
        if (e.data && e.data.event) {
          handleIncomingMessage(e.data.event, e.data.payload);
        }
      };
    } catch {
    }

    if (supabase) {
      setConnectionStatus("reconnecting");
      const channel = supabase.channel(`battleship-room:${normalizedCode}`, {
        config: {
          broadcast: { self: false },
          presence: { key: localPlayer.id },
        },
      });

      channelRef.current = channel;

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const presentIds = Object.keys(state);
          const hasOtherPlayer = presentIds.some((id) => id !== localPlayer.id);
          setOpponentConnected(hasOtherPlayer);
          setConnectionStatus("connected");
        })
        .on("presence", { event: "join" }, ({ newPresences }) => {
          const joinedOthers = (newPresences as any[]).some(
            (p: any) =>
              (p.key && p.key !== localPlayer.id) ||
              (p.id && p.id !== localPlayer.id),
          );
          if (joinedOthers) {
            if (opponentReconnectTimerRef.current) {
              clearTimeout(opponentReconnectTimerRef.current);
              opponentReconnectTimerRef.current = null;
            }
            setOpponentConnected(true);
            setOpponentLeft(false);
            sound.playButton();
          }
        })
        .on("presence", { event: "leave" }, ({ leftPresences }) => {
          const leftOthers = (leftPresences as any[]).some(
            (p: any) =>
              (p.key && p.key !== localPlayer.id) ||
              (p.id && p.id !== localPlayer.id),
          );
          if (leftOthers) {
            setOpponentConnected(false);
            if (opponentReconnectTimerRef.current) {
              clearTimeout(opponentReconnectTimerRef.current);
            }
            // A player can briefly leave while replacing a lobby channel with the game channel.
            opponentReconnectTimerRef.current = setTimeout(() => {
              if (
                !channel.presenceState() ||
                Object.keys(channel.presenceState()).length <= 1
              ) {
                if (
                  roomRef.current?.status === "battle" ||
                  roomRef.current?.status === "placement"
                ) {
                  setOpponentLeft(true);
                }
              }
              opponentReconnectTimerRef.current = null;
            }, 2500);
          }
        })
        .on("broadcast", { event: "*" }, ({ event, payload }) => {
          handleIncomingMessage(event, payload);
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setConnectionStatus("connected");
            channel.track({
              id: localPlayer.id,
              name: localPlayer.name,
              role: localPlayer.role,
              onlineAt: new Date().toISOString(),
            });

            // Guest asks host for state after subscribing.
            if (!isHost) {
              channel.send({
                type: "broadcast",
                event: "GUEST_JOINED",
                payload: { player: localPlayer },
              });
            }
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setConnectionStatus("reconnecting");
          } else if (status === "CLOSED") {
            setConnectionStatus("disconnected");
          }
        });
    } else {
      setConnectionStatus("connected");
      if (!isHost) {
        setTimeout(() => {
          sendEvent("GUEST_JOINED", { player: localPlayer });
        }, 150);
      }
    }

    // Events: GUEST_JOINED, ROOM_SYNC, PLAYER_READY, GAME_STARTED, ATTACK, ATTACK_RESULT, REMATCH_REQUEST, OPPONENT_LEFT
    function handleIncomingMessage(event: string, payload: any) {
      const currentLocal = localPlayerRef.current;
      if (!currentLocal) return;

      switch (event) {
        case "GUEST_JOINED": {
          if (currentLocal.role === "player1") {
            const guestPlayer: Player = payload.player;
            setOpponentConnected(true);
            setOpponentLeft(false);
            sound.playTurn();

            setRoom((prev) => {
              if (!prev) return null;
              const updated: Room = {
                ...prev,
                player2: guestPlayer,
                status: "placement",
              };
              setTimeout(() => {
                sendEvent("ROOM_SYNC", { room: updated });
              }, 50);
              return updated;
            });

            if (onPhaseChange) onPhaseChange("placement");
          }
          break;
        }

        case "ROOM_SYNC": {
          const incomingRoom: Room = payload.room;
          if (!incomingRoom || incomingRoom.roomCode !== normalizedCode) break;
          setRoom(incomingRoom);
          setOpponentConnected(true);
          setOpponentLeft(false);

          if (incomingRoom.status === "placement" && onPhaseChange) {
            onPhaseChange("placement");
          } else if (incomingRoom.status === "battle" && onPhaseChange) {
            onPhaseChange("battle");
          } else if (incomingRoom.status === "finished" && onPhaseChange) {
            onPhaseChange("finished");
          }
          break;
        }

        case "PLAYER_READY": {
          const { role } = payload;
          if (role !== currentLocal.role) {
            opponentFleetReadyRef.current = true;
            setOpponentFleetReady(true);
            sound.playButton();
          }

          const currentMyReady =
            role === currentLocal.role ? true : myFleetReadyRef.current;
          const currentOpReady =
            role !== currentLocal.role ? true : opponentFleetReadyRef.current;

          if (currentMyReady && currentOpReady) {
            myFleetReadyRef.current = true;
            opponentFleetReadyRef.current = true;
            setMyFleetReady(true);
            setOpponentFleetReady(true);
            sendEvent("GAME_STARTED", { startingTurn: "player1" });
            setRoom((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                status: "battle",
                currentTurn: "player1",
              };
            });
            sound.playTurn();
            if (onPhaseChange) onPhaseChange("battle");
          }
          break;
        }

        case "GAME_STARTED": {
          myFleetReadyRef.current = true;
          opponentFleetReadyRef.current = true;
          setMyFleetReady(true);
          setOpponentFleetReady(true);
          setRoom((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              status: "battle",
              currentTurn: payload?.startingTurn || "player1",
            };
          });
          if (onPhaseChange) onPhaseChange("battle");
          break;
        }

        case "ATTACK": {
          const { row, col, attackerRole, attackerId } = payload;
          if (attackerRole === currentLocal.role) return;
          const attackAlreadyProcessed = enemyAttacksRef.current.some(
            (attack) => attack.row === row && attack.col === col,
          );
          if (attackAlreadyProcessed) break;

          // Defender validates against its private fleet.
          const currentFleet = myFleetRef.current;
          let hit = false;
          let hitShip: PlacedShip | null = null;

          for (const s of currentFleet) {
            const matched = s.coordinates.some(
              (c) => c.row === row && c.col === col,
            );
            if (matched) {
              hit = true;
              hitShip = s;
              break;
            }
          }

          let sunkShipData:
            | {
                id: ShipType;
                name: string;
                size: number;
                emoji: string;
                orientation: "horizontal" | "vertical";
                coordinates: Coordinate[];
                imageTop?: string;
                imageDestroy?: string;
              }
            | undefined = undefined;
          let updatedMyFleet = [...currentFleet];

          if (hit && hitShip) {
            const newHits = hitShip.hits + 1;
            const isSunk = newHits >= hitShip.size;
            updatedMyFleet = currentFleet.map((s) =>
              s.id === hitShip!.id ? { ...s, hits: newHits, isSunk } : s,
            );
            setMyFleet(updatedMyFleet);

            if (isSunk) {
              sunkShipData = {
                id: hitShip.id,
                name: hitShip.name,
                size: hitShip.size,
                emoji: hitShip.emoji,
                orientation: hitShip.orientation,
                coordinates: hitShip.coordinates,
                imageTop: hitShip.imageTop,
                imageDestroy: hitShip.imageDestroy,
              };
            }
          }

          const allSunk =
            updatedMyFleet.length >= 5 && updatedMyFleet.every((s) => s.isSunk);

          const attackRecord: AttackRecord = {
            row,
            col,
            result: hit ? "hit" : "miss",
            sunkShipId: sunkShipData?.id,
            timestamp: Date.now(),
            attackerId,
          };
          enemyAttacksRef.current = [...enemyAttacksRef.current, attackRecord];
          setEnemyAttacksOnMe(enemyAttacksRef.current);

          if (allSunk) {
            sound.playDefeat();
          } else if (sunkShipData) {
            sound.playSunk();
          } else if (hit) {
            sound.playHit();
          } else {
            sound.playMiss();
          }

          setLastAttackFeedback({
            row,
            col,
            result: hit ? "hit" : "miss",
            sunkShipName: sunkShipData?.name,
            attackerRole,
            timestamp: Date.now(),
          });

          const nextTurn: PlayerRole =
            attackerRole === "player1" ? "player2" : "player1";

          sendEvent("ATTACK_RESULT", {
            row,
            col,
            result: hit ? "hit" : "miss",
            sunkShip: sunkShipData,
            allSunk,
            attackerRole,
            attackerId,
            nextTurn,
            winner: allSunk ? attackerRole : null,
          });

          setRoom((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              currentTurn: nextTurn,
              status: allSunk ? "finished" : "battle",
              winner: allSunk ? attackerRole : null,
            };
          });

          if (allSunk && onPhaseChange) {
            onPhaseChange("finished");
          }
          break;
        }

        case "ATTACK_RESULT": {
          const {
            row,
            col,
            result,
            sunkShip,
            allSunk,
            attackerRole,
            attackerId,
            nextTurn,
            winner,
          } = payload;

          if (attackerRole === currentLocal.role) {
            const resultAlreadyProcessed = myAttacksRef.current.some(
              (attack) => attack.row === row && attack.col === col,
            );
            if (resultAlreadyProcessed) break;
            const attackRecord: AttackRecord = {
              row,
              col,
              result,
              sunkShipId: sunkShip?.id,
              timestamp: Date.now(),
              attackerId,
            };
            myAttacksRef.current = [...myAttacksRef.current, attackRecord];
            setMyAttacksOnEnemy(myAttacksRef.current);

            if (sunkShip) {
              setSunkEnemyShips((prev) =>
                prev.some((ship) => ship.id === sunkShip.id)
                  ? prev
                  : [...prev, sunkShip],
              );
            }

            if (allSunk) {
              sound.playVictory();
            } else if (sunkShip) {
              sound.playSunk();
            } else if (result === "hit") {
              sound.playHit();
            } else {
              sound.playMiss();
            }

            setLastAttackFeedback({
              row,
              col,
              result,
              sunkShipName: sunkShip?.name,
              attackerRole,
              timestamp: Date.now(),
            });
          }

          setRoom((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              currentTurn: nextTurn,
              status: allSunk ? "finished" : "battle",
              winner,
            };
          });

          if (allSunk && onPhaseChange) {
            onPhaseChange("finished");
          }
          break;
        }

        case "REMATCH_REQUEST": {
          myAttacksRef.current = [];
          enemyAttacksRef.current = [];
          myFleetReadyRef.current = false;
          opponentFleetReadyRef.current = false;
          setMyAttacksOnEnemy([]);
          setEnemyAttacksOnMe([]);
          setSunkEnemyShips([]);
          setMyFleetReady(false);
          setOpponentFleetReady(false);
          setLastAttackFeedback(null);

          setRoom((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              status: "placement",
              winner: null,
              currentTurn: "player1",
            };
          });

          sound.playTurn();
          if (onPhaseChange) onPhaseChange("placement");
          break;
        }

        case "OPPONENT_LEFT": {
          setOpponentLeft(true);
          setOpponentConnected(false);
          break;
        }
      }
    }

    return () => {
      if (opponentReconnectTimerRef.current) {
        clearTimeout(opponentReconnectTimerRef.current);
        opponentReconnectTimerRef.current = null;
      }
      if (channelRef.current && supabase)
        supabase.removeChannel(channelRef.current);
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.close();
        } catch {}
      }
    };
  }, [roomCode, localPlayer, sendEvent, onPhaseChange]);

  const setReady = useCallback(() => {
    if (!localPlayer || myFleet.length < 5) return;
    myFleetReadyRef.current = true;
    setMyFleetReady(true);
    sendEvent("PLAYER_READY", {
      playerId: localPlayer.id,
      role: localPlayer.role,
    });

    if (opponentFleetReadyRef.current) {
      opponentFleetReadyRef.current = true;
      setRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: "battle",
          currentTurn: "player1",
        };
      });
      sound.playTurn();
      if (onPhaseChange) onPhaseChange("battle");
    }
  }, [localPlayer, myFleet, opponentFleetReady, sendEvent, onPhaseChange]);

  const launchAttack = useCallback(
    (row: number, col: number): boolean => {
      if (!room || !localPlayer) return false;
      if (room.status !== "battle") return false;
      if (room.currentTurn !== localPlayer.role) return false;

      const alreadyAttacked = myAttacksOnEnemy.some(
        (a) => a.row === row && a.col === col,
      );
      if (alreadyAttacked) return false;

      sound.playButton();
      sendEvent("ATTACK", {
        row,
        col,
        attackerId: localPlayer.id,
        attackerRole: localPlayer.role,
      });

      return true;
    },
    [room, localPlayer, myAttacksOnEnemy, sendEvent],
  );

  const requestRematch = useCallback(() => {
    sendEvent("REMATCH_REQUEST", { senderId: localPlayer?.id });
    myAttacksRef.current = [];
    enemyAttacksRef.current = [];
    myFleetReadyRef.current = false;
    opponentFleetReadyRef.current = false;
    setMyAttacksOnEnemy([]);
    setEnemyAttacksOnMe([]);
    setSunkEnemyShips([]);
    setMyFleetReady(false);
    setOpponentFleetReady(false);
    setLastAttackFeedback(null);

    setRoom((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: "placement",
        winner: null,
        currentTurn: "player1",
      };
    });

    if (onPhaseChange) onPhaseChange("placement");
  }, [localPlayer, sendEvent, onPhaseChange]);

  const leaveRoom = useCallback(() => {
    sendEvent("OPPONENT_LEFT", { playerId: localPlayer?.id });
    if (channelRef.current && getSupabaseClient()) {
      getSupabaseClient()?.removeChannel(channelRef.current);
    }
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.close();
      } catch {}
    }
    setRoom(null);
    setMyFleet([]);
    myFleetReadyRef.current = false;
    opponentFleetReadyRef.current = false;
    setMyFleetReady(false);
    setOpponentFleetReady(false);
    myAttacksRef.current = [];
    enemyAttacksRef.current = [];
    setMyAttacksOnEnemy([]);
    setEnemyAttacksOnMe([]);
    setSunkEnemyShips([]);
    if (onPhaseChange) onPhaseChange("home");
  }, [localPlayer, sendEvent, onPhaseChange]);

  return {
    room,
    connectionStatus,
    opponentConnected,
    opponentLeft,
    error,
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
  };
}
