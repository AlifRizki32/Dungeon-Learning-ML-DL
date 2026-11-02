import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  areAllTopicChunksComplete,
  evaluateFillNumber,
  evaluateMatchAttempt,
  evaluateOrderAttempt,
  formatBarValue,
  getAllReviewItems,
  getDueReviewItems,
  getLessonChunksForTopic,
  hasLessonChunksForTopic,
  isChunkComplete,
  parseLocalizedNumber,
  prepareMatchRightOptions,
  scheduleReviewItem,
  shuffleChoiceOptions,
  shuffleOrderItems,
  tokenizeTextWithGlossaryTerms,
} from './lessonEngine';

describe('Lesson Chunks v3 Engine (lessonEngine.ts)', () => {
  it('loads chunks for Floor 1 (topics 1-6) and Floor 2 (topics 7-11), and returns empty for topics 12-28', () => {
    let floor1TotalChunks = 0;
    for (let t = 1; t <= 6; t += 1) {
      assert.equal(hasLessonChunksForTopic(t), true);
      const chunks = getLessonChunksForTopic(t);
      assert.ok(chunks.length >= 3, `Topic ${t} should have at least 3 chunks`);
      floor1TotalChunks += chunks.length;
    }
    assert.equal(floor1TotalChunks, 22);

    let floor2TotalChunks = 0;
    for (let t = 7; t <= 11; t += 1) {
      assert.equal(hasLessonChunksForTopic(t), true);
      const chunks = getLessonChunksForTopic(t);
      assert.ok(chunks.length >= 3, `Topic ${t} should have at least 3 chunks`);
      floor2TotalChunks += chunks.length;
    }
    assert.equal(floor2TotalChunks, 22);

    assert.equal(hasLessonChunksForTopic(12), false);
    assert.equal(getLessonChunksForTopic(21).length, 0);
    assert.equal(getAllReviewItems().length, 64);
  });

  it('tracks chunk completion based on all practice activities attempted at least once', () => {
    const t1Chunks = getLessonChunksForTopic(1);
    const firstChunk = t1Chunks[0];
    assert.equal(isChunkComplete(firstChunk, {}), false);

    // Partial attempts -> still false
    const partialState = {
      [firstChunk.chunkId]: {
        done: false,
        attempts: 1,
        attemptedActivities: [firstChunk.practice[0].id],
      },
    };
    assert.equal(isChunkComplete(firstChunk, partialState), false);

    // All practice activities attempted -> true
    const fullState = {
      [firstChunk.chunkId]: {
        done: false,
        attempts: firstChunk.practice.length,
        attemptedActivities: firstChunk.practice.map((p) => p.id),
      },
    };
    assert.equal(isChunkComplete(firstChunk, fullState), true);

    // Topic completion requires all chunks of topic 1 to be complete
    assert.equal(areAllTopicChunksComplete(1, fullState), false);
    const allTopic1Complete = Object.fromEntries(
      t1Chunks.map((c) => [
        c.chunkId,
        {
          done: true,
          attempts: c.practice.length,
          attemptedActivities: c.practice.map((p) => p.id),
        },
      ])
    );
    assert.equal(areAllTopicChunksComplete(1, allTopic1Complete), true);
  });

  it('shuffles choice options while keeping correctness mapped by option identity', () => {
    const options = ['Opsi A', 'Opsi B (Benar)', 'Opsi C'];
    const shuffled = shuffleChoiceOptions(options, 1, () => 0.1);
    assert.equal(shuffled.length, 3);
    const correctOpt = shuffled.find((o) => o.isCorrect);
    assert.ok(correctOpt);
    assert.equal(correctOpt.text, 'Opsi B (Benar)');
    assert.equal(correctOpt.optionId, 'opt-1');
  });

  it('parses localized numeric input with comma, dot, leading minus, spaces, and tolerance (including 0.002 and 0.005)', () => {
    assert.equal(parseLocalizedNumber('  2,5 '), 2.5);
    assert.equal(parseLocalizedNumber(' -1,25 '), -1.25);
    assert.equal(parseLocalizedNumber(' −0.75 '), -0.75);
    assert.equal(parseLocalizedNumber('abc'), null);

    const resExact = evaluateFillNumber(' 17,5 ', 17.5, 0.01);
    assert.equal(resExact.isCorrect, true);

    const resWithinTol = evaluateFillNumber('0,22', 0.222, 0.01);
    assert.equal(resWithinTol.isCorrect, true);

    const resOutsideTol = evaluateFillNumber('0,25', 0.222, 0.01);
    assert.equal(resOutsideTol.isCorrect, false);

    // Floor 2 tolerances: 0.002 (t8c4p1: 1.386) and 0.005 (t10c1p1: 0.18) and negative (-25)
    assert.equal(evaluateFillNumber('1,385', 1.386, 0.002).isCorrect, true);
    assert.equal(evaluateFillNumber('1.388', 1.386, 0.002).isCorrect, true);
    assert.equal(evaluateFillNumber('1,39', 1.386, 0.002).isCorrect, false);
    assert.equal(evaluateFillNumber('0,18', 0.18, 0.005).isCorrect, true);
    assert.equal(evaluateFillNumber('0,175', 0.18, 0.005).isCorrect, true);
    assert.equal(evaluateFillNumber('-25', -25, 0.01).isCorrect, true);
    assert.equal(evaluateFillNumber('−25', -25, 0.01).isCorrect, true);
  });

  it('formats bar values with up to 3 decimals, thousands separators, and "0" for zero', () => {
    assert.equal(formatBarValue(0), '0');
    assert.equal(formatBarValue(-0), '0');
    assert.equal(formatBarValue(5), '5');
    assert.equal(formatBarValue(100000), '100.000');
    assert.equal(formatBarValue(0.105), '0,105');
    assert.equal(formatBarValue(0.625), '0,625');
    assert.equal(formatBarValue(1.3864), '1,386');
  });

  it('evaluates order and match practice activities accurately', () => {
    const items = ['Langkah 1', 'Langkah 2', 'Langkah 3'];
    const shuffled = shuffleOrderItems(items, () => 0.2);
    assert.equal(shuffled.length, 3);

    const orderOk = evaluateOrderAttempt(['Langkah 1', 'Langkah 2', 'Langkah 3'], items);
    assert.equal(orderOk.isCorrect, true);
    assert.deepEqual(orderOk.wrongPositions, []);

    const orderWrong = evaluateOrderAttempt(['Langkah 1', 'Langkah 3', 'Langkah 2'], items);
    assert.equal(orderWrong.isCorrect, false);
    assert.deepEqual(orderWrong.wrongPositions, [1, 2]);

    const pairs = [
      { left: 'Mean', right: 'Rata-rata' },
      { left: 'Median', right: 'Nilai tengah' },
    ];
    const rightOpts = prepareMatchRightOptions(pairs, () => 0.3);
    assert.equal(rightOpts.length, 2);

    const matchOk = evaluateMatchAttempt({ 0: 'Rata-rata', 1: 'Nilai tengah' }, pairs);
    assert.equal(matchOk.isCorrect, true);

    const matchWrong = evaluateMatchAttempt({ 0: 'Nilai tengah', 1: 'Rata-rata' }, pairs);
    assert.equal(matchWrong.isCorrect, false);
    assert.deepEqual(matchWrong.wrongLeftIndices, [0, 1]);
  });

  it('tokenizes text with glossary terms (case-insensitive, whole words, including base terms)', () => {
    const terms = [
      { term: 'mean', plain: 'Rata-rata jumlah dibagi banyak data.' },
      { term: 'simpangan baku (σ)', plain: 'Akar dari varians.' },
    ];
    const text = 'Nilai Mean dan simpangan baku sangat penting dibandingkan meaningful.';
    const tokens = tokenizeTextWithGlossaryTerms(text, terms);
    const matched = tokens.filter((t) => Boolean(t.termEntry));
    assert.equal(matched.length, 2);
    assert.equal(matched[0].text, 'Mean');
    assert.equal(matched[0].termEntry?.term, 'mean');
    assert.equal(matched[1].text, 'simpangan baku');
    assert.equal(matched[1].termEntry?.term, 'simpangan baku (σ)');
  });

  it('schedules spaced review items for Lupa, Ragu, and Ingat with intervalScale', () => {
    const today = '2026-11-02';
    const initial = { box: 0, due: today };

    // Ingat: moves box 0 -> 1, interval[1] = 3 days * scale 1 = 3 days
    const ingat1 = scheduleReviewItem(initial, 'ingat', 1, today);
    assert.equal(ingat1.box, 1);
    assert.equal(ingat1.intervalDays, 3);
    assert.equal(ingat1.due, '2026-11-05');

    // Ingat with intervalScale = 2: box 1 -> 2, interval[2] = 7 * 2 = 14 days
    const ingat2 = scheduleReviewItem({ box: 1, due: today }, 'ingat', 2, today);
    assert.equal(ingat2.box, 2);
    assert.equal(ingat2.intervalDays, 14);
    assert.equal(ingat2.due, '2026-11-16');

    // Ragu: stays in same box (box 2), interval[2] = 7 * 0.5 = 4 days (rounded)
    const ragu = scheduleReviewItem({ box: 2, due: today }, 'ragu', 0.5, today);
    assert.equal(ragu.box, 2);
    assert.equal(ragu.intervalDays, 4);
    assert.equal(ragu.due, '2026-11-06');

    // Lupa: resets to box 0 with due = tomorrow
    const lupa = scheduleReviewItem({ box: 3, due: today }, 'lupa', 1.5, today);
    assert.equal(lupa.box, 0);
    assert.equal(lupa.intervalDays, 1);
    assert.equal(lupa.due, '2026-11-03');

    // Due filter caps at 10 per session
    const allItems = getAllReviewItems();
    const firstId = allItems[0].id;
    const secondId = allItems[1].id;
    const queue = {
      [firstId]: { box: 0, due: '2026-11-02' },
      [secondId]: { box: 1, due: '2026-11-05' },
    };
    const dueInfo = getDueReviewItems(queue, today, 10);
    assert.equal(dueInfo.totalDueCount, 1);
    assert.equal(dueInfo.dueItems[0].id, firstId);
  });
});
