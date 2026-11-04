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
import { useGameStore } from '../store/useGameStore';

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

test('P-06: export -> reset -> import preserves every persisted key with non-default values', () => {
  const store = useGameStore.getState();
  store.resetProgress();

  // Populate non-default values for EVERY persisted key in the current schema
  useGameStore.setState({
    version: 3,
    hasStarted: true,
    playerName: 'Ratu Tensor Nusantara',
    avatarId: 'ranger',
    xp: 1450,
    streak: 5,
    lastActiveDate: '2026-11-03',
    completedRooms: ['topic-1', 'topic-6', 'topic-7', 'topic-12', 'topic-21'],
    defeatedBosses: ['boss-1'],
    completedTowerQuests: ['m1'],
    towerSteps: {
      m1: { m1s1: true, m1s2: true, m1s3: true, m1s4: true, m1s5: true },
      m2: { m2s1: true },
    },
    towerCompleted: ['m1'],
    reflections: {
      p1: 'Refleksi mendalam tentang fondasi matematika dan aljabar linear.',
      p2: 'Catatan evaluasi diri proyek ML.',
    },
    specialization: 'Embedded ML / TinyML & Edge AI',
    certificateIssuedAt: '2026-11-03T10:00:00.000Z',
    relics: ['relic-1', 'relic-g1', 'relic-m1'],
    badges: ['badge-1'],
    quizBestScores: { 'topic-1': 100, 'topic-6': 80 },
    bestScoreByTopic: { 'topic-1': 100, 'topic-6': 80 },
    quizBonusClaimedRooms: ['topic-1'],
    echoBonusClaimedRooms: ['topic-6'],
    spellsUnlocked: ['s1', 's6', 's7', 's12', 's21'],
    questionStats: {
      t1q1: { seen: 3, wrong: 1, correctStreak: 2 },
    },
    bossProgress: {
      1: { clearedPhases: [1, 2, 3, 4, 5, 6], potions: 1, lastVariantByPhase: { 1: 0, 2: 1 } },
      2: { clearedPhases: [1, 2], potions: 2, lastVariantByPhase: { 1: 0 } },
      3: { clearedPhases: [], potions: 3, lastVariantByPhase: {} },
      4: { clearedPhases: [], potions: 2, lastVariantByPhase: {} },
      5: { clearedPhases: [1], potions: 2, lastVariantByPhase: { 1: 1 } },
    },
    dojoDailyXP: { date: '2026-11-03', xp: 14 },
    evidenceNotes: {
      'topic-21': 'Repo Git dengan 12 commit rapi dan pytest hijau.',
      '21': 'Repo Git dengan 12 commit rapi dan pytest hijau.',
      m1: 'Catatan bukti selesai membaca bab ISLP.',
    },
    studySessions: [
      {
        id: 'ses-test-1',
        topicId: 'topic-1',
        durationMinutes: 90,
        date: '2026-11-03',
        note: 'Latihan soal pecahan dan garis lurus',
        source: 'manual',
        createdAt: 1762170000000,
      },
    ],
    weeklyTargetHours: 12,
    claimedWeeklyBonusWeeks: ['2026-11-02'],
    activeFloorId: 2,
    activeNodeByFloor: {
      1: 'boss-1',
      2: 'topic-8',
      3: 'topic-13',
      4: 'topic-19',
      5: 'topic-22',
    },
    soundEnabled: true,
    sfxVolume: 0.6,
    musicEnabled: true,
    musicVolume: 0.25,
    reduceMotion: true,
    lessonProgress: {
      t1c1: {
        done: true,
        attempts: 3,
        attemptedActivities: ['t1c1p1', 't1c1p2', 't1c1p3'],
      },
    },
    summaries: {
      t1c1: 'Rata-rata adalah jumlah seluruh nilai dibagi banyaknya data.',
    },
    taskDone: {
      t21c1: true,
      m1c1: true,
    },
    reviewQueue: {
      t1c1r1: { box: 2, due: '2026-11-10' },
    },
    settings: {
      intervalScale: 1.5,
    },
  });

  const exportedRaw = useGameStore.getState().exportSaveJSON();
  const exportedParsed = JSON.parse(exportedRaw);

  // Reset store completely to defaults
  useGameStore.getState().resetProgress();
  assert.equal(useGameStore.getState().xp, 0);
  assert.deepEqual(useGameStore.getState().lessonProgress, {});
  assert.deepEqual(useGameStore.getState().summaries, {});
  assert.deepEqual(useGameStore.getState().reviewQueue, {});

  // Import the exported JSON
  const importRes = useGameStore.getState().importSaveJSON(exportedRaw);
  assert.equal(importRes.success, true);

  const reExportedRaw = useGameStore.getState().exportSaveJSON();
  const reExportedParsed = JSON.parse(reExportedRaw);

  assert.equal(reExportedParsed.version, exportedParsed.version);
  assert.deepEqual(reExportedParsed.state, exportedParsed.state);
});

