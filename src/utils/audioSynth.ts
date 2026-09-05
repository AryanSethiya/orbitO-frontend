/**
 * OrbitO Web Audio Synthesizer
 * Zero-dependency procedural cybernetic sound effects engine for tactile HUD feedback.
 * Respects pilot preference stored in 'orbito_sfx'.
 */

class AudioSynth {
  private ctx: AudioContext | null = null;

  private isSfxEnabled(): boolean {
    try {
      return localStorage.getItem('orbito_sfx') !== 'false';
    } catch {
      return true;
    }
  }

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Vector probe transmission synth pulse (when Enter/Transmit is clicked)
   */
  playTransmitBeep() {
    if (!this.isSfxEnabled()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(820, now);
      osc.frequency.exponentialRampToValueAtTime(1240, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Audio playback fails gracefully if blocked
    }
  }

  /**
   * Proximity lock feedback based on semantic proximity tier
   */
  playProximityLock(tier: 'CENTER' | 'HOT' | 'WARM' | 'COOL' | 'COLD') {
    if (!this.isSfxEnabled()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (tier === 'CENTER') {
        // Triumphant orbital lock arpeggio: C5 -> E5 -> G5 -> C6
        const freqs = [523.25, 659.25, 783.99, 1046.50];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteTime = now + idx * 0.08;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0.12, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(noteTime);
          osc.stop(noteTime + 0.35);
        });
      } else if (tier === 'HOT') {
        // High-frequency dual resonant ping
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(920, now);
        osc1.frequency.exponentialRampToValueAtTime(1400, now + 0.14);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1150, now);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.17);
        osc2.stop(now + 0.17);
      } else if (tier === 'WARM') {
        // Mid-band warm pulse
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(460, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.12);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.14);
      } else {
        // Cool or Cold: Deep sonar blip
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(190, now + 0.1);

        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch {
      // Audio playback fails gracefully
    }
  }

  /**
   * Hint Decryptor acoustic chime
   */
  playHintChime() {
    if (!this.isSfxEnabled()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [640, 960, 1280].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.22);
      });
    } catch {}
  }
}

export const audioSynth = new AudioSynth();
