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
  /** Which segment index (0-based) this cell is within the ship */
  shipSegmentIndex?: number;
  /** Total size of the ship (number of cells) */
  shipSize?: number;
  /** Orientation of the ship */
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
 * Background-slice style for one cell of a multi-cell ship image.
 *
 * All top/destroy art is authored horizontally (aspect == ship length).
 * For vertical ships we keep slicing along the horizontal axis and rotate
 * the slice 90deg clockwise so the hull points down the column with zero
 * squash/stretch. Rotating a square cell's content keeps it filling the
 * cell exactly.
 *
 * The 1.02 scale bleeds each slice ~1px under its neighbour so GPU
 * rasterization of the rotation never leaves a hairline seam on the Y
 * axis between stacked segments (parent has overflow-hidden, so the
 * excess is clipped and only covers the seam).
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

  // Fully-sunk ship cell: friendly board (ship.isSunk) or enemy board
  // (coordinate belongs to a sunk-ship reveal). Renders ONE continuous
  // destroy image merged across all segments (same slicing as top view).
  const showSunkImage = isSunk && Boolean(shipImageDestroy);

  // A friendly, unhit cell that belongs to a ship. This is the case that
  // needs to visually merge with its neighbouring segments instead of
  // looking like its own boxed tile.
  const isFriendlyShipCell = !isEnemy && hasShip && !isHit && !isSunk;
  const hasShipImage = isFriendlyShipCell && !!shipImageTop;
  const isFirstSegment = shipSegmentIndex === 0;
  const isLastSegment = shipSegmentIndex === shipSize - 1;

  // Only the two outer edges of a multi-cell ship get a border and a
  // rounded corner. The seams between segments stay flat and borderless
  // so the hull reads as one continuous shape rather than glued-together
  // tiles.
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
    // No image yet for this ship, fall back to the original boxed look.
    shipCellClasses =
      "bg-[#2b2f1d] border border-[#c9a227]/60";
  }

  // Sunk wreck frame: same merged-hull treatment as intact ships (only the
  // two outer edges get a border), so the destroy art reads as one image
  // instead of separate boxed tiles cutting through the hull.
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
        // Sunk wreck (destroy image) takes precedence over plain hit
        showSunkImage
          ? sunkCellClasses
          : // Hit state
            isHit
            ? isSunk
              ? "bg-[#33100b] border border-[#b3352b] text-[#e89a90]"
              : "bg-[#3a130e] border border-[#b3352b]/70 text-[#e89a90]"
            : // Miss state
              isMiss
              ? "bg-[#1c1f16] border border-[#4a4f3c] text-[#a8956c]"
              : // Placement preview
                isPlacementHover
                ? isPlacementValid
                  ? "bg-[#2c3319]/70 border-2 border-[#7da05c]"
                  : "bg-[#33100b]/70 border-2 border-[#b3352b]"
                : // Friendly ship (image-merged or fallback boxed look)
                  isFriendlyShipCell
                  ? shipCellClasses
                  : // Targetable enemy cell
                    isTargetable
                    ? "bg-[#141a13] border border-[#3a4030] hover:bg-[#2b2413] hover:border-[#c9a227] cursor-crosshair"
                    : // Default empty
                      "bg-[#151a13]/80 border border-[#2c332a] text-[#4a4f3c] cursor-default"
      }`}
    >
      {/* 0. Sunk wreck: ONE merged destroy image across all segments.
          Each cell renders only its slice so the wreck reads as a single
          continuous hull, exactly like the top-view rendering. */}
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
          {/* Dark scorch overlay so the wreck reads as destroyed */}
          <div className="absolute inset-0 bg-[#b3352b]/25 pointer-events-none" />
          {/* Single flame at the bow so the merged wreck reads as one ship */}
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

      {/* 1. Hit Animation & Graphic (skipped when the wreck image is shown) */}
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

      {/* 2. Miss Ripple & Splash Graphic */}
      {isMiss && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="relative flex items-center justify-center"
        >
          <span className="text-xs sm:text-sm select-none">💦</span>
          {/* Subtle water ripple ring */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0.8 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1 }}
            className="absolute w-5 h-5 rounded-full border border-[#a8956c] pointer-events-none"
          />
        </motion.div>
      )}

      {/* 3. Friendly Ship Display */}
      {isFriendlyShipCell && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0"
        >
          {shipImageTop ? (
            // Render only the correct slice of the image so all cells
            // merge into one continuous ship image. Vertical hulls reuse
            // the horizontal slice rotated 90deg to avoid squash/stretch.
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

      {/* 4. Crosshair indicator on hover when targetable */}
      {isTargetable && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <Target className="w-3.5 h-3.5 text-[#e8c84a] animate-spin-slow" />
        </div>
      )}

      {/* Subtle grid corner coordinates dot, skipped on ship cells so it
          doesn't dot across the merged hull image */}
      {!isFriendlyShipCell && !showSunkImage && (
        <div className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-[#d9c9a3]/20 pointer-events-none" />
      )}
    </button>
  );
};
