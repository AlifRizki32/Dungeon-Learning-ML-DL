import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FLOOR1_CONTENT,
  FLOOR2_CONTENT,
  FLOOR3_CONTENT,
  FLOOR4_CONTENT,
  FLOOR5_CONTENT,
  FLOOR6_CONTENT,
  SPELL_VISUALS,
  TOWER_RELICS,
  areAllReflectionsAnswered,
  buildBattleDeck,
  buildDojoQuestionSet,
  buildFloor1BattleDeck,
  calculateQuestionWeight,
  calculateRoomCritBonusXP,
  canCompleteTowerQuest,
  canTickTowerStep,
  canUnlockCerminPuncak,
  computeLatencyMiniLab,
  computeNeuronMiniLab,
  computeQuantMiniLab,
  computeSoftmaxMiniLab,
  evaluateFloor1Battle,
  formatCertificateSummaryText,
  getAllSpells,
  getEffectiveBossSpellId,
  getInitialBossPotions,
  getNextBossVariantIndex,
  getSpellsByFloor,
  getTotalBossPhases,
  getTowerQuestStepProgress,
  getTowerQuestStatus,
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

test('floor3.content.json has verbatim structure: 6 topics (12..17), 6 spells (s12..s17), miniLabs, Hydra Berkepala Banyak 7 phases + Phase 7 Gema Lantai 1-2 override', () => {
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
});

test('floor4.content.json has verbatim structure: 3 topics (18..20), 3 spells (s18..s20), quant & latency miniLabs, Mecha-Core 5 phases + Phase 4 & 5 Gema overrides + 20 unique spell colors', () => {
  assert.equal(FLOOR4_CONTENT.reviewStatus, 'needs-human-review');
  assert.equal(FLOOR4_CONTENT.floor, 4);
  assert.equal(FLOOR4_CONTENT.topics.length, 3);
  for (let i = 0; i < 3; i++) {
    const t = FLOOR4_CONTENT.topics[i];
    assert.equal(t.topicId, i + 18);
    assert.equal(t.spell.id, `s${i + 18}`);
    assert.equal(t.quiz.length, 5);
  }
  assert.ok(!FLOOR4_CONTENT.topics[0].miniLab);
  assert.equal(FLOOR4_CONTENT.topics[1].miniLab, 'quant');
  assert.equal(FLOOR4_CONTENT.topics[2].miniLab, 'latency');

  assert.equal(FLOOR4_CONTENT.boss.name, 'Mecha-Core');
  assert.equal(FLOOR4_CONTENT.boss.phases.length, 5);
  assert.equal(getTotalBossPhases(4), 5);
  assert.equal(getInitialBossPotions(4), 2);

  // Check Phase 4 ("Gema Lantai 2-3") and Phase 5 ("Gema Lantai 1 dan 3") variant-level spellId overrides
  const phase4 = FLOOR4_CONTENT.boss.phases[3];
  assert.equal(phase4.phase, 4);
  assert.equal(phase4.title, 'Gema Lantai 2-3');
  assert.equal(getEffectiveBossSpellId(phase4, phase4.variants[0]), 's14');
  assert.equal(getEffectiveBossSpellId(phase4, phase4.variants[1]), 's9');

  const phase5 = FLOOR4_CONTENT.boss.phases[4];
  assert.equal(phase5.phase, 5);
  assert.equal(phase5.title, 'Gema Lantai 1 dan 3');
  assert.equal(getEffectiveBossSpellId(phase5, phase5.variants[0]), 's2');
  assert.equal(getEffectiveBossSpellId(phase5, phase5.variants[1]), 's15');

  // Verify 28 distinct spell colors across Floors 1, 2, 3, 4, and 5
  const allSpells = getAllSpells();
  assert.equal(allSpells.length, 28);
  assert.equal(getSpellsByFloor(1).length, 6);
  assert.equal(getSpellsByFloor(2).length, 5);
  assert.equal(getSpellsByFloor(3).length, 6);
  assert.equal(getSpellsByFloor(4).length, 3);
  assert.equal(getSpellsByFloor(5).length, 8);
  const uniqueColors = new Set(allSpells.map((s) => SPELL_VISUALS[s.id].color));
  assert.equal(uniqueColors.size, 28);
});

