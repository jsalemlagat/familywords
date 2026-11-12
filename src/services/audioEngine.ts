/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ThemeMode } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private currentTheme: ThemeMode = 'TABLETOP';

  constructor() {
    const savedMute = localStorage.getItem('wordcraft_muted');
    if (savedMute !== null) {
      this.isMuted = savedMute === 'true';
    }
  }

  public setTheme(theme: ThemeMode) {
    this.currentTheme = theme;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('wordcraft_muted', String(this.isMuted));
    return this.isMuted;
  }

  public get muted(): boolean {
    return this.isMuted;
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Short haptic pulse on mobile devices
   */
  public vibrate(pattern: number | number[]) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore vibration errors
      }
    }
  }

  /**
   * Tile touch/drag click sound tailored by theme
   */
  public playTileClick(pitchStep = 0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.vibrate(10); // subtle 10ms haptic tap

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    if (this.currentTheme === 'TABLETOP') {
      // Warm wooden percussive click
      osc.type = 'triangle';
      const baseFreq = 320 + pitchStep * 35;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.05);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (this.currentTheme === 'ZEN') {
      // Gentle meditative singing bowl chime
      osc.type = 'sine';
      const baseFreq = 520 + pitchStep * 40;
      osc.frequency.setValueAtTime(baseFreq, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } else if (this.currentTheme === 'ARCADE') {
      // 8-bit energetic blip
      osc.type = 'square';
      const baseFreq = 440 + pitchStep * 60;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (this.currentTheme === 'SENIOR') {
      // Clear piano-like note
      osc.type = 'sine';
      const baseFreq = 440 + pitchStep * 45;
      osc.frequency.setValueAtTime(baseFreq, now);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } else {
      // Midnight dark: clean high tech tick
      osc.type = 'sine';
      const baseFreq = 700 + pitchStep * 50;
      osc.frequency.setValueAtTime(baseFreq, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }

  /**
   * Celebratory chord on valid word submit
   */
  public playWordSuccess(points: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.vibrate([25, 30, 45]); // double haptic pulse

    const now = this.ctx.currentTime;
    // Harmonic triad based on word score
    const freqs = points >= 3 ? [523.25, 659.25, 783.99, 1046.50] : [440, 554.37, 659.25];

    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = this.currentTheme === 'ARCADE' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);

      gain.gain.setValueAtTime(0.2, now + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.3);
    });
  }

  /**
   * Dull thud on invalid word
   */
  public playWordInvalid() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.vibrate(50); // buzz

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Double tone on already found word
   */
  public playWordDuplicate() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.vibrate([15, 20, 15]);

    const now = this.ctx.currentTime;
    [320, 320].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.18, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.09);
    });
  }

  /**
   * Final countdown ticking clock
   */
  public playClockTick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Match finished gong / fanfare
   */
  public playRoundOver() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.vibrate([80, 50, 120]);

    const now = this.ctx.currentTime;
    [392, 523.25, 659.25, 783.99].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.25, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.65);
    });
  }
}

export const soundEngine = new SoundEngine();
