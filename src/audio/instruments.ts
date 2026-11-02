/**
 * Web Audio API Chiptune Instrument Voices & Shared AudioContext Manager
 * Pure procedural synthesis — zero external audio files or libraries.
 */

let sharedAudioContext: AudioContext | null = null;
let sharedNoiseBuffer: AudioBuffer | null = null;
let userInteractionUnlocked = false;

export type ChiptuneWaveform = OscillatorType;
export type PercussionType = 'kick' | 'snare' | 'hat' | 'tom';

/**
 * Returns the singleton AudioContext if supported by the browser.
 * Does not force creation if createIfMissing is false.
 */
export function getSharedAudioContext(createIfMissing = true): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioContext && createIfMissing) {
      sharedAudioContext = new AudioCtx();
    }
    return sharedAudioContext;
  } catch {
    return null;
  }
}

/**
 * Unlocks and resumes the shared AudioContext upon explicit user interaction.
 */
export function unlockSharedAudioContext(): AudioContext | null {
  userInteractionUnlocked = true;
  const ctx = getSharedAudioContext(true);
  if (!ctx) return null;
  try {
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }
  } catch {
    // Ignore resume errors in restricted environments
  }
  return ctx;
}

export function isAudioInteractionUnlocked(): boolean {
  return userInteractionUnlocked;
}

/**
 * Lazily creates and caches a 1-second white/pink-ish noise buffer for retro percussion.
 */
function getNoiseBuffer(ctx: AudioContext): AudioBuffer | null {
  if (sharedNoiseBuffer && sharedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return sharedNoiseBuffer;
  }
  try {
    const bufferSize = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Slight 8-bit stepped texture blend
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.95 * b2 + white * 0.048;
      output[i] = Math.max(-1, Math.min(1, white * 0.65 + (b0 + b1 + b2) * 0.35));
    }
    sharedNoiseBuffer = buffer;
    return buffer;
  } catch {
    return null;
  }
}

export interface LeadVoiceOptions {
  freq: number;
  startTime: number;
  duration: number;
  waveform?: ChiptuneWaveform;
  volume?: number;
  vibratoDepth?: number;
  vibratoRate?: number;
  cutoffFreq?: number;
}

/**
 * Plays a melodic chiptune lead note with gentle low-pass warmth,
 * click-free ADSR envelope, and optional vibrato on longer notes.
 */
export function playLeadVoice(
  ctx: AudioContext,
  destination: AudioNode,
  opts: LeadVoiceOptions
): void {
  const {
    freq,
    startTime,
    duration,
    waveform = 'square',
    volume = 0.14,
    vibratoDepth = 3.2,
    vibratoRate = 5.5,
    cutoffFreq = 3200,
  } = opts;

  if (freq <= 0 || duration <= 0) return;

  try {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();

    osc.type = waveform;
    osc.frequency.setValueAtTime(freq, startTime);

    // Warm low-pass filter so square/sawtooth waves are pleasant for long study sessions
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoffFreq, startTime);
    filter.Q.setValueAtTime(0.7, startTime);

    const attack = Math.min(0.014, duration * 0.2);
    const decay = Math.min(0.08, duration * 0.35);
    const sustainLevel = Math.max(0.001, volume * 0.72);
    const release = Math.min(0.05, duration * 0.25);
    const stopTime = startTime + duration + 0.01;

    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(volume, startTime + attack);
    env.gain.linearRampToValueAtTime(sustainLevel, startTime + attack + decay);
    env.gain.setValueAtTime(sustainLevel, Math.max(startTime + attack + decay, startTime + duration - release));
    env.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    // Optional vibrato on sustained notes (> 0.22s)
    let lfo: OscillatorNode | null = null;
    let lfoGain: GainNode | null = null;
    if (duration >= 0.22 && vibratoDepth > 0) {
      lfo = ctx.createOscillator();
      lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(vibratoRate, startTime);
      lfoGain.gain.setValueAtTime(0.001, startTime);
      lfoGain.gain.linearRampToValueAtTime(vibratoDepth, startTime + Math.min(0.15, duration * 0.5));
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(startTime);
      lfo.stop(stopTime);
    }

    osc.connect(filter);
    filter.connect(env);
    env.connect(destination);

    osc.start(startTime);
    osc.stop(stopTime);
  } catch {
    // Ignore transient scheduling errors
  }
}

