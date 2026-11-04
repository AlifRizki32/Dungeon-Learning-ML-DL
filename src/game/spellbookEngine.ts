import floor1ContentRaw from '../data/floor1.content.json';
import floor2ContentRaw from '../data/floor2.content.json';
import floor3ContentRaw from '../data/floor3.content.json';
import floor4ContentRaw from '../data/floor4.content.json';
import floor5ContentRaw from '../data/floor5.content.json';
import floor6ContentRaw from '../data/floor6.content.json';
import { ALL_TOPICS } from '../data/roadmap.js';

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
  relic?: string;
  evidenceHint?: string;
  miniLab?: 'neuron' | 'softmax' | 'quant' | 'latency';
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
export const FLOOR4_CONTENT: FloorContentFile = floor4ContentRaw as FloorContentFile;
export const FLOOR5_CONTENT: FloorContentFile = floor5ContentRaw as FloorContentFile;

export const SPELLBOOK_FLOORS: Record<number, FloorContentFile> = {
  1: FLOOR1_CONTENT,
  2: FLOOR2_CONTENT,
  3: FLOOR3_CONTENT,
  4: FLOOR4_CONTENT,
  5: FLOOR5_CONTENT,
};

export const ECHO_BONUS_XP = 5;
export const CRIT_ROOM_BONUS_RATE = 0.1; // +10% of room XP, once per room
export const DOJO_CORRECT_XP = 2;
export const DOJO_DAILY_XP_CAP = 20;
export const INITIAL_BOSS_POTIONS = 2;
export const FLOOR3_BOSS_POTIONS = 3;
export const FLOOR5_BOSS_POTIONS = 3;
export const MAX_HEARTS = 3;

export function getInitialBossPotions(floorId: number): number {
  if (floorId === 3) return FLOOR3_BOSS_POTIONS;
  if (floorId === 5) return FLOOR5_BOSS_POTIONS;
  return INITIAL_BOSS_POTIONS;
}

export function getTotalBossPhases(floorId: number): number {
  return SPELLBOOK_FLOORS[floorId]?.boss.phases.length ?? 6;
}

export interface SpellVisualTheme {
  spellId: string;
  floorId: 1 | 2 | 3 | 4 | 5;
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
    | 'schedule'
    | 'pipeline'
    | 'quantize'
    | 'edge';
  runeSymbol: string;
}

