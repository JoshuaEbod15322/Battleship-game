import { BOARD_SIZE, SHIPS } from '../config/ships';
import type {
  CellState,
  Coordinate,
  Orientation,
  PlacedShip,
  ShipDefinition,
} from '../types/battleship';

/**
 * Creates an empty 10x10 board initialized to 'empty'
 */
export function createBoard(size: number = BOARD_SIZE): CellState[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => 'empty' as CellState)
  );
}

/**
 * Checks if a coordinate is within 0-9 boundaries
 */
export function isValidCoordinate(row: number, col: number, size: number = BOARD_SIZE): boolean {
  return row >= 0 && row < size && col >= 0 && col < size;
}

/**
 * Calculates the cells a ship occupies given its origin, orientation, and size
 */
export function getShipCoordinates(
  origin: Coordinate,
  orientation: Orientation,
  size: number
): Coordinate[] {
  const coords: Coordinate[] = [];
  for (let i = 0; i < size; i++) {
    const row = orientation === 'vertical' ? origin.row + i : origin.row;
    const col = orientation === 'horizontal' ? origin.col + i : origin.col;
    coords.push({ row, col });
  }
  return coords;
}

/**
 * Checks if a ship can be placed at the specified origin and orientation
 * without going out of bounds or colliding with existing placed ships
 */
export function canPlaceShip(
  ship: ShipDefinition,
  origin: Coordinate,
  orientation: Orientation,
  existingShips: PlacedShip[],
  boardSize: number = BOARD_SIZE,
  ignoreShipId?: string
): boolean {
  const coords = getShipCoordinates(origin, orientation, ship.size);

  // Check boundary limits
  for (const { row, col } of coords) {
    if (!isValidCoordinate(row, col, boardSize)) {
      return false;
    }
  }

  // Check collisions against other placed ships
  for (const existing of existingShips) {
    if (ignoreShipId && existing.id === ignoreShipId) continue;
    for (const ec of existing.coordinates) {
      if (coords.some((c) => c.row === ec.row && c.col === ec.col)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Places or updates a ship in the fleet
 */
export function placeShip(
  shipDef: ShipDefinition,
  origin: Coordinate,
  orientation: Orientation,
  existingShips: PlacedShip[],
  boardSize: number = BOARD_SIZE
): PlacedShip[] | null {
  if (!canPlaceShip(shipDef, origin, orientation, existingShips, boardSize, shipDef.id)) {
    return null;
  }

  const coords = getShipCoordinates(origin, orientation, shipDef.size);
  const newShip: PlacedShip = {
    id: shipDef.id,
    name: shipDef.name,
    size: shipDef.size,
    emoji: shipDef.emoji,
    image: shipDef.image,
    origin,
    orientation,
    coordinates: coords,
    hits: 0,
    isSunk: false,
  };

  const filtered = existingShips.filter((s) => s.id !== shipDef.id);
  return [...filtered, newShip];
}

/**
 * Rotates orientation between 'horizontal' and 'vertical'
 */
export function rotateOrientation(current: Orientation): Orientation {
  return current === 'horizontal' ? 'vertical' : 'horizontal';
}

/**
 * Generates a valid, randomized layout for all 5 classic ships
 */
export function randomizeFleet(
  shipsToPlace: ShipDefinition[] = SHIPS,
  boardSize: number = BOARD_SIZE
): PlacedShip[] {
  let placed: PlacedShip[] = [];
  let attempts = 0;
  const maxAttempts = 1000;

  while (placed.length < shipsToPlace.length && attempts < maxAttempts) {
    attempts++;
    placed = [];
    for (const ship of shipsToPlace) {
      let placedCurrent = false;
      let shipAttempts = 0;

      while (!placedCurrent && shipAttempts < 150) {
        shipAttempts++;
        const orientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
        const maxRow = orientation === 'vertical' ? boardSize - ship.size : boardSize - 1;
        const maxCol = orientation === 'horizontal' ? boardSize - ship.size : boardSize - 1;

        const row = Math.floor(Math.random() * (maxRow + 1));
        const col = Math.floor(Math.random() * (maxCol + 1));
        const origin: Coordinate = { row, col };

        if (canPlaceShip(ship, origin, orientation, placed, boardSize)) {
          const coords = getShipCoordinates(origin, orientation, ship.size);
          placed.push({
            id: ship.id,
            name: ship.name,
            size: ship.size,
            emoji: ship.emoji,
            image: ship.image,
            origin,
            orientation,
            coordinates: coords,
            hits: 0,
            isSunk: false,
          });
          placedCurrent = true;
        }
      }

      if (!placedCurrent) {
        // Retry whole fleet layout if blocked
        break;
      }
    }
  }

  return placed;
}

/**
 * Checks if a specific coordinate hits any ship in the fleet
 */
export function isHit(coord: Coordinate, ships: PlacedShip[]): { hit: boolean; ship?: PlacedShip } {
  for (const ship of ships) {
    const matched = ship.coordinates.some(
      (c) => c.row === coord.row && c.col === coord.col
    );
    if (matched) {
      return { hit: true, ship };
    }
  }
  return { hit: false };
}

/**
 * Evaluates an incoming attack against a defender's fleet.
 * Updates the defender's ships and returns whether it was hit/miss,
 * if any ship was sunk, and if the entire fleet is destroyed.
 */
export function attackFleet(
  coord: Coordinate,
  fleet: PlacedShip[],
  attackHistory: Coordinate[]
): {
  result: 'hit' | 'miss';
  updatedFleet: PlacedShip[];
  sunkShip: PlacedShip | null;
  allSunk: boolean;
  duplicate: boolean;
} {
  // Check duplicate
  const isDuplicate = attackHistory.some((a) => a.row === coord.row && a.col === coord.col);
  if (isDuplicate) {
    return {
      result: 'miss',
      updatedFleet: fleet,
      sunkShip: null,
      allSunk: isFleetDestroyed(fleet),
      duplicate: true,
    };
  }

  const { hit, ship } = isHit(coord, fleet);
  if (!hit || !ship) {
    return {
      result: 'miss',
      updatedFleet: fleet,
      sunkShip: null,
      allSunk: isFleetDestroyed(fleet),
      duplicate: false,
    };
  }

  let newlySunkShip: PlacedShip | null = null;
  const updatedFleet = fleet.map((s) => {
    if (s.id !== ship.id) return s;
    const newHits = s.hits + 1;
    const isSunk = newHits >= s.size;
    const updated = { ...s, hits: newHits, isSunk };
    if (isSunk && !s.isSunk) {
      newlySunkShip = updated;
    }
    return updated;
  });

  const allSunk = isFleetDestroyed(updatedFleet);

  return {
    result: 'hit',
    updatedFleet,
    sunkShip: newlySunkShip,
    allSunk,
    duplicate: false,
  };
}

/**
 * Checks if all ships in the fleet are destroyed
 */
export function isFleetDestroyed(fleet: PlacedShip[]): boolean {
  if (fleet.length < SHIPS.length) return false;
  return fleet.every((s) => s.isSunk);
}

/**
 * Returns coordinate label e.g. "B4", "A10"
 */
export function getCoordinateLabel(row: number, col: number): string {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  return `${letters[col] || '?'}${row + 1}`;
}