export interface HarmonyVoiceOptions {
  freq: number;
  startTime: number;
  duration: number;
  waveform?: ChiptuneWaveform;
  volume?: number;
}

/**
 * Plays a soft harmony / arpeggio / pad voice.
 */
export function playHarmonyVoice(
  ctx: AudioContext,
  destination: AudioNode,
  opts: HarmonyVoiceOptions
): void {
  const {
    freq,
    startTime,
    duration,
    waveform = 'triangle',
    volume = 0.09,
  } = opts;

  if (freq <= 0 || duration <= 0) return;

  try {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();

    osc.type = waveform;
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, startTime);

    const attack = Math.min(0.018, duration * 0.25);
    const stopTime = startTime + duration + 0.015;

    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(volume, startTime + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    osc.connect(filter);
    filter.connect(env);
    env.connect(destination);

    osc.start(startTime);
    osc.stop(stopTime);
  } catch {
    // Ignore scheduling errors
  }
}

export interface BassVoiceOptions {
  freq: number;
  startTime: number;
  duration: number;
  waveform?: ChiptuneWaveform;
  volume?: number;
}

/**
 * Plays a punchy, warm RPG chiptune bass note.
 */
export function playBassVoice(
  ctx: AudioContext,
  destination: AudioNode,
  opts: BassVoiceOptions
): void {
  const {
    freq,
    startTime,
    duration,
    waveform = 'triangle',
    volume = 0.16,
  } = opts;

  if (freq <= 0 || duration <= 0) return;

  try {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();

    osc.type = waveform;
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, startTime);

    const attack = 0.008;
    const sustain = Math.max(0.001, volume * 0.68);
    const stopTime = startTime + duration + 0.01;

    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(volume, startTime + attack);
    env.gain.linearRampToValueAtTime(sustain, startTime + Math.min(0.07, duration * 0.5));
    env.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    osc.connect(filter);
    filter.connect(env);
    env.connect(destination);

    osc.start(startTime);
    osc.stop(stopTime);
  } catch {
    // Ignore scheduling errors
  }
}

/**
 * Plays subtle retro 8-bit/16-bit percussion (kick, snare, hi-hat, tom).
 */
export function playPercussionVoice(
  ctx: AudioContext,
  destination: AudioNode,
  type: PercussionType,
  startTime: number,
  volume = 0.08
): void {
  if (volume <= 0) return;

  try {
    if (type === 'kick' || type === 'tom') {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'triangle';

      const startFreq = type === 'kick' ? 135 : 190;
      const endFreq = type === 'kick' ? 38 : 72;
      const dur = type === 'kick' ? 0.11 : 0.13;

      osc.frequency.setValueAtTime(startFreq, startTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + dur);

      env.gain.setValueAtTime(volume * 1.15, startTime);
      env.gain.exponentialRampToValueAtTime(0.0001, startTime + dur + 0.01);

      osc.connect(env);
      env.connect(destination);
      osc.start(startTime);
      osc.stop(startTime + dur + 0.015);
      return;
    }

    const noiseBuffer = getNoiseBuffer(ctx);
    if (!noiseBuffer) return;

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();

    if (type === 'snare') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1650, startTime);
      filter.Q.setValueAtTime(0.9, startTime);

      const dur = 0.11;
      env.gain.setValueAtTime(volume * 0.85, startTime);
      env.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

      source.connect(filter);
      filter.connect(env);
      env.connect(destination);
      source.start(startTime, 0, dur + 0.01);
      source.stop(startTime + dur + 0.01);

      // Add a tiny body tone to the retro snare
      const snapOsc = ctx.createOscillator();
      const snapEnv = ctx.createGain();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(185, startTime);
      snapOsc.frequency.exponentialRampToValueAtTime(85, startTime + 0.06);
      snapEnv.gain.setValueAtTime(volume * 0.55, startTime);
      snapEnv.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.065);
      snapOsc.connect(snapEnv);
      snapEnv.connect(destination);
      snapOsc.start(startTime);
      snapOsc.stop(startTime + 0.07);
    } else if (type === 'hat') {
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(5800, startTime);

      const dur = 0.045;
      env.gain.setValueAtTime(volume * 0.45, startTime);
      env.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

      source.connect(filter);
      filter.connect(env);
      env.connect(destination);
      source.start(startTime, 0, dur + 0.01);
      source.stop(startTime + dur + 0.01);
    }
  } catch {
    // Ignore percussion scheduling errors
  }
}
