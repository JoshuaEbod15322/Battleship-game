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
    orientation: Orientation;
    coordinates: Coordinate[];
    imageTop?: string;
    imageDestroy?: string;
  }>;
  canAttack?: boolean;
  onAttack?: (row: number, col: number) => void;
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

  const getShipAtCoord = (row: number, col: number): PlacedShip | undefined => {
    return placedShips.find((s) =>
      s.coordinates.some((c) => c.row === row && c.col === col),
    );
  };

  const getAttackAtCoord = (
    row: number,
    col: number,
  ): AttackRecord | undefined => {
    return attacks.find((a) => a.row === row && a.col === col);
  };

  const isSunkAtCoord = (row: number, col: number): boolean => {
    if (!isEnemy) {
      const ship = getShipAtCoord(row, col);
      return Boolean(ship?.isSunk);
    }
    return sunkShips.some((s) =>
      s.coordinates.some((c) => c.row === row && c.col === col),
    );
  };

  const getSunkShipAtCoord = (row: number, col: number) => {
    return sunkShips.find((s) =>
      s.coordinates.some((c) => c.row === row && c.col === col),
    );
  };

  return (
    <div
      id={`game-board-${isEnemy ? "enemy" : "fleet"}`}
      className="wr-panel wr-map relative flex flex-col p-2.5 sm:p-4 max-w-md w-full mx-auto min-w-0"
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#4d452c]">
        <div className="flex items-center gap-2">
          {isEnemy ? (
            <div className="w-7 h-7 bg-[#2a0f0c] border border-[#b3352b] flex items-center justify-center text-[#e89a90]">
              <Crosshair className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 bg-[#0d0b06] border border-[#6f5d21] flex items-center justify-center text-[#c9a227]">
              <Shield className="w-4 h-4" />
            </div>
          )}
          <div>
            <h3
              className={`wr-head text-xs sm:text-sm tracking-[0.2em] uppercase ${
                isEnemy ? "text-[#e89a90]" : "text-[#e8c84a]"
              }`}
            >
              {title}
            </h3>
          </div>
        </div>

        <div className="wr-plate px-2 py-0.5 text-[11px] font-bold tracking-[0.2em]">
          <span> 10×10</span>
        </div>
      </div>

      <div className="relative w-full">
        <div className="grid grid-cols-11 text-center text-[9px] sm:text-xs font-bold tracking-[0.15em] text-[#c9a227] mb-1">
          <div className="w-4 sm:w-6" />
          {COLUMN_LABELS.map((col) => (
            <div key={col} className="select-none">
              {col}
            </div>
          ))}
        </div>

        <div className="space-y-0 sm:space-y-0">
          {ROW_LABELS.map((rowLabel, rIdx) => (
            <div
              key={rowLabel}
              className="grid grid-cols-11 items-center gap-0 sm:gap-0"
            >
              <div className="w-4 sm:w-6 text-right pr-0.5 sm:pr-1 text-[9px] sm:text-xs font-bold tracking-[0.15em] text-[#c9a227] select-none">
                {rowLabel}
              </div>

              {COLUMN_LABELS.map((_, cIdx) => {
                const ship = !isEnemy ? getShipAtCoord(rIdx, cIdx) : undefined;
                const sunkReveal = isEnemy
                  ? getSunkShipAtCoord(rIdx, cIdx)
                  : undefined;
                const attack = getAttackAtCoord(rIdx, cIdx);
                const isHit = attack?.result === "hit";
                const isMiss = attack?.result === "miss";
                const isSunk = isSunkAtCoord(rIdx, cIdx);

                const shipSegmentIndex = ship
                  ? ship.coordinates.findIndex(
                      (c) => c.row === rIdx && c.col === cIdx,
                    )
                  : sunkReveal
                    ? sunkReveal.coordinates.findIndex(
                        (c) => c.row === rIdx && c.col === cIdx,
                      )
                    : 0;

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
                    shipEmoji={ship?.emoji ?? sunkReveal?.emoji}
                    shipImageTop={ship?.imageTop}
                    shipImageDestroy={
                      ship?.imageDestroy ?? sunkReveal?.imageDestroy
                    }
                    shipSegmentIndex={shipSegmentIndex}
                    shipSize={ship?.size ?? sunkReveal?.size ?? 1}
                    shipOrientation={
                      ship?.orientation ??
                      sunkReveal?.orientation ??
                      "horizontal"
                    }
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
