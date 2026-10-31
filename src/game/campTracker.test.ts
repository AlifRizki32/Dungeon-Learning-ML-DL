import test from 'node:test';
import assert from 'node:assert/strict';
import {
  StudySession,
  calculateProjectedCompletion,
  getCampfireStage,
  getLast8WeeksBuckets,
  getWeekStartDateKey,
  validateAndParseSaveJSON,
} from './campTracker';

test('getWeekStartDateKey returns Monday YYYY-MM-DD for any day of week', () => {
  // 2026-10-30 is a Friday -> Monday is 2026-10-26
  assert.equal(getWeekStartDateKey('2026-10-30'), '2026-10-26');
  // 2026-11-01 is a Sunday -> Monday is 2026-10-26
  assert.equal(getWeekStartDateKey('2026-11-01'), '2026-10-26');
  // 2026-10-26 is a Monday -> 2026-10-26
  assert.equal(getWeekStartDateKey('2026-10-26'), '2026-10-26');
});

test('getLast8WeeksBuckets aggregates hours across 8 calendar weeks accurately', () => {
  const sessions: StudySession[] = [
    {
      id: 's1',
      topicId: 'topic-1',
      durationMinutes: 120, // 2h in current week
      date: '2026-10-30',
      source: 'manual',
      createdAt: 1,
    },
    {
      id: 's2',
      topicId: 'topic-2',
      durationMinutes: 90, // 1.5h in current week
      date: '2026-10-27',
      source: 'pomodoro',
      createdAt: 2,
    },
    {
      id: 's3',
      topicId: 'topic-1',
      durationMinutes: 180, // 3h in M-1 (previous week)
      date: '2026-10-20',
      source: 'manual',
      createdAt: 3,
    },
  ];

  const buckets = getLast8WeeksBuckets(sessions, '2026-10-30');
  assert.equal(buckets.length, 8);
  assert.equal(buckets[7].shortLabel, 'Minggu Ini');
  assert.equal(buckets[7].totalHours, 3.5);
  assert.equal(buckets[7].sessionCount, 2);

  assert.equal(buckets[6].shortLabel, 'M-1');
  assert.equal(buckets[6].totalHours, 3);
  assert.equal(buckets[6].sessionCount, 1);
});

test('getCampfireStage scales from stage 0 to stage 4 based on weekly target', () => {
  assert.equal(getCampfireStage(0, 9).stage, 0);
  assert.equal(getCampfireStage(2, 9).stage, 1); // 22%
  assert.equal(getCampfireStage(4.5, 9).stage, 2); // 50%
  assert.equal(getCampfireStage(7.5, 9).stage, 3); // 83%
  assert.equal(getCampfireStage(9, 9).stage, 4); // 100%
  assert.equal(getCampfireStage(12, 9).stage, 4); // >100%
});

test('calculateProjectedCompletion uses actual average hours per week when sessions exist', () => {
  const refDate = new Date(2026, 9, 30, 12, 0, 0); // Oct 30, 2026
  const sessions: StudySession[] = [
    {
      id: 's1',
      topicId: 'topic-1',
      durationMinutes: 600, // 10 hours in current week
      date: '2026-10-30',
      source: 'manual',
      createdAt: 1,
    },
  ];
  const proj = calculateProjectedCompletion([], sessions, 9, refDate);
  assert.equal(proj.usingActualAverage, true);
  assert.equal(proj.actualAvgHoursPerWeek, 10);
  assert.ok(proj.estimatedWeeksToFinish > 0);
  assert.ok(proj.projectedMonthYear.length > 4);
});

test('validateAndParseSaveJSON accepts valid saves and rejects invalid JSON', () => {
  const goodSave = JSON.stringify({
    state: {
      playerName: 'Arsitek Neural',
      xp: 450,
      completedRooms: ['topic-1', 'topic-6'],
      weeklyTargetHours: 12,
    },
    version: 1,
  });

  const res = validateAndParseSaveJSON(goodSave);
  assert.equal(res.valid, true);
  if (res.valid) {
    assert.equal(res.data.playerName, 'Arsitek Neural');
    assert.equal(res.data.xp, 450);
    assert.equal(res.data.weeklyTargetHours, 12);
  }

  const badSave = validateAndParseSaveJSON('{ broken json ');
  assert.equal(badSave.valid, false);
});
