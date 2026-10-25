// Lightweight Web Audio synthesizer for rich interactive music previews
class WebAudioSynth {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentTrackId: string | null = null;
  private intervalId: any = null;
  private step: number = 0;
  private masterGain: GainNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Predefined pleasant musical scales & chords for different tracks
  private getTrackChords(trackId: string) {
    if (trackId.includes('1') || trackId.toLowerCase().includes('sunrise')) {
      // Cinematic majestic C major / G / Am / F
      return [
        [261.63, 329.63, 392.0, 523.25], // C maj
        [196.0, 246.94, 293.66, 392.0],  // G maj
        [220.0, 261.63, 329.63, 440.0],  // A min
        [174.61, 220.0, 261.63, 349.23]  // F maj
      ];
    } else if (trackId.includes('2') || trackId.toLowerCase().includes('blitz')) {
      // Funk / Electronic groove
      return [
        [146.83, 220.0, 293.66, 369.99], // D maj9
        [164.81, 246.94, 329.63, 392.0],  // E min7
        [196.0, 261.63, 329.63, 392.0],   // G maj7
        [220.0, 277.18, 329.63, 440.0]   // A7
      ];
    } else if (trackId.includes('3') || trackId.toLowerCase().includes('kiss')) {
      // Chill Lofi / Hip hop
      return [
        [261.63, 311.13, 392.0, 466.16], // Eb maj7
        [220.0, 261.63, 329.63, 392.0],  // C min7
        [174.61, 220.0, 261.63, 329.63], // F min7
        [196.0, 246.94, 293.66, 369.99]  // Bb7
      ];
    } else {
      // Pop / groove
      return [
        [220.0, 277.18, 329.63, 440.0],
        [164.81, 220.0, 261.63, 329.63],
        [174.61, 220.0, 261.63, 349.23],
        [196.0, 246.94, 293.66, 392.0]
      ];
    }
  }

  playTrack(trackId: string, onTick?: (currentTime: number) => void, maxDurationSeconds?: number) {
    if (typeof window === 'undefined') return;
    this.stop();
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.isPlaying = true;
    this.currentTrackId = trackId;
    this.step = 0;
    try {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    } catch (e) {}
    const chords = this.getTrackChords(trackId);
    let secondsElapsed = 0;

    const playStep = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;

      if (maxDurationSeconds && secondsElapsed >= maxDurationSeconds) {
        this.stop();
        if (onTick) onTick(maxDurationSeconds);
        return;
      }

      const chordIdx = Math.floor(this.step / 4) % chords.length;
      const chord = chords[chordIdx];
      const now = this.ctx.currentTime;

      // Play soft bass tone
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(chord[0] / 2, now);
      bassGain.gain.setValueAtTime(0.3, now);
      bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      bassOsc.connect(bassGain);
      bassGain.connect(this.masterGain);
      bassOsc.start(now);
      bassOsc.stop(now + 0.45);

      // Play melody / pad tone
      const note = chord[this.step % chord.length];
      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();
      leadOsc.type = 'sine';
      leadOsc.frequency.setValueAtTime(note, now);
      leadGain.gain.setValueAtTime(0.18, now);
      leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      leadOsc.connect(leadGain);
      leadGain.connect(this.masterGain);
      leadOsc.start(now);
      leadOsc.stop(now + 0.55);

      this.step++;
      secondsElapsed += 0.25;
      if (onTick) onTick(secondsElapsed);
    };

    playStep();
    this.intervalId = setInterval(playStep, 250);
  }

  setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume * 0.3)), this.ctx.currentTime);
    }
  }

  stop() {
    this.isPlaying = false;
    this.currentTrackId = null;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      } catch (e) {}
    }
  }

  getIsPlaying() {
    return this.isPlaying;
  }

  getCurrentTrackId() {
    return this.currentTrackId;
  }
}

export const audioSynth = new WebAudioSynth();
