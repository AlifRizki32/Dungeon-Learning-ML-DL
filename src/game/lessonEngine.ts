import floor1LessonsRaw from '../data/lessons/floor1.lessons.json';
import floor2LessonsRaw from '../data/lessons/floor2.lessons.json';
import { getLocalDateKey } from './campTracker';

export interface LessonTerm {
  term: string;
  plain: string;
}

export interface LessonSceneLine {
  who: 'Rune' | 'Kamu' | string;
  text: string;
}

export interface LessonGuess {
  question: string;
  options: string[];
  correctIndex: number;
  reveal: string;
}

export interface DotGridGroup {
  id: string;
  count: number;
  label: string;
  subsetOf?: string;
}

export interface DotGridVisual {
  type: 'dotGrid';
  total: number;
  columns: number;
  groups: DotGridGroup[];
}

export interface BarsItem {
  id: string;
  label: string;
  value: number;
}

export interface BarsVisual {
  type: 'bars';
  items: BarsItem[];
}

export interface LinePlotVisual {
  type: 'linePlot';
  points: [number, number][];
  line?: { m: number; c: number };
}

export interface MatrixDef {
  id: string;
  rows: number[][];
  rowLabels?: string[];
  colLabels?: string[];
}

export interface MatrixGridVisual {
  type: 'matrixGrid';
  matrices: MatrixDef[];
}

export interface CodeBlockVisual {
  type: 'codeBlock';
  lines: string[];
}

export type LessonVisual =
  | DotGridVisual
  | BarsVisual
  | LinePlotVisual
  | MatrixGridVisual
  | CodeBlockVisual
  | { type: string; [key: string]: unknown };

export interface LessonStep {
  text: string;
  highlight: string[];
}

export interface ChoicePracticeActivity {
  id: string;
  type: 'choice';
  question: string;
  options: string[];
  correctIndex: number;
  why: string;
}

export interface FillNumberPracticeActivity {
  id: string;
  type: 'fillNumber';
  question: string;
  answer: number;
  tolerance: number;
  unit: string;
  why: string;
}

export interface OrderPracticeActivity {
  id: string;
  type: 'order';
  question: string;
  items: string[];
  why: string;
}

export interface MatchPair {
  left: string;
  right: string;
}

export interface MatchPracticeActivity {
  id: string;
  type: 'match';
  question: string;
  pairs: MatchPair[];
  why: string;
}

export type LessonPracticeActivity =
  | ChoicePracticeActivity
  | FillNumberPracticeActivity
  | OrderPracticeActivity
  | MatchPracticeActivity;

export interface LessonFormula {
  lines: string[];
  readAloud: string;
}

export interface LessonReviewItem {
  id: string;
  front: string;
  back: string;
}

export interface LessonChunk {
  chunkId: string;
  title: string;
  goal: string;
  terms: LessonTerm[];
  scene: LessonSceneLine[];
  guess: LessonGuess;
  visual?: LessonVisual;
  steps: LessonStep[];
  practice: LessonPracticeActivity[];
  formula: LessonFormula;
  commonMistake: string;
  summaryPrompt: string;
  reviewItems: LessonReviewItem[];
}

export interface LessonTopicEntry {
  topicId: number;
  chunks: LessonChunk[];
}

export interface FloorLessonsFile {
  reviewStatus: string;
  floor: number;
  lessonVersion: number;
  guide: { name: string; role: string };
  topics: LessonTopicEntry[];
}

export interface LessonChunkProgress {
  done: boolean;
  attempts: number;
  attemptedActivities?: string[];
}

export interface ReviewQueueEntry {
  box: number;
  due: string;
}

export interface EnrichedReviewItem extends LessonReviewItem {
  chunkId: string;
  chunkTitle: string;
  topicId: number;
  box: number;
  due: string;
}

export const FLOOR1_LESSONS: FloorLessonsFile =
  floor1LessonsRaw as unknown as FloorLessonsFile;
export const FLOOR2_LESSONS: FloorLessonsFile =
  floor2LessonsRaw as unknown as FloorLessonsFile;

