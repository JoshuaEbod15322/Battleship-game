export type Coordinate = {
  row: number; // 0-9 (rows 1-10)
  col: number; // 0-9 (columns A-J)
};

export type Orientation = "horizontal" | "vertical";

export type ShipType =
  | "carrier"
  | "battleship"
  | "cruiser"
  | "submarine"
  | "destroyer";

export type ShipDefinition = {
  id: ShipType;
  name: string;
  size: number;
  emoji: string;
  image?: string;
  description?: string;
};

export type PlacedShip = {
  id: ShipType;
  name: string;
  size: number;
  emoji: string;
  image?: string;
  origin: Coordinate;
  orientation: Orientation;
  coordinates: Coordinate[];
  hits: number;
  isSunk: boolean;
};

export type CellState = "empty" | "ship" | "hit" | "miss";

export type AttackRecord = {
  row: number;
  col: number;
  result: "hit" | "miss";
  sunkShipId?: ShipType;
  timestamp: number;
  attackerId: string;
};

export type PlayerRole = "player1" | "player2";

export type Player = {
  id: string;
  name: string;
  role: PlayerRole;
  isReady: boolean;
  isConnected: boolean;
  avatarSeed?: string;
};

export type GamePhase =
  | "home"
  | "create"
  | "join"
  | "lobby"
  | "game"
  | "placement"
  | "battle"
  | "finished";

export type RoomStatus =
  | "waiting"
  | "placement"
  | "battle"
  | "finished"
  | "abandoned";

export type Room = {
  roomId: string;
  roomCode: string;
  player1: Player | null;
  player2: Player | null;
  status: RoomStatus;
  currentTurn: PlayerRole;
  winner: PlayerRole | null;
  createdAt: number;
};

// Realtime Broadcast Payloads
export type JoinEventPayload = {
  roomCode: string;
  player: Player;
};

export type LobbySyncPayload = {
  room: Room;
};

export type PlayerReadyPayload = {
  playerId: string;
  role: PlayerRole;
};

export type GameStartPayload = {
  startingTurn: PlayerRole;
};

export type AttackEventPayload = {
  row: number;
  col: number;
  attackerId: string;
  attackerRole: PlayerRole;
};

export type AttackResultPayload = {
  row: number;
  col: number;
  result: "hit" | "miss";
  sunkShip?: {
    id: ShipType;
    name: string;
    size: number;
    emoji: string;
    coordinates: Coordinate[];
  };
  allSunk: boolean;
  attackerId: string;
  attackerRole: PlayerRole;
};

export type RematchRequestPayload = {
  senderId: string;
};

export type LeaveRoomPayload = {
  playerId: string;
  reason: "surrendered" | "disconnected" | "left";
};
