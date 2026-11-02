import {
  playBassVoice,
  playHarmonyVoice,
  playLeadVoice,
  playPercussionVoice,
} from './instruments';
import { MusicTrackDefinition, noteToFreq } from './musicTracks';

const LOOKAHEAD_INTERVAL_MS = 50;
const SCHEDULE_AHEAD_TIME_SEC = 0.14;

/**
 * Counts how many consecutive steps a note is held via '~' ties starting at `stepIndex`.
 */
export function countTiedSteps(pattern: (string | null)[], stepIndex: number): number {
  const len = pattern.length;
  if (len === 0) return 1;
  let count = 1;
  for (let offset = 1; offset < len; offset++) {
    const nextCell = pattern[(stepIndex + offset) % len];
    if (nextCell === '~') {
      count++;
    } else {
      break;
    }
  }
  return count;
}

export class ChiptuneTrackSequencer {
  private ctx: AudioContext;
  private track: MusicTrackDefinition;
  private trackGain: GainNode;
  private currentStep: number;
  private nextNoteTime: number;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private cleanupTimerId: ReturnType<typeof setTimeout> | null = null;
  private running = false;

  constructor(
    ctx: AudioContext,
    masterDestination: AudioNode,
    track: MusicTrackDefinition,
    initialStep = 0
  ) {
    this.ctx = ctx;
    this.track = track;
    this.currentStep = initialStep % Math.max(1, track.lead.length);
    this.nextNoteTime = ctx.currentTime + 0.03;

    this.trackGain = ctx.createGain();
    this.trackGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.trackGain.connect(masterDestination);
  }

  public getStep(): number {
    return this.currentStep;
  }

  public isRunning(): boolean {
    return this.running;
  }

  public start(fadeInSec = 0.45): void {
    if (this.running) return;
    this.running = true;

    const now = this.ctx.currentTime;
    this.nextNoteTime = now + 0.025;

    try {
      this.trackGain.gain.cancelScheduledValues(now);
      this.trackGain.gain.setValueAtTime(0.0001, now);
      this.trackGain.gain.linearRampToValueAtTime(1.0, now + Math.max(0.05, fadeInSec));
    } catch {
      // Ignore gain ramp errors
    }

    this.scheduleAhead();
    this.timerId = setInterval(() => {
      this.scheduleAhead();
    }, LOOKAHEAD_INTERVAL_MS);
  }

  public fadeOutAndDispose(fadeOutSec = 0.4, onDisposed?: (lastStep: number) => void): void {
    const savedStep = this.currentStep;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.running = false;

    const now = this.ctx.currentTime;
    try {
      this.trackGain.gain.cancelScheduledValues(now);
      const currentVal = Math.max(0.0001, this.trackGain.gain.value || 1.0);
      this.trackGain.gain.setValueAtTime(currentVal, now);
      this.trackGain.gain.linearRampToValueAtTime(0.0001, now + Math.max(0.04, fadeOutSec));
    } catch {
      // Ignore gain ramp errors
    }

    this.cleanupTimerId = setTimeout(() => {
      this.disposeImmediate();
      if (onDisposed) onDisposed(savedStep);
    }, Math.ceil(fadeOutSec * 1000) + 60);
  }

  public disposeImmediate(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.cleanupTimerId !== null) {
      clearTimeout(this.cleanupTimerId);
      this.cleanupTimerId = null;
    }
    this.running = false;
    try {
      this.trackGain.disconnect();
    } catch {
      // Ignore disconnect errors
    }
  }

  private getStepDurationSec(): number {
    const beatsPerSec = this.track.bpm / 60;
    return 1 / (beatsPerSec * this.track.stepsPerBeat);
  }

  private scheduleAhead(): void {
    if (!this.running) return;
    if (this.ctx.state === 'suspended') {
      // Keep nextNoteTime aligned with currentTime while suspended so it doesn't burst when resumed
      this.nextNoteTime = this.ctx.currentTime + 0.03;
      return;
    }

    const stepDur = this.getStepDurationSec();
    const totalSteps = this.track.lead.length;

    // Guard against huge time jumps (e.g. background tab throttling)
    if (this.nextNoteTime < this.ctx.currentTime - 0.25) {
      this.nextNoteTime = this.ctx.currentTime + 0.02;
    }

    while (this.nextNoteTime < this.ctx.currentTime + SCHEDULE_AHEAD_TIME_SEC) {
      this.scheduleStep(this.currentStep, this.nextNoteTime, stepDur);
      this.nextNoteTime += stepDur;
      this.currentStep = (this.currentStep + 1) % totalSteps;
    }
  }

  private scheduleStep(stepIndex: number, startTime: number, stepDur: number): void {
    const {
      lead,
      harmony,
      bass,
      percussion,
      leadWaveform,
      harmonyWaveform,
      bassWaveform,
      leadVolume,
      harmonyVolume,
      bassVolume,
      percussionVolume,
      leadCutoff,
    } = this.track;

    // 1. Lead Channel
    const leadCell = lead[stepIndex];
    const leadFreq = noteToFreq(leadCell);
    if (leadFreq !== null) {
      const tied = countTiedSteps(lead, stepIndex);
      playLeadVoice(this.ctx, this.trackGain, {
        freq: leadFreq,
        startTime,
        duration: stepDur * tied * 0.94,
        waveform: leadWaveform,
        volume: leadVolume,
        cutoffFreq: leadCutoff,
      });
    }

    // 2. Harmony / Arpeggio Channel
    const harmonyCell = harmony[stepIndex];
    const harmonyFreq = noteToFreq(harmonyCell);
    if (harmonyFreq !== null) {
      const tied = countTiedSteps(harmony, stepIndex);
      playHarmonyVoice(this.ctx, this.trackGain, {
        freq: harmonyFreq,
        startTime,
        duration: stepDur * tied * 0.92,
        waveform: harmonyWaveform,
        volume: harmonyVolume,
      });
    }

    // 3. Bass Channel
    const bassCell = bass[stepIndex];
    const bassFreq = noteToFreq(bassCell);
    if (bassFreq !== null) {
      const tied = countTiedSteps(bass, stepIndex);
      playBassVoice(this.ctx, this.trackGain, {
        freq: bassFreq,
        startTime,
        duration: stepDur * tied * 0.9,
        waveform: bassWaveform,
        volume: bassVolume,
      });
    }

    // 4. Percussion Channel
    const percCell = percussion[stepIndex];
    if (percCell) {
      playPercussionVoice(
        this.ctx,
        this.trackGain,
        percCell,
        startTime,
        percussionVolume
      );
    }
  }
}
