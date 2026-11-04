import {
  getSharedAudioContext,
  isAudioInteractionUnlocked,
  unlockSharedAudioContext,
} from './instruments';
import { ChiptuneTrackSequencer } from './musicSequencer';
import {
  MUSIC_TRACKS,
  MusicThemeId,
  MusicTrackDefinition,
} from './musicTracks';

export const DEFAULT_MUSIC_VOLUME = 0.35;
export const DEFAULT_SFX_VOLUME = 0.75;
const CROSSFADE_DURATION_SEC = 0.45;

export function clampVolume(value: number, fallback = DEFAULT_MUSIC_VOLUME): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

export interface MusicManagerSnapshot {
  currentThemeId: MusicThemeId;
  currentTrack: MusicTrackDefinition;
  musicEnabled: boolean;
  musicVolume: number;
  isPlaying: boolean;
  hasUserInteracted: boolean;
}

type Listener = (snapshot: MusicManagerSnapshot) => void;

class BackgroundMusicManager {
  private currentThemeId: MusicThemeId = 'title';
  private musicEnabled = false;
  private musicVolume = DEFAULT_MUSIC_VOLUME;
  private masterGain: GainNode | null = null;
  private activeSequencer: ChiptuneTrackSequencer | null = null;
  private activeSequencerTheme: MusicThemeId | null = null;
  private fadingOutSequencers: Set<ChiptuneTrackSequencer> = new Set();
  private savedStepByTheme: Partial<Record<MusicThemeId, number>> = {};
  private listeners: Set<Listener> = new Set();
  private interactionListenersAttached = false;

  constructor() {
    this.attachGlobalInteractionListeners();
  }

  private attachGlobalInteractionListeners(): void {
    if (typeof window === 'undefined' || this.interactionListenersAttached) return;
    this.interactionListenersAttached = true;

    const onFirstGesture = () => {
      this.notifyUserInteraction();
    };

    window.addEventListener('pointerdown', onFirstGesture, { passive: true });
    window.addEventListener('keydown', onFirstGesture, { passive: true });
  }

  public notifyUserInteraction(): void {
    const wasUnlocked = isAudioInteractionUnlocked();
    const ctx = unlockSharedAudioContext();
    if (!ctx) return;

    if (this.musicEnabled && !this.activeSequencer) {
      this.startOrCrossfadeTo(this.currentThemeId);
    } else if (!wasUnlocked) {
      this.emitChange();
    }
  }

  public syncState(opts: {
    themeId: MusicThemeId;
    musicEnabled: boolean;
    musicVolume: number;
  }): void {
    const nextVolume = clampVolume(opts.musicVolume, DEFAULT_MUSIC_VOLUME);
    const volumeChanged = Math.abs(this.musicVolume - nextVolume) > 0.001;
    const enabledChanged = this.musicEnabled !== opts.musicEnabled;
    const themeChanged = this.currentThemeId !== opts.themeId;

    this.musicVolume = nextVolume;
    this.musicEnabled = opts.musicEnabled;
    this.currentThemeId = opts.themeId;

    if (volumeChanged || enabledChanged) {
      this.applyMasterVolume();
    }

    if (!this.musicEnabled) {
      this.stopActiveSequencer(0.25);
      if (enabledChanged || volumeChanged || themeChanged) {
        this.emitChange();
      }
      return;
    }

    // Only start/crossfade if the user has already interacted with the page
    if (isAudioInteractionUnlocked()) {
      if (!this.activeSequencer || this.activeSequencerTheme !== this.currentThemeId) {
        this.startOrCrossfadeTo(this.currentThemeId);
      } else if (enabledChanged || volumeChanged || themeChanged) {
        this.emitChange();
      }
    } else if (enabledChanged || volumeChanged || themeChanged) {
      this.emitChange();
    }
  }

  public setTheme(themeId: MusicThemeId): void {
    if (this.currentThemeId === themeId && this.activeSequencerTheme === themeId) {
      return;
    }
    this.currentThemeId = themeId;
    if (this.musicEnabled && isAudioInteractionUnlocked()) {
      this.startOrCrossfadeTo(themeId);
    } else {
      this.emitChange();
    }
  }

