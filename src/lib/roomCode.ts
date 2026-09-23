// Ambiguous glyphs (0/O, 1/I) excluded so codes read cleanly over voice/chat.
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(length: number = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * CHARS.length);
    code += CHARS[randomIndex];
  }
  return code;
}

export function isValidRoomCode(code: string): boolean {
  if (!code) return false;
  const clean = code.trim().toUpperCase();
  return /^[A-Z0-9]{5,8}$/.test(clean);
}

export function getInviteUrl(roomCode: string): string {
  if (typeof window === 'undefined') return `https://battleship.app/?join=${roomCode}`;
  const origin = window.location.origin;
  return `${origin}/?join=${roomCode.toUpperCase()}`;
}