const ALL_LESSON_FILES: FloorLessonsFile[] = [FLOOR1_LESSONS, FLOOR2_LESSONS];

/**
 * Merged map of topicId (1..28) -> LessonChunk[]
 */
const CHUNKS_BY_TOPIC_ID: Map<number, LessonChunk[]> = new Map();
const REVIEW_ITEMS_BY_ID: Map<
  string,
  LessonReviewItem & { chunkId: string; chunkTitle: string; topicId: number }
> = new Map();

for (const file of ALL_LESSON_FILES) {
  for (const t of file.topics || []) {
    const existing = CHUNKS_BY_TOPIC_ID.get(t.topicId) || [];
    const merged = [...existing, ...(t.chunks || [])];
    CHUNKS_BY_TOPIC_ID.set(t.topicId, merged);

    for (const chunk of t.chunks || []) {
      for (const item of chunk.reviewItems || []) {
        REVIEW_ITEMS_BY_ID.set(item.id, {
          ...item,
          chunkId: chunk.chunkId,
          chunkTitle: chunk.title,
          topicId: t.topicId,
        });
      }
    }
  }
}

export function parseNumericTopicId(topicId: string | number): number | null {
  if (typeof topicId === 'number' && Number.isInteger(topicId)) {
    return topicId;
  }
  const str = String(topicId).trim();
  const match = /^topic-(\d+)$/i.exec(str) || /^(\d+)$/.exec(str);
  if (!match) return null;
  return Number(match[1]);
}

/**
 * Returns the merged lesson chunks for a given topicId (e.g. 'topic-1' or 1).
 * Returns an empty array if the topic has no v3 lesson chunks yet (e.g. Floors 2-6).
 */
export function getLessonChunksForTopic(topicId: string | number): LessonChunk[] {
  const numId = parseNumericTopicId(topicId);
  if (numId === null) return [];
  return CHUNKS_BY_TOPIC_ID.get(numId) || [];
}

export function hasLessonChunksForTopic(topicId: string | number): boolean {
  return getLessonChunksForTopic(topicId).length > 0;
}

export function getAllReviewCatalogItems(): (LessonReviewItem & {
  chunkId: string;
  chunkTitle: string;
  topicId: number;
})[] {
  return Array.from(REVIEW_ITEMS_BY_ID.values());
}

export const getAllReviewItems = getAllReviewCatalogItems;

export function getReviewCatalogItemById(id: string) {
  return REVIEW_ITEMS_BY_ID.get(id) || null;
}

/**
 * Checks whether a single chunk is complete:
 * Every practice activity in the chunk has been attempted at least once
 * (or chunkProgress.done is already true).
 */
export function isChunkComplete(
  chunk: LessonChunk,
  progressMap: Record<string, LessonChunkProgress>
): boolean {
  const prog = progressMap[chunk.chunkId];
  if (!prog) return false;
  if (prog.done) return true;
  if (!chunk.practice || chunk.practice.length === 0) return true;
  const attempted = new Set(prog.attemptedActivities || []);
  return chunk.practice.every((act) => attempted.has(act.id));
}

/**
 * Checks whether all chunks of a topic are complete.
 */
export function areAllTopicChunksComplete(
  topicId: string | number,
  progressMap: Record<string, LessonChunkProgress>
): boolean {
  const chunks = getLessonChunksForTopic(topicId);
  if (chunks.length === 0) return true;
  return chunks.every((chunk) => isChunkComplete(chunk, progressMap));
}

// ============================================================================
// PRACTICE ACTIVITY HELPERS
// ============================================================================

export interface ShuffledChoiceOption {
  optionId: string;
  originalIndex: number;
  text: string;
  isCorrect: boolean;
}

export type ShuffledLessonChoiceOption = ShuffledChoiceOption;
export type LessonChoicePractice = ChoicePracticeActivity;
export type LessonFillNumberPractice = FillNumberPracticeActivity;
export type LessonOrderPractice = OrderPracticeActivity;
export type LessonMatchPractice = MatchPracticeActivity;

export interface ShuffledOrderItem {
  id: string;
  text: string;
  correctIndex: number;
}

