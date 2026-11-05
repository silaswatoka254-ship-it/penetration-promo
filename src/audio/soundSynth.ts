/**
 * Procedural Web Audio API Sound Synthesizer
 * Zero external audio files (100% generated with oscillators, noise, and biquad filters).
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled: boolean = false;
  private lastTickTime: number = 0;
  private tickToggle: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(enable: boolean) {
    this.enabled = enable;
    if (enable) {
      this.initCtx();
      this.playUiClick();
    }
  }

  public playUiClick() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.045);
    } catch {
      // AudioContext policy safe fallback
    }
  }

  public playHorologyTick(rateHz: number = 4) {
    if (!this.enabled) return;
    const now = performance.now();
    const intervalMs = 1000 / rateHz;
    if (now - this.lastTickTime < intervalMs * 0.85) return;
    this.lastTickTime = now;
    this.tickToggle = !this.tickToggle;

    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Pallet stone ping & metal teeth impact
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(this.tickToggle ? 4800 : 5400, t);
      filter.Q.setValueAtTime(12, t);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(this.tickToggle ? 3200 : 3600, t);

      gain.gain.setValueAtTime(0.045, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.022);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.025);
    } catch {
      // Ignore audio suspended policy
    }
  }

  public playRoverServo() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.linearRampToValueAtTime(180, t + 0.08);

      gain.gain.setValueAtTime(0.02, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.085);
    } catch {
      // Ignore
    }
  }

  public playZenChime() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Resonant harmonic singing bowl
      const freqs = [528, 1056, 1584];
      const gains = [0.06, 0.03, 0.015];

      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(gains[idx], t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 1.85);
      });
    } catch {
      // Ignore
    }
  }
}

export const soundSynth = new SoundSynthesizer();
