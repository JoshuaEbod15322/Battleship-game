import type { ShipDefinition } from "../types/battleship";

// ---------------------------------------------------------------------------
// Import your ship images from src/assets/ship/
// Naming convention:
//   <shipId>-side.(svg|png|webp)     →  side view  (shown in Fleet Deployment panel)
//   <shipId>-top.(svg|png|webp)      →  top view   (shown on the game board grid)
//   <shipId>-destroy.(svg|png|webp)  →  destroyed  (shown when the ship is fully sunk)
//
// Example:
//   import carrierSide from "../assets/ship/carrier-side.svg";
//   import carrierTop  from "../assets/ship/carrier-top.svg";
//   import carrierDestroy from "../assets/ship/carrier-destroy.png";
// ---------------------------------------------------------------------------

import carrierSide from "../assets/ship/carrier-side.png";
import carrierTop from "../assets/ship/carrier-top.png";
import carrierDestroy from "../assets/ship/carrier-destroy.png";
import battleshipSide from "../assets/ship/battleship-side.png";
import battleshipTop from "../assets/ship/battleship-top.png";
import battleshipDestroy from "../assets/ship/battleship-destroy.png";
import cruiserSide from "../assets/ship/cruiser-side.png";
import cruiserTop from "../assets/ship/cruiser-top.png";
import cruiserDestroy from "../assets/ship/cruiser-destroy.png";
import submarineSide from "../assets/ship/submarine-side.png";
import submarineTop from "../assets/ship/submarine-top.png";
import submarineDestroy from "../assets/ship/submarine-destroy.png";
import destroyerSide from "../assets/ship/destroyer-side.png";
import destroyerTop from "../assets/ship/destroyer-top.png";
import destroyerDestroy from "../assets/ship/destroyer-destroy.png";

export const BOARD_SIZE = 10;
export const COLUMN_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
export const ROW_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

export const SHIPS: ShipDefinition[] = [
  {
    id: "carrier",
    name: "Carrier",
    size: 5,
    emoji: "🛳️",
    imageSide: carrierSide,
    imageTop: carrierTop,
    imageDestroy: carrierDestroy,
    description: "Heaviest capital ship with long airstrip surface.",
  },
  {
    id: "battleship",
    name: "Battleship",
    size: 4,
    emoji: "🛳️",
    imageSide: battleshipSide, // e.g. battleshipSide
    imageTop: battleshipTop, // e.g. battleshipTop
    imageDestroy: battleshipDestroy, // e.g. battleshipDestroy
    description: "Armored juggernaut packed with heavy artillery.",
  },
  {
    id: "cruiser",
    name: "Cruiser",
    size: 3,
    emoji: "🚤",
    imageSide: cruiserSide, // e.g. cruiserSide
    imageTop: cruiserTop, // e.g. cruiserTop
    imageDestroy: cruiserDestroy, // e.g. cruiserDestroy
    description: "Fast tactical vessel for strike maneuvers.",
  },
  {
    id: "submarine",
    name: "Submarine",
    size: 3,
    emoji: "🚢",
    imageSide: submarineSide, // e.g. submarineSide
    imageTop: submarineTop, // e.g. submarineTop
    imageDestroy: submarineDestroy, // e.g. submarineDestroy
    description: "Stealth undersea hunter with sonar tracking.",
  },
  {
    id: "destroyer",
    name: "Destroyer",
    size: 2,
    emoji: "⛴️",
    imageSide: destroyerSide, // e.g. destroyerSide
    imageTop: destroyerTop, // e.g. destroyerTop
    imageDestroy: destroyerDestroy, // e.g. destroyerDestroy
    description: "Agile escort boat equipped for rapid anti-sub defense.",
  },
];

export const GAME_ASSETS = {
  ships: {
    carrier: "🚢",
    battleship: "🛳️",
    cruiser: "🚤",
    submarine: "🚢",
    destroyer: "⛴️",
  },
  effects: {
    hit: "💥",
    hitFire: "",
    miss: "💦",
    explosion: "💥",
    target: "🎯",
    sunk: "🔥",
  },
  status: {
    victory: "🏆",
    defeat: "💀",
    warning: "⚠️",
    waiting: "⏳",
    connected: "🟢",
    disconnected: "🔴",
    multiplayer: "👥",
    room: "🏠",
  },
  controls: {
    randomize: "🎲",
    rotate: "🔄",
    start: "▶️",
    back: "←",
  },
} as const;
