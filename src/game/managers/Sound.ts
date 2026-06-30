/**
 * Lightweight procedural sound using the Web Audio API — no asset files.
 * Generates short synthesized blips for jump, slide, coin, crash and a soft
 * ambient volcanic rumble loop. Safe to call before user gesture (it lazily
 * resumes the AudioContext on first interaction).
 */
export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private rumble: { osc: OscillatorNode; gain: GainNode } | null = null;
  public muted = false;

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  resume(): void {
    const ctx = this.ensure();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  private blip(freq: number, dur: number, type: OscillatorType, slideTo?: number, vol = 0.4): void {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.muted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  jump(): void { this.blip(320, 0.18, 'square', 620, 0.25); }
  slide(): void { this.blip(420, 0.16, 'sawtooth', 140, 0.2); }
  coin(): void { this.blip(880, 0.09, 'triangle', 1320, 0.28); }
  lane(): void { this.blip(520, 0.05, 'sine', 600, 0.12); }

  crash(): void {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.muted) return;
    // Noise burst
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    noise.start();
    this.blip(120, 0.4, 'sawtooth', 50, 0.3);
  }

  startRumble(): void {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.rumble) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 42;
    gain.gain.value = 0.0;
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 2);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    this.rumble = { osc, gain };
  }

  stopRumble(): void {
    if (!this.rumble || !this.ctx) return;
    this.rumble.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
    const r = this.rumble;
    setTimeout(() => { try { r.osc.stop(); } catch { /* already stopped */ } }, 600);
    this.rumble = null;
  }
}
