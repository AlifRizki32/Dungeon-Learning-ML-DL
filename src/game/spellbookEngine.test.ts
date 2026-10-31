import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FLOOR1_CONTENT,
  FLOOR2_CONTENT,
  FLOOR3_CONTENT,
  SPELL_VISUALS,
  buildBattleDeck,
  buildDojoQuestionSet,
  buildFloor1BattleDeck,
  calculateQuestionWeight,
  calculateRoomCritBonusXP,
  computeNeuronMiniLab,
  computeSoftmaxMiniLab,
  evaluateFloor1Battle,
  getAllSpells,
  getEffectiveBossSpellId,
  getInitialBossPotions,
  getNextBossVariantIndex,
  getSpellsByFloor,
  getTotalBossPhases,
  recoverBossAfterFaint,
  shuffleOptionsByIdentity,
  updateQuestionStat,
} from './spellbookEngine';
import { migrateStateToV3 } from '../store/useGameStore';

test('floor1.content.json has verbatim structure: 6 topics, 6 spells, 30 questions, 6 boss phases with 2 variants', () => {
  assert.equal(FLOOR1_CONTENT.reviewStatus, 'needs-human-review');
  assert.equal(FLOOR1_CONTENT.floor, 1);
  assert.equal(FLOOR1_CONTENT.topics.length, 6);
  for (let i = 0; i < 6; i++) {
    const t = FLOOR1_CONTENT.topics[i];
    assert.equal(t.topicId, i + 1);
    assert.equal(t.spell.id, `s${i + 1}`);
    assert.equal(t.quiz.length, 5);
  }
  assert.equal(FLOOR1_CONTENT.boss.name, 'Raja Matematika');
  assert.equal(FLOOR1_CONTENT.boss.phases.length, 6);
  for (const p of FLOOR1_CONTENT.boss.phases) {
    assert.equal(p.variants.length, 2);
  }
});

test('floor2.content.json has verbatim structure: 5 topics (7..11), 5 spells (s7..s11), 25 questions, Golem Pohon Purba 6 phases + Phase 6 Gema Lantai 1 override', () => {
  assert.equal(FLOOR2_CONTENT.reviewStatus, 'needs-human-review');
  assert.equal(FLOOR2_CONTENT.floor, 2);
  assert.equal(FLOOR2_CONTENT.topics.length, 5);
  for (let i = 0; i < 5; i++) {
    const t = FLOOR2_CONTENT.topics[i];
    assert.equal(t.topicId, i + 7);
    assert.equal(t.spell.id, `s${i + 7}`);
    assert.equal(t.quiz.length, 5);
  }
  assert.equal(FLOOR2_CONTENT.boss.name, 'Golem Pohon Purba');
  assert.equal(FLOOR2_CONTENT.boss.phases.length, 6);

  // Check Phase 6 "Gema Lantai 1" variant-level spellId override
  const phase6 = FLOOR2_CONTENT.boss.phases[5];
  assert.equal(phase6.phase, 6);
  assert.equal(phase6.title, 'Gema Lantai 1');
  assert.equal(getEffectiveBossSpellId(phase6, phase6.variants[0]), 's5');
  assert.equal(getEffectiveBossSpellId(phase6, phase6.variants[1]), 's2');
});