test('P-06: importing older v1 and v2 save shapes migrates without data loss', () => {
  const store = useGameStore.getState();
  store.resetProgress();

  // 1. v1 shape (no spellsUnlocked, quizBestScores only, legacy tower-1..7 IDs)
  const v1Save = JSON.stringify({
    version: 1,
    state: {
      playerName: 'Veteran V1',
      avatarId: 'knight',
      xp: 850,
      streak: 3,
      lastActiveDate: '2026-11-01',
      completedRooms: ['topic-1', 'topic-6', 'topic-7'],
      defeatedBosses: ['boss-1'],
      completedTowerQuests: ['tower-1', 'tower-2'],
      quizBestScores: { 'topic-1': 100, 'topic-6': 80 },
      relics: ['relic-1'],
      badges: ['badge-1'],
    },
  });

  const resV1 = useGameStore.getState().importSaveJSON(v1Save);
  assert.equal(resV1.success, true);
  const stateAfterV1 = useGameStore.getState();
  assert.equal(stateAfterV1.playerName, 'Veteran V1');
  assert.equal(stateAfterV1.xp, 850);
  assert.deepEqual(stateAfterV1.completedRooms, ['topic-1', 'topic-6', 'topic-7']);
  assert.deepEqual(stateAfterV1.spellsUnlocked.sort(), ['s1', 's6', 's7']);
  assert.deepEqual(stateAfterV1.towerCompleted.sort(), ['m1', 'm2']);
  assert.equal(stateAfterV1.bestScoreByTopic['topic-1'], 100);
  assert.ok(stateAfterV1.relics.includes('relic-m1'));
  assert.ok(stateAfterV1.relics.includes('relic-m2'));

  // 2. v2 shape (flat bossProgress object)
  const v2Save = JSON.stringify({
    version: 2,
    state: {
      playerName: 'Veteran V2',
      xp: 1200,
      completedRooms: ['topic-1', 'topic-2'],
      bossProgress: {
        clearedPhases: [1, 2, 3],
        potions: 1,
        lastVariantByPhase: { 1: 0, 2: 1 },
      },
      evidenceNotes: { '21': 'Catatan bukti v2' },
    },
  });

  const resV2 = useGameStore.getState().importSaveJSON(v2Save);
  assert.equal(resV2.success, true);
  const stateAfterV2 = useGameStore.getState();
  assert.equal(stateAfterV2.playerName, 'Veteran V2');
  assert.equal(stateAfterV2.xp, 1200);
  assert.deepEqual(stateAfterV2.bossProgress[1], {
    clearedPhases: [1, 2, 3],
    potions: 1,
    lastVariantByPhase: { 1: 0, 2: 1 },
  });
  assert.deepEqual(stateAfterV2.bossProgress[2].clearedPhases, []);
  assert.equal(stateAfterV2.evidenceNotes['21'], 'Catatan bukti v2');
});

