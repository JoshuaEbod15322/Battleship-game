import React, { useState } from "react";
import { BoardCell } from "./BoardCell";
import { BOARD_SIZE, COLUMN_LABELS, ROW_LABELS } from "../../config/ships";
import type {
  AttackRecord,
  Coordinate,
  Orientation,
  PlacedShip,
  ShipDefinition,
  ShipType,
} from "../../types/battleship";
import { canPlaceShip, getShipCoordinates } from "../../lib/gameLogic";
import { Shield, Crosshair } from "lucide-react";

interface GameBoardProps {
  title: string;
  isEnemy?: boolean;
  placedShips?: PlacedShip[];
  attacks?: AttackRecord[];
  sunkShips?: Array<{
    id: ShipType;
    name: string;
    size: number;
    emoji: string;
    coordinates: Coordinate[];
  }>;
  canAttack?: boolean;
  onAttack?: (row: number, col: number) => void;

  // Placement mode props
  isPlacementMode?: boolean;
  selectedShipDef?: ShipDefinition | null;
  orientation?: Orientation;
  onPlaceShip?: (origin: Coordinate) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  title,
  isEnemy = false,
  placedShips = [],
  attacks = [],
  sunkShips = [],
  canAttack = false,
  onAttack,
  isPlacementMode = false,
  selectedShipDef = null,
  orientation = "horizontal",
  onPlaceShip,
}) => {
  const [hoverCoord, setHoverCoord] = useState<Coordinate | null>(null);

  // Calculate placement preview coordinates
  let placementPreviewCoords: Coordinate[] = [];
  let isPlacementValid = false;

  if (isPlacementMode && selectedShipDef && hoverCoord) {
    placementPreviewCoords = getShipCoordinates(
      hoverCoord,
      orientation,
      selectedShipDef.size,
    );
    isPlacementValid = canPlaceShip(
      selectedShipDef,
      hoverCoord,
      orientation,
      placedShips,
      BOARD_SIZE,
      selectedShipDef.id,
    );
  }

  // Helper to find ship on a coordinate
  const getShipAtCoord = (row: number, col: number): PlacedShip | undefined => {
    return placedShips.find((s) =>
      s.coordinates.some((c) => c.row === row && c.col === col),
    );
  };

  // Helper to find attack on a coordinate
  const getAttackAtCoord = (
    row: number,
    col: number,
  ): AttackRecord | undefined => {
    return attacks.find((a) => a.row === row && a.col === col);
  };

  // Helper to check if sunk on coordinate
  const isSunkAtCoord = (row: number, col: number): boolean => {
    if (!isEnemy) {
      const ship = getShipAtCoord(row, col);
      return Boolean(ship?.isSunk);
    }
    return sunkShips.some((s) =>
      s.coordinates.some((c) => c.row === row && c.col === col),
    );
  };

  return (
    <div
      id={`game-board-${isEnemy ? "enemy" : "fleet"}`}
      className="relative flex flex-col p-2.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md max-w-md w-full mx-auto min-w-0"
    >
      {/* Board Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          {isEnemy ? (
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Crosshair className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-4 h-4" />
            </div>
          )}
          <div>
            <h3
              className={`font-mono text-xs sm:text-sm font-semibold tracking-wider uppercase ${
                isEnemy ? "text-rose-400" : "text-cyan-400"
              }`}
            >
              {title}
            </h3>
            {/* <p className="text-[10px] text-slate-400 font-mono">
              {isEnemy
                ? canAttack
                  ? "Target Coordinates Armed"
                  : "Radar Surveillance Active"
                : `Active Fleet: ${placedShips.filter((s) => !s.isSunk).length} / 5 Vessels`}
            </p> */}
          </div>
        </div>

        {/* Small naval status ping indicator */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950/60 border border-slate-800 text-[12px] font-mono text-slate-400">
          <span>10×10</span>
        </div>
      </div>

      {/* Grid with Column & Row Headers */}
      <div className="relative w-full">
        {/* Column Labels (A-J) */}
        <div className="grid grid-cols-11 text-center font-mono text-[9px] sm:text-xs font-semibold text-slate-400 mb-1">
          <div className="w-4 sm:w-6" /> {/* spacer for row labels */}
          {COLUMN_LABELS.map((col) => (
            <div key={col} className="select-none text-cyan-300/70">
              {col}
            </div>
          ))}
        </div>

        {/* Rows with labels (1-10) and grid cells */}
        <div className="space-y-0.5 sm:space-y-1">
          {ROW_LABELS.map((rowLabel, rIdx) => (
            <div
              key={rowLabel}
              className="grid grid-cols-11 items-center gap-0.5 sm:gap-1"
            >
              {/* Row Label (1-10) */}
              <div className="w-4 sm:w-6 text-right pr-0.5 sm:pr-1 font-mono text-[9px] sm:text-xs font-semibold text-cyan-300/70 select-none">
                {rowLabel}
              </div>

              {/* 10 Cells in this row */}
              {COLUMN_LABELS.map((_, cIdx) => {
                const ship = !isEnemy ? getShipAtCoord(rIdx, cIdx) : undefined;
                const attack = getAttackAtCoord(rIdx, cIdx);
                const isHit = attack?.result === "hit";
                const isMiss = attack?.result === "miss";
                const isSunk = isSunkAtCoord(rIdx, cIdx);

                // Check if this cell is part of placement preview
                const isPreview = placementPreviewCoords.some(
                  (c) => c.row === rIdx && c.col === cIdx,
                );

                return (
                  <BoardCell
                    key={`${rIdx}-${cIdx}`}
                    row={rIdx}
                    col={cIdx}
                    isEnemy={isEnemy}
                    hasShip={Boolean(ship)}
                    shipEmoji={ship?.emoji}
                    isHit={isHit}
                    isMiss={isMiss}
                    isSunk={isSunk}
                    isPlacementHover={isPreview}
                    isPlacementValid={isPlacementValid}
                    canAttack={canAttack}
                    onClick={() => {
                      if (isPlacementMode && onPlaceShip) {
                        onPlaceShip({ row: rIdx, col: cIdx });
                      } else if (isEnemy && canAttack && onAttack && !attack) {
                        onAttack(rIdx, cIdx);
                      }
                    }}
                    onMouseEnter={() => {
                      if (isPlacementMode) {
                        setHoverCoord({ row: rIdx, col: cIdx });
                      }
                    }}
                    onMouseLeave={() => {
                      if (isPlacementMode) {
                        setHoverCoord(null);
                      }
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