export interface PreparedMatchRightOption {
  id: string;
  text: string;
  originalPairIndex: number;
}

/**
 * Shuffles choice options at render time while keeping correctness mapped by option identity.
 */
export function shuffleChoiceOptions(
  options: string[],
  correctIndex: number,
  rng: () => number = Math.random
): ShuffledChoiceOption[] {
  const items: ShuffledChoiceOption[] = options.map((text, idx) => ({
    optionId: `opt-${idx}`,
    originalIndex: idx,
    text,
    isCorrect: idx === correctIndex,
  }));

  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
  return items;
}

/**
 * Parses a localized numeric input string:
 * Accepts a comma or a dot as decimal separator, optional leading minus sign (- or −),
 * and surrounding whitespace.
 */
export function parseLocalizedNumber(raw: string): number | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw
    .trim()
    .replace(/\u2212/g, '-') // Unicode minus '−' -> ASCII '-'
    .replace(/,/g, '.');

  if (!cleaned) return null;
  if (!/^-?\d+(?:\.\d+)?$/.test(cleaned)) return null;

  const val = Number(cleaned);
  return Number.isFinite(val) ? val : null;
}

export function evaluateFillNumber(
  rawInput: string,
  answer: number,
  tolerance: number = 0
): {
  valid: boolean;
  numericValue: number | null;
  isCorrect: boolean;
} {
  const parsed = parseLocalizedNumber(rawInput);
  if (parsed === null) {
    return { valid: false, numericValue: null, isCorrect: false };
  }
  const diff = Math.abs(parsed - answer);
  const tol = Math.max(0, Number(tolerance) || 0);
  // Small epsilon for floating point comparisons
  const isCorrect = diff <= tol + 1e-9;
  return {
    valid: true,
    numericValue: parsed,
    isCorrect,
  };
}

/**
 * Formats bar chart numeric values with up to 3 decimals and thousands separators
 * using Indonesian locale conventions ('.' for thousands, ',' for decimals).
 * A value of 0 (or -0) always returns "0".
 */
export function formatBarValue(value: number): string {
  const num = Number(value);
  if (!Number.isFinite(num) || Object.is(num, -0) || num === 0) {
    return '0';
  }
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(num);
}

/**
 * Shuffles items for an `order` activity. Guarantees that when items.length >= 2,
 * the initial shuffled array is not identical to the already-sorted array.
 */
export function shuffleOrderItems(
  items: string[],
  rng: () => number = Math.random
): ShuffledOrderItem[] {
  const tagged = items.map((text, idx) => ({
    id: `ord-${idx}`,
    text,
    correctIndex: idx,
  }));

  if (tagged.length <= 1) return tagged;

  const copy = [...tagged];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }

  const isIdentical = copy.every((item, idx) => item.correctIndex === idx);
  if (isIdentical && copy.length >= 2) {
    const tmp = copy[0];
    copy[0] = copy[1];
    copy[1] = tmp;
  }

  return copy;
}

export function evaluateOrderAttempt(
  builtSequenceTexts: string[],
  correctItems: string[]
): {
  isCorrect: boolean;
  isAllCorrect: boolean;
  wrongPositions: number[];
} {
  const wrongPositions: number[] = [];
  for (let i = 0; i < correctItems.length; i++) {
    if (builtSequenceTexts[i] !== correctItems[i]) {
      wrongPositions.push(i);
    }
  }
  const isAllCorrect =
    builtSequenceTexts.length === correctItems.length && wrongPositions.length === 0;
  return {
    isCorrect: isAllCorrect,
    isAllCorrect,
    wrongPositions,
  };
}

export function prepareMatchRightOptions(
  pairs: MatchPair[],
  rng: () => number = Math.random
): PreparedMatchRightOption[] {
  const rightList = pairs.map((p, idx) => ({
    id: `right-${idx}`,
    text: p.right,
    originalPairIndex: idx,
  }));

  if (rightList.length <= 1) return rightList;

  const shuffled = [...rightList];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }

  const isIdentical = shuffled.every((item, idx) => item.originalPairIndex === idx);
  if (isIdentical && shuffled.length >= 2) {
    const tmp = shuffled[0];
    shuffled[0] = shuffled[1];
    shuffled[1] = tmp;
  }

  return shuffled;
}