test('floor5.content.json has verbatim structure: 8 topics (21..28), 8 spells (s21..s28), 40 questions, relics & evidenceHints, and Raja Deadline 8 phases with 3 potions', () => {
  assert.equal(FLOOR5_CONTENT.reviewStatus, 'needs-human-review');
  assert.equal(FLOOR5_CONTENT.floor, 5);
  assert.equal(FLOOR5_CONTENT.topics.length, 8);

  const expectedRelics = [
    'Kompas Git',
    'Lensa Data',
    'Papan Sirkuit',
    'Neraca Jujur',
    'Tameng Cadangan',
    'Mikrofon Emas',
    'Peta Lingkup',
    'Kunci Perisai',
  ];

  for (let i = 0; i < 8; i++) {
    const t = FLOOR5_CONTENT.topics[i];
    assert.equal(t.topicId, i + 21);
    assert.equal(t.spell.id, `s${i + 21}`);
    assert.equal(t.relic, expectedRelics[i]);
    assert.ok(t.evidenceHint && t.evidenceHint.length > 0);
    assert.equal(t.quiz.length, 5);
  }

  assert.equal(FLOOR5_CONTENT.boss.name, 'Raja Deadline');
  assert.equal(FLOOR5_CONTENT.boss.phases.length, 8);
  assert.equal(getTotalBossPhases(5), 8);
  assert.equal(getInitialBossPotions(5), 3);

  for (let i = 0; i < 8; i++) {
    const p = FLOOR5_CONTENT.boss.phases[i];
    assert.equal(p.phase, i + 1);
    assert.equal(p.topicId, i + 21);
    assert.equal(p.spellId, `s${i + 21}`);
    assert.equal(p.variants.length, 2);
  }
});

