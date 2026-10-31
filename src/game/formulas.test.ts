import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOSS_XP,
  TOWER_QUEST_XP,
  calculateRoomXP,
  xpRequiredForLevel,
  calculateLevelFromXP,
  getTitleForLevel,
  isFloorUnlocked,
  isRoomUnlocked,
  isBossUnlocked,
  computeNextStreak,
  getDisplayStreak,
  calculateWeeksConquered,
} from './formulas';
import { FLOORS, ALL_TOPICS } from '../data/roadmap.js';

test('Room XP formula: round(((min + max) / 2) * 50)', () => {
  assert.equal(calculateRoomXP({ min: 1, max: 2 }), 75);
  assert.equal(calculateRoomXP({ min: 3, max: 4 }), 175);
  assert.equal(calculateRoomXP({ min: 4, max: 5 }), 225);
  assert.equal(calculateRoomXP({ min: 3, max: 3 }), 150);
  assert.equal(calculateRoomXP({ min: 6, max: 8 }), 350);
  assert.equal(BOSS_XP, 300);
  assert.equal(TOWER_QUEST_XP, 150);
});

test('Level XP threshold formula: 60 * (L - 1)^2', () => {
  assert.equal(xpRequiredForLevel(1), 0);
  assert.equal(xpRequiredForLevel(2), 60);
  assert.equal(xpRequiredForLevel(3), 240);
  assert.equal(xpRequiredForLevel(4), 540);
  assert.equal(xpRequiredForLevel(10), 4860);

  assert.equal(calculateLevelFromXP(0), 1);
  assert.equal(calculateLevelFromXP(59), 1);
  assert.equal(calculateLevelFromXP(60), 2);
  assert.equal(calculateLevelFromXP(239), 2);
  assert.equal(calculateLevelFromXP(240), 3);
  assert.equal(calculateLevelFromXP(4860), 10);
});

test('Titles match level brackets', () => {
  assert.equal(getTitleForLevel(1), 'Novice Data');
  assert.equal(getTitleForLevel(2), 'Novice Data');
  assert.equal(getTitleForLevel(3), 'Data Apprentice');
  assert.equal(getTitleForLevel(4), 'Data Apprentice');
  assert.equal(getTitleForLevel(5), 'Neural Knight');
  assert.equal(getTitleForLevel(6), 'Neural Knight');
  assert.equal(getTitleForLevel(7), 'Edge Ranger');
  assert.equal(getTitleForLevel(9), 'Edge Ranger');
  assert.equal(getTitleForLevel(10), 'ML Archmage');
  assert.equal(getTitleForLevel(15), 'ML Archmage');
});

test('Parallel and sequential room unlock rules work as specified', () => {
  const floor1 = FLOORS[0];
  const floor5 = FLOORS[4];

  // Start of game: Floor 1 and Floor 5 are unlocked
  assert.equal(isFloorUnlocked(1, []), true);
  assert.equal(isFloorUnlocked(2, []), false);
  assert.equal(isFloorUnlocked(5, []), true);
  assert.equal(isFloorUnlocked(6, []), false);

  // Floor 1 Topic 1 (Matematika dasar) and Topic 6 (Python - parallel) are unlocked at start
  assert.equal(isRoomUnlocked(floor1.topics[0], floor1.topics, [], []), true);
  assert.equal(isRoomUnlocked(floor1.topics[1], floor1.topics, [], []), false);
  assert.equal(isRoomUnlocked(floor1.topics[5], floor1.topics, [], []), true);

  // Defeating Topic 1 unlocks Topic 2
  assert.equal(isRoomUnlocked(floor1.topics[1], floor1.topics, ['topic-1'], []), true);

  // All 8 Guild Quests on Floor 5 (topics 21-28) are unlocked from start
  for (const gq of floor5.topics) {
    assert.equal(isRoomUnlocked(gq, floor5.topics, [], []), true);
  }

  // Boss 1 unlocks only when all 6 topics on Floor 1 are defeated
  assert.equal(
    isBossUnlocked(1, floor1.topics, ['topic-1', 'topic-2', 'topic-3', 'topic-4', 'topic-5'], []),
    false
  );
  assert.equal(
    isBossUnlocked(
      1,
      floor1.topics,
      ['topic-1', 'topic-2', 'topic-3', 'topic-4', 'topic-5', 'topic-6'],
      []
    ),
    true
  );

  // Floor 6 unlocks only when all 5 bosses are defeated
  assert.equal(
    isFloorUnlocked(6, ['boss-1', 'boss-2', 'boss-3', 'boss-4', 'boss-5']),
    true
  );
});

test('Streak increments on consecutive days and resets when skipping a day', () => {
  const s1 = computeNextStreak(0, null, '2026-10-28');
  assert.equal(s1.streak, 1);

  // Same day completion keeps streak at 1
  const s1Same = computeNextStreak(s1.streak, s1.lastActiveDate, '2026-10-28');
  assert.equal(s1Same.streak, 1);

  // Next consecutive day increments to 2
  const s2 = computeNextStreak(s1.streak, s1.lastActiveDate, '2026-10-29');
  assert.equal(s2.streak, 2);

  // Skipping 2026-10-30 and completing on 2026-10-31 resets streak to 1
  assert.equal(getDisplayStreak(s2.streak, s2.lastActiveDate, '2026-10-31'), 0);
  const sReset = computeNextStreak(s2.streak, s2.lastActiveDate, '2026-10-31');
  assert.equal(sReset.streak, 1);
});

test('Roadmap data integrity: 28 topics across 5 phases totaling 79-104 raw weeks', () => {
  assert.equal(ALL_TOPICS.length, 28);
  const weeks = calculateWeeksConquered(ALL_TOPICS.map((t) => t.id));
  assert.equal(weeks.conqueredMin, 79);
  assert.equal(weeks.conqueredMax, 104);
  assert.equal(weeks.percentConquered, 100);
});
