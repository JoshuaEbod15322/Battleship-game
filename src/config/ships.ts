import type { ShipDefinition } from '../types/battleship';

export const BOARD_SIZE = 10;
export const COLUMN_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
export const ROW_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export const SHIPS: ShipDefinition[] = [
  {
    id: 'carrier',
    name: 'Carrier',
    size: 5,
    emoji: '🚢',
    image: '/assets/ships/carrier.png',
    description: 'Heaviest capital ship with long airstrip surface.',
  },
  {
    id: 'battleship',
    name: 'Battleship',
    size: 4,
    emoji: '🛳️',
    image: '/assets/ships/battleship.png',
    description: 'Armored juggernaut packed with heavy artillery.',
  },
  {
    id: 'cruiser',
    name: 'Cruiser',
    size: 3,
    emoji: '🚤',
    image: '/assets/ships/cruiser.png',
    description: 'Fast tactical vessel for strike maneuvers.',
  },
  {
    id: 'submarine',
    name: 'Submarine',
    size: 3,
    emoji: '🚢',
    image: '/assets/ships/submarine.png',
    description: 'Stealth undersea hunter with sonar tracking.',
  },
  {
    id: 'destroyer',
    name: 'Destroyer',
    size: 2,
    emoji: '⛴️',
    image: '/assets/ships/destroyer.png',
    description: 'Agile escort boat equipped for rapid anti-sub defense.',
  },
];

export const GAME_ASSETS = {
  ships: {
    carrier: '🚢',
    battleship: '🛳️',
    cruiser: '🚤',
    submarine: '🚢',
    destroyer: '⛴️',
  },
  effects: {
    hit: '💥',
    hitFire: '🔥',
    miss: '💦',
    explosion: '💥',
    target: '🎯',
    sunk: '🔥',
  },
  status: {
    victory: '🏆',
    defeat: '💀',
    warning: '⚠️',
    waiting: '⏳',
    connected: '🟢',
    disconnected: '🔴',
    multiplayer: '👥',
    room: '🏠',
  },
  controls: {
    randomize: '🎲',
    rotate: '🔄',
    start: '▶️',
    back: '←',
  },
} as const;
