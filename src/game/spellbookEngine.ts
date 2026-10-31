import floor1ContentRaw from '../data/floor1.content.json';
import floor2ContentRaw from '../data/floor2.content.json';
import floor3ContentRaw from '../data/floor3.content.json';

export interface Floor1Spell {
  id: string;
  name: string;
  formulas: string[];
}

export interface Floor1Scroll {
  paragraphs: string[];
  workedExample: string;
  commonMistake: string;
}

export interface Floor1Reference {
  label: string;
  url: string | null;
}

export interface Floor1QuizQuestion {
  id: string;
  difficulty: 'mudah' | 'sedang' | 'sulit';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Floor1TopicContent {
  topicId: number;
  miniLab?: 'neuron' | 'softmax';
  spell: Floor1Spell;
  scroll: Floor1Scroll;
  references: Floor1Reference[];
  quiz: Floor1QuizQuestion[];
}

export interface BossVariantContent {
  spellId?: string;
  scenario: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface BossPhaseContent {
  phase: number;
  topicId: number;
  spellId: string;
  title?: string;
  variants: BossVariantContent[];
}

export interface Floor1ContentFile {
  reviewStatus: string;
  floor: number;
  topics: Floor1TopicContent[];
  boss: {
    name: string;
    phases: BossPhaseContent[];
  };
}

export type FloorContentFile = Floor1ContentFile;
export type SpellbookTopicContent = Floor1TopicContent;
export type SpellbookSpell = Floor1Spell;

export interface QuestionStat {
  seen: number;
  wrong: number;
  correctStreak: number;
}

export interface BossProgressState {
  clearedPhases: number[];
  potions: number;
  lastVariantByPhase: Record<number, number>;
}

export interface ShuffledOption {
  optionId: string;
  originalIndex: number;
  text: string;
  isCorrect: boolean;
}

export interface PreparedBattleQuestion {
  id: string;
  topicId: number;
  floorId: number;
  roadmapTopicId: string;
  spellId: string;
  spellName: string;
  difficulty: 'mudah' | 'sedang' | 'sulit';
  question: string;
  explanation: string;
  isEcho: boolean;
  shuffledOptions: ShuffledOption[];
}

export const FLOOR1_CONTENT: FloorContentFile = floor1ContentRaw as FloorContentFile;
export const FLOOR2_CONTENT: FloorContentFile = floor2ContentRaw as FloorContentFile;
export const FLOOR3_CONTENT: FloorContentFile = floor3ContentRaw as FloorContentFile;

export const SPELLBOOK_FLOORS: Record<number, FloorContentFile> = {
  1: FLOOR1_CONTENT,
  2: FLOOR2_CONTENT,
  3: FLOOR3_CONTENT,
};

export const ECHO_BONUS_XP = 5;
export const CRIT_ROOM_BONUS_RATE = 0.1; // +10% of room XP, once per room
export const DOJO_CORRECT_XP = 2;
export const DOJO_DAILY_XP_CAP = 20;
export const INITIAL_BOSS_POTIONS = 2;
export const FLOOR3_BOSS_POTIONS = 3;
export const MAX_HEARTS = 3;

export function getInitialBossPotions(floorId: number): number {
  return floorId === 3 ? FLOOR3_BOSS_POTIONS : INITIAL_BOSS_POTIONS;
}

export function getTotalBossPhases(floorId: number): number {
  return SPELLBOOK_FLOORS[floorId]?.boss.phases.length ?? 6;
}

export interface SpellVisualTheme {
  spellId: string;
  floorId: 1 | 2 | 3;
  color: string;
  bgColor: string;
  animStyle:
    | 'beam'
    | 'orbs'
    | 'lightning'
    | 'grid'
    | 'spiral'
    | 'code'
    | 'roots'
    | 'leaves'
    | 'prisms'
    | 'forge'
    | 'constellation'
    | 'synapse'
    | 'tensor'
    | 'kernel'
    | 'sequence'
    | 'attention'
    | 'schedule';
  runeSymbol: string;
}

/**
 * 17 distinct spell colors across Floors 1-3:
 * Floor 1 (s1..s6): #38d864, #3ac5eb, #f5b935, #9b5de5, #e83b47, #f4f1ea
 * Floor 2 (s7..s11): #1d8a3d, #a87312, #94a3b8, #64748b, #5c4e99
 * Floor 3 (s12..s17): #b3aad1, #941923, #0284c7, #b45309, #fcd34d, #7e22ce
 */
export const SPELL_VISUALS: Record<string, SpellVisualTheme> = {
  s1: {
    spellId: 's1',
    floorId: 1,
    color: '#38d864', // Emerald Green
    bgColor: '#0a1714',
    animStyle: 'beam',
    runeSymbol: '% / y=mx+c',
  },
  s2: {
    spellId: 's2',
    floorId: 1,
    color: '#3ac5eb', // Arcane Cyan
    bgColor: '#0d1b2a',
    animStyle: 'orbs',
    runeSymbol: 'P(A|B)',
  },
  s3: {
    spellId: 's3',
    floorId: 1,
    color: '#f5b935', // Torchlight Amber Gold
    bgColor: '#291324',
    animStyle: 'lightning',
    runeSymbol: 'p < α',
  },
  s4: {
    spellId: 's4',
    floorId: 1,
    color: '#9b5de5', // Mystic Amethyst Purple
    bgColor: '#16112b',
    animStyle: 'grid',
    runeSymbol: 'A·v = λv',
  },
  s5: {
    spellId: 's5',
    floorId: 1,
    color: '#e83b47', // Crimson Flame Red
    bgColor: '#291324',
    animStyle: 'spiral',
    runeSymbol: 'θ − η∇L',
  },
  s6: {
    spellId: 's6',
    floorId: 1,
    color: '#f4f1ea', // Starlight Parchment Ivory
    bgColor: '#1f193d',
    animStyle: 'code',
    runeSymbol: 'df.groupby',
  },
  s7: {
    spellId: 's7',
    floorId: 2,
    color: '#1d8a3d', // Deep Forest Moss Green
    bgColor: '#0a1714',
    animStyle: 'roots',
    runeSymbol: 'Train|Val|Test',
  },
  s8: {
    spellId: 's8',
    floorId: 2,
    color: '#a87312', // Aged Bark Amber Bronze
    bgColor: '#241909',
    animStyle: 'leaves',
    runeSymbol: 'F1 = 2PR/(P+R)',
  },
  s9: {
    spellId: 's9',
    floorId: 2,
    color: '#94a3b8', // Runic Silver Steel
    bgColor: '#121b28',
    animStyle: 'prisms',
    runeSymbol: 'σ(z) · Gini',
  },
  s10: {
    spellId: 's10',
    floorId: 2,
    color: '#64748b', // Ironwood Slate
    bgColor: '#161e29',
    animStyle: 'forge',
    runeSymbol: 'z = (x−μ)/s',
  },
  s11: {
    spellId: 's11',
    floorId: 2,
    color: '#5c4e99', // Twilight Indigo Cluster
    bgColor: '#16112b',
    animStyle: 'constellation',
    runeSymbol: 'K-Means · PC1',
  },
  s12: {
    spellId: 's12',
    floorId: 3,
    color: '#b3aad1', // Lavender Synapse Mist
    bgColor: '#1a142e',
    animStyle: 'synapse',
    runeSymbol: 'z = w·x+b · ReLU',
  },
  s13: {
    spellId: 's13',
    floorId: 3,
    color: '#941923', // Torch Ember Ruby
    bgColor: '#260d14',
    animStyle: 'tensor',
    runeSymbol: 'zero_grad · step',
  },
  s14: {
    spellId: 's14',
    floorId: 3,
    color: '#0284c7', // Kernel Azure Pulse
    bgColor: '#0c1f33',
    animStyle: 'kernel',
    runeSymbol: 'Conv2D · Pool',
  },
  s15: {
    spellId: 's15',
    floorId: 3,
    color: '#b45309', // Temporal Chrono Copper
    bgColor: '#241509',
    animStyle: 'sequence',
    runeSymbol: 'h_t = tanh(Wh)',
  },
  s16: {
    spellId: 's16',
    floorId: 3,
    color: '#fcd34d', // Solar Attention Gold
    bgColor: '#261f0a',
    animStyle: 'attention',
    runeSymbol: 'softmax(QK^T/√d)',
  },
  s17: {
    spellId: 's17',
    floorId: 3,
    color: '#7e22ce', // Deep Arcane Violet
    bgColor: '#1b0d2e',
    animStyle: 'schedule',
    runeSymbol: 'AdamW · CosineLR',
  },
};

export interface NeuronMiniLabResult {
  z: number;
  relu: number;
  sigmoid: number;
}

export function computeNeuronMiniLab(
  x1: number,
  x2: number,
  w1: number,
  w2: number,
  b: number
): NeuronMiniLabResult {
  const z = Math.round((w1 * x1 + w2 * x2 + b) * 1000) / 1000;
  const relu = Math.max(0, z);
  const sigmoid = 1 / (1 + Math.exp(-z));
  return { z, relu, sigmoid };
}

export interface SoftmaxMiniLabResult {
  probabilities: [number, number, number];
  sum: number;
}

export function computeSoftmaxMiniLab(
  s1: number,
  s2: number,
  s3: number
): SoftmaxMiniLabResult {
  const maxS = Math.max(s1, s2, s3);
  const e1 = Math.exp(s1 - maxS);
  const e2 = Math.exp(s2 - maxS);
  const e3 = Math.exp(s3 - maxS);
  const denom = e1 + e2 + e3;
  const p1 = e1 / denom;
  const p2 = e2 / denom;
  const p3 = e3 / denom;
  return {
    probabilities: [p1, p2, p3],
    sum: p1 + p2 + p3,
  };
}

export function getNumericTopicId(topicId: string | number): number | null {
  if (typeof topicId === 'number') {
    return topicId >= 1 && topicId <= 17 ? topicId : null;
  }
  const match = /^topic-(\d+)$/.exec(topicId);
  if (!match) return null;
  const num = Number(match[1]);
  return num >= 1 && num <= 17 ? num : null;
}

export function getRoadmapTopicId(numericTopicId: number): string {
  return `topic-${numericTopicId}`;
}

export function getFloorForTopicNumber(numericTopicId: number): number {
  if (numericTopicId >= 1 && numericTopicId <= 6) return 1;
  if (numericTopicId >= 7 && numericTopicId <= 11) return 2;
  if (numericTopicId >= 12 && numericTopicId <= 17) return 3;
  return 1;
}

export function getFloorContent(floorId: number): FloorContentFile | undefined {
  return SPELLBOOK_FLOORS[floorId];
}

export function getTopicContent(
  topicId: string | number
): (SpellbookTopicContent & { floorId: number }) | undefined {
  const numId = getNumericTopicId(topicId);
  if (numId === null) return undefined;
  for (const [floorKey, floorData] of Object.entries(SPELLBOOK_FLOORS)) {
    const found = floorData.topics.find((t) => t.topicId === numId);
    if (found) {
      return { ...found, floorId: Number(floorKey) };
    }
  }
  return undefined;
}

/**
 * Backward-compatible alias that returns Spellbook topic content for Floor 1-3 topics (1..17).
 */
export function getFloor1TopicContent(
  topicId: string | number
): (SpellbookTopicContent & { floorId: number }) | undefined {
  return getTopicContent(topicId);
}

export interface EnrichedSpell extends Floor1Spell {
  topicId: number;
  floorId: number;
  roadmapTopicId: string;
  summary: string;
}

export function getSpellsByFloor(floorId: 1 | 2 | 3): EnrichedSpell[] {
  const floorData = SPELLBOOK_FLOORS[floorId];
  if (!floorData) return [];
  return floorData.topics.map((t) => ({
    ...t.spell,
    topicId: t.topicId,
    floorId,
    roadmapTopicId: getRoadmapTopicId(t.topicId),
    summary: t.scroll.paragraphs[0] || '',
  }));
}

export function getAllSpells(): EnrichedSpell[] {
  return [...getSpellsByFloor(1), ...getSpellsByFloor(2), ...getSpellsByFloor(3)];
}

export function getAllFloor1Spells(): EnrichedSpell[] {
  return getSpellsByFloor(1);
}

/**
 * Resolves the effective spellId for a boss phase and variant.
 * Supports variant-level spellId overrides (e.g., Floor 2 Phase 6 "Gema Lantai 1").
 */
export function getEffectiveBossSpellId(
  phaseData: BossPhaseContent,
  variantData?: BossVariantContent
): string {
  if (variantData?.spellId) {
    return variantData.spellId;
  }
  return phaseData.spellId;
}

/**
 * Shuffles answer options at render time while keeping correctness mapped by option identity.
 */
export function shuffleOptionsByIdentity(
  options: string[],
  correctIndex: number,
  rng: () => number = Math.random
): ShuffledOption[] {
  const mapped: ShuffledOption[] = options.map((text, idx) => ({
    optionId: `opt-${idx}`,
    originalIndex: idx,
    text,
    isCorrect: idx === correctIndex,
  }));

  for (let i = mapped.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = mapped[i];
    mapped[i] = mapped[j];
    mapped[j] = temp;
  }

  return mapped;
}

/**
 * Helper to pick 1 question from a candidate list of topics using Dojo weighting:
 * weight = max(1, 1 + 2*wrongCount - correctStreak)
 */
function pickWeightedEchoQuestion(
  topics: { topic: SpellbookTopicContent; floorId: number }[],
  questionStats: Record<string, QuestionStat>,
  rng: () => number
): { topic: SpellbookTopicContent; floorId: number; question: Floor1QuizQuestion } | null {
  const pool: {
    topic: SpellbookTopicContent;
    floorId: number;
    question: Floor1QuizQuestion;
    weight: number;
  }[] = [];

  for (const item of topics) {
    for (const q of item.topic.quiz) {
      const weight = calculateQuestionWeight(questionStats[q.id]);
      pool.push({
        topic: item.topic,
        floorId: item.floorId,
        question: q,
        weight,
      });
    }
  }

  if (pool.length === 0) return null;

  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * totalWeight;
  for (let i = 0; i < pool.length; i++) {
    roll -= pool[i].weight;
    if (roll <= 0) {
      return pool[i];
    }
  }
  return pool[pool.length - 1];
}

/**
 * Builds the battle question deck for a Spellbook room (Floor 1 or Floor 2):
 * - 5 questions from the room's topic (shuffled)
 * - Plus 1 "Gema Masa Lalu" echo question:
 *   - Floor 1: drawn from previously defeated Floor 1 topics.
 *   - Floor 2+: drawn from defeated topics of EARLIER floors with 60% probability
 *     and from defeated topics of the CURRENT floor with 40% probability
 *     (falling back to whichever pool has defeated topics available),
 *     weighted by the Dojo formula weight = max(1, 1 + 2*wrongCount - correctStreak).
 */
export function buildBattleDeck(
  topicId: string | number,
  completedRoomIds: string[],
  questionStats: Record<string, QuestionStat> = {},
  rng: () => number = Math.random
): PreparedBattleQuestion[] {
  const topicContent = getTopicContent(topicId);
  if (!topicContent) return [];

  const currentFloorId = topicContent.floorId;
  const currentRoadmapId = getRoadmapTopicId(topicContent.topicId);

  // Prepare and shuffle the 5 topic questions
  const baseQuestions: PreparedBattleQuestion[] = topicContent.quiz.map((q) => ({
    id: q.id,
    topicId: topicContent.topicId,
    floorId: currentFloorId,
    roadmapTopicId: currentRoadmapId,
    spellId: topicContent.spell.id,
    spellName: topicContent.spell.name,
    difficulty: q.difficulty,
    question: q.question,
    explanation: q.explanation,
    isEcho: false,
    shuffledOptions: shuffleOptionsByIdentity(q.options, q.correctIndex, rng),
  }));

  for (let i = baseQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = baseQuestions[i];
    baseQuestions[i] = baseQuestions[j];
    baseQuestions[j] = tmp;
  }

  // Separate defeated candidate topics into earlierFloors vs currentFloor
  const earlierFloorTopics: { topic: SpellbookTopicContent; floorId: number }[] = [];
  const currentFloorTopics: { topic: SpellbookTopicContent; floorId: number }[] = [];

  for (const [fKey, fContent] of Object.entries(SPELLBOOK_FLOORS)) {
    const fId = Number(fKey);
    for (const t of fContent.topics) {
      const rId = getRoadmapTopicId(t.topicId);
      if (rId === currentRoadmapId || !completedRoomIds.includes(rId)) {
        continue;
      }
      if (fId < currentFloorId) {
        earlierFloorTopics.push({ topic: t, floorId: fId });
      } else if (fId === currentFloorId) {
        currentFloorTopics.push({ topic: t, floorId: fId });
      }
    }
  }

  let chosenPool: { topic: SpellbookTopicContent; floorId: number }[] = [];
  if (currentFloorId >= 2) {
    if (earlierFloorTopics.length > 0 && currentFloorTopics.length > 0) {
      // 60% probability earlier floors, 40% probability current floor
      chosenPool = rng() < 0.6 ? earlierFloorTopics : currentFloorTopics;
    } else if (earlierFloorTopics.length > 0) {
      chosenPool = earlierFloorTopics;
    } else {
      chosenPool = currentFloorTopics;
    }
  } else {
    chosenPool = currentFloorTopics;
  }

  if (chosenPool.length === 0) {
    return baseQuestions;
  }

  const picked = pickWeightedEchoQuestion(chosenPool, questionStats, rng);
  if (!picked) {
    return baseQuestions;
  }

  const echoQuestion: PreparedBattleQuestion = {
    id: picked.question.id,
    topicId: picked.topic.topicId,
    floorId: picked.floorId,
    roadmapTopicId: getRoadmapTopicId(picked.topic.topicId),
    spellId: picked.topic.spell.id,
    spellName: picked.topic.spell.name,
    difficulty: picked.question.difficulty,
    question: picked.question.question,
    explanation: picked.question.explanation,
    isEcho: true,
    shuffledOptions: shuffleOptionsByIdentity(
      picked.question.options,
      picked.question.correctIndex,
      rng
    ),
  };

  // Insert echo question at a random position (0..baseQuestions.length)
  const insertIdx = Math.floor(rng() * (baseQuestions.length + 1));
  const result = [...baseQuestions];
  result.splice(insertIdx, 0, echoQuestion);
  return result;
}

/**
 * Backward-compatible wrapper for buildBattleDeck.
 */
export function buildFloor1BattleDeck(
  topicId: string | number,
  completedRoomIds: string[],
  rng: () => number = Math.random,
  questionStats: Record<string, QuestionStat> = {}
): PreparedBattleQuestion[] {
  return buildBattleDeck(topicId, completedRoomIds, questionStats, rng);
}

/**
 * Evaluates Spellbook battle pass/fail:
 * Pass = at least 4 of the 5 topic questions correct, AND self-assessment checkbox ticked.
 * Echo question never affects pass/fail.
 */
export function evaluateFloor1Battle(
  topicCorrectCount: number,
  topicTotalCount: number = 5
): { passedQuiz: boolean; scorePercent: number } {
  const safeTotal = Math.max(1, topicTotalCount);
  const scorePercent = Math.round((topicCorrectCount / safeTotal) * 100);
  const passedQuiz = topicCorrectCount >= 4;
  return { passedQuiz, scorePercent };
}

/**
 * Critical-hit XP bonus: +10% of room XP, applied once per room.
 */
export function calculateRoomCritBonusXP(
  baseRoomXP: number,
  critBonusAlreadyClaimed: boolean
): number {
  if (critBonusAlreadyClaimed) return 0;
  return Math.round(baseRoomXP * CRIT_ROOM_BONUS_RATE);
}

/**
 * Dojo Latihan weight formula:
 * weight = max(1, 1 + 2*wrongCount - correctStreak)
 */
export function calculateQuestionWeight(stat?: QuestionStat): number {
  const wrongCount = stat?.wrong ?? 0;
  const correctStreak = stat?.correctStreak ?? 0;
  return Math.max(1, 1 + 2 * wrongCount - correctStreak);
}

export function updateQuestionStat(
  prev: QuestionStat | undefined,
  isCorrect: boolean
): QuestionStat {
  const seen = (prev?.seen ?? 0) + 1;
  if (isCorrect) {
    return {
      seen,
      wrong: prev?.wrong ?? 0,
      correctStreak: (prev?.correctStreak ?? 0) + 1,
    };
  }
  return {
    seen,
    wrong: (prev?.wrong ?? 0) + 1,
    correctStreak: 0,
  };
}

/**
 * Selects up to 8 questions from defeated Floor 1 & Floor 2 topics, weighted by history:
 * weight = max(1, 1 + 2*wrongCount - correctStreak)
 */
export function buildDojoQuestionSet(
  completedRoomIds: string[],
  questionStats: Record<string, QuestionStat>,
  maxQuestions: number = 8,
  rng: () => number = Math.random
): (PreparedBattleQuestion & { weight: number })[] {
  const pool: {
    topic: SpellbookTopicContent;
    floorId: number;
    question: Floor1QuizQuestion;
    weight: number;
  }[] = [];

  for (const [fKey, fContent] of Object.entries(SPELLBOOK_FLOORS)) {
    const floorId = Number(fKey);
    for (const t of fContent.topics) {
      if (!completedRoomIds.includes(getRoadmapTopicId(t.topicId))) continue;
      for (const q of t.quiz) {
        const weight = calculateQuestionWeight(questionStats[q.id]);
        pool.push({ topic: t, floorId, question: q, weight });
      }
    }
  }

  const selected: (PreparedBattleQuestion & { weight: number })[] = [];
  const remaining = [...pool];
  const targetCount = Math.min(maxQuestions, remaining.length);

  for (let k = 0; k < targetCount; k++) {
    const totalWeight = remaining.reduce((sum, item) => sum + item.weight, 0);
    let roll = rng() * totalWeight;
    let chosenIdx = 0;
    for (let i = 0; i < remaining.length; i++) {
      roll -= remaining[i].weight;
      if (roll <= 0) {
        chosenIdx = i;
        break;
      }
    }
    const [picked] = remaining.splice(chosenIdx, 1);
    selected.push({
      id: picked.question.id,
      topicId: picked.topic.topicId,
      floorId: picked.floorId,
      roadmapTopicId: getRoadmapTopicId(picked.topic.topicId),
      spellId: picked.topic.spell.id,
      spellName: picked.topic.spell.name,
      difficulty: picked.question.difficulty,
      question: picked.question.question,
      explanation: picked.question.explanation,
      isEcho: false,
      weight: picked.weight,
      shuffledOptions: shuffleOptionsByIdentity(
        picked.question.options,
        picked.question.correctIndex,
        rng
      ),
    });
  }

  return selected;
}

/**
 * Boss variant selection rule:
 * "Use variant A first, B after a miss, and alternate on later retries."
 */
export function getNextBossVariantIndex(previousVariantIndex?: number): 0 | 1 {
  if (previousVariantIndex === undefined) return 0; // Variant A first
  return previousVariantIndex === 0 ? 1 : 0; // Alternate A <-> B
}

/**
 * Boss faint recovery rule:
 * "At 0 hearts: faint, hearts refill, the boss regains one segment (never above full), then retry."
 */
export function recoverBossAfterFaint(clearedPhases: number[]): number[] {
  if (clearedPhases.length === 0) return [];
  return clearedPhases.slice(0, clearedPhases.length - 1);
}