/**
 * 20 distinct spell colors across Floors 1-4:
 * Floor 1 (s1..s6): #38d864, #3ac5eb, #f5b935, #9b5de5, #e83b47, #f4f1ea
 * Floor 2 (s7..s11): #1d8a3d, #a87312, #94a3b8, #64748b, #5c4e99
 * Floor 3 (s12..s17): #b3aad1, #941923, #0284c7, #b45309, #fcd34d, #7e22ce
 * Floor 4 (s18..s20): #0891b2, #2dd4bf, #fb923c
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
  s18: {
    spellId: 's18',
    floorId: 4,
    color: '#0891b2', // Telemetry Deep Cyan
    bgColor: '#08202b',
    animStyle: 'pipeline',
    runeSymbol: 'API · Drift · RPS',
  },
  s19: {
    spellId: 's19',
    floorId: 4,
    color: '#2dd4bf', // Silicon Quant Aqua
    bgColor: '#092424',
    animStyle: 'quantize',
    runeSymbol: 'FP32 → INT8 · KB',
  },
  s20: {
    spellId: 's20',
    floorId: 4,
    color: '#fb923c', // Sensor Beacon Orange
    bgColor: '#281508',
    animStyle: 'edge',
    runeSymbol: 'Σ t_tahap ≤ batas',
  },
  s21: {
    spellId: 's21',
    floorId: 5,
    color: '#f43f5e', // Crimson Rose Git
    bgColor: '#280a14',
    animStyle: 'code',
    runeSymbol: 'git commit · pytest',
  },
  s22: {
    spellId: 's22',
    floorId: 5,
    color: '#10b981', // Viridian Data Lens
    bgColor: '#06241b',
    animStyle: 'prisms',
    runeSymbol: 'w_k = N/(K·N_k)',
  },
  s23: {
    spellId: 's23',
    floorId: 5,
    color: '#f97316', // Tangerine Circuit Copper
    bgColor: '#291205',
    animStyle: 'lightning',
    runeSymbol: 'ADC 2^N · MQTT QoS',
  },
  s24: {
    spellId: 's24',
    floorId: 5,
    color: '#c084fc', // Amethyst Honest Scale
    bgColor: '#1f0d2e',
    animStyle: 'grid',
    runeSymbol: 'Δ% Baseline · Seed',
  },
  s25: {
    spellId: 's25',
    floorId: 5,
    color: '#eab308', // Amber Backup Shield
    bgColor: '#261d05',
    animStyle: 'forge',
    runeSymbol: 'P(A∩B) = P(A)·P(B)',
  },
  s26: {
    spellId: 's26',
    floorId: 5,
    color: '#ec4899', // Magenta Stage Mic
    bgColor: '#290a1d',
    animStyle: 'beam',
    runeSymbol: '10m Pitch · Q&A',
  },
  s27: {
    spellId: 's27',
    floorId: 5,
    color: '#38bdf8', // Sky Scope Map
    bgColor: '#082032',
    animStyle: 'schedule',
    runeSymbol: 'MVP · Jam × (1−buf)',
  },
  s28: {
    spellId: 's28',
    floorId: 5,
    color: '#84cc16', // Lime Security Lock
    bgColor: '#162407',
    animStyle: 'constellation',
    runeSymbol: 'TLS · OWASP IoT',
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

export interface QuantMiniLabResult {
  bytesPerParameter: 1 | 4;
  modelSizeBytes: number;
  modelSizeKB: number;
  fitsInFlash: boolean;
  fitsInRam: boolean;
  flashStatus: string;
  ramStatus: string;
}

/**
 * Topic 19 ("quant") Mini-Lab: "Lab Anggaran Memori"
 * 1 KB = 1.000 byte; float32 = 4 byte, int8 = 1 byte.
 */
export function computeQuantMiniLab(
  parameterCount: number,
  dataType: 'float32' | 'int8',
  flashKB: number,
  ramKB: number,
  arenaKB: number
): QuantMiniLabResult {
  const bytesPerParameter: 1 | 4 = dataType === 'float32' ? 4 : 1;
  const modelSizeBytes = parameterCount * bytesPerParameter;
  const modelSizeKB = modelSizeBytes / 1000;
  const fitsInFlash = modelSizeKB <= flashKB;
  const fitsInRam = arenaKB <= ramKB;
  return {
    bytesPerParameter,
    modelSizeBytes,
    modelSizeKB,
    fitsInFlash,
    fitsInRam,
    flashStatus: fitsInFlash ? 'Muat di flash' : 'Tidak muat di flash',
    ramStatus: fitsInRam ? 'Muat di RAM' : 'Tidak muat di RAM',
  };
}

export interface LatencyMiniLabResult {
  totalMs: number;
  limitMs: number;
  withinBudget: boolean;
  deltaMs: number;
  statusText: string;
}

/**
 * Topic 20 ("latency") Mini-Lab: "Lab Anggaran Latensi"
 * total = akuisisi + pra-pemrosesan + inferensi + pengiriman
 * Shows "Sisa X ms" when total <= limit, or "Melebihi X ms" when total > limit.
 */
export function computeLatencyMiniLab(
  akuisisiMs: number,
  prapemrosesanMs: number,
  inferensiMs: number,
  pengirimanMs: number,
  limitMs: number
): LatencyMiniLabResult {
  const totalMs = akuisisiMs + prapemrosesanMs + inferensiMs + pengirimanMs;
  const withinBudget = totalMs <= limitMs;
  const deltaMs = Math.abs(limitMs - totalMs);
  const statusText = withinBudget ? `Sisa ${deltaMs} ms` : `Melebihi ${deltaMs} ms`;
  return {
    totalMs,
    limitMs,
    withinBudget,
    deltaMs,
    statusText,
  };
}

export function getNumericTopicId(topicId: string | number): number | null {
  if (typeof topicId === 'number') {
    return topicId >= 1 && topicId <= 28 ? topicId : null;
  }
  const match = /^topic-(\d+)$/.exec(topicId);
  if (!match) return null;
  const num = Number(match[1]);
  return num >= 1 && num <= 28 ? num : null;
}