export function evaluateMatchAttempt(
  connectionsByLeftIndex: Record<number, string>,
  pairs: MatchPair[]
): {
  isCorrect: boolean;
  isAllCorrect: boolean;
  wrongLeftIndices: number[];
} {
  const wrongLeftIndices: number[] = [];
  for (let i = 0; i < pairs.length; i++) {
    const chosenRight = connectionsByLeftIndex[i];
    if (chosenRight !== pairs[i].right) {
      wrongLeftIndices.push(i);
    }
  }
  const isAllCorrect = wrongLeftIndices.length === 0;
  return {
    isCorrect: isAllCorrect,
    isAllCorrect,
    wrongLeftIndices,
  };
}

// ============================================================================
// GLOSSARY TOKENIZER (CASE-INSENSITIVE, WHOLE WORDS)
// ============================================================================

export interface GlossaryTextSegment {
  type: 'text' | 'term';
  text: string;
  termEntry?: LessonTerm;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Splits a plain text string into segments where occurrences of `terms`
 * (case-insensitive, whole words) are marked as `{ type: 'term', text, termEntry }`.
 */
export function tokenizeTextWithGlossaryTerms(
  text: string,
  terms: LessonTerm[]
): GlossaryTextSegment[] {
  if (!text || !Array.isArray(terms) || terms.length === 0) {
    return [{ type: 'text', text: text || '' }];
  }

  // Build candidate surface patterns mapped to their LessonTerm
  const patternMap = new Map<string, LessonTerm>();
  const patterns: string[] = [];

  for (const t of terms) {
    const rawTerm = (t.term || '').trim();
    if (!rawTerm) continue;
    const lowerFull = rawTerm.toLowerCase();
    patternMap.set(lowerFull, t);
    patterns.push(escapeRegExp(rawTerm));

    // If term has a parenthetical suffix like "simpangan baku (σ)" or "korelasi (r)",
    // also match the base word/phrase "simpangan baku" or "korelasi"
    const parenIdx = rawTerm.indexOf('(');
    if (parenIdx > 0) {
      const basePart = rawTerm.slice(0, parenIdx).trim();
      if (basePart.length >= 2) {
        const lowerBase = basePart.toLowerCase();
        if (!patternMap.has(lowerBase)) {
          patternMap.set(lowerBase, t);
          patterns.push(escapeRegExp(basePart));
        }
      }
    }
  }

  if (patterns.length === 0) {
    return [{ type: 'text', text }];
  }

  // Sort longest pattern first so "turunan parsial" matches before "turunan"
  patterns.sort((a, b) => b.length - a.length);

  // Whole-word boundaries using Unicode-aware lookbehind/lookahead
  const regex = new RegExp(
    `(?<![\\p{L}\\p{N}_])(${patterns.join('|')})(?![\\p{L}\\p{N}_])`,
    'giu'
  );

  const segments: GlossaryTextSegment[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matchedStr = match[0];
    const startIdx = match.index;
    if (startIdx > lastIdx) {
      segments.push({
        type: 'text',
        text: text.slice(lastIdx, startIdx),
      });
    }
    const entry = patternMap.get(matchedStr.toLowerCase());
    if (entry) {
      segments.push({
        type: 'term',
        text: matchedStr,
        termEntry: entry,
      });
    } else {
      segments.push({
        type: 'text',
        text: matchedStr,
      });
    }
    lastIdx = startIdx + matchedStr.length;
  }

  if (lastIdx < text.length) {
    segments.push({
      type: 'text',
      text: text.slice(lastIdx),
    });
  }

  return segments.length > 0 ? segments : [{ type: 'text', text }];
}

// ============================================================================
// SPACED REVIEW ("ULASAN HARIAN") SCHEDULER
// ============================================================================

export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30] as const;
export const REVIEW_BOX_INTERVALS = REVIEW_INTERVALS_DAYS;
export const DEFAULT_INTERVAL_SCALE = 1;
export const MAX_REVIEW_SESSION_ITEMS = 10;