test('Mini-lab pure math helpers: computeNeuronMiniLab, computeSoftmaxMiniLab, computeQuantMiniLab, and computeLatencyMiniLab', () => {
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

  // Quant mini-lab (Topic 19): 50,000 params, float32 (4B) => 200,000 B = 200 KB (1 KB = 1,000 byte)
  const quantFloat = computeQuantMiniLab(50000, 'float32', 1000, 256, 50);
  assert.equal(quantFloat.bytesPerParameter, 4);
  assert.equal(quantFloat.modelSizeBytes, 200000);
  assert.equal(quantFloat.modelSizeKB, 200);
  assert.equal(quantFloat.fitsInFlash, true);
  assert.equal(quantFloat.fitsInRam, true);
  assert.equal(quantFloat.flashStatus, 'Muat di flash');
  assert.equal(quantFloat.ramStatus, 'Muat di RAM');

  // Quant mini-lab: 50,000 params, int8 (1B) => 50,000 B = 50 KB; flash 40 KB => does not fit flash
  const quantInt8 = computeQuantMiniLab(50000, 'int8', 40, 256, 300);
  assert.equal(quantInt8.bytesPerParameter, 1);
  assert.equal(quantInt8.modelSizeKB, 50);
  assert.equal(quantInt8.fitsInFlash, false);
  assert.equal(quantInt8.fitsInRam, false);

  // Latency mini-lab (Topic 20): workedExample 15 + 10 + 35 + 20 = 80 ms, limit 100 ms => Sisa 20 ms
  const latWithin = computeLatencyMiniLab(15, 10, 35, 20, 100);
  assert.equal(latWithin.totalMs, 80);
  assert.equal(latWithin.withinBudget, true);
  assert.equal(latWithin.statusText, 'Sisa 20 ms');

  // Latency mini-lab exceeding limit: 40 + 30 + 50 + 20 = 140 ms, limit 100 ms => Melebihi 40 ms
  const latOver = computeLatencyMiniLab(40, 30, 50, 20, 100);
  assert.equal(latOver.totalMs, 140);
  assert.equal(latOver.withinBudget, false);
  assert.equal(latOver.statusText, 'Melebihi 40 ms');
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

test('buildBattleDeck for Floors 1-4 (60% earlier floor / 40% current floor echo rule)', () => {
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

  // Floor 4: earlier floor ('topic-12' on Floor 3) and current floor ('topic-18' on Floor 4) defeated when entering 'topic-19'
  // When rng returns 0.3 (< 0.6), echo must come from earlier floor ('topic-12')
  const deckF4Earlier = buildBattleDeck('topic-19', ['topic-12', 'topic-18'], {}, () => 0.3);
  const echoF4Earlier = deckF4Earlier.find((q) => q.isEcho);
  assert.ok(echoF4Earlier);
  assert.equal(echoF4Earlier.floorId, 3);
  assert.equal(echoF4Earlier.roadmapTopicId, 'topic-12');

  // When rng returns 0.85 (>= 0.6), echo must come from current floor ('topic-18')
  const deckF4Current = buildBattleDeck('topic-19', ['topic-12', 'topic-18'], {}, () => 0.85);
  const echoF4Current = deckF4Current.find((q) => q.isEcho);
  assert.ok(echoF4Current);
  assert.equal(echoF4Current.floorId, 4);
  assert.equal(echoF4Current.roadmapTopicId, 'topic-18');

  // Floor 5: Fresh save with 0 defeated rooms -> skip echo (5 questions total)
  const deckF5Fresh = buildBattleDeck('topic-21', []);
  assert.equal(deckF5Fresh.length, 5);
  assert.equal(deckF5Fresh.filter((q) => q.isEcho).length, 0);

  // Floor 5: Draws echo from ALL defeated topics of ANY floor (excluding current room)
  const deckF5WithAnyFloor = buildBattleDeck('topic-22', ['topic-21', 'topic-3'], {});
  assert.equal(deckF5WithAnyFloor.length, 6);
  const echoF5 = deckF5WithAnyFloor.find((q) => q.isEcho);
  assert.ok(echoF5);
  assert.ok(echoF5.roadmapTopicId === 'topic-21' || echoF5.roadmapTopicId === 'topic-3');
});

test('Dojo weight formula max(1, 1 + 2*wrongCount - correctStreak) and Floor 4 inclusion', () => {
  let stat = updateQuestionStat(undefined, false); // 1 wrong, 0 streak
  assert.equal(stat.wrong, 1);
  assert.equal(stat.correctStreak, 0);
  assert.equal(calculateQuestionWeight(stat), 3); // 1 + 2(1) - 0 = 3

  stat = updateQuestionStat(stat, false); // 2 wrong, 0 streak
  assert.equal(calculateQuestionWeight(stat), 5); // 1 + 2(2) - 0 = 5

  stat = updateQuestionStat(stat, true); // 2 wrong, 1 streak
  assert.equal(calculateQuestionWeight(stat), 4); // 1 + 4 - 1 = 4

  // Build dojo set from Floor 1 (topic-1), Floor 2 (topic-7), Floor 3 (topic-12), and Floor 4 (topic-18)
  const dojoSet = buildDojoQuestionSet(
    ['topic-1', 'topic-7', 'topic-12', 'topic-18'],
    { t18q1: stat },
    8
  );
  assert.equal(dojoSet.length, 8);
  assert.ok(dojoSet.some((q) => q.floorId === 4));
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

  // v2 -> v3 store migration converts flat bossProgress into { 1: ..., 2: ..., 3: ..., 4: ..., 5: ... } and unlocks Floor 1-5 spells + evidenceNotes
  const migrated = migrateStateToV3({
    version: 2,
    completedRooms: ['topic-1', 'topic-7', 'topic-12', 'topic-18', 'topic-21'],
    evidenceNotes: { 'topic-21': 'Repo GitHub dengan tag v1.0' },
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
  assert.ok(migrated.spellsUnlocked.includes('s18'));
  assert.ok(migrated.spellsUnlocked.includes('s21'));
  assert.equal(migrated.evidenceNotes['topic-21'], 'Repo GitHub dengan tag v1.0');
  assert.deepEqual(migrated.bossProgress[1].clearedPhases, [1, 2, 3, 4, 5, 6]);
  assert.equal(migrated.bossProgress[1].potions, 1);
  assert.deepEqual(migrated.bossProgress[2].clearedPhases, []);
  assert.equal(migrated.bossProgress[2].potions, 2);
  assert.deepEqual(migrated.bossProgress[3].clearedPhases, []);
  assert.equal(migrated.bossProgress[3].potions, 3);
  assert.deepEqual(migrated.bossProgress[4].clearedPhases, []);
  assert.equal(migrated.bossProgress[4].potions, 2);
  assert.deepEqual(migrated.bossProgress[5].clearedPhases, []);
  assert.equal(migrated.bossProgress[5].potions, 3);
});

test('floor6.content.json verbatim structure, quest step progress, specialization rule, Cermin Puncak unlock, and Piagam summary', () => {
  assert.equal(FLOOR6_CONTENT.reviewStatus, 'needs-human-review');
  assert.equal(FLOOR6_CONTENT.floor, 6);
  assert.equal(FLOOR6_CONTENT.stepsAreSuggestions, true);
  assert.equal(FLOOR6_CONTENT.quests.length, 7);
  assert.equal(FLOOR6_CONTENT.specializations.length, 5);
  assert.equal(FLOOR6_CONTENT.guardian.name, 'Cermin Puncak');
  assert.equal(FLOOR6_CONTENT.guardian.reflectionPrompts.length, 5);
  assert.equal(FLOOR6_CONTENT.certificate.title, 'Piagam Penyelesai Peta Belajar');
  assert.equal(TOWER_RELICS.length, 7);

  for (const q of FLOOR6_CONTENT.quests) {
    assert.equal(q.xp, 150);
    assert.ok(q.relic.length > 0);
    assert.ok(q.steps.length >= 4);
  }

  // Status transitions: Belum dimulai -> Berjalan -> Selesai
  assert.equal(getTowerQuestStatus('m1', {}, []), 'Belum dimulai');
  assert.equal(getTowerQuestStatus('m1', { m1: { m1s1: true } }, []), 'Berjalan');
  assert.equal(getTowerQuestStatus('m1', { m1: { m1s1: true } }, ['m1']), 'Selesai');

  const progM1 = getTowerQuestStepProgress('m1', { m1: { m1s1: true, m1s2: true } });
  assert.equal(progM1.ticked, 2);
  assert.equal(progM1.total, 5);

  // Specialization rule for m6s3: cannot tick m6s3 until specialization is chosen
  assert.equal(canTickTowerStep('m6', 'm6s3', null), false);
  assert.equal(canTickTowerStep('m6', 'm6s3', ''), false);
  assert.equal(canTickTowerStep('m6', 'm6s3', 'TinyML'), true);
  assert.equal(canTickTowerStep('m6', 'm6s1', null), true);

  // Completing m6 requires all 4 steps AND non-empty specialization
  const m6AllSteps = { m6: { m6s1: true, m6s2: true, m6s3: true, m6s4: true } };
  assert.equal(canCompleteTowerQuest('m6', m6AllSteps, [], null), false);
  assert.equal(canCompleteTowerQuest('m6', m6AllSteps, [], 'TinyML'), true);
  assert.equal(canCompleteTowerQuest('m6', m6AllSteps, ['m6'], 'TinyML'), false);

  // Cermin Puncak unlocks only when all 7 quests are completed
  assert.equal(canUnlockCerminPuncak(['m1', 'm2', 'm3', 'm4', 'm5', 'm6']), false);
  assert.equal(
    canUnlockCerminPuncak(['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7']),
    true
  );

  // Reflection prompts validation
  assert.equal(areAllReflectionsAnswered({ r1: 'A', r2: 'B', r3: 'C', r4: 'D' }), false);
  assert.equal(
    areAllReflectionsAnswered({ r1: 'A', r2: 'B', r3: 'C', r4: 'D', r5: '   ' }),
    false
  );
  assert.equal(
    areAllReflectionsAnswered({ r1: 'A', r2: 'B', r3: 'C', r4: 'D', r5: 'E' }),
    true
  );

  // Certificate plain-text summary uses exact title "Piagam Penyelesai Peta Belajar"
  const certText = formatCertificateSummaryText({
    playerName: 'Alya Tensor',
    level: 14,
    levelTitle: 'Arsitek Jaringan',
    roomsDefeated: 28,
    totalRooms: 28,
    bossesDefeated: 5,
    totalBosses: 5,
    relicsCount: 20,
    totalRelics: 20,
    towerQuestsCompleted: 7,
    totalTowerQuests: 7,
    specialization: 'TinyML',
    issuedDateFormatted: '31 Oktober 2026',
  });
  assert.ok(certText.includes('PIAGAM PENYELESAI PETA BELAJAR'));
  assert.ok(certText.includes('TinyML'));
  assert.ok(certText.includes(FLOOR6_CONTENT.certificate.honestNote));
  assert.ok(certText.includes(FLOOR6_CONTENT.certificate.closing));
});
