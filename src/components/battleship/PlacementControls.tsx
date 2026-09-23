import React from "react";
import { RotateCw, Dices, RotateCcw, Check, AlertCircle } from "lucide-react";
import type {
  Orientation,
  PlacedShip,
  ShipDefinition,
} from "../../types/battleship";
import { SHIPS } from "../../config/ships";
import { sound } from "../../lib/sound";

interface PlacementControlsProps {
  placedShips: PlacedShip[];
  selectedShip: ShipDefinition | null;
  orientation: Orientation;
  onSelectShip: (ship: ShipDefinition) => void;
  onRotate: () => void;
  onRandomize: () => void;
  onReset: () => void;
  onReady: () => void;
  isReady: boolean;
  opponentReady: boolean;
}

export const PlacementControls: React.FC<PlacementControlsProps> = ({
  placedShips,
  selectedShip,
  orientation,
  onSelectShip,
  onRotate,
  onRandomize,
  onReset,
  onReady,
  isReady,
  opponentReady,
}) => {
  const allShipsPlaced = placedShips.length === SHIPS.length;

  return (
    <div
      id="placement-controls"
      className="wr-panel p-3 sm:p-4 max-w-md w-full mx-auto space-y-4 relative"
    >
      <div className="absolute -top-3 left-6 wr-plate px-3 py-0.5 text-[10px] font-bold tracking-[0.3em] uppercase">
        Fleet Manifest
      </div>

      <div className="flex items-center justify-between border-b border-[#4d452c] pb-2.5 mt-2">
        <div>
          <h3 className="wr-head text-xs sm:text-sm tracking-[0.2em] text-[#e8c84a] uppercase">
            Deployment Orders
          </h3>
          <p className="text-[11px] text-[#a8956c]">
            {allShipsPlaced
              ? "All 5 hulls on the chart. Sign the order."
              : "Pick a hull, stamp it on the chart."}
          </p>
        </div>
        <div className="text-xs font-bold text-[#e9dfc4]">
          <span className="text-[#e8c84a]">{placedShips.length}</span> /{" "}
          {SHIPS.length}
        </div>
      </div>

      <div className="space-y-1.5">
        {SHIPS.map((ship) => {
          const isPlaced = placedShips.some((s) => s.id === ship.id);
          const isSelected = selectedShip?.id === ship.id;

          return (
            <button
              key={ship.id}
              id={`select-ship-${ship.id}`}
              type="button"
              onClick={() => {
                sound.playButton();
                onSelectShip(ship);
              }}
              className={`w-full flex items-center justify-between p-2.5 border transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#2b2413] border-[#c9a227]"
                  : isPlaced
                    ? "bg-[#0d0b06] border-[#3a3423] hover:border-[#6f5d21]"
                    : "bg-[#14110a] border-[#4d452c] hover:border-[#c9a227]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-8 flex items-center justify-center shrink-0 bg-[#0d0b06] border border-[#3a3423]">
                  {ship.imageSide ? (
                    <img
                      src={ship.imageSide}
                      alt={ship.name}
                      className="w-full h-full object-contain sepia-[0.35]"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-xl" role="img" aria-label={ship.name}>
                      {ship.emoji}
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <div className="text-md font-semibold flex items-center gap-1.5">
                    <span
                      className={
                        isSelected ? "text-[#e8c84a]" : "text-[#e9dfc4]"
                      }
                    >
                      {ship.name}
                    </span>
                    {isPlaced && (
                      <span className="wr-stamp text-[9px] text-[#7da05c]">
                        Placed
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-1 items-center">
                {Array.from({ length: ship.size }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-3 border ${
                      isPlaced
                        ? "bg-[#6b6238] border-[#c9a227]"
                        : isSelected
                          ? "bg-[#c9a227] border-[#e8c84a] animate-pulse"
                          : "bg-[#0d0b06] border-[#4d452c]"
                    }`}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
        <button
          id="rotate-btn"
          type="button"
          disabled={isReady}
          onClick={() => {
            sound.playButton();
            onRotate();
          }}
          className="wr-btn-steel flex items-center justify-center gap-1.5 py-2 px-2.5 text-[11px] cursor-pointer"
          title={
            isReady
              ? "Orders signed"
              : `Turn the hull (now ${orientation}) or press R`
          }
        >
          <RotateCw className="w-3.5 h-3.5 text-[#c9a227]" />
          <span>Turn</span>
        </button>

        <button
          id="randomize-btn"
          type="button"
          disabled={isReady}
          onClick={() => {
            sound.playButton();
            onRandomize();
          }}
          className="wr-btn-steel flex items-center justify-center gap-1.5 py-2 px-2.5 text-[11px] cursor-pointer"
          title={isReady ? "Orders signed" : "Let the staff place the fleet"}
        >
          <Dices className="w-3.5 h-3.5 text-[#c9a227]" />
          <span>Staff Plot</span>
        </button>

        <button
          id="reset-btn"
          type="button"
          className="wr-btn-steel col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 py-2 px-2.5 text-[11px] cursor-pointer"
          disabled={isReady}
          onClick={() => {
            sound.playButton();
            onReset();
          }}
          title={isReady ? "Orders signed" : "Strike every hull from the chart"}
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#b3352b]" />
          <span>Recall</span>
        </button>
      </div>

      <div className="text-[11px] p-2 bg-[#0d0b06] border border-[#4d452c] flex items-center justify-between text-[#a8956c]">
        <span className="tracking-[0.2em] uppercase">Rival staff:</span>
        <span
          className={`font-bold flex items-center gap-1.5 tracking-widest uppercase ${
            opponentReady ? "text-[#7da05c]" : "text-[#c9a227]"
          }`}
        >
          {opponentReady ? "Sealed & ready" : "Still plotting..."}
        </span>
      </div>

      <button
        id="ready-btn"
        type="button"
        disabled={!allShipsPlaced || isReady}
        onClick={() => {
          sound.playButton();
          onReady();
        }}
        className={`w-full py-3 text-xs sm:text-sm tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
          isReady
            ? "bg-[#1c2415] border border-[#7da05c] text-[#7da05c] cursor-default"
            : allShipsPlaced
              ? "wr-btn-brass animate-pulse"
              : "bg-[#14110a] text-[#6e6040] border border-[#3a3423] cursor-not-allowed"
        }`}
      >
        {isReady ? (
          <>
            <Check className="w-4 h-4" />
            <span>Orders Signed</span>
          </>
        ) : allShipsPlaced ? (
          <>
            <span>Sign Orders &amp; Sail</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4" />
            <span>Five hulls required</span>
          </>
        )}
      </button>
    </div>
  );
};