export type ReviewRating = 'lupa' | 'ragu' | 'ingat';

export function clampIntervalScale(scale: number): number {
  if (typeof scale !== 'number' || !Number.isFinite(scale)) {
    return DEFAULT_INTERVAL_SCALE;
  }
  return Math.max(0.5, Math.min(2, Math.round(scale * 10) / 10));
}

export function addDaysToDateKey(dateKey: string, daysToAdd: number): string {
  const safeKey = typeof dateKey === 'string' ? dateKey : getLocalDateKey();
  const parts = safeKey.split('-').map(Number);
  const date =
    parts.length === 3 && !parts.some(Number.isNaN)
      ? new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0)
      : new Date();
  date.setDate(date.getDate() + Math.round(daysToAdd));
  return getLocalDateKey(date);
}

/**
 * Schedules a review item according to Section 5 rules:
 * - Intervals per box = [1, 3, 7, 14, 30] multiplied by intervalScale (0.5..2, default 1).
 * - "ingat": moves up one box (max box 4) and sets due = today + intervals[newBox] * scale (at least 1 day).
 * - "ragu": keeps the same box and sets due = today + intervals[box] * scale (at least 1 day).
 * - "lupa": moves to box 0 with due = tomorrow (today + 1 day).
 */
export function scheduleReviewItem(
  current: ReviewQueueEntry | undefined,
  rating: ReviewRating,
  intervalScale: number = DEFAULT_INTERVAL_SCALE,
  todayKey: string = getLocalDateKey()
): ReviewQueueEntry & { intervalDays: number } {
  const safeScale = clampIntervalScale(intervalScale);
  const currentBox = current
    ? Math.max(0, Math.min(4, Math.floor(current.box)))
    : 0;

  if (rating === 'lupa') {
    return {
      box: 0,
      due: addDaysToDateKey(todayKey, 1),
      intervalDays: 1,
    };
  }

  if (rating === 'ragu') {
    const rawDays = REVIEW_INTERVALS_DAYS[currentBox] * safeScale;
    const days = Math.max(1, Math.round(rawDays));
    return {
      box: currentBox,
      due: addDaysToDateKey(todayKey, days),
      intervalDays: days,
    };
  }

  // rating === 'ingat'
  const newBox = Math.min(4, currentBox + 1);
  const rawDays = REVIEW_INTERVALS_DAYS[newBox] * safeScale;
  const days = Math.max(1, Math.round(rawDays));
  return {
    box: newBox,
    due: addDaysToDateKey(todayKey, days),
    intervalDays: days,
  };
}

/**
 * Returns all due review items (where entry.due <= todayKey) and the session slice (max 10).
 */
export function getDueReviewItems(
  reviewQueue: Record<string, ReviewQueueEntry>,
  todayKey: string = getLocalDateKey(),
  maxSessionItems: number = MAX_REVIEW_SESSION_ITEMS
): {
  totalDueCount: number;
  dueItems: EnrichedReviewItem[];
  sessionItems: EnrichedReviewItem[];
} {
  const dueItems: EnrichedReviewItem[] = [];

  for (const [itemId, entry] of Object.entries(reviewQueue || {})) {
    if (!entry || typeof entry.due !== 'string') continue;
    if (entry.due <= todayKey) {
      const catalogItem = getReviewCatalogItemById(itemId);
      if (catalogItem) {
        dueItems.push({
          ...catalogItem,
          box: Math.max(0, Math.min(4, Number(entry.box) || 0)),
          due: entry.due,
        });
      }
    }
  }

  // Sort by due date ascending, then box ascending
  dueItems.sort((a, b) => {
    if (a.due !== b.due) return a.due.localeCompare(b.due);
    if (a.box !== b.box) return a.box - b.box;
    return a.id.localeCompare(b.id);
  });

  return {
    totalDueCount: dueItems.length,
    dueItems,
    sessionItems: dueItems.slice(0, maxSessionItems),
  };
}