test('floor3.content.json has verbatim structure: 6 topics (12..17), 6 spells (s12..s17), miniLabs, Hydra Berkepala Banyak 7 phases + Phase 7 Gema Lantai 1-2 override + 17 unique spell colors', () => {
  assert.equal(FLOOR3_CONTENT.reviewStatus, 'needs-human-review');
  assert.equal(FLOOR3_CONTENT.floor, 3);
  assert.equal(FLOOR3_CONTENT.topics.length, 6);
  for (let i = 0; i < 6; i++) {
    const t = FLOOR3_CONTENT.topics[i];
    assert.equal(t.topicId, i + 12);
    assert.equal(t.spell.id, `s${i + 12}`);
    assert.equal(t.quiz.length, 5);
  }
  assert.equal(FLOOR3_CONTENT.topics[0].miniLab, 'neuron');
  assert.equal(FLOOR3_CONTENT.topics[4].miniLab, 'softmax');

  assert.equal(FLOOR3_CONTENT.boss.name, 'Hydra Berkepala Banyak');
  assert.equal(FLOOR3_CONTENT.boss.phases.length, 7);
  assert.equal(getTotalBossPhases(3), 7);
  assert.equal(getInitialBossPotions(3), 3);
  assert.equal(getInitialBossPotions(2), 2);

  // Check Phase 7 "Gema Lantai 1-2" variant-level spellId override (s5 and s8)
  const phase7 = FLOOR3_CONTENT.boss.phases[6];
  assert.equal(phase7.phase, 7);
  assert.equal(phase7.title, 'Gema Lantai 1-2');
  assert.equal(getEffectiveBossSpellId(phase7, phase7.variants[0]), 's5');
  assert.equal(getEffectiveBossSpellId(phase7, phase7.variants[1]), 's8');

  // Verify 17 distinct spell colors across Floors 1, 2, and 3
  const allSpells = getAllSpells();
  assert.equal(allSpells.length, 17);
  assert.equal(getSpellsByFloor(1).length, 6);
  assert.equal(getSpellsByFloor(2).length, 5);
  assert.equal(getSpellsByFloor(3).length, 6);
  const uniqueColors = new Set(allSpells.map((s) => SPELL_VISUALS[s.id].color));
  assert.equal(uniqueColors.size, 17);
});

test('Mini-lab pure math helpers: computeNeuronMiniLab and computeSoftmaxMiniLab', () => {
  // workedExample topic 12: x1=2, x2=-1, w1=1.5, w2=2, b=-0.5 => z = 0.5, ReLU(z) = 0.5
  const neuronRes = computeNeuronMiniLab(2, -1, 1.5, 2, -0.5);
  assert.equal(neuronRes.z, 0.5);
  assert.equal(neuronRes.relu, 0.5);
  assert.ok(neuronRes.sigmoid > 0.62 && neuronRes.sigmoid < 0.63);

  const negRes = computeNeuronMiniLab(-2, -1, 1, 1, 0);
  assert.equal(negRes.z, -3);
  assert.equal(negRes.relu, 0);

  // Softmax mini-lab: equal scores give [1/3, 1/3, 1/3] and sum = 1
  const smEqual = computeSoftmaxMiniLab(0, 0, 0);
  assert.ok(Math.abs(smEqual.sum - 1) < 1e-9);
  assert.ok(Math.abs(smEqual.probabilities[0] - 1 / 3) < 1e-6);

  // workedExample topic 16: scores [2, 1, 0] -> ~[0.67, 0.24, 0.09]
  const smEx = computeSoftmaxMiniLab(2, 1, 0);
  assert.ok(Math.abs(smEx.sum - 1) < 1e-9);
  assert.ok(Math.abs(smEx.probabilities[0] - 0.665) < 0.01);
  assert.ok(Math.abs(smEx.probabilities[1] - 0.244) < 0.01);
  assert.ok(Math.abs(smEx.probabilities[2] - 0.09) < 0.01);
});

test('shuffleOptionsByIdentity maps correctness by option identity, not rendered position', () => {
  const options = ['1/3', '1/4', '1/6', '3/4'];
  const correctIndex = 1; // "1/4"
  const shuffled = shuffleOptionsByIdentity(options, correctIndex, () => 0.01);
  assert.equal(shuffled.length, 4);
  const correctOnes = shuffled.filter((o) => o.isCorrect);
  assert.equal(correctOnes.length, 1);
  assert.equal(correctOnes[0].text, '1/4');
  assert.equal(correctOnes[0].originalIndex, 1);
});