  public setMusicEnabled(enabled: boolean): void {
    if (this.musicEnabled === enabled) return;
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopActiveSequencer(0.25);
    } else {
      // Clicking the music toggle itself is a user interaction
      unlockSharedAudioContext();
      this.startOrCrossfadeTo(this.currentThemeId);
    }
    this.emitChange();
  }

  public setMusicVolume(volume: number): void {
    this.musicVolume = clampVolume(volume, DEFAULT_MUSIC_VOLUME);
    this.applyMasterVolume();
    this.emitChange();
  }

  private ensureMasterGain(ctx: AudioContext): GainNode {
    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      const targetGain = this.musicEnabled ? this.musicVolume : 0.0001;
      this.masterGain.gain.setValueAtTime(targetGain, ctx.currentTime);
      this.masterGain.connect(ctx.destination);
    }
    return this.masterGain;
  }

  private applyMasterVolume(): void {
    const ctx = getSharedAudioContext(false);
    if (!ctx || !this.masterGain) return;
    try {
      const now = ctx.currentTime;
      const targetGain = this.musicEnabled ? Math.max(0.0001, this.musicVolume) : 0.0001;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value || targetGain, now);
      this.masterGain.gain.linearRampToValueAtTime(targetGain, now + 0.06);
    } catch {
      // Ignore gain errors
    }
  }

  private startOrCrossfadeTo(themeId: MusicThemeId): void {
    // Do not restart if the exact same theme is already playing
    if (
      this.activeSequencer &&
      this.activeSequencer.isRunning() &&
      this.activeSequencerTheme === themeId
    ) {
      return;
    }

    const ctx = getSharedAudioContext(true);
    if (!ctx) return;

    const master = this.ensureMasterGain(ctx);
    this.applyMasterVolume();

    // Fade out any previous active sequencer and save its step position
    if (this.activeSequencer && this.activeSequencerTheme) {
      const prevSeq = this.activeSequencer;
      const prevTheme = this.activeSequencerTheme;
      this.savedStepByTheme[prevTheme] = prevSeq.getStep();
      this.fadingOutSequencers.add(prevSeq);
      prevSeq.fadeOutAndDispose(CROSSFADE_DURATION_SEC, (lastStep) => {
        this.savedStepByTheme[prevTheme] = lastStep;
        this.fadingOutSequencers.delete(prevSeq);
      });
      this.activeSequencer = null;
      this.activeSequencerTheme = null;
    }

    const track = MUSIC_TRACKS[themeId] || MUSIC_TRACKS.dungeon_explore;
    // Boss battles start fresh at step 0 for dramatic impact; exploration themes resume smoothly
    const resumeStep =
      themeId === 'boss_battle' ? 0 : (this.savedStepByTheme[themeId] ?? 0);

    const nextSeq = new ChiptuneTrackSequencer(ctx, master, track, resumeStep);
    this.activeSequencer = nextSeq;
    this.activeSequencerTheme = themeId;
    nextSeq.start(CROSSFADE_DURATION_SEC);

    this.emitChange();
  }

  private stopActiveSequencer(fadeOutSec = 0.25): void {
    if (!this.activeSequencer) return;
    const prevSeq = this.activeSequencer;
    const prevTheme = this.activeSequencerTheme;
    if (prevTheme) {
      this.savedStepByTheme[prevTheme] = prevSeq.getStep();
    }
    this.activeSequencer = null;
    this.activeSequencerTheme = null;
    this.fadingOutSequencers.add(prevSeq);
    prevSeq.fadeOutAndDispose(fadeOutSec, (lastStep) => {
      if (prevTheme) {
        this.savedStepByTheme[prevTheme] = lastStep;
      }
      this.fadingOutSequencers.delete(prevSeq);
    });
  }

  public getSnapshot(): MusicManagerSnapshot {
    const track = MUSIC_TRACKS[this.currentThemeId] || MUSIC_TRACKS.title;
    return {
      currentThemeId: this.currentThemeId,
      currentTrack: track,
      musicEnabled: this.musicEnabled,
      musicVolume: this.musicVolume,
      isPlaying: Boolean(
        this.musicEnabled &&
          this.activeSequencer &&
          this.activeSequencer.isRunning() &&
          isAudioInteractionUnlocked()
      ),
      hasUserInteracted: isAudioInteractionUnlocked(),
    };
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emitChange(): void {
    const snap = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snap);
    }
  }
}

export const musicManager = new BackgroundMusicManager();
