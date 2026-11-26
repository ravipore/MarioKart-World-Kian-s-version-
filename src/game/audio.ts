import { getMapSongSpec, midiToFreq, MusicTrackId } from './music';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private muted = false;
  private starInterval: number | null = null;
  private starStep = 0;
  private starActive = false;

  private currentMusicId: MusicTrackId | null = null;
  private musicInterval: number | null = null;
  private musicStep = 0;
  private musicFinalLap = false;
  private musicPaused = false;

  public unlock(): void {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.35;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.68;
      this.musicGain.connect(this.masterGain);

      // Pre-allocate short white-noise buffer for procedural drums
      const sampleRate = this.ctx.sampleRate;
      const length = Math.floor(sampleRate * 0.25);
      const buffer = this.ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;

      // Subtle continuous engine hum
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 65;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 260;

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);
      this.engineOsc.start();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    if (this.currentMusicId && this.musicInterval === null) {
      this.scheduleMusicLoop();
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.35, this.ctx.currentTime, 0.03);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public updateEngine(active: boolean, speedRatio: number, isBoost: boolean, isBullet: boolean): void {
    if (!this.ctx || !this.engineOsc || !this.engineGain) return;
    const now = this.ctx.currentTime;
    if (!active || this.muted) {
      this.engineGain.gain.setTargetAtTime(0, now, 0.08);
      return;
    }
    const targetFreq = isBullet
      ? 195 + speedRatio * 55
      : isBoost
        ? 145 + speedRatio * 80
        : 58 + speedRatio * 95;
    const targetGain = isBullet ? 0.14 : 0.06 + speedRatio * 0.04;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.06);
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
  }

  private playTone(
    freq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0,
    targetBus?: AudioNode | null,
  ): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(targetBus ?? this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playNoiseDrum(duration: number, filterFreq: number, filterType: BiquadFilterType, volume: number): void {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, now);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    src.start(now);
    src.stop(now + duration + 0.01);
  }

  private scheduleMusicLoop(): void {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (!this.currentMusicId) return;
    const song = getMapSongSpec(this.currentMusicId);
    const effectiveBpm = song.bpm * (this.musicFinalLap ? 1.11 : 1.0);
    const stepMs = Math.max(85, Math.round(((60 / effectiveBpm) / 2) * 1000));
    this.stepMusic();
    this.musicInterval = window.setInterval(() => this.stepMusic(), stepMs);
  }

  private stepMusic(): void {
    if (
      !this.ctx ||
      !this.musicGain ||
      this.muted ||
      this.musicPaused ||
      this.starActive ||
      !this.currentMusicId ||
      this.ctx.state !== 'running'
    ) {
      return;
    }

    const song = getMapSongSpec(this.currentMusicId);
    const idx = this.musicStep % 32;
    const stepSec = (60 / (song.bpm * (this.musicFinalLap ? 1.11 : 1.0))) / 2;
    const pitchMult = this.musicFinalLap ? 1.059463 : 1.0; // +1 semitone final lap hype

    // 1. Lead melody
    const leadMidi = song.melody[idx] ?? 0;
    if (leadMidi > 0) {
      const freq = midiToFreq(leadMidi) * pitchMult;
      const dur = stepSec * 0.92;
      this.playTone(freq, freq, dur, song.leadWave, song.leadVol, 0, this.musicGain);
    }

    // 2. Bassline
    const bassMidi = song.bass[idx] ?? 0;
    if (bassMidi > 0) {
      const bFreq = midiToFreq(bassMidi) * pitchMult;
      this.playTone(bFreq, bFreq * 0.995, stepSec * 0.88, song.bassWave, song.bassVol, 0, this.musicGain);
    }

    // 3. Chord arpeggio
    const chordIdx = Math.floor(idx / 4) % song.chords.length;
    const chord = song.chords[chordIdx];
    if (chord && chord.length > 0) {
      const arpNote = chord[idx % chord.length];
      const aFreq = midiToFreq(arpNote) * pitchMult;
      this.playTone(aFreq, aFreq, stepSec * 0.65, song.arpWave, song.arpVol, 0, this.musicGain);
      if (idx % 2 === 1 && chord.length > 1) {
        const echoNote = chord[(idx + 1) % chord.length];
        this.playTone(
          midiToFreq(echoNote) * pitchMult,
          midiToFreq(echoNote) * pitchMult,
          stepSec * 0.45,
          song.arpWave,
          song.arpVol * 0.72,
          stepSec * 0.5,
          this.musicGain,
        );
      }
    }

    // 4. Percussion pattern by song drumStyle
    const stepInBar = idx % 8;
    const dv = song.drumVol;
    if (song.drumStyle === 'trance') {
      if (stepInBar % 2 === 0) this.playTone(135, 42, 0.11, 'sine', dv * 1.15, 0, this.musicGain);
      if (stepInBar === 2 || stepInBar === 6) this.playNoiseDrum(0.09, 1800, 'bandpass', dv * 0.85);
      if (stepInBar % 2 === 1) this.playNoiseDrum(0.04, 6500, 'highpass', dv * 0.55);
    } else if (song.drumStyle === 'latin') {
      if (stepInBar === 0 || stepInBar === 3 || stepInBar === 6) {
        this.playTone(145, 52, 0.1, 'sine', dv * 1.05, 0, this.musicGain);
      }
      if (stepInBar === 2 || stepInBar === 4 || stepInBar === 7) {
        this.playNoiseDrum(0.06, 2200, 'bandpass', dv * 0.7);
      }
      this.playNoiseDrum(0.03, 5500, 'highpass', dv * 0.35);
    } else if (song.drumStyle === 'funk') {
      if (stepInBar === 0 || stepInBar === 3 || stepInBar === 5) {
        this.playTone(130, 44, 0.11, 'sine', dv * 1.1, 0, this.musicGain);
      }
      if (stepInBar === 2 || stepInBar === 6) {
        this.playNoiseDrum(0.1, 2000, 'bandpass', dv * 0.95);
      }
      this.playNoiseDrum(0.035, 6200, 'highpass', dv * 0.45);
    } else if (song.drumStyle === 'jazz') {
      if (stepInBar === 0 || stepInBar === 4) {
        this.playTone(115, 48, 0.1, 'sine', dv * 0.9, 0, this.musicGain);
      }
      if (stepInBar === 2 || stepInBar === 5 || stepInBar === 6) {
        this.playNoiseDrum(0.045, 7000, 'highpass', dv * 0.55);
      }
    } else if (song.drumStyle === 'march') {
      if (stepInBar === 0 || stepInBar === 4) {
        this.playTone(125, 45, 0.12, 'sine', dv * 1.15, 0, this.musicGain);
      }
      if (stepInBar === 2 || stepInBar === 6 || stepInBar === 7) {
        this.playNoiseDrum(0.09, 1700, 'bandpass', dv * 0.9);
      }
    } else if (song.drumStyle === 'shanty') {
      if (stepInBar === 0 || stepInBar === 4) {
        this.playTone(120, 46, 0.11, 'sine', dv * 1.05, 0, this.musicGain);
      }
      if (stepInBar === 2 || stepInBar === 6) {
        this.playNoiseDrum(0.075, 1900, 'bandpass', dv * 0.8);
      }
      if (stepInBar % 2 === 1) this.playNoiseDrum(0.03, 5200, 'highpass', dv * 0.35);
    } else {
      // 'rock' / 'pop'
      if (stepInBar === 0 || stepInBar === 4 || (song.drumStyle === 'rock' && stepInBar === 5)) {
        this.playTone(135, 42, 0.11, 'sine', dv * 1.15, 0, this.musicGain);
      }
      if (stepInBar === 2 || stepInBar === 6) {
        this.playNoiseDrum(0.1, 1850, 'bandpass', dv * 0.9);
      }
      this.playNoiseDrum(0.032, 6000, 'highpass', dv * 0.42);
    }

    this.musicStep++;
  }

  public startMusic(trackId: MusicTrackId, options?: { finalLap?: boolean; reset?: boolean }): void {
    const nextFinalLap = options?.finalLap ?? false;
    const sameTrack = this.currentMusicId === trackId;
    this.currentMusicId = trackId;
    this.musicPaused = false;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.starActive ? 0 : 0.68, this.ctx.currentTime, 0.05);
    }
    if (sameTrack && this.musicInterval !== null && !options?.reset) {
      if (this.musicFinalLap !== nextFinalLap) {
        this.setMusicFinalLap(nextFinalLap);
      }
      return;
    }
    this.musicFinalLap = nextFinalLap;
    if (!sameTrack || options?.reset) {
      this.musicStep = 0;
    }
    if (this.ctx) {
      this.scheduleMusicLoop();
    }
  }

  public setMusicFinalLap(finalLap: boolean): void {
    if (this.musicFinalLap === finalLap) return;
    this.musicFinalLap = finalLap;
    if (this.musicInterval !== null && this.currentMusicId && this.ctx) {
      this.scheduleMusicLoop();
    }
  }

  public setMusicPaused(paused: boolean): void {
    this.musicPaused = paused;
    if (this.musicGain && this.ctx) {
      const target = paused || this.starActive ? 0 : 0.68;
      this.musicGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.04);
    }
  }

  public stopMusic(): void {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentMusicId = null;
    this.musicFinalLap = false;
    this.musicPaused = false;
    this.musicStep = 0;
  }

  public getCurrentMusicId(): MusicTrackId | null {
    return this.currentMusicId;
  }

  public playCountdown(isGo: boolean): void {
    if (isGo) {
      this.playTone(587.33, 880, 0.38, 'triangle', 0.45);
      this.playTone(880, 1174.66, 0.42, 'sine', 0.35, 0.05);
    } else {
      this.playTone(440, 440, 0.18, 'triangle', 0.32);
    }
  }

  public playRouletteTick(): void {
    this.playTone(680, 780, 0.045, 'square', 0.12);
  }

  public playItemAcquire(): void {
    this.playTone(523.25, 523.25, 0.08, 'triangle', 0.28, 0);
    this.playTone(659.25, 659.25, 0.08, 'triangle', 0.28, 0.07);
    this.playTone(1046.5, 1046.5, 0.18, 'triangle', 0.34, 0.14);
  }

  public playNitroBoost(): void {
    this.playTone(220, 740, 0.35, 'sawtooth', 0.25);
    this.playTone(440, 980, 0.32, 'triangle', 0.24, 0.03);
  }

  public playBulletBill(): void {
    this.playTone(110, 420, 0.45, 'sawtooth', 0.34);
    this.playTone(160, 620, 0.5, 'square', 0.2, 0.04);
  }

  public playSpinyLaunch(): void {
    this.playTone(300, 920, 0.28, 'sawtooth', 0.25);
    this.playTone(500, 260, 0.25, 'triangle', 0.22, 0.12);
  }

  public playSpinyWarning(): void {
    this.playTone(880, 660, 0.14, 'square', 0.18);
  }

  public playSpinyExplosion(): void {
    this.playTone(160, 38, 0.55, 'sawtooth', 0.48);
    this.playTone(240, 52, 0.45, 'square', 0.3, 0.02);
  }

  public startStarMusic(): void {
    this.stopStarMusic();
    this.starActive = true;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
    }
    const notes = [523.25, 587.33, 659.25, 783.99, 880, 783.99, 659.25, 587.33];
    this.starStep = 0;
    const playNext = () => {
      if (this.muted) return;
      const n = notes[this.starStep % notes.length];
      this.playTone(n, n * 1.02, 0.11, 'square', 0.14);
      this.starStep++;
    };
    playNext();
    this.starInterval = window.setInterval(playNext, 125);
  }

  public stopStarMusic(): void {
    this.starActive = false;
    if (this.musicGain && this.ctx && !this.musicPaused) {
      this.musicGain.gain.setTargetAtTime(0.68, this.ctx.currentTime, 0.06);
    }
    if (this.starInterval !== null) {
      clearInterval(this.starInterval);
      this.starInterval = null;
    }
  }

  public playStarKnockdown(): void {
    this.playTone(280, 95, 0.26, 'sawtooth', 0.36);
    this.playTone(640, 1280, 0.18, 'triangle', 0.26);
  }

  public playGreenShellLaunch(): void {
    this.playTone(420, 740, 0.14, 'triangle', 0.26);
  }

  public playBananaDrop(): void {
    this.playTone(520, 320, 0.1, 'sine', 0.22);
  }

  public playBananaSlip(): void {
    this.playTone(720, 210, 0.35, 'sine', 0.3);
    this.playTone(480, 140, 0.28, 'triangle', 0.2, 0.08);
  }

  public playLightningStrike(): void {
    this.playTone(1240, 180, 0.38, 'sawtooth', 0.38);
    this.playTone(880, 95, 0.48, 'square', 0.28, 0.04);
  }

  public playRedShellLaunch(): void {
    this.playTone(520, 880, 0.16, 'triangle', 0.28);
    this.playTone(760, 1080, 0.12, 'sine', 0.2, 0.05);
  }

  public playBobOmbThrow(): void {
    this.playTone(340, 560, 0.14, 'sine', 0.24);
  }

  public playBobOmbExplosion(): void {
    this.playTone(150, 34, 0.58, 'sawtooth', 0.5);
    this.playTone(230, 48, 0.46, 'square', 0.34, 0.02);
  }

  public playMegaMushroom(): void {
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
    notes.forEach((f, idx) => {
      this.playTone(f, f * 1.03, 0.12, 'triangle', 0.28, idx * 0.055);
    });
  }

  public playSuperHorn(): void {
    this.playTone(220, 440, 0.32, 'sawtooth', 0.36);
    this.playTone(330, 660, 0.34, 'square', 0.28, 0.02);
    this.playTone(554.37, 880, 0.26, 'triangle', 0.24, 0.04);
  }

  public playBoomerangThrow(): void {
    this.playTone(620, 980, 0.14, 'triangle', 0.24);
    this.playTone(980, 540, 0.16, 'sine', 0.2, 0.08);
  }

  public playBump(): void {
    this.playTone(140, 70, 0.1, 'triangle', 0.18);
  }

  public playDriftRelease(): void {
    this.playTone(360, 720, 0.2, 'triangle', 0.22);
  }

  public playLapComplete(isFinal: boolean): void {
    const base = isFinal ? 659.25 : 523.25;
    this.playTone(base, base, 0.1, 'triangle', 0.32, 0);
    this.playTone(base * 1.25, base * 1.25, 0.1, 'triangle', 0.32, 0.09);
    this.playTone(base * 1.5, base * 1.5, 0.22, 'triangle', 0.36, 0.18);
  }

  public playFinishFanfare(won: boolean): void {
    this.stopStarMusic();
    this.stopMusic();
    if (won) {
      const fanfare = [523.25, 659.25, 783.99, 1046.5];
      fanfare.forEach((f, i) => {
        this.playTone(f, f, i === 3 ? 0.45 : 0.14, 'triangle', 0.36, i * 0.13);
      });
    } else {
      const sad = [392.0, 349.23, 311.13, 261.63];
      sad.forEach((f, i) => {
        this.playTone(f, f * 0.98, 0.22, 'sawtooth', 0.2, i * 0.16);
      });
    }
  }

  public playBalloonPop(): void {
    this.playTone(540, 120, 0.16, 'triangle', 0.36);
    this.playTone(260, 75, 0.2, 'sawtooth', 0.24, 0.02);
  }

  public playElimination(): void {
    this.playTone(320, 90, 0.42, 'sawtooth', 0.34);
    this.playTone(210, 65, 0.45, 'square', 0.22, 0.08);
  }

  public dispose(): void {
    this.stopStarMusic();
    this.stopMusic();
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
      } catch {
        // ignore if already stopped
      }
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
