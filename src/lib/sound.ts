/**
 * Naval Battleship Procedural Sound Engine
 * Uses Web Audio API for zero-dependency, low-latency audio effects.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Check saved mute preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('battleship_sound_muted');
      this.isMuted = saved === 'true';
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('battleship_sound_muted', String(muted));
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // 1. UI Button Click
  public playButton() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(640, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio context restricted until user interaction
    }
  }

  // 2. Hit Explosion
  public playHit() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // White noise burst for explosion
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      // Lowpass filter for deep boom
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      // Low frequency sub-thump
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(140, now);
      sub.frequency.exponentialRampToValueAtTime(35, now + 0.3);
      subGain.gain.setValueAtTime(0.35, now);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      sub.connect(subGain);
      subGain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.35);
      sub.start(now);
      sub.stop(now + 0.3);
    } catch {}
  }

  // 3. Water Splash Miss
  public playMiss() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Water droplet / bubbling splash
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      // Noise component for splash
      const bufferSize = this.ctx.sampleRate * 0.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const splash = this.ctx.createBufferSource();
      splash.buffer = buffer;
      const splashFilter = this.ctx.createBiquadFilter();
      splashFilter.type = 'bandpass';
      splashFilter.frequency.setValueAtTime(1200, now);
      splashFilter.Q.value = 3;
      const splashGain = this.ctx.createGain();
      splashGain.gain.setValueAtTime(0.12, now);
      splashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      splash.connect(splashFilter);
      splashFilter.connect(splashGain);
      splashGain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
      splash.start(now);
      splash.stop(now + 0.2);
    } catch {}
  }

  // 4. Ship Sunk Alarm & Devastating Impact
  public playSunk() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Play heavy hit first
      this.playHit();

      // Naval warning siren pulse
      for (let i = 0; i < 3; i++) {
        const siren = this.ctx.createOscillator();
        const sirenGain = this.ctx.createGain();
        const start = now + i * 0.18;
        siren.type = 'sawtooth';
        siren.frequency.setValueAtTime(450, start);
        siren.frequency.linearRampToValueAtTime(650, start + 0.12);

        sirenGain.gain.setValueAtTime(0.12, start);
        sirenGain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);

        siren.connect(sirenGain);
        sirenGain.connect(this.ctx.destination);

        siren.start(start);
        siren.stop(start + 0.16);
      }
    } catch {}
  }

  // 5. Sonar Radar Ping (Turn Change)
  public playTurn() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const ping = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      ping.type = 'sine';
      ping.frequency.setValueAtTime(1046.5, now); // C6 submarine ping
      ping.frequency.exponentialRampToValueAtTime(1000, now + 0.4);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      ping.connect(gain);
      gain.connect(this.ctx.destination);

      ping.start(now);
      ping.stop(now + 0.5);
    } catch {}
  }

  // 6. Victory Fanfare
  public playVictory() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = now + idx * 0.15;
        const dur = idx === notes.length - 1 ? 0.7 : 0.25;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(start);
        osc.stop(start + dur);
      });
    } catch {}
  }

  // 7. Defeat Drone
  public playDefeat() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [440, 392, 349.23, 293.66]; // A4, G4, F4, D4
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = now + idx * 0.25;
        const dur = 0.5;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);

        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;

        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(start);
        osc.stop(start + dur);
      });
    } catch {}
  }
}

export const sound = new SoundEngine();
