import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MUSIC_THEME_LIST,
  MUSIC_TRACKS,
  noteToFreq,
  resolveMusicThemeForState,
} from './musicTracks';
import { countTiedSteps } from './musicSequencer';
import { clampVolume } from './musicManager';
import { migrateStateToV3, useGameStore } from '../store/useGameStore';

test('noteToFreq converts scientific pitch notation accurately and handles rests/ties', () => {
  assert.equal(noteToFreq('A4'), 440);
  assert.equal(noteToFreq('A3'), 220);
  assert.equal(noteToFreq('A5'), 880);
  assert.ok(Math.abs((noteToFreq('C4') ?? 0) - 261.626) < 0.01);
  assert.ok(Math.abs((noteToFreq('F#4') ?? 0) - 369.994) < 0.01);
  assert.ok(Math.abs((noteToFreq('Bb3') ?? 0) - 233.082) < 0.01);

  assert.equal(noteToFreq(null), null);
  assert.equal(noteToFreq('-'), null);
  assert.equal(noteToFreq('~'), null);
  assert.equal(noteToFreq('invalid'), null);
});

test('countTiedSteps counts consecutive ~ tie tokens accurately', () => {
  const pattern = ['D5', '~', '~', 'A4', 'F4', '~', null, '-'];
  assert.equal(countTiedSteps(pattern, 0), 3);
  assert.equal(countTiedSteps(pattern, 3), 1);
  assert.equal(countTiedSteps(pattern, 4), 2);
});

test('All 5 RPG chiptune tracks have valid 64-step multi-channel arrangements', () => {
  assert.equal(MUSIC_THEME_LIST.length, 5);
  const expectedIds = [
    'title',
    'dungeon_explore',
    'guild_hall',
    'boss_battle',
    'master_tower',
  ] as const;

  for (const id of expectedIds) {
    const track = MUSIC_TRACKS[id];
    assert.ok(track, `Track ${id} must exist`);
    assert.equal(track.lead.length, 64, `${id} lead should have 64 steps`);
    assert.equal(track.harmony.length, 64, `${id} harmony should have 64 steps`);
    assert.equal(track.bass.length, 64, `${id} bass should have 64 steps`);
    assert.equal(track.percussion.length, 64, `${id} percussion should have 64 steps`);
    assert.ok(track.bpm >= 70 && track.bpm <= 180, `${id} BPM should be in RPG range`);

    // Every note token (that isn't null, '-', or '~') must parse to a valid frequency
    for (const channel of [track.lead, track.harmony, track.bass]) {
      let noteCount = 0;
      for (const token of channel) {
        if (token && token !== '-' && token !== '~') {
          const freq = noteToFreq(token);
          assert.ok(
            freq !== null && freq > 20 && freq < 4000,
            `Invalid note token "${token}" in track "${id}"`
          );
          noteCount++;
        }
      }
      assert.ok(noteCount >= 8, `Track ${id} channel must contain structured musical notes`);
    }
  }
});

test('resolveMusicThemeForState maps game screens, floors, and boss battles to the 5 themes', () => {
  // 1. Title screen
  assert.equal(
    resolveMusicThemeForState({
      currentView: 'title',
      activeFloorId: 1,
      selectedBossFloorId: null,
    }),
    'title'
  );

  // 2. Floors 1–4 exploration (and study sub-screens while on Floors 1–4)
  for (const floorId of [1, 2, 3, 4]) {
    for (const view of ['dungeon', 'grimoire', 'review', 'camp', 'dashboard', 'inventory', 'settings']) {
      assert.equal(
        resolveMusicThemeForState({
          currentView: view,
          activeFloorId: floorId,
          selectedBossFloorId: null,
        }),
        'dungeon_explore'
      );
    }
  }

  // 3. Floor 5 Guild Hall
  assert.equal(
    resolveMusicThemeForState({
      currentView: 'dungeon',
      activeFloorId: 5,
      selectedBossFloorId: null,
    }),
    'guild_hall'
  );
  // Opening Grimoire while on Floor 5 preserves Guild Hall music without restarting
  assert.equal(
    resolveMusicThemeForState({
      currentView: 'grimoire',
      activeFloorId: 5,
      selectedBossFloorId: null,
    }),
    'guild_hall'
  );

  // 4. Boss Battle overrides any floor and returns to previous floor theme when closed
  for (const bossFloor of [1, 2, 3, 4, 5]) {
    assert.equal(
      resolveMusicThemeForState({
        currentView: 'dungeon',
        activeFloorId: bossFloor,
        selectedBossFloorId: bossFloor,
      }),
      'boss_battle'
    );
  }

  // 5. Menara Master (Floor 6 / tower view)
  assert.equal(
    resolveMusicThemeForState({
      currentView: 'tower',
      activeFloorId: 1,
      selectedBossFloorId: null,
    }),
    'master_tower'
  );
  assert.equal(
    resolveMusicThemeForState({
      currentView: 'dungeon',
      activeFloorId: 6,
      selectedBossFloorId: null,
    }),
    'master_tower'
  );
});

test('useGameStore and migrateStateToV3 preserve save data and normalize music/sfx settings', () => {
  const migratedLegacy = migrateStateToV3({
    playerName: 'Arsitek Lama',
    xp: 500,
    completedRooms: ['topic-1', 'topic-2'],
  });

  assert.equal(migratedLegacy.playerName, 'Arsitek Lama');
  assert.equal(migratedLegacy.xp, 500);
  assert.equal(migratedLegacy.musicEnabled, false);
  assert.equal(migratedLegacy.musicVolume, 0.35);
  assert.equal(migratedLegacy.sfxVolume, 0.75);

  const migratedCustom = migrateStateToV3({
    musicEnabled: true,
    musicVolume: 0.6,
    sfxVolume: 0.4,
  });
  assert.equal(migratedCustom.musicEnabled, true);
  assert.equal(migratedCustom.musicVolume, 0.6);
  assert.equal(migratedCustom.sfxVolume, 0.4);

  // Test live store actions
  const store = useGameStore.getState();
  store.setMusicEnabled(false);
  assert.equal(useGameStore.getState().musicEnabled, false);
  store.toggleMusic();
  assert.equal(useGameStore.getState().musicEnabled, true);

  store.setMusicVolume(0.8);
  assert.equal(useGameStore.getState().musicVolume, 0.8);
  store.setSfxVolume(0.5);
  assert.equal(useGameStore.getState().sfxVolume, 0.5);

  assert.equal(clampVolume(1.5), 1);
  assert.equal(clampVolume(-0.5), 0);
});
