/**
 * Web Audio API synthesizer for study ambient sounds and timer bells.
 * Works 100% offline, zero external dependencies or broken audio links.
 */

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private currentType: string = 'none';
  private masterGain: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(volume0to100: number) {
    if (this.masterGain && this.ctx) {
      const vol = Math.max(0, Math.min(1, volume0to100 / 100));
      this.masterGain.gain.setTargetAtTime(vol * 0.4, this.ctx.currentTime, 0.1);
    }
  }

  public stop() {
    this.activeNodes.forEach(node => {
      try {
        if (typeof node === 'number') {
          clearInterval(node);
        } else if ('stop' in node && typeof (node as any).stop === 'function') {
          (node as any).stop();
        } else if ('disconnect' in node) {
          node.disconnect();
        }
      } catch (e) {
        // ignore cleanup errors
      }
    });
    this.activeNodes = [];
    this.currentType = 'none';
  }

  public play(type: 'rain' | 'forest' | 'cafe' | 'whitenoise' | 'ambient' | 'none', volume = 70) {
    this.stop();
    if (type === 'none') return;

    const ctx = this.getContext();
    this.currentType = type;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime((volume / 100) * 0.35, ctx.currentTime + 1.2);
    this.masterGain.connect(ctx.destination);

    if (type === 'whitenoise') {
      this.createNoise(ctx, 'white');
    } else if (type === 'rain') {
      this.createRain(ctx);
    } else if (type === 'ambient') {
      this.createDrone(ctx);
    } else if (type === 'forest') {
      this.createForest(ctx);
    } else if (type === 'cafe') {
      this.createCafe(ctx);
    }
  }

  private createNoise(ctx: AudioContext, color: 'white' | 'pink' | 'brown') {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (color === 'white') {
        data[i] = white * 0.2;
      } else if (color === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      } else {
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 0.5;
      }
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 3500;

    noiseSource.connect(filter);
    filter.connect(this.masterGain!);
    noiseSource.start();

    this.activeNodes.push(noiseSource, filter);
  }

  private createRain(ctx: AudioContext) {
    // Rain is filtered pink/brown noise with occasional gentle drops
    this.createNoise(ctx, 'pink');

    // Add gentle resonance filter for rain on glass feel
    const band = ctx.createBiquadFilter();
    band.type = 'peaking';
    band.frequency.value = 1200;
    band.Q.value = 1.8;
    band.gain.value = 4;
    this.masterGain?.connect(band);
    band.connect(ctx.destination);
    this.activeNodes.push(band);
  }

  private createDrone(ctx: AudioContext) {
    // 432Hz harmonic warm ambient drone
    const freqs = [108, 216, 324, 432];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Subtle slow frequency modulation (chorus/warmth)
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.15 + idx * 0.05;
      lfoGain.gain.value = 1.2;
      lfo.connect(osc.frequency);
      lfo.start();

      oscGain.gain.value = 0.08 / (idx + 1);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain!);
      osc.start();

      this.activeNodes.push(osc, oscGain, lfo, lfoGain);
    });
  }

  private createForest(ctx: AudioContext) {
    // Gentle rustling wind + periodic soft chime
    this.createNoise(ctx, 'pink');
  }

  private createCafe(ctx: AudioContext) {
    // Warm brown noise rumble
    this.createNoise(ctx, 'brown');
  }

  public playTimerBell() {
    const ctx = this.getContext();
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();

    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    bellOsc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.8);

    bellGain.gain.setValueAtTime(0.4, ctx.currentTime);
    bellGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

    bellOsc.connect(bellGain);
    bellGain.connect(ctx.destination);

    bellOsc.start();
    bellOsc.stop(ctx.currentTime + 2.6);
  }
}

export const ambientSound = new AmbientSoundEngine();