test('buildBattleDeck for Floors 1-3 (60% earlier floor / 40% current floor echo rule)', () => {
  // Floor 1: No topics defeated -> 5 questions, 0 echo
  const deckNoDefeated = buildFloor1BattleDeck('topic-1', []);
  assert.equal(deckNoDefeated.length, 5);
  assert.equal(deckNoDefeated.filter((q) => q.isEcho).length, 0);

  // Floor 1: topic-1 defeated, entering topic-2 -> 6 questions (5 topic-2 + 1 echo from topic-1)
  const deckWithEcho = buildFloor1BattleDeck('topic-2', ['topic-1']);
  assert.equal(deckWithEcho.length, 6);
  const echoes = deckWithEcho.filter((q) => q.isEcho);
  assert.equal(echoes.length, 1);
  assert.equal(echoes[0].roadmapTopicId, 'topic-1');

  // Floor 3: earlier floor ('topic-7' on Floor 2) and current floor ('topic-12' on Floor 3) defeated when entering 'topic-13'
  // When rng returns 0.3 (< 0.6), echo must come from earlier floor ('topic-7')
  const deckF3Earlier = buildBattleDeck('topic-13', ['topic-7', 'topic-12'], {}, () => 0.3);
  const echoF3Earlier = deckF3Earlier.find((q) => q.isEcho);
  assert.ok(echoF3Earlier);
  assert.equal(echoF3Earlier.floorId, 2);
  assert.equal(echoF3Earlier.roadmapTopicId, 'topic-7');

  // When rng returns 0.85 (>= 0.6), echo must come from current floor ('topic-12')
  const deckF3Current = buildBattleDeck('topic-13', ['topic-7', 'topic-12'], {}, () => 0.85);
  const echoF3Current = deckF3Current.find((q) => q.isEcho);
  assert.ok(echoF3Current);
  assert.equal(echoF3Current.floorId, 3);
  assert.equal(echoF3Current.roadmapTopicId, 'topic-12');
});

test('Dojo weight formula max(1, 1 + 2*wrongCount - correctStreak) and Floor 3 inclusion', () => {
  let stat = updateQuestionStat(undefined, false); // 1 wrong, 0 streak
  assert.equal(stat.wrong, 1);
  assert.equal(stat.correctStreak, 0);
  assert.equal(calculateQuestionWeight(stat), 3); // 1 + 2(1) - 0 = 3

  stat = updateQuestionStat(stat, false); // 2 wrong, 0 streak
  assert.equal(calculateQuestionWeight(stat), 5); // 1 + 2(2) - 0 = 5

  stat = updateQuestionStat(stat, true); // 2 wrong, 1 streak
  assert.equal(calculateQuestionWeight(stat), 4); // 1 + 4 - 1 = 4

  // Build dojo set from Floor 1 (topic-1), Floor 2 (topic-7), and Floor 3 (topic-12)
  const dojoSet = buildDojoQuestionSet(['topic-1', 'topic-7', 'topic-12'], { t12q1: stat }, 8);
  assert.equal(dojoSet.length, 8);
  assert.ok(dojoSet.some((q) => q.floorId === 3));
});

test('evaluateFloor1Battle, crit bonus (+10% once per room), Boss variant/faint rules, and v2->v3 migration', () => {
  assert.equal(evaluateFloor1Battle(4, 5).passedQuiz, true);
  assert.equal(evaluateFloor1Battle(3, 5).passedQuiz, false);

  assert.equal(calculateRoomCritBonusXP(150, false), 15);
  assert.equal(calculateRoomCritBonusXP(150, true), 0);

  // Variant A (0) first, Variant B (1) after miss, then alternate
  const v1 = getNextBossVariantIndex(undefined);
  assert.equal(v1, 0);
  const v2 = getNextBossVariantIndex(v1);
  assert.equal(v2, 1);
  const v3 = getNextBossVariantIndex(v2);
  assert.equal(v3, 0);

  // Boss regains one segment on faint (never above full / never below 0 cleared)
  assert.deepEqual(recoverBossAfterFaint([1, 2, 3]), [1, 2]);
  assert.deepEqual(recoverBossAfterFaint([]), []);

  // v2 -> v3 store migration converts flat bossProgress into { 1: ..., 2: ..., 3: ... } and unlocks Floor 1-3 spells
  const migrated = migrateStateToV3({
    version: 2,
    completedRooms: ['topic-1', 'topic-7', 'topic-12'],
    bossProgress: {
      clearedPhases: [1, 2, 3, 4, 5, 6],
      potions: 1,
      lastVariantByPhase: { 1: 0 },
    },
  });
  assert.equal(migrated.version, 3);
  assert.ok(migrated.spellsUnlocked.includes('s1'));
  assert.ok(migrated.spellsUnlocked.includes('s7'));
  assert.ok(migrated.spellsUnlocked.includes('s12'));
  assert.deepEqual(migrated.bossProgress[1].clearedPhases, [1, 2, 3, 4, 5, 6]);
  assert.equal(migrated.bossProgress[1].potions, 1);
  assert.deepEqual(migrated.bossProgress[2].clearedPhases, []);
  assert.equal(migrated.bossProgress[2].potions, 2);
  assert.deepEqual(migrated.bossProgress[3].clearedPhases, []);
  assert.equal(migrated.bossProgress[3].potions, 3);
});

