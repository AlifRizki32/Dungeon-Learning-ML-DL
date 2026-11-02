import type { ChiptuneWaveform, PercussionType } from './instruments';

export type MusicThemeId =
  | 'title'
  | 'dungeon_explore'
  | 'guild_hall'
  | 'boss_battle'
  | 'master_tower';

export interface MusicTrackDefinition {
  id: MusicThemeId;
  titleId: string;
  subtitleId: string;
  bpm: number;
  stepsPerBeat: number; // 4 = 16th notes
  leadWaveform: ChiptuneWaveform;
  harmonyWaveform: ChiptuneWaveform;
  bassWaveform: ChiptuneWaveform;
  leadVolume: number;
  harmonyVolume: number;
  bassVolume: number;
  percussionVolume: number;
  leadCutoff: number;
  /**
   * 64-step pattern arrays:
   * - Note name e.g. 'D4', 'F#4', 'Bb3' triggers a new note
   * - '~' sustains/ties the previous note
   * - null or '-' is a rest
   */
  lead: (string | null)[];
  harmony: (string | null)[];
  bass: (string | null)[];
  percussion: (PercussionType | null)[];
}

const SEMITONE_MAP: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

/**
 * Converts scientific pitch notation (e.g. 'A4' -> 440Hz, 'F#3', 'Bb4') to frequency in Hz.
 * Returns null for rests ('-', null, '~', or invalid strings).
 */