export function getRoadmapTopicId(numericTopicId: number): string {
  return `topic-${numericTopicId}`;
}

export function getFloorForTopicNumber(numericTopicId: number): number {
  if (numericTopicId >= 1 && numericTopicId <= 6) return 1;
  if (numericTopicId >= 7 && numericTopicId <= 11) return 2;
  if (numericTopicId >= 12 && numericTopicId <= 17) return 3;
  if (numericTopicId >= 18 && numericTopicId <= 20) return 4;
  if (numericTopicId >= 21 && numericTopicId <= 28) return 5;
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
 * Backward-compatible alias that returns Spellbook topic content for Floor 1-5 topics (1..28).
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

export function getSpellsByFloor(floorId: 1 | 2 | 3 | 4 | 5): EnrichedSpell[] {
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
  return [
    ...getSpellsByFloor(1),
    ...getSpellsByFloor(2),
    ...getSpellsByFloor(3),
    ...getSpellsByFloor(4),
    ...getSpellsByFloor(5),
  ];
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

  // Separate defeated candidate topics into earlierFloors vs currentFloor vs allDefeatedTopics
  const earlierFloorTopics: { topic: SpellbookTopicContent; floorId: number }[] = [];
  const currentFloorTopics: { topic: SpellbookTopicContent; floorId: number }[] = [];
  const allDefeatedTopics: { topic: SpellbookTopicContent; floorId: number }[] = [];

  for (const [fKey, fContent] of Object.entries(SPELLBOOK_FLOORS)) {
    const fId = Number(fKey);
    for (const t of fContent.topics) {
      const rId = getRoadmapTopicId(t.topicId);
      if (rId === currentRoadmapId || !completedRoomIds.includes(rId)) {
        continue;
      }
      allDefeatedTopics.push({ topic: t, floorId: fId });
      if (fId < currentFloorId) {
        earlierFloorTopics.push({ topic: t, floorId: fId });
      } else if (fId === currentFloorId) {
        currentFloorTopics.push({ topic: t, floorId: fId });
      }
    }
  }

  let chosenPool: { topic: SpellbookTopicContent; floorId: number }[] = [];
  if (currentFloorId === 5) {
    // Floor 5 Guild Hall echo rule: draw from ALL defeated topics of ANY floor (1-5).
    // If nothing has been defeated yet, skip the echo (5 questions total).
    chosenPool = allDefeatedTopics;
  } else if (currentFloorId >= 2) {
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

// ============================================================================
// Floor 6 ("Menara Master") Types, Content & Pure Logic
// ============================================================================

export interface Floor6QuestStep {
  id: string;
  text: string;
}

export interface Floor6Quest {
  id: string;
  title: string;
  summary: string;
  xp: number;
  relic: string;
  evidenceHint: string;
  steps: Floor6QuestStep[];
  references: Floor1Reference[];
}

export interface Floor6ReflectionPrompt {
  id: string;
  text: string;
}

export interface Floor6ContentFile {
  reviewStatus: string;
  floor: number;
  stepsAreSuggestions: boolean;
  intro: string;
  specializationNote: string;
  specializations: string[];
  quests: Floor6Quest[];
  guardian: {
    name: string;
    intro: string;
    reflectionPrompts: Floor6ReflectionPrompt[];
  };
  certificate: {
    title: string;
    honestNote: string;
    closing: string;
  };
}

export const FLOOR6_CONTENT: Floor6ContentFile = floor6ContentRaw as Floor6ContentFile;

export type TowerQuestStatus = 'Belum dimulai' | 'Berjalan' | 'Selesai';

export interface TowerRelicMeta {
  id: string;
  questId: string;
  name: string;
  source: string;
  iconType: string;
  description: string;
}

export const TOWER_RELICS: TowerRelicMeta[] = FLOOR6_CONTENT.quests.map((q, idx) => ({
  id: `relic-${q.id}`,
  questId: q.id,
  name: q.relic,
  source: `Menara Master — Lantai Menara ${idx + 1}: ${q.title}`,
  iconType: `tower-${q.id}`,
  description: q.summary,
}));

export function getTowerRelicId(questId: string): string {
  return `relic-${questId}`;
}

export function getTowerQuestById(questId: string): Floor6Quest | undefined {
  return FLOOR6_CONTENT.quests.find((q) => q.id === questId);
}

export function getTowerQuestStepProgress(
  questId: string,
  towerSteps: Record<string, Record<string, boolean>>
): { ticked: number; total: number } {
  const quest = getTowerQuestById(questId);
  if (!quest) return { ticked: 0, total: 0 };
  const stepMap = towerSteps[questId] || {};
  const ticked = quest.steps.filter((s) => Boolean(stepMap[s.id])).length;
  return { ticked, total: quest.steps.length };
}

export function getTowerQuestStatus(
  questId: string,
  towerSteps: Record<string, Record<string, boolean>>,
  towerCompleted: string[]
): TowerQuestStatus {
  if (towerCompleted.includes(questId)) {
    return 'Selesai';
  }
  const { ticked } = getTowerQuestStepProgress(questId, towerSteps);
  if (ticked > 0) {
    return 'Berjalan';
  }
  return 'Belum dimulai';
}

/**
 * Ticking step m6s3 ("Pilih satu spesialisasi di aplikasi ini (tersimpan di perangkatmu)")
 * is allowed only after a specialization is chosen.
 */
export function canTickTowerStep(
  questId: string,
  stepId: string,
  specialization: string | null
): boolean {
  if (questId === 'm6' && stepId === 'm6s3') {
    return Boolean(specialization && specialization.trim().length > 0);
  }
  return true;
}

/**
 * Checks if a Floor 6 quest can be marked complete:
 * - Not already completed
 * - All steps for the quest are ticked
 * - For m6, specialization must also be non-empty
 */
export function canCompleteTowerQuest(
  questId: string,
  towerSteps: Record<string, Record<string, boolean>>,
  towerCompleted: string[],
  specialization: string | null
): boolean {
  if (towerCompleted.includes(questId)) return false;
  const quest = getTowerQuestById(questId);
  if (!quest) return false;
  if (questId === 'm6' && (!specialization || !specialization.trim())) {
    return false;
  }
  const stepMap = towerSteps[questId] || {};
  return quest.steps.every((s) => Boolean(stepMap[s.id]));
}

/**
 * Cermin Puncak unlocks when all 7 Floor 6 quests are completed.
 */
export function canUnlockCerminPuncak(towerCompleted: string[]): boolean {
  return FLOOR6_CONTENT.quests.every((q) => towerCompleted.includes(q.id));
}

/**
 * Checks whether all 5 reflection prompts have non-empty answers.
 */
export function areAllReflectionsAnswered(reflections: Record<string, string>): boolean {
  return FLOOR6_CONTENT.guardian.reflectionPrompts.every(
    (p) => typeof reflections[p.id] === 'string' && reflections[p.id].trim().length > 0
  );
}

export interface CertificateSummaryInput {
  playerName: string;
  level: number;
  levelTitle: string;
  roomsDefeated: number;
  totalRooms: number;
  bossesDefeated: number;
  totalBosses: number;
  relicsCount: number;
  totalRelics: number;
  towerQuestsCompleted: number;
  totalTowerQuests: number;
  specialization: string | null;
  issuedDateFormatted: string;
}

/**
 * Builds the plain-text summary for "Salin ringkasan" on the Certificate ("Piagam").
 * Uses exact certificate.title, certificate.honestNote, and certificate.closing from floor6.content.json.
 */
export function formatCertificateSummaryText(input: CertificateSummaryInput): string {
  const cert = FLOOR6_CONTENT.certificate;
  const specText =
    input.specialization && input.specialization.trim()
      ? input.specialization.trim()
      : 'Belum dipilih';
  return [
    `=== ${cert.title.toUpperCase()} ===`,
    `Nama Petualang: ${input.playerName}`,
    `Level & Gelar: Level ${input.level} — ${input.levelTitle}`,
    `Ruang/Quest Dikalahkan: ${input.roomsDefeated}/${input.totalRooms}`,
    `Boss Dikalahkan: ${input.bossesDefeated}/${input.totalBosses}`,
    `Jumlah Relik: ${input.relicsCount}/${input.totalRelics}`,
    `Quest Menara Selesai: ${input.towerQuestsCompleted}/${input.totalTowerQuests}`,
    `Spesialisasi Pilihan: ${specText}`,
    `Tanggal Terbit: ${input.issuedDateFormatted}`,
    '',
    cert.honestNote,
    cert.closing,
  ].join('\n');
}

const MONSTER_DIALOGUE_BY_TOPIC: Record<string, string> = {
  'topic-1':
    'Hahaha! Banyak petualang tersesat saat melihat rumus panjang, padahal rahasianya hanya menyederhanakan pecahan dan membaca kemiringan grafik!',
  'topic-2':
    'Jangan tertipu oleh angka rata-rata semata! Buktikan dulu apakah kamu tahu cara memperbarui peluang lewat Teorema Bayes saat bukti baru muncul!',
  'topic-3':
    'Nilai p-value kecil sering disalahartikan oleh pemula yang terburu-buru! Beranikah kamu menjelaskan maknanya tanpa terjebak ilusi kebetulan?',
  'topic-4':
    'Setiap baris dan kolom di tubuhku adalah ruang vektor! Jika kamu tak paham mengapa matriks dikalikan, langkahmu di dunia ML akan terhenti di sini!',
  'topic-5':
    'Rasakan curamnya lereng fungsi ini! Tanpa arah gradien dan aturan rantai, kamu hanya akan berputar-putar di puncak bukit error!',
  'topic-6':
    'Tabel dataku penuh nilai kosong dan angka berantakan! Bersihkan aku dengan NumPy dan pandas, lalu tunjukkan wujud asliku lewat grafik matplotlib!',
  'topic-7':
    'Akar-akarku membelah tanah menjadi kawasan latih, validasi, dan uji yang tak boleh saling bocor! Beranikah kau melangkah tanpa mengintip masa depan?',
  'topic-8':
    'Di hutan yang timpang ini, akurasi semu hanyalah fatamorgana daun kering! Tunjukkan keseimbangan presisi dan recall-mu sebelum melintas!',
  'topic-9':
    'Setiap dahan di tubuhku bercabang mengikuti penurunan impuritas Gini! Tebaslah ambang batas keputusanku jika kau paham rahasia kurva sigmoid!',
  'topic-10':
    'Kayu mentah takkan menjadi perisai kokoh tanpa pembersihan dan penyetaraan skala! Hanya fitur yang diolah tanpa kebocoran yang sanggup menembus kulitku!',
  'topic-11':
    'Tanpa label penunjuk jalan, gugus-gugus spora di rimba ini berkumpul menurut jarak terdekat! Temukan pusat klaster dan sumbu variansi utamaku!',
  'topic-12':
    'Denyut sinapsisku memadukan bobot dan bias sebelum membangkitkan gerbang aktivasi non-linear! Tanpa aktivasi yang tepat, lapisanku hanyalah bayangan garis lurus biasa!',
  'topic-13':
    'Aliran gradien di tubuhku tak pernah lupa dijumlahkan jika kau lalai mengosongkannya! Tunjukkan ritme lima langkah latihan PyTorch sebelum melangkah lebih dalam!',
  'topic-14':
    'Mataku memindai setiap petak piksel dengan filter lokal yang berbagi bobot di seluruh ruang! Bisakah kau menghitung ukuran peta fiturku setelah melintasi stride dan pooling?',
  'topic-15':
    'Ingatanku mengalir dari langkah waktu ke langkah waktu melalui keadaan tersembunyi yang berantai! Waspadalah terhadap gradien yang meredup di lorong urutan panjang ini!',
  'topic-16':
    'Setiap kepalaku menimbang Query dan Key untuk memusatkan perhatian langsung ke bagian urutan terpenting! Bagi skor dot-product dengan akar dimensi agar bobot softmax-ku tidak membeku!',
  'topic-17':
    'Hanya penjadwalan laju belajar, pencari AdamW, dan perisai regularisasi yang sanggup menjaga latihanku tetap stabil! Buktikan kau mampu meredam overfitting di kuil terdalam ini!',
  'topic-18':
    'Kontainer serverku hanya menerima model yang dikemas rapi beserta langkah prapemrosesannya! Waspadalah terhadap pergeseran distribusi data saat sistemmu berjalan di produksi!',
  'topic-19':
    'Sirkuit mikrokontrolerku hanya menyediakan ruang kilobyte yang sempit di flash dan RAM! Padatkan bobot float32-mu menjadi int8 dan pastikan tensor arena muat sebelum melintas!',
  'topic-20':
    'Dari pembacaan sensor hingga aksi perangkat, setiap milidetik dihitung dalam anggaran latensi total! Bangunlah pipa ujung-ke-ujung yang tangguh dan temukan penghambat utamanya!',
  'topic-21':
    'Satu commit raksasa tanpa pesan jelas atau kunci rahasia yang bocor di riwayat Git akan mengacaukan proyekmu! Tunjukkan cabang yang rapi dan barisan tes otomatis yang lulus!',
  'topic-22':
    'Data sensor dunia nyata penuh nilai hilang, derau, dan kelas yang timpang! Selidiki penyebab kejanggalan data dan catat kualitasnya sebelum kau berani melatih model!',
  'topic-23':
    'Tegangan ADC, kalibrasi dua titik, dan tingkat QoS MQTT menentukan apakah perangkatmu bertahan 24 jam! Hitung daya bateraimu dengan cermat sebelum sirkuit ini padam!',
  'topic-24':
    'Skor tinggi tanpa pembanding hanyalah ilusi jika kalah oleh baseline sederhana! Buktikan peningkatan relatif modelmu dan catat seed eksperimen agar hasilnya jujur serta dapat diulang!',
  'topic-25':
    'Semakin banyak komponen saat demo, semakin besar peluang ada yang gagal di panggung! Siapkan log yang jelas, langkah reproduksi minimal, serta rekaman cadangan sebelum hari-H!',
  'topic-26':
    'Waktu sepuluh menit di panggung akan habis jika kau tenggelam dalam tabel mentah! Sampaikan satu pesan per slide dan jawab pertanyaan sulit dengan jujur beserta data analisis kesalahan!',
  'topic-27':
    'Fitur tambahan yang terus menyelinap akan menenggelamkan proyek solomu sebelum selesai! Kunci rencana satu halaman dengan batas lingkup tertulis dan fokuslah menuntaskan MVP!',
  'topic-28':
    'Kata sandi bawaan dan broker terbuka adalah celah empuk bagi penyusup perangkat IoT! Terapkan enkripsi, minimisasi data pengguna, dan siapkan jawaban keamanan untuk setiap proyekmu!',
};

/**
 * Retrieve the Floor monster's short in-world dialogue (<= 2 sentences) if available.
 */
export function getMonsterDialogue(topicId: string, fallbackFlavor: string = ''): string {
  return MONSTER_DIALOGUE_BY_TOPIC[topicId] || fallbackFlavor;
}

export interface WeakTopicSummary {
  topicId: string;
  number: number;
  floorId: number;
  name: string;
  bestScorePercent: number;
  needsReview: boolean;
}

/**
 * Build the sorted list of lowest-scoring attempted topics for the Dashboard "Kelemahan" section.
 */
export function getWeakestTopics(
  quizBestScores: Record<string, number>,
  maxItems = 5
): WeakTopicSummary[] {
  const entries = Object.entries(quizBestScores)
    .map(([topicId, bestScorePercent]) => {
      const topic = ALL_TOPICS.find((t) => t.id === topicId);
      if (!topic) return null;
      return {
        topicId,
        number: topic.number,
        floorId: topic.floorId,
        name: topic.name,
        bestScorePercent,
        needsReview: bestScorePercent < 100,
      };
    })
    .filter((item): item is WeakTopicSummary => item !== null);

  entries.sort((a, b) => {
    if (a.bestScorePercent !== b.bestScorePercent) {
      return a.bestScorePercent - b.bestScorePercent;
    }
    return a.number - b.number;
  });

  return entries.slice(0, maxItems);
}