test('P-06: per-field bounds drop invalid entries without failing import, and failed/oversized imports keep existing save intact', () => {
  const store = useGameStore.getState();
  store.resetProgress();

  const dirtyPayload = JSON.stringify({
    version: 3,
    state: {
      playerName: 'A'.repeat(50),
      summaries: {
        t1c1: 'S'.repeat(500),
        badType: 12345,
      },
      evidenceNotes: {
        '21': 'E'.repeat(400),
        badNote: null,
      },
      reflections: {
        q1: 'R'.repeat(600),
        q2: 'Valid reflection',
        badRefl: 999,
      },
      reviewQueue: {
        validCard: { box: 4, due: '2026-11-15' },
        clampedBox: { box: 99, due: '2026-11-16' },
        badDate: { box: 2, due: 'not-a-date' },
      },
      settings: { intervalScale: 9.9 },
      taskDone: {
        t1c1: true,
        t1c2: false,
        t1c3: 'not-a-bool',
      },
      lessonProgress: {
        t1c1: { done: true, attempts: 3, attemptedActivities: ['guess', 999, 'p0'] },
        badEntry: 'invalid',
      },
      activeFloorId: 99,
      activeNodeByFloor: {
        1: 'topic-2', // valid on floor 1
        2: 'topic-999', // invalid node ID -> dropped
        3: 'topic-1', // belongs to floor 1, not floor 3 -> dropped
        4: 'boss-4', // valid boss on floor 4
      },
    },
  });

  const res = useGameStore.getState().importSaveJSON(dirtyPayload);
  assert.equal(res.success, true);

  const after = useGameStore.getState();
  assert.equal(after.playerName.length, 28);
  assert.equal(after.summaries.t1c1.length, 400);
  assert.equal('badType' in after.summaries, false);
  assert.equal(after.evidenceNotes['21'].length, 300);
  assert.equal('badNote' in after.evidenceNotes, false);
  assert.equal(after.reflections.q1.length, 500);
  assert.equal(after.reflections.q2, 'Valid reflection');
  assert.equal('badRefl' in after.reflections, false);
  assert.deepEqual(after.reviewQueue, {
    validCard: { box: 4, due: '2026-11-15' },
    clampedBox: { box: 4, due: '2026-11-16' },
  });
  assert.equal(after.settings.intervalScale, 2);
  assert.deepEqual(after.taskDone, { t1c1: true, t1c2: false });
  assert.deepEqual(after.lessonProgress, {
    t1c1: { done: true, attempts: 3, attemptedActivities: ['guess', 'p0'] },
  });
  // activeFloorId 99 was dropped so default 1 remains
  assert.equal(after.activeFloorId, 1);
  // Floor 1 ('topic-2') and Floor 4 ('boss-4') kept; Floor 2 and Floor 3 fell back to default floor first topics
  assert.equal(after.activeNodeByFloor[1], 'topic-2');
  assert.equal(after.activeNodeByFloor[2], 'topic-7');
  assert.equal(after.activeNodeByFloor[3], 'topic-12');
  assert.equal(after.activeNodeByFloor[4], 'boss-4');

  // Verify failed / oversized imports keep existing save completely intact
  const snapshotBeforeFail = useGameStore.getState().exportSaveJSON().state;

  const oversized = 'x'.repeat(1024 * 1024 + 10);
  const resOversized = useGameStore.getState().importSaveJSON(oversized);
  assert.equal(resOversized.success, false);
  assert.match(resOversized.message, /1 MB/);

  const resMalformed = useGameStore.getState().importSaveJSON('{not valid json');
  assert.equal(resMalformed.success, false);

  const snapshotAfterFail = useGameStore.getState().exportSaveJSON().state;
  assert.deepStrictEqual(snapshotAfterFail, snapshotBeforeFail);
});