export function noteToFreq(note: string | null | undefined): number | null {
  if (!note || note === '-' || note === '~') return null;
  const match = /^([A-G](?:#|b)?)(-?\d+)$/.exec(note.trim());
  if (!match) return null;
  const [, pitchName, octaveStr] = match;
  const semitone = SEMITONE_MAP[pitchName];
  if (semitone === undefined) return null;
  const octave = parseInt(octaveStr, 10);
  const midi = (octave + 1) * 12 + semitone;
  return Number((440 * Math.pow(2, (midi - 69) / 12)).toFixed(3));
}

/**
 * Resolves the appropriate background music theme from the current game state.
 * Pure function — deterministic and unit-testable.
 */
export function resolveMusicThemeForState(state: {
  currentView: string;
  activeFloorId: number;
  selectedBossFloorId: number | null;
}): MusicThemeId {
  // 1. Boss Battle overrides any floor or screen while BossModal is open
  if (state.selectedBossFloorId !== null && state.selectedBossFloorId !== undefined) {
    return 'boss_battle';
  }

  // 2. Main Menu / Title Screen
  if (state.currentView === 'title') {
    return 'title';
  }

  // 3. Menara Master (Floor 6 or Tower view)
  if (state.currentView === 'tower' || state.activeFloorId === 6) {
    return 'master_tower';
  }

  // 4. Guild Hall (Floor 5) — persists across study sub-tabs if currently stationed on Floor 5
  if (state.activeFloorId === 5) {
    return 'guild_hall';
  }

  // 5. Default Dungeon Exploration (Floors 1–4 and associated study views)
  return 'dungeon_explore';
}

export const MUSIC_TRACKS: Record<MusicThemeId, MusicTrackDefinition> = {
  /**
   * THEME 1 — MAIN MENU / TITLE SCREEN
   * "Gerbang Katakomba Kuno" (D Dorian / D Minor, 86 BPM)
   * Mysterious, welcoming, nostalgic RPG overture with crystalline arpeggios and warm flute-like lead.
   */
  title: {
    id: 'title',
    titleId: 'Gerbang Katakomba Kuno',
    subtitleId: 'Layar Judul & Menu Utama',
    bpm: 86,
    stepsPerBeat: 4,
    leadWaveform: 'triangle',
    harmonyWaveform: 'sine',
    bassWaveform: 'triangle',
    leadVolume: 0.14,
    harmonyVolume: 0.09,
    bassVolume: 0.14,
    percussionVolume: 0.04,
    leadCutoff: 2600,
    lead: [
      // Bar 1 (Dm9 motif)
      'D5', '~', '~', 'A4', 'F4', '~', 'G4', '~',
      'A4', '~', '~', '~', 'D5', '~', 'E5', '~',
      // Bar 2 (BbMaj7 -> Asus4)
      'F5', '~', 'E5', '~', 'D5', '~', 'C5', '~',
      'A4', '~', '~', '~', '-', null, 'A4', 'C5',
      // Bar 3 (Gm7 -> C9)
      'Bb4', '~', 'A4', '~', 'G4', '~', 'Bb4', '~',
      'D5', '~', 'C5', '~', 'G4', '~', 'A4', '~',
      // Bar 4 (Asus4 -> A7 -> Dm resolution)
      'F4', '~', 'E4', '~', 'D4', '~', 'E4', '~',
      'D4', '~', '~', '~', '~', '~', '-', null,
    ],
    harmony: [
      // Bar 1 (Dm arpeggio)
      'D4', 'F4', 'A4', 'D5', 'A4', 'F4', 'D4', 'F4',
      'A3', 'D4', 'F4', 'A4', 'F4', 'D4', 'A3', 'D4',
      // Bar 2 (BbMaj7 -> Am7 arpeggio)
      'Bb3', 'D4', 'F4', 'A4', 'F4', 'D4', 'Bb3', 'D4',
      'A3', 'C4', 'E4', 'A4', 'E4', 'C4', 'A3', 'C4',
      // Bar 3 (Gm7 -> C7 arpeggio)
      'G3', 'Bb3', 'D4', 'G4', 'D4', 'Bb3', 'G3', 'Bb3',
      'C4', 'E4', 'G4', 'Bb4', 'G4', 'E4', 'C4', 'E4',
      // Bar 4 (F -> A7 -> Dm)
      'F3', 'A3', 'C4', 'F4', 'A3', 'C#4', 'E4', 'G4',
      'D4', 'F4', 'A4', 'D5', 'A4', 'F4', 'D4', '-',
    ],
    bass: [
      // Bar 1
      'D2', '~', '~', '~', 'A2', '~', 'D3', '~',
      'D2', '~', '~', '~', 'A2', '~', 'F2', '~',
      // Bar 2
      'Bb1', '~', '~', '~', 'F2', '~', 'Bb2', '~',
      'A1', '~', '~', '~', 'E2', '~', 'A2', '~',
      // Bar 3
      'G1', '~', '~', '~', 'D2', '~', 'G2', '~',
      'C2', '~', '~', '~', 'G2', '~', 'C3', '~',
      // Bar 4
      'F2', '~', 'D2', '~', 'A1', '~', 'A2', '~',
      'D2', '~', '~', '~', 'D2', '~', '-', null,
    ],
    percussion: [
      'kick', null, null, null, 'hat', null, null, null,
      'kick', null, null, null, 'hat', null, null, null,
      'kick', null, null, null, 'hat', null, null, null,
      'kick', null, null, null, 'hat', null, 'hat', null,
      'kick', null, null, null, 'hat', null, null, null,
      'kick', null, null, null, 'hat', null, null, null,
      'kick', null, null, null, 'hat', null, 'tom', null,
      'kick', null, null, null, null, null, null, null,
    ],
  },

  /**
   * THEME 2 — DUNGEON EXPLORATION (Floors 1–4)
   * "Lorong Rune & Algoritma" (A Minor / C Major, 108 BPM)
   * Adventurous, nostalgic 8-bit/16-bit dungeon crawler melody designed to be pleasant during study.
   */
  dungeon_explore: {
    id: 'dungeon_explore',
    titleId: 'Lorong Rune & Algoritma',
    subtitleId: 'Eksplorasi Dungeon (Lantai 1–4)',
    bpm: 108,
    stepsPerBeat: 4,
    leadWaveform: 'square',
    harmonyWaveform: 'triangle',
    bassWaveform: 'triangle',
    leadVolume: 0.11,
    harmonyVolume: 0.085,
    bassVolume: 0.15,
    percussionVolume: 0.055,
    leadCutoff: 2500,
    lead: [
      // Bar 1 (Am -> G)
      'A4', '~', 'C5', '~', 'E5', '~', 'D5', 'C5',
      'B4', '~', 'G4', '~', 'B4', '~', 'D5', '~',
      // Bar 2 (F -> E7)
      'C5', '~', 'A4', '~', 'F4', '~', 'A4', 'C5',
      'B4', '~', '~', '~', 'E4', '~', 'G#4', 'B4',
      // Bar 3 (Dm7 -> Am)
      'D5', '~', 'F5', '~', 'E5', 'D5', 'C5', 'B4',
      'C5', '~', 'A4', '~', 'E4', '~', 'A4', '~',
      // Bar 4 (F -> G -> Am turnaround)
      'F4', '~', 'A4', '~', 'G4', '~', 'B4', '~',
      'A4', '~', '~', '~', '~', '~', '-', null,
    ],
    harmony: [
      // Bar 1
      'A3', 'C4', 'E4', 'C4', 'A3', 'C4', 'E4', 'C4',
      'G3', 'B3', 'D4', 'B3', 'G3', 'B3', 'D4', 'B3',
      // Bar 2
      'F3', 'A3', 'C4', 'A3', 'F3', 'A3', 'C4', 'A3',
      'E3', 'G#3', 'B3', 'E4', 'B3', 'G#3', 'E3', 'G#3',
      // Bar 3
      'D4', 'F4', 'A4', 'F4', 'D4', 'F4', 'A4', 'F4',
      'A3', 'C4', 'E4', 'C4', 'A3', 'C4', 'E4', 'C4',
      // Bar 4
      'F3', 'A3', 'C4', 'F4', 'G3', 'B3', 'D4', 'G4',
      'A3', 'C4', 'E4', 'A4', 'E4', 'C4', 'A3', '-',
    ],
    bass: [
      // Bar 1
      'A2', '~', 'E2', '~', 'A2', '~', 'E2', '~',
      'G2', '~', 'D2', '~', 'G2', '~', 'D2', '~',
      // Bar 2
      'F2', '~', 'C2', '~', 'F2', '~', 'C2', '~',
      'E2', '~', 'B1', '~', 'E2', '~', 'G#2', '~',
      // Bar 3
      'D2', '~', 'A2', '~', 'D2', '~', 'F2', '~',
      'A2', '~', 'E2', '~', 'A2', '~', 'C2', '~',
      // Bar 4
      'F2', '~', 'C2', '~', 'G2', '~', 'D2', '~',
      'A2', '~', 'E2', '~', 'A2', '~', '-', null,
    ],
    percussion: [
      'kick', null, 'hat', null, 'snare', null, 'hat', null,
      'kick', null, 'hat', 'kick', 'snare', null, 'hat', null,
      'kick', null, 'hat', null, 'snare', null, 'hat', null,
      'kick', null, 'hat', null, 'snare', null, 'hat', 'hat',
      'kick', null, 'hat', null, 'snare', null, 'hat', null,
      'kick', null, 'hat', 'kick', 'snare', null, 'hat', null,
      'kick', null, 'hat', null, 'snare', null, 'hat', null,
      'kick', null, 'snare', null, 'kick', 'tom', null, null,
    ],
  },

  /**
   * THEME 3 — GUILD HALL (Floor 5)
   * "Aula Guild Petualang" (G Major / Mixolydian, 122 BPM)
   * Warmer, uplifting, heroic RPG guild theme with bright harmonies and buoyant rhythm.
   */
  guild_hall: {
    id: 'guild_hall',
    titleId: 'Aula Guild Petualang',
    subtitleId: 'Aula Guild (Lantai 5)',
    bpm: 122,
    stepsPerBeat: 4,
    leadWaveform: 'square',
    harmonyWaveform: 'triangle',
    bassWaveform: 'triangle',
    leadVolume: 0.12,
    harmonyVolume: 0.09,
    bassVolume: 0.15,
    percussionVolume: 0.065,
    leadCutoff: 3100,
    lead: [
      // Bar 1 (G -> D/F#)
      'G4', '~', 'B4', 'C5', 'D5', '~', 'G5', '~',
      'F#5', '~', 'D5', '~', 'A4', '~', 'B4', 'C5',
      // Bar 2 (Em7 -> C)
      'B4', '~', 'E5', '~', 'D5', '~', 'B4', 'G4',
      'C5', '~', 'E5', '~', 'D5', '~', '-', null,
      // Bar 3 (C -> G/B -> Am7)
      'E5', '~', 'G5', '~', 'F#5', 'E5', 'D5', 'B4',
      'C5', '~', 'A4', '~', 'E4', '~', 'F#4', 'G4',
      // Bar 4 (D7 -> G fanfare resolution)
      'A4', '~', 'B4', '~', 'C5', '~', 'D5', '~',
      'G4', '~', 'D5', '~', 'G5', '~', '-', null,
    ],
    harmony: [
      // Bar 1
      'G3', 'B3', 'D4', 'G4', 'B3', 'D4', 'G4', 'B4',
      'F#3', 'A3', 'D4', 'F#4', 'A3', 'D4', 'F#4', 'A4',
      // Bar 2
      'E3', 'G3', 'B3', 'E4', 'G3', 'B3', 'E4', 'G4',
      'C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4', 'E4',
      // Bar 3
      'C4', 'E4', 'G4', 'E4', 'B3', 'D4', 'G4', 'D4',
      'A3', 'C4', 'E4', 'A4', 'E4', 'C4', 'A3', 'C4',
      // Bar 4
      'D3', 'F#3', 'A3', 'C4', 'D4', 'F#4', 'A4', 'C5',
      'G3', 'B3', 'D4', 'G4', 'B4', 'G4', 'D4', '-',
    ],
    bass: [
      // Bar 1
      'G2', '~', 'D2', '~', 'G2', '~', 'B2', '~',
      'D2', '~', 'A2', '~', 'D2', '~', 'F#2', '~',
      // Bar 2
      'E2', '~', 'B2', '~', 'E2', '~', 'G2', '~',
      'C2', '~', 'G2', '~', 'C2', '~', 'D2', '~',
      // Bar 3
      'C2', '~', 'G2', '~', 'B1', '~', 'G2', '~',
      'A1', '~', 'E2', '~', 'A2', '~', 'G2', '~',
      // Bar 4
      'D2', '~', 'E2', '~', 'F#2', '~', 'D2', '~',
      'G2', '~', 'D2', '~', 'G2', '~', '-', null,
    ],
    percussion: [
      'kick', null, 'hat', null, 'snare', null, 'hat', 'kick',
      'kick', null, 'hat', null, 'snare', null, 'hat', null,
      'kick', null, 'hat', null, 'snare', null, 'hat', 'kick',
      'kick', null, 'hat', null, 'snare', 'hat', 'tom', null,
      'kick', null, 'hat', null, 'snare', null, 'hat', 'kick',
      'kick', null, 'hat', null, 'snare', null, 'hat', null,
      'kick', null, 'hat', 'kick', 'snare', null, 'hat', 'snare',
      'kick', null, 'snare', null, 'kick', null, 'hat', null,
    ],
  },

  /**
   * THEME 4 — BOSS BATTLE
   * "Amarah Penjaga Segel" (E Minor / Phrygian Dominant, 148 BPM)
   * Intense, fast-tempo RPG boss soundtrack with driving octave bassline and dramatic melody.
   */
  boss_battle: {
    id: 'boss_battle',
    titleId: 'Amarah Penjaga Segel',
    subtitleId: 'Pertarungan Boss Penjaga Lantai',
    bpm: 148,
    stepsPerBeat: 4,
    leadWaveform: 'sawtooth',
    harmonyWaveform: 'square',
    bassWaveform: 'square',
    leadVolume: 0.125,
    harmonyVolume: 0.075,
    bassVolume: 0.14,
    percussionVolume: 0.085,
    leadCutoff: 3400,
    lead: [
      // Bar 1 (Urgent Em motif)
      'E5', '~', 'B4', 'E5', 'G5', '~', 'F#5', 'E5',
      'F5', '~', 'C5', 'F5', 'A5', '~', 'G5', 'F5',
      // Bar 2 (Phrygian tension -> B7)
      'E5', '~', 'D#5', 'E5', 'F#5', '~', 'G5', 'A5',
      'B5', '~', '~', 'A5', 'G5', 'F#5', 'D#5', 'B4',
      // Bar 3 (Am -> Em chromatic climb)
      'C5', '~', 'E5', '~', 'A5', '~', 'G5', 'F#5',
      'G5', '~', 'B4', '~', 'E5', '~', 'F#5', 'G5',
      // Bar 4 (C -> B7 dramatic cadence)
      'A5', 'G5', 'F#5', 'E5', 'D#5', 'E5', 'F#5', 'B4',
      'E5', '~', '~', '~', 'E5', '~', '-', null,
    ],
    harmony: [
      // Bar 1
      'E4', 'B3', 'E4', 'G4', 'E4', 'B3', 'E4', 'G4',
      'F4', 'C4', 'F4', 'A4', 'F4', 'C4', 'F4', 'A4',
      // Bar 2
      'E4', 'B3', 'E4', 'G4', 'F#4', 'D#4', 'F#4', 'A4',
      'B3', 'D#4', 'F#4', 'B4', 'A4', 'F#4', 'D#4', 'B3',
      // Bar 3
      'A3', 'C4', 'E4', 'A4', 'E4', 'C4', 'A3', 'E4',
      'G3', 'B3', 'E4', 'G4', 'E4', 'B3', 'G3', 'B3',
      // Bar 4
      'C4', 'E4', 'A4', 'C5', 'B3', 'D#4', 'F#4', 'B4',
      'E4', 'G4', 'B4', 'E5', 'B4', 'G4', 'E4', '-',
    ],
    bass: [
      // Driving 8th/16th octave bass
      'E2', 'E3', 'E2', 'E3', 'E2', 'E3', 'E2', 'E3',
      'F2', 'F3', 'F2', 'F3', 'F2', 'F3', 'F2', 'F3',
      'E2', 'E3', 'E2', 'E3', 'D#2', 'D#3', 'D#2', 'D#3',
      'B1', 'B2', 'B1', 'B2', 'B1', 'B2', 'C2', 'D#2',
      'A1', 'A2', 'A1', 'A2', 'A1', 'A2', 'A1', 'A2',
      'G1', 'G2', 'G1', 'G2', 'E2', 'E3', 'F#2', 'G2',
      'C2', 'C3', 'C2', 'C3', 'B1', 'B2', 'B1', 'B2',
      'E2', 'E3', 'B2', 'G2', 'E2', '~', '-', null,
    ],
    percussion: [
      'kick', 'hat', 'kick', 'hat', 'snare', 'hat', 'kick', 'hat',
      'kick', 'hat', 'kick', 'hat', 'snare', 'hat', 'kick', 'snare',
      'kick', 'hat', 'kick', 'hat', 'snare', 'hat', 'kick', 'hat',
      'kick', 'hat', 'snare', 'hat', 'kick', 'snare', 'tom', 'tom',
      'kick', 'hat', 'kick', 'hat', 'snare', 'hat', 'kick', 'hat',
      'kick', 'hat', 'kick', 'hat', 'snare', 'hat', 'kick', 'snare',
      'kick', 'hat', 'snare', 'hat', 'kick', 'hat', 'snare', 'hat',
      'kick', 'snare', 'kick', 'snare', 'kick', 'tom', 'snare', null,
    ],
  },

  /**
   * THEME 5 — MENARA MASTER (Floor 6)
   * "Puncak Menara Master" (F# Minor -> D Major -> E Major -> C#7, 98 BPM)
   * Epic, emotional, majestic final-adventure soundtrack evoking mastery and culmination.
   */
  master_tower: {
    id: 'master_tower',
    titleId: 'Puncak Menara Master',
    subtitleId: 'Menara Master (Lantai 6)',
    bpm: 98,
    stepsPerBeat: 4,
    leadWaveform: 'square',
    harmonyWaveform: 'triangle',
    bassWaveform: 'triangle',
    leadVolume: 0.13,
    harmonyVolume: 0.095,
    bassVolume: 0.15,
    percussionVolume: 0.06,
    leadCutoff: 2900,
    lead: [
      // Bar 1 (F#m soaring opening)
      'F#4', '~', 'A4', 'B4', 'C#5', '~', '~', 'F#5',
      'E5', '~', 'C#5', '~', 'A4', '~', '~', '~',
      // Bar 2 (D Major -> E Major heroic lift)
      'D5', '~', 'E5', 'F#5', 'A5', '~', 'G#5', 'F#5',
      'G#5', '~', 'E5', '~', 'B4', '~', 'C#5', 'D5',
      // Bar 3 (Bm7 -> F#m/A)
      'F#5', '~', 'E5', 'D5', 'C#5', '~', 'D5', 'E5',
      'F#5', '~', 'C#5', '~', 'A4', '~', 'F#4', '~',
      // Bar 4 (D Major -> C#7 -> F#m/A# majestic resolution)
      'B4', '~', 'D5', '~', 'C#5', '~', 'F5', '~',
      'F#5', '~', '~', '~', '~', '~', '-', null,
    ],
    harmony: [
      // Bar 1
      'F#3', 'A3', 'C#4', 'F#4', 'C#4', 'A3', 'F#3', 'A3',
      'E3', 'A3', 'C#4', 'E4', 'C#4', 'A3', 'E3', 'A3',
      // Bar 2
      'D3', 'F#3', 'A3', 'D4', 'F#4', 'D4', 'A3', 'F#3',
      'E3', 'G#3', 'B3', 'E4', 'G#4', 'E4', 'B3', 'G#3',
      // Bar 3
      'B3', 'D4', 'F#4', 'B4', 'F#4', 'D4', 'B3', 'D4',
      'F#3', 'A3', 'C#4', 'F#4', 'C#4', 'A3', 'F#3', 'A3',
      // Bar 4
      'D3', 'F#3', 'A3', 'D4', 'C#3', 'F3', 'G#3', 'C#4',
      'F#3', 'A3', 'C#4', 'F#4', 'A4', 'F#4', 'C#4', '-',
    ],
    bass: [
      // Bar 1
      'F#2', '~', '~', 'C#2', 'F#2', '~', 'E2', '~',
      'A1', '~', '~', 'E2', 'A2', '~', 'E2', '~',
      // Bar 2
      'D2', '~', '~', 'A2', 'D2', '~', 'A2', '~',
      'E2', '~', '~', 'B2', 'E2', '~', 'G#2', '~',
      // Bar 3
      'B1', '~', '~', 'F#2', 'B2', '~', 'D2', '~',
      'F#2', '~', '~', 'C#2', 'F#2', '~', 'A2', '~',
      // Bar 4
      'D2', '~', 'B1', '~', 'C#2', '~', 'C#2', '~',
      'F#2', '~', 'C#2', '~', 'F#2', '~', '-', null,
    ],
    percussion: [
      'kick', null, 'hat', null, 'snare', null, 'hat', null,
      'kick', null, 'hat', 'kick', 'snare', null, 'hat', null,
      'kick', null, 'hat', null, 'snare', null, 'hat', null,
      'kick', null, 'hat', null, 'snare', null, 'tom', 'hat',
      'kick', null, 'hat', null, 'snare', null, 'hat', null,
      'kick', null, 'hat', 'kick', 'snare', null, 'hat', null,
      'kick', null, 'snare', null, 'kick', null, 'snare', null,
      'kick', null, 'hat', null, 'kick', null, null, null,
    ],
  },
};

export const MUSIC_THEME_LIST: MusicTrackDefinition[] = [
  MUSIC_TRACKS.title,
  MUSIC_TRACKS.dungeon_explore,
  MUSIC_TRACKS.guild_hall,
  MUSIC_TRACKS.boss_battle,
  MUSIC_TRACKS.master_tower,
];
