import React from 'react';
import { RotateCw, Dices, RotateCcw, Check, AlertCircle } from 'lucide-react';
import type { Orientation, PlacedShip, ShipDefinition } from '../../types/battleship';
import { SHIPS } from '../../config/ships';
import { sound } from '../../lib/sound';

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
      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md max-w-md w-full mx-auto space-y-4 font-mono"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div>
          <h3 className="text-xs sm:text-sm font-bold tracking-wider text-cyan-400 uppercase">
            Your Fleet Deployment
          </h3>
          <p className="text-[11px] text-slate-400">
            {allShipsPlaced
              ? 'All 5 ships deployed. Confirm tactical ready.'
              : 'Select a ship, choose sector on grid.'}
          </p>
        </div>
        <div className="text-xs font-bold text-slate-300">
          <span className="text-cyan-400">{placedShips.length}</span> / {SHIPS.length}
        </div>
      </div>

      {/* Ships List Selector */}
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
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950/80 border-cyan-400 shadow-md shadow-cyan-900/30'
                  : isPlaced
                  ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  : 'bg-slate-900/60 border-cyan-900/40 text-slate-200 hover:border-cyan-600/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl" role="img" aria-label={ship.name}>
                  {ship.emoji}
                </span>
                <div className="text-left">
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span className={isSelected ? 'text-cyan-300' : 'text-slate-200'}>
                      {ship.name}
                    </span>
                    {isPlaced && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                        PLACED
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">{ship.size} Grid Sectors</div>
                </div>
              </div>

              {/* Ship Segment Indicator */}
              <div className="flex gap-1 items-center">
                {Array.from({ length: ship.size }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-3 rounded-xs border ${
                      isPlaced
                        ? 'bg-cyan-500/60 border-cyan-400'
                        : isSelected
                        ? 'bg-cyan-400 border-cyan-300 animate-pulse'
                        : 'bg-slate-800 border-slate-700'
                    }`}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Buttons: Rotate, Randomize, Reset */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          id="rotate-btn"
          type="button"
          onClick={() => {
            sound.playButton();
            onRotate();
          }}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-950/80 border border-slate-700 hover:border-cyan-500 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          title="Rotate ship placement orientation (or press R)"
        >
          <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>{orientation === 'horizontal' ? 'HORIZ 🔄' : 'VERT 🔄'}</span>
        </button>

        <button
          id="randomize-btn"
          type="button"
          onClick={() => {
            sound.playButton();
            onRandomize();
          }}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-950/80 border border-slate-700 hover:border-cyan-500 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          title="Randomize fleet placement"
        >
          <Dices className="w-3.5 h-3.5 text-amber-400" />
          <span>RANDOM 🎲</span>
        </button>

        <button
          id="reset-btn"
          type="button"
          onClick={() => {
            sound.playButton();
            onReset();
          }}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-950/80 border border-slate-700 hover:border-rose-500 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          title="Clear all placed ships"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          <span>RESET</span>
        </button>
      </div>

      {/* Opponent readiness notice */}
      <div className="text-[11px] p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-slate-400">
        <span>Opponent Status:</span>
        <span
          className={`font-bold flex items-center gap-1 ${
            opponentReady ? 'text-emerald-400' : 'text-amber-400'
          }`}
        >
          {opponentReady ? '🟢 Ready for Combat' : '⏳ Placing Ships...'}
        </span>
      </div>

      {/* Ready Button */}
      <button
        id="ready-btn"
        type="button"
        disabled={!allShipsPlaced || isReady}
        onClick={() => {
          sound.playButton();
          onReady();
        }}
        className={`w-full py-3 rounded-xl font-mono text-xs sm:text-sm font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
          isReady
            ? 'bg-emerald-950 border border-emerald-600 text-emerald-400 cursor-default'
            : allShipsPlaced
            ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 cursor-pointer animate-pulse'
            : 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed'
        }`}
      >
        {isReady ? (
          <>
            <Check className="w-4 h-4 text-emerald-400" />
            <span>FLEET LOCKED &amp; READY</span>
          </>
        ) : allShipsPlaced ? (
          <>
            <Check className="w-4 h-4 text-slate-950" />
            <span>LOCK IN FLEET &amp; BATTLE ▶️</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4 text-slate-500" />
            <span>PLACE ALL 5 SHIPS FIRST</span>
          </>
        )}
      </button>
    </div>
  );
};
