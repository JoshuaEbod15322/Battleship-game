import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase';
import type {
  AttackRecord,
  Coordinate,
  GamePhase,
  PlacedShip,
  Player,
  PlayerRole,
  Room,
  ShipType,
} from '../types/battleship';
import { sound } from '../lib/sound';

export type AttackFeedback = {
  row: number;
  col: number;
  result: 'hit' | 'miss';
  sunkShipName?: string;
  attackerRole: PlayerRole;
  timestamp: number;
};

export function useMultiplayer(
  roomCode: string | null,
  localPlayer: Player | null,
  onPhaseChange?: (phase: GamePhase) => void
) {
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');
  const [opponentConnected, setOpponentConnected] = useState<boolean>(false);
  const [opponentLeft, setOpponentLeft] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Private local fleet (Never sent across the wire until sunk!)
  const [myFleet, setMyFleet] = useState<PlacedShip[]>([]);
  const [myFleetReady, setMyFleetReady] = useState<boolean>(false);
  const [opponentFleetReady, setOpponentFleetReady] = useState<boolean>(false);

  // Attacks tracked:
  // myAttacksOnEnemy: coordinates where local player attacked the opponent
  const [myAttacksOnEnemy, setMyAttacksOnEnemy] = useState<AttackRecord[]>([]);
  // enemyAttacksOnMe: coordinates where opponent attacked local player
  const [enemyAttacksOnMe, setEnemyAttacksOnMe] = useState<AttackRecord[]>([]);

  // Sunk enemy ships (publicly revealed once fully destroyed)
  const [sunkEnemyShips, setSunkEnemyShips] = useState<Array<{
    id: ShipType;
    name: string;
    size: number;
    emoji: string;
    coordinates: Coordinate[];
  }>>([]);

  // Latest attack feedback banner / flash
  const [lastAttackFeedback, setLastAttackFeedback] = useState<AttackFeedback | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const myFleetRef = useRef<PlacedShip[]>(myFleet);
  myFleetRef.current = myFleet;

  const roomRef = useRef<Room | null>(room);
  roomRef.current = room;

  const localPlayerRef = useRef<Player | null>(localPlayer);
  localPlayerRef.current = localPlayer;

  // Broadcast helper
  const sendEvent = useCallback((event: string, payload: unknown) => {
    // 1. Supabase Realtime Channel
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event,
        payload,
      }).catch((err) => {
        console.warn('Supabase broadcast error:', err);
      });
    }

    // 2. Local tab relay BroadcastChannel (for testing in 2 tabs simultaneously or fallback)
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ event, payload });
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }
  }, []);

  // Initialize and subscribe to channel
  useEffect(() => {
    if (!roomCode || !localPlayer) return;

    const normalizedCode = roomCode.toUpperCase();
    const supabase = getSupabaseClient();
    const isHost = localPlayer.role === 'player1';

    // Reset local match state
    setOpponentLeft(false);
    setError(null);

    // Initial room state
    const initialRoom: Room = {
      roomId: `room_${normalizedCode}`,
      roomCode: normalizedCode,
      player1: isHost ? localPlayer : null,
      player2: !isHost ? localPlayer : null,
      status: 'waiting',
      currentTurn: 'player1',
      winner: null,
      createdAt: Date.now(),
    };
    setRoom(initialRoom);

    // Setup local BroadcastChannel for multi-tab fallback
    try {
      const bc = new BroadcastChannel(`battleship_relay_${normalizedCode}`);
      broadcastChannelRef.current = bc;
      bc.onmessage = (e) => {
        if (e.data && e.data.event) {
          handleIncomingMessage(e.data.event, e.data.payload);
        }
      };
    } catch {
      // BroadcastChannel not supported in some sandboxes
    }

    // Connect to Supabase Realtime if configured
    if (supabase) {
      setConnectionStatus('reconnecting');
      const channel = supabase.channel(`battleship-room:${normalizedCode}`, {
        config: {
          broadcast: { self: false },
          presence: { key: localPlayer.id },
        },
      });

      channelRef.current = channel;

      // Handle presence (who is online)
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const presentIds = Object.keys(state);
          const hasOtherPlayer = presentIds.some((id) => id !== localPlayer.id);
          setOpponentConnected(hasOtherPlayer);
          setConnectionStatus('connected');
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          const joinedOthers = (newPresences as any[]).some(
            (p: any) => (p.key && p.key !== localPlayer.id) || (p.id && p.id !== localPlayer.id)
          );
          if (joinedOthers) {
            setOpponentConnected(true);
            setOpponentLeft(false);
            sound.playButton();
          }
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          const leftOthers = (leftPresences as any[]).some(
            (p: any) => (p.key && p.key !== localPlayer.id) || (p.id && p.id !== localPlayer.id)
          );
          if (leftOthers) {
            setOpponentConnected(false);
            if (roomRef.current?.status === 'battle' || roomRef.current?.status === 'placement') {
              setOpponentLeft(true);
            }
          }
        })
        // Broadcast events
        .on('broadcast', { event: '*' }, ({ event, payload }) => {
          handleIncomingMessage(event, payload);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
            channel.track({
              id: localPlayer.id,
              name: localPlayer.name,
              role: localPlayer.role,
              onlineAt: new Date().toISOString(),
            });

            // If Guest just subscribed, ask host for sync
            if (!isHost) {
              channel.send({
                type: 'broadcast',
                event: 'GUEST_JOINED',
                payload: { player: localPlayer },
              });
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setConnectionStatus('reconnecting');
          } else if (status === 'CLOSED') {
            setConnectionStatus('disconnected');
          }
        });
    } else {
      // Offline / Local relay mode
      setConnectionStatus('connected');
      if (!isHost) {
        // Send GUEST_JOINED over broadcast channel
        setTimeout(() => {
          sendEvent('GUEST_JOINED', { player: localPlayer });
        }, 150);
      }
    }

    // Message dispatcher
    function handleIncomingMessage(event: string, payload: any) {
      const currentLocal = localPlayerRef.current;
      if (!currentLocal) return;

      switch (event) {
        case 'GUEST_JOINED': {
          // Received by host (player1)
          if (currentLocal.role === 'player1') {
            const guestPlayer: Player = payload.player;
            setOpponentConnected(true);
            setOpponentLeft(false);
            sound.playTurn();

            setRoom((prev) => {
              if (!prev) return null;
              const updated: Room = {
                ...prev,
                player2: guestPlayer,
                status: 'placement', // Both connected! Transition to placement
              };
              // Sync updated state to guest
              setTimeout(() => {
                sendEvent('ROOM_SYNC', { room: updated });
              }, 50);
              return updated;
            });

            if (onPhaseChange) onPhaseChange('placement');
          }
          break;
        }

        case 'ROOM_SYNC': {
          // Received by guest (player2) or sync requests
          const incomingRoom: Room = payload.room;
          setRoom(incomingRoom);
          setOpponentConnected(true);
          setOpponentLeft(false);

          if (incomingRoom.status === 'placement' && onPhaseChange) {
            onPhaseChange('placement');
          } else if (incomingRoom.status === 'battle' && onPhaseChange) {
            onPhaseChange('battle');
          } else if (incomingRoom.status === 'finished' && onPhaseChange) {
            onPhaseChange('finished');
          }
          break;
        }

        case 'PLAYER_READY': {
          const { role } = payload;
          if (role !== currentLocal.role) {
            setOpponentFleetReady(true);
            sound.playButton();
          }

          // Check if both are ready now
          const currentMyReady = (role === currentLocal.role) ? true : myFleetReady;
          const currentOpReady = (role !== currentLocal.role) ? true : opponentFleetReady;

          if (currentMyReady && currentOpReady) {
            // Both ready! Transition to battle
            setRoom((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                status: 'battle',
                currentTurn: 'player1', // Player 1 fires first
              };
            });
            sound.playTurn();
            if (onPhaseChange) onPhaseChange('battle');
          }
          break;
        }

        case 'ATTACK': {
          // Opponent attacked local player's waters!
          const { row, col, attackerRole, attackerId } = payload;
          if (attackerRole === currentLocal.role) return; // ignore own echo

          // Defender validates against private fleet
          const currentFleet = myFleetRef.current;
          let hit = false;
          let hitShip: PlacedShip | null = null;

          for (const s of currentFleet) {
            const matched = s.coordinates.some((c) => c.row === row && c.col === col);
            if (matched) {
              hit = true;
              hitShip = s;
              break;
            }
          }

          let sunkShipData: { id: ShipType; name: string; size: number; emoji: string; coordinates: Coordinate[] } | undefined = undefined;
          let updatedMyFleet = [...currentFleet];

          if (hit && hitShip) {
            const newHits = hitShip.hits + 1;
            const isSunk = newHits >= hitShip.size;
            updatedMyFleet = currentFleet.map((s) => (s.id === hitShip!.id ? { ...s, hits: newHits, isSunk } : s));
            setMyFleet(updatedMyFleet);

            if (isSunk) {
              sunkShipData = {
                id: hitShip.id,
                name: hitShip.name,
                size: hitShip.size,
                emoji: hitShip.emoji,
                coordinates: hitShip.coordinates,
              };
            }
          }

          // Check if all of defender's ships are destroyed
          const allSunk = updatedMyFleet.length >= 5 && updatedMyFleet.every((s) => s.isSunk);

          // Update defender's incoming attack history
          const attackRecord: AttackRecord = {
            row,
            col,
            result: hit ? 'hit' : 'miss',
            sunkShipId: sunkShipData?.id,
            timestamp: Date.now(),
            attackerId,
          };
          setEnemyAttacksOnMe((prev) => [...prev, attackRecord]);

          // Sound effect on defender
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
            result: hit ? 'hit' : 'miss',
            sunkShipName: sunkShipData?.name,
            attackerRole,
            timestamp: Date.now(),
          });

          // Next turn
          const nextTurn: PlayerRole = attackerRole === 'player1' ? 'player2' : 'player1';

          // Broadcast validated result back to attacker and room
          sendEvent('ATTACK_RESULT', {
            row,
            col,
            result: hit ? 'hit' : 'miss',
            sunkShip: sunkShipData,
            allSunk,
            attackerRole,
            attackerId,
            nextTurn,
            winner: allSunk ? attackerRole : null,
          });

          // Update defender's room state
          setRoom((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              currentTurn: nextTurn,
              status: allSunk ? 'finished' : 'battle',
              winner: allSunk ? attackerRole : null,
            };
          });

          if (allSunk && onPhaseChange) {
            onPhaseChange('finished');
          }
          break;
        }

        case 'ATTACK_RESULT': {
          // Attacker (and observers) receive the attack result!
          const { row, col, result, sunkShip, allSunk, attackerRole, attackerId, nextTurn, winner } = payload;

          if (attackerRole === currentLocal.role) {
            // Local player was the attacker!
            const attackRecord: AttackRecord = {
              row,
              col,
              result,
              sunkShipId: sunkShip?.id,
              timestamp: Date.now(),
              attackerId,
            };
            setMyAttacksOnEnemy((prev) => [...prev, attackRecord]);

            if (sunkShip) {
              setSunkEnemyShips((prev) => [...prev, sunkShip]);
            }

            // Sounds for attacker
            if (allSunk) {
              sound.playVictory();
            } else if (sunkShip) {
              sound.playSunk();
            } else if (result === 'hit') {
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

          // Update room turn and winner
          setRoom((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              currentTurn: nextTurn,
              status: allSunk ? 'finished' : 'battle',
              winner,
            };
          });

          if (allSunk && onPhaseChange) {
            onPhaseChange('finished');
          }
          break;
        }

        case 'REMATCH_REQUEST': {
          // Reset game for both players to placement phase
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
              status: 'placement',
              winner: null,
              currentTurn: 'player1',
            };
          });

          sound.playTurn();
          if (onPhaseChange) onPhaseChange('placement');
          break;
        }

        case 'OPPONENT_LEFT': {
          setOpponentLeft(true);
          setOpponentConnected(false);
          break;
        }
      }
    }

    return () => {
      if (channelRef.current && supabase) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'OPPONENT_LEFT',
          payload: { playerId: localPlayer.id },
        });
        supabase.removeChannel(channelRef.current);
      }
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage({
            event: 'OPPONENT_LEFT',
            payload: { playerId: localPlayer.id },
          });
          broadcastChannelRef.current.close();
        } catch {}
      }
    };
  }, [roomCode, localPlayer, sendEvent, onPhaseChange]);

  // Action: Local Player locks in fleet placement
  const setReady = useCallback(() => {
    if (!localPlayer || myFleet.length < 5) return;
    setMyFleetReady(true);
    sendEvent('PLAYER_READY', {
      playerId: localPlayer.id,
      role: localPlayer.role,
    });

    // Check if opponent is already ready
    if (opponentFleetReady) {
      setRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'battle',
          currentTurn: 'player1',
        };
      });
      sound.playTurn();
      if (onPhaseChange) onPhaseChange('battle');
    }
  }, [localPlayer, myFleet, opponentFleetReady, sendEvent, onPhaseChange]);

  // Action: Launch Attack
  const launchAttack = useCallback(
    (row: number, col: number): boolean => {
      if (!room || !localPlayer) return false;
      if (room.status !== 'battle') return false;
      if (room.currentTurn !== localPlayer.role) return false;

      // Validate cell hasn't been attacked yet
      const alreadyAttacked = myAttacksOnEnemy.some((a) => a.row === row && a.col === col);
      if (alreadyAttacked) return false;

      // Send attack to defending player
      sound.playButton();
      sendEvent('ATTACK', {
        row,
        col,
        attackerId: localPlayer.id,
        attackerRole: localPlayer.role,
      });

      return true;
    },
    [room, localPlayer, myAttacksOnEnemy, sendEvent]
  );

  // Action: Rematch
  const requestRematch = useCallback(() => {
    sendEvent('REMATCH_REQUEST', { senderId: localPlayer?.id });
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
        status: 'placement',
        winner: null,
        currentTurn: 'player1',
      };
    });

    if (onPhaseChange) onPhaseChange('placement');
  }, [localPlayer, sendEvent, onPhaseChange]);

  // Action: Leave Room
  const leaveRoom = useCallback(() => {
    sendEvent('OPPONENT_LEFT', { playerId: localPlayer?.id });
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
    setMyFleetReady(false);
    setOpponentFleetReady(false);
    setMyAttacksOnEnemy([]);
    setEnemyAttacksOnMe([]);
    setSunkEnemyShips([]);
    if (onPhaseChange) onPhaseChange('home');
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
