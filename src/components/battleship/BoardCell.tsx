import React from "react";
import { motion } from "motion/react";
import { Flame, Target } from "lucide-react";

interface BoardCellProps {
  row: number;
  col: number;
  isEnemy: boolean;
  hasShip?: boolean;
  shipEmoji?: string;
  /** Top-down image used on the game board grid */
  shipImageTop?: string;
  /** Destroyed variant shown once the whole ship is sunk */
  shipImageDestroy?: string;
  shipSegmentIndex?: number;
  shipSize?: number;
  shipOrientation?: "horizontal" | "vertical";
  isHit?: boolean;
  isMiss?: boolean;
  isSunk?: boolean;
  isPlacementHover?: boolean;
  isPlacementValid?: boolean;
  canAttack?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

/**
 * Ship art is authored horizontally; vertical hulls reuse the horizontal
 * slice rotated 90deg. Scale 1.02 bleeds slices under neighbours so rotated
 * seams never show a hairline (parent clips the excess).
 */
function getShipSliceStyle(
  image: string,
  segmentIndex: number,
  shipSize: number,
  orientation: "horizontal" | "vertical",
): React.CSSProperties {
  const safeSize = Math.max(1, shipSize);
  const safeIndex = Math.min(Math.max(0, segmentIndex), safeSize - 1);
  const positionX = safeSize === 1 ? 0 : (safeIndex / (safeSize - 1)) * 100;
  return {
    backgroundImage: `url(${image})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${safeSize * 100}% 100%`,
    backgroundPosition: `${positionX}% 50%`,
    transform:
      orientation === "vertical"
        ? "rotate(90deg) scale(1.02)"
        : "scale(1.02)",
  };
}

export const BoardCell: React.FC<BoardCellProps> = ({
  row,
  col,
  isEnemy,
  hasShip = false,
  shipEmoji,
  shipImageTop,
  shipImageDestroy,
  shipSegmentIndex = 0,
  shipSize = 1,
  shipOrientation = "horizontal",
  isHit = false,
  isMiss = false,
  isSunk = false,
  isPlacementHover = false,
  isPlacementValid = true,
  canAttack = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const isTargetable = isEnemy && canAttack && !isHit && !isMiss;

  const showSunkImage = isSunk && Boolean(shipImageDestroy);

  const isFriendlyShipCell = !isEnemy && hasShip && !isHit && !isSunk;
  const hasShipImage = isFriendlyShipCell && !!shipImageTop;
  const isFirstSegment = shipSegmentIndex === 0;
  const isLastSegment = shipSegmentIndex === shipSize - 1;

  let shipCellClasses = "";
  if (hasShipImage) {
    if (shipOrientation === "horizontal") {
      shipCellClasses = [
        "bg-[#2b2f1d] border-y border-[#c9a227]/60",
        isFirstSegment ? "border-l" : "",
        isLastSegment ? "border-r" : "",
      ]
        .filter(Boolean)
        .join(" ");
    } else {
      shipCellClasses = [
        "bg-[#2b2f1d] border-x border-[#c9a227]/60",
        isFirstSegment ? "border-t" : "",
        isLastSegment ? "border-b" : "",
      ]
        .filter(Boolean)
        .join(" ");
    }
  } else if (isFriendlyShipCell) {
    shipCellClasses =
      "bg-[#2b2f1d] border border-[#c9a227]/60";
  }

  let sunkCellClasses = "";
  if (showSunkImage) {
    if (shipOrientation === "horizontal") {
      sunkCellClasses = [
        "bg-[#33100b] border-y border-[#b3352b]",
        isFirstSegment ? "border-l" : "",
        isLastSegment ? "border-r" : "",
      ]
        .filter(Boolean)
        .join(" ");
    } else {
      sunkCellClasses = [
        "bg-[#33100b] border-x border-[#b3352b]",
        isFirstSegment ? "border-t" : "",
        isLastSegment ? "border-b" : "",
      ]
        .filter(Boolean)
        .join(" ");
    }
  }

  return (
    <button
      id={`cell-${isEnemy ? "enemy" : "fleet"}-${row}-${col}`}
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={isEnemy ? !isTargetable : !onClick}
      className={`relative w-full aspect-square flex items-center justify-center transition-all duration-150 select-none overflow-hidden ${
        showSunkImage
          ? sunkCellClasses
          : isHit
            ? isSunk
              ? "bg-[#33100b] border border-[#b3352b] text-[#e89a90]"
              : "bg-[#3a130e] border border-[#b3352b]/70 text-[#e89a90]"
            : isMiss
              ? "bg-[#1c1f16] border border-[#4a4f3c] text-[#a8956c]"
              : isPlacementHover
                ? isPlacementValid
                  ? "bg-[#2c3319]/70 border-2 border-[#7da05c]"
                  : "bg-[#33100b]/70 border-2 border-[#b3352b]"
                : isFriendlyShipCell
                  ? shipCellClasses
                  : isTargetable
                    ? "bg-[#141a13] border border-[#3a4030] hover:bg-[#2b2413] hover:border-[#c9a227] cursor-crosshair"
                    : "bg-[#151a13]/80 border border-[#2c332a] text-[#4a4f3c] cursor-default"
      }`}
    >
      {showSunkImage && shipImageDestroy && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0"
        >
          <div
            className="w-full h-full"
            style={getShipSliceStyle(
              shipImageDestroy,
              shipSegmentIndex,
              shipSize,
              shipOrientation,
            )}
          />
          <div className="absolute inset-0 bg-[#b3352b]/25 pointer-events-none" />
          {shipSegmentIndex === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-0 right-0.5 pointer-events-none"
            >
              <Flame className="w-3 h-3 text-[#e8c84a] animate-pulse fill-[#e8c84a] drop-shadow" />
            </motion.div>
          )}
        </motion.div>
      )}

      {isHit && !showSunkImage && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="flex flex-col items-center justify-center"
        >
          <span className="text-sm sm:text-base leading-none select-none filter drop-shadow">
            💥
          </span>
          {isSunk && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-1 -right-1"
            >
              <Flame className="w-3 h-3 text-[#e8c84a] animate-pulse fill-[#e8c84a]" />
            </motion.div>
          )}
        </motion.div>
      )}

      {isMiss && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="relative flex items-center justify-center"
        >
          <span className="text-xs sm:text-sm select-none">💦</span>
          <motion.div
            initial={{ scale: 0.4, opacity: 0.8 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1 }}
            className="absolute w-5 h-5 rounded-full border border-[#a8956c] pointer-events-none"
          />
        </motion.div>
      )}

      {isFriendlyShipCell && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0"
        >
          {shipImageTop ? (
            <div
              className="w-full h-full"
              style={getShipSliceStyle(
                shipImageTop,
                shipSegmentIndex,
                shipSize,
                shipOrientation,
              )}
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm select-none filter drop-shadow">
              {shipEmoji || "🚢"}
            </span>
          )}
        </motion.div>
      )}

      {isTargetable && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <Target className="w-3.5 h-3.5 text-[#e8c84a] animate-spin-slow" />
        </div>
      )}

      {!isFriendlyShipCell && !showSunkImage && (
        <div className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-[#d9c9a3]/20 pointer-events-none" />
      )}
    </button>
  );
};
