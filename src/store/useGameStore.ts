import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { FLOORS, TOWER_FLOOR } from '../data/roadmap.js';
import {
  BOSS_XP,
  TOWER_QUEST_XP,
  calculateLevelFromXP,
  calculateRoomXP,
  computeNextStreak,
  getTitleForLevel,
  isFloorUnlocked,
  isRoomUnlocked,
} from '../game/formulas';
import {
  DEFAULT_WEEKLY_TARGET_HOURS,
  StudySession,
  WEEKLY_BONUS_XP,
  getLocalDateKey,
  getWeekStartDateKey,
  validateAndParseSaveJSON,
} from '../game/campTracker';
import {
  BossProgressState,
  DOJO_CORRECT_XP,
  DOJO_DAILY_XP_CAP,
  ECHO_BONUS_XP,
  FLOOR6_CONTENT,
  INITIAL_BOSS_POTIONS,
  QuestionStat,
  calculateQuestionWeight,
  calculateRoomCritBonusXP,
  canCompleteTowerQuest,
  canTickTowerStep,
  getInitialBossPotions,
  getTotalBossPhases,
  getTopicContent,
  getTowerQuestById,
  getTowerRelicId,
  getNextBossVariantIndex,
  recoverBossAfterFaint,
  updateQuestionStat,
} from '../game/spellbookEngine';
import {
  DEFAULT_INTERVAL_SCALE,
  LessonChunkProgress,
  LessonReviewItem,
  ReviewQueueEntry,
  ReviewRating,
  clampIntervalScale,
  getLessonChunkById,
  getLessonChunksForTopic,
  scheduleReviewItem,
} from '../game/lessonEngine';

export type ScreenView =
  | 'title'
  | 'dungeon'
  | 'grimoire'
  | 'review'
  | 'camp'
  | 'dashboard'
  | 'inventory'
  | 'tower'
  | 'settings';

export interface LevelUpInfo {
  isOpen: boolean;
  oldLevel: number;
  newLevel: number;
  newTitle: string;
}

export interface LogSessionInput {
  topicId: string;
  durationMinutes: number;
  date: string;
  note?: string;
  source?: 'manual' | 'pomodoro';
}

export interface GameState {
  version: number;
  hasStarted: boolean;
  playerName: string;
  avatarId: string;
  xp: number;
  streak: number;
  lastActiveDate: string | null;
  completedRooms: string[];
  defeatedBosses: string[];
  completedTowerQuests: string[];
  towerSteps: Record<string, Record<string, boolean>>;
  towerCompleted: string[];
  reflections: Record<string, string>;
  specialization: string | null;
  certificateIssuedAt: string | null;
  relics: string[];
  badges: string[];
  quizBestScores: Record<string, number>;
  bestScoreByTopic: Record<string, number>;
  quizBonusClaimedRooms: string[];
  echoBonusClaimedRooms: string[];
  spellsUnlocked: string[];
  questionStats: Record<string, QuestionStat>;
  bossProgress: Record<number, BossProgressState>;
  dojoDailyXP: { date: string; xp: number };
  evidenceNotes: Record<string | number, string>;
  studySessions: StudySession[];
  weeklyTargetHours: number;
  claimedWeeklyBonusWeeks: string[];
  activeFloorId: number;
  activeNodeByFloor: Record<number, string>;
  soundEnabled: boolean;
  sfxVolume: number;
  musicEnabled: boolean;
  musicVolume: number;
  reduceMotion: boolean;
  lessonProgress: Record<string, LessonChunkProgress>;
  summaries: Record<string, string>;
  taskDone: Record<string, boolean>;
  reviewQueue: Record<string, ReviewQueueEntry>;
  settings: {
    intervalScale: number;
  };

  // Transient UI state
  currentView: ScreenView;
  selectedTopicId: string | null;
  scrollOnlyTopicId: string | null;
  selectedBossFloorId: number | null;
  levelUpModal: LevelUpInfo | null;
  newlyUnlockedIds: string[];

  // Actions
  startAdventure: (name: string, avatarId: string) => void;
  continueAdventure: () => void;
  setView: (view: ScreenView) => void;
  selectFloor: (floorId: number) => void;
  openRoomBattle: (topicId: string) => void;
  closeRoomBattle: () => void;
  openScrollViewer: (topicId: string) => void;
  closeScrollViewer: () => void;
  openBossBattle: (floorId: number) => void;
  closeBossBattle: () => void;
  setEvidenceNote: (topicId: string | number, note: string) => void;
  recordQuizAttempt: (topicId: string, scorePercent: number) => void;
  recordQuestionAnswer: (questionId: string, isCorrect: boolean) => QuestionStat;
  awardDojoAnswerXP: (
    questionId: string,
    isCorrect: boolean
  ) => {
    xpAwarded: number;
    dailyTotal: number;
    newWeight: number;
    leveledUp: boolean;
    newLevel: number;
  };
  defeatRoom: (
    topicId: string,
    correctQuizAnswers?: number,
    quizScorePercent?: number,
    echoCorrect?: boolean
  ) => {
    xpGained: number;
    baseXPGained: number;
    bonusXPGained: number;
    echoXPGained: number;
    unlockedSpellId: string | null;
    leveledUp: boolean;
    newLevel: number;
  };
  useBossPotion: (floorId?: number) => boolean;
  advanceBossPhaseVariant: (floorId: number, phase: number) => 0 | 1;
  completeBossPhase: (floorId: number, phase: number) => void;
  faintBossFight: (floorId: number) => void;
  resetBossFightProgress: (floorId?: number) => void;
  defeatBoss: (floorId: number) => { xpGained: number; leveledUp: boolean; newLevel: number };
  toggleTowerStep: (questId: string, stepId: string) => boolean;
  setSpecialization: (specialization: string | null) => void;
  completeTowerQuest: (questId: string) => {
    xpGained: number;
    relicName: string | null;
    relicId: string | null;
    leveledUp: boolean;
    newLevel: number;
  };
  setReflectionAnswer: (promptId: string, answer: string) => void;
  issueCertificate: () => string;
  toggleTowerQuest: (questId: string) => { xpGained: number; leveledUp: boolean; newLevel: number };
  logStudySession: (input: LogSessionInput) => {
    session: StudySession;
    bonusXPAwarded: number;
    leveledUp: boolean;
    newLevel: number;
  };
  deleteStudySession: (sessionId: string) => void;
  setWeeklyTargetHours: (hours: number) => {
    bonusXPAwarded: number;
    leveledUp: boolean;
    newLevel: number;
  };
  exportSaveJSON: () => string;
  importSaveJSON: (rawJson: string) => { success: boolean; message: string };
  dismissLevelUpModal: () => void;
  clearNewlyUnlocked: () => void;
  toggleSound: () => void;
  setSfxVolume: (volume: number) => void;
  toggleMusic: () => void;
  setMusicEnabled: (enabled: boolean) => void;
  setMusicVolume: (volume: number) => void;
  toggleReduceMotion: () => void;
  recordChunkPracticeAttempt: (chunkId: string, activityId: string, totalPracticeIds?: string[]) => void;
  completeLessonChunk: (chunkId: string, reviewItems: LessonReviewItem[]) => void;
  setChunkSummary: (chunkId: string, summary: string) => void;
  toggleChunkRealTaskDone: (chunkId: string, done?: boolean) => void;
  gradeReviewItem: (itemId: string, rating: ReviewRating) => ReviewQueueEntry;
  setIntervalScale: (scale: number) => void;
  resetProgress: () => void;
}

const STORAGE_KEY = 'dungeon-ml-dl:v1';
const CURRENT_VERSION = 3;

export const INITIAL_FLOOR_BOSS_PROGRESS: BossProgressState = {
  clearedPhases: [],
  potions: INITIAL_BOSS_POTIONS,
  lastVariantByPhase: {},
};

export function createDefaultBossProgressForFloor(floorId: number): BossProgressState {
  return {
    clearedPhases: [],
    potions: getInitialBossPotions(floorId),
    lastVariantByPhase: {},
  };
}

function createInitialBossProgressMap(): Record<number, BossProgressState> {
  return {
    1: createDefaultBossProgressForFloor(1),
    2: createDefaultBossProgressForFloor(2),
    3: createDefaultBossProgressForFloor(3),
    4: createDefaultBossProgressForFloor(4),
    5: createDefaultBossProgressForFloor(5),
  };
}

const INITIAL_PERSISTED_STATE = {
  version: CURRENT_VERSION,
  hasStarted: false,
  playerName: 'Petualang Tensor',
  avatarId: 'alchemist',
  xp: 0,
  streak: 0,
  lastActiveDate: null as string | null,
  completedRooms: [] as string[],
  defeatedBosses: [] as string[],
  completedTowerQuests: [] as string[],
  towerSteps: {} as Record<string, Record<string, boolean>>,
  towerCompleted: [] as string[],
  reflections: {} as Record<string, string>,
  specialization: null as string | null,
  certificateIssuedAt: null as string | null,
  relics: [] as string[],
  badges: [] as string[],
  quizBestScores: {} as Record<string, number>,
  bestScoreByTopic: {} as Record<string, number>,
  quizBonusClaimedRooms: [] as string[],
  echoBonusClaimedRooms: [] as string[],
  spellsUnlocked: [] as string[],
  questionStats: {} as Record<string, QuestionStat>,
  bossProgress: createInitialBossProgressMap(),
  dojoDailyXP: { date: '', xp: 0 },
  evidenceNotes: {} as Record<string | number, string>,
  studySessions: [] as StudySession[],
  weeklyTargetHours: DEFAULT_WEEKLY_TARGET_HOURS,
  claimedWeeklyBonusWeeks: [] as string[],
  activeFloorId: 1,
  activeNodeByFloor: {
    1: 'topic-1',
    2: 'topic-7',
    3: 'topic-12',
    4: 'topic-18',
    5: 'topic-21',
  } as Record<number, string>,
  soundEnabled: false,
  sfxVolume: 0.75,
  musicEnabled: true,
  musicVolume: 0.35,
  reduceMotion: false,
  lessonProgress: {} as Record<string, LessonChunkProgress>,
  summaries: {} as Record<string, string>,
  taskDone: {} as Record<string, boolean>,
  reviewQueue: {} as Record<string, ReviewQueueEntry>,
  settings: {
    intervalScale: DEFAULT_INTERVAL_SCALE,
  },
};

function normalizeSingleBossProgress(raw: unknown, floorId: number = 1): BossProgressState {
  const defaultPotions = getInitialBossPotions(floorId);
  if (!raw || typeof raw !== 'object') {
    return {
      clearedPhases: [],
      potions: defaultPotions,
      lastVariantByPhase: {},
    };
  }
  const obj = raw as Partial<BossProgressState>;
  return {
    clearedPhases: Array.isArray(obj.clearedPhases)
      ? obj.clearedPhases.filter((x): x is number => typeof x === 'number')
      : [],
    potions: typeof obj.potions === 'number' ? obj.potions : defaultPotions,
    lastVariantByPhase:
      obj.lastVariantByPhase && typeof obj.lastVariantByPhase === 'object'
        ? { ...obj.lastVariantByPhase }
        : {},
  };
}

/**
 * Lossless migration from v1 or v2 state to v3:
 * - Derives unlocked spells (s1..s17) from completed Floor 1-3 rooms.
 * - Migrates flat v2 bossProgress into floor-keyed bossProgress: { 1: ..., 2: ..., 3: ... }.
 */
export function migrateStateToV3(rawState: Record<string, unknown>) {
  const completedRooms = Array.isArray(rawState.completedRooms)
    ? (rawState.completedRooms.filter((x) => typeof x === 'string') as string[])
    : [];

  const existingSpells = Array.isArray(rawState.spellsUnlocked)
    ? (rawState.spellsUnlocked.filter((x) => typeof x === 'string') as string[])
    : [];

  const derivedSpells = new Set<string>(existingSpells);
  for (const roomId of completedRooms) {
    const topicContent = getTopicContent(roomId);
    if (topicContent) {
      derivedSpells.add(topicContent.spell.id);
    }
  }

  const prevBestScores =
    rawState.bestScoreByTopic && typeof rawState.bestScoreByTopic === 'object'
      ? (rawState.bestScoreByTopic as Record<string, number>)
      : rawState.quizBestScores && typeof rawState.quizBestScores === 'object'
      ? (rawState.quizBestScores as Record<string, number>)
      : {};

  const rawBoss = rawState.bossProgress;
  let bossProgressMap: Record<number, BossProgressState>;

  if (
    rawBoss &&
    typeof rawBoss === 'object' &&
    ('clearedPhases' in rawBoss || 'potions' in rawBoss)
  ) {
    // v2 flat BossProgressState -> move to floor 1 and initialize floors 2, 3, 4 & 5
    bossProgressMap = {
      1: normalizeSingleBossProgress(rawBoss, 1),
      2: normalizeSingleBossProgress(undefined, 2),
      3: normalizeSingleBossProgress(undefined, 3),
      4: normalizeSingleBossProgress(undefined, 4),
      5: normalizeSingleBossProgress(undefined, 5),
    };
  } else if (rawBoss && typeof rawBoss === 'object') {
    const rec = rawBoss as Record<string, unknown>;
    bossProgressMap = {
      1: normalizeSingleBossProgress(rec['1'] ?? rec[1], 1),
      2: normalizeSingleBossProgress(rec['2'] ?? rec[2], 2),
      3: normalizeSingleBossProgress(rec['3'] ?? rec[3], 3),
      4: normalizeSingleBossProgress(rec['4'] ?? rec[4], 4),
      5: normalizeSingleBossProgress(rec['5'] ?? rec[5], 5),
    };
  } else {
    bossProgressMap = createInitialBossProgressMap();
  }

  const normalizedNotes: Record<string, string> = {};
  if (
    rawState.evidenceNotes &&
    typeof rawState.evidenceNotes === 'object' &&
    !Array.isArray(rawState.evidenceNotes)
  ) {
    for (const [k, v] of Object.entries(rawState.evidenceNotes as Record<string, unknown>)) {
      if (typeof v === 'string') {
        normalizedNotes[String(k)] = v.slice(0, 300);
      }
    }
  }

  // Normalize Floor 6 towerSteps
  const normalizedTowerSteps: Record<string, Record<string, boolean>> = {};
  if (
    rawState.towerSteps &&
    typeof rawState.towerSteps === 'object' &&
    !Array.isArray(rawState.towerSteps)
  ) {
    for (const [qId, stepObj] of Object.entries(rawState.towerSteps as Record<string, unknown>)) {
      if (stepObj && typeof stepObj === 'object' && !Array.isArray(stepObj)) {
        normalizedTowerSteps[qId] = {};
        for (const [sId, val] of Object.entries(stepObj as Record<string, unknown>)) {
          if (val === true) {
            normalizedTowerSteps[qId][sId] = true;
          }
        }
      }
    }
  }

  // Normalize towerCompleted and completedTowerQuests (also map legacy 'tower-1'..'tower-7' -> 'm1'..'m7')
  const rawTowerList = [
    ...(Array.isArray(rawState.towerCompleted) ? rawState.towerCompleted : []),
    ...(Array.isArray(rawState.completedTowerQuests) ? rawState.completedTowerQuests : []),
  ];
  const towerSet = new Set<string>();
  for (const item of rawTowerList) {
    if (typeof item !== 'string') continue;
    const legacyMatch = /^tower-(\d+)$/.exec(item);
    const qId = legacyMatch ? `m${legacyMatch[1]}` : item;
    if (FLOOR6_CONTENT.quests.some((q) => q.id === qId)) {
      towerSet.add(qId);
    }
  }
  const normalizedTowerCompleted = Array.from(towerSet);

  // Ensure completed quests have all their steps ticked and their relics granted
  const existingRelics = Array.isArray(rawState.relics)
    ? (rawState.relics.filter((x) => typeof x === 'string') as string[])
    : [];
  const relicSet = new Set<string>(existingRelics);

  for (const qId of normalizedTowerCompleted) {
    const quest = getTowerQuestById(qId);
    if (quest) {
      normalizedTowerSteps[qId] = normalizedTowerSteps[qId] || {};
      for (const s of quest.steps) {
        normalizedTowerSteps[qId][s.id] = true;
      }
      relicSet.add(getTowerRelicId(qId));
    }
  }

  // Normalize reflections
  const normalizedReflections: Record<string, string> = {};
  if (
    rawState.reflections &&
    typeof rawState.reflections === 'object' &&
    !Array.isArray(rawState.reflections)
  ) {
    for (const [pId, val] of Object.entries(rawState.reflections as Record<string, unknown>)) {
      if (typeof val === 'string') {
        normalizedReflections[pId] = val.slice(0, 500);
      }
    }
  }

  const normalizedSpecialization =
    typeof rawState.specialization === 'string' && rawState.specialization.trim().length > 0
      ? rawState.specialization.trim()
      : null;

  const normalizedCertificateIssuedAt =
    typeof rawState.certificateIssuedAt === 'string' && rawState.certificateIssuedAt.trim().length > 0
      ? rawState.certificateIssuedAt
      : null;

  // Normalize Lesson Chunks v3 fields
  const normalizedLessonProgress: Record<string, LessonChunkProgress> = {};
  if (
    rawState.lessonProgress &&
    typeof rawState.lessonProgress === 'object' &&
    !Array.isArray(rawState.lessonProgress)
  ) {
    for (const [cId, val] of Object.entries(rawState.lessonProgress as Record<string, unknown>)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const obj = val as Partial<LessonChunkProgress>;
        normalizedLessonProgress[cId] = {
          done: Boolean(obj.done),
          attempts: typeof obj.attempts === 'number' && obj.attempts >= 0 ? obj.attempts : 0,
          attemptedActivities: Array.isArray(obj.attemptedActivities)
            ? obj.attemptedActivities.filter((x): x is string => typeof x === 'string')
            : [],
        };
      }
    }
  }

  const normalizedSummaries: Record<string, string> = {};
  if (
    rawState.summaries &&
    typeof rawState.summaries === 'object' &&
    !Array.isArray(rawState.summaries)
  ) {
    for (const [cId, val] of Object.entries(rawState.summaries as Record<string, unknown>)) {
      if (typeof val === 'string') {
        normalizedSummaries[cId] = val.slice(0, 400);
      }
    }
  }

  const normalizedTaskDone: Record<string, boolean> = {};
  if (
    rawState.taskDone &&
    typeof rawState.taskDone === 'object' &&
    !Array.isArray(rawState.taskDone)
  ) {
    for (const [cId, val] of Object.entries(rawState.taskDone as Record<string, unknown>)) {
      if (val === true) {
        normalizedTaskDone[cId] = true;
      }
    }
  }

  const normalizedReviewQueue: Record<string, ReviewQueueEntry> = {};
  if (
    rawState.reviewQueue &&
    typeof rawState.reviewQueue === 'object' &&
    !Array.isArray(rawState.reviewQueue)
  ) {
    for (const [itemId, val] of Object.entries(rawState.reviewQueue as Record<string, unknown>)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const obj = val as Partial<ReviewQueueEntry>;
        if (typeof obj.due === 'string' && obj.due.trim()) {
          normalizedReviewQueue[itemId] = {
            box:
              typeof obj.box === 'number'
                ? Math.max(0, Math.min(4, Math.floor(obj.box)))
                : 0,
            due: obj.due.trim(),
          };
        }
      }
    }
  }

  const rawSettings =
    rawState.settings && typeof rawState.settings === 'object'
      ? (rawState.settings as { intervalScale?: unknown })
      : {};
  const normalizedIntervalScale = clampIntervalScale(
    typeof rawSettings.intervalScale === 'number'
      ? rawSettings.intervalScale
      : DEFAULT_INTERVAL_SCALE
  );

  const normalizedMusicEnabled =
    typeof rawState.musicEnabled === 'boolean' ? rawState.musicEnabled : true;
  const normalizedMusicVolume =
    typeof rawState.musicVolume === 'number' && !Number.isNaN(rawState.musicVolume)
      ? Math.max(0, Math.min(1, Number(rawState.musicVolume.toFixed(2))))
      : 0.35;
  const normalizedSfxVolume =
    typeof rawState.sfxVolume === 'number' && !Number.isNaN(rawState.sfxVolume)
      ? Math.max(0, Math.min(1, Number(rawState.sfxVolume.toFixed(2))))
      : 0.75;

  return {
    ...INITIAL_PERSISTED_STATE,
    ...rawState,
    completedRooms,
    spellsUnlocked: Array.from(derivedSpells),
    relics: Array.from(relicSet),
    completedTowerQuests: normalizedTowerCompleted,
    towerCompleted: normalizedTowerCompleted,
    towerSteps: normalizedTowerSteps,
    reflections: normalizedReflections,
    specialization: normalizedSpecialization,
    certificateIssuedAt: normalizedCertificateIssuedAt,
    quizBestScores: { ...prevBestScores },
    bestScoreByTopic: { ...prevBestScores },
    questionStats:
      rawState.questionStats && typeof rawState.questionStats === 'object'
        ? (rawState.questionStats as Record<string, QuestionStat>)
        : {},
    bossProgress: bossProgressMap,
    evidenceNotes: normalizedNotes,
    lessonProgress: normalizedLessonProgress,
    summaries: normalizedSummaries,
    taskDone: normalizedTaskDone,
    reviewQueue: normalizedReviewQueue,
    settings: {
      intervalScale: normalizedIntervalScale,
    },
    musicEnabled: normalizedMusicEnabled,
    musicVolume: normalizedMusicVolume,
    sfxVolume: normalizedSfxVolume,
    version: CURRENT_VERSION,
  };
}

export const migrateV1ToV2State = migrateStateToV3;

/**
 * Safe storage wrapper that catches all read/write/remove errors and
 * falls back gracefully when localStorage is unavailable, empty, or corrupted.
 */
const safeLocalStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const raw = window.localStorage.getItem(name);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || typeof parsed.state !== 'object') {
        return null;
      }
      return raw;
    } catch {
      try {
        window.localStorage?.removeItem(name);
      } catch {
        // Ignore remove errors
      }
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.setItem(name, value);
    } catch {
      // Ignore quota or private browsing storage errors
    }
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.removeItem(name);
    } catch {
      // Ignore errors
    }
  },
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...INITIAL_PERSISTED_STATE,

      currentView: 'title',
      selectedTopicId: null,
      scrollOnlyTopicId: null,
      selectedBossFloorId: null,
      levelUpModal: null,
      newlyUnlockedIds: [],

      startAdventure: (name: string, avatarId: string) => {
        const cleanName = name.trim() || 'Petualang Tensor';
        set({
          hasStarted: true,
          playerName: cleanName,
          avatarId: avatarId || 'alchemist',
          currentView: 'dungeon',
        });
      },

      continueAdventure: () => {
        set({
          hasStarted: true,
          currentView: 'dungeon',
        });
      },

      setView: (view: ScreenView) => {
        set({
          currentView: view,
          selectedTopicId: null,
          scrollOnlyTopicId: null,
          selectedBossFloorId: null,
        });
      },

      selectFloor: (floorId: number) => {
        const state = get();
        if (floorId === 6) {
          set({
            activeFloorId: 6,
            currentView: 'tower',
            selectedTopicId: null,
            scrollOnlyTopicId: null,
            selectedBossFloorId: null,
          });
          return;
        }
        if (!isFloorUnlocked(floorId, state.defeatedBosses)) {
          return;
        }
        set({
          activeFloorId: floorId,
          currentView: 'dungeon',
          selectedTopicId: null,
          scrollOnlyTopicId: null,
          selectedBossFloorId: null,
        });
      },

      openRoomBattle: (topicId: string) => {
        const state = get();
        const floor = FLOORS.find((f) => f.topics.some((t) => t.id === topicId));
        if (!floor) return;
        set({
          selectedTopicId: topicId,
          scrollOnlyTopicId: null,
          activeNodeByFloor: {
            ...state.activeNodeByFloor,
            [floor.id]: topicId,
          },
        });
      },

      closeRoomBattle: () => {
        set({ selectedTopicId: null });
      },

      openScrollViewer: (topicId: string) => {
        set({ scrollOnlyTopicId: topicId });
      },

      closeScrollViewer: () => {
        set({ scrollOnlyTopicId: null });
      },

      openBossBattle: (floorId: number) => {
        const state = get();
        const floor = FLOORS.find((f) => f.id === floorId);
        if (!floor) return;
        set({
          selectedBossFloorId: floorId,
          activeNodeByFloor: {
            ...state.activeNodeByFloor,
            [floorId]: floor.boss.id,
          },
        });
      },

      closeBossBattle: () => {
        set({ selectedBossFloorId: null });
      },

      setEvidenceNote: (topicId: string | number, note: string) => {
        const state = get();
        const safeNote = String(note ?? '').slice(0, 300);
        const keyStr = String(topicId);
        const nextNotes: Record<string | number, string> = {
          ...state.evidenceNotes,
          [keyStr]: safeNote,
        };
        if (typeof topicId === 'number') {
          nextNotes[`topic-${topicId}`] = safeNote;
        } else if (/^topic-(\d+)$/.test(keyStr)) {
          const numPart = keyStr.replace('topic-', '');
          nextNotes[numPart] = safeNote;
        }
        set({
          evidenceNotes: nextNotes,
        });
      },

      recordQuizAttempt: (topicId: string, scorePercent: number) => {
        const state = get();
        const prevBest = state.bestScoreByTopic[topicId] ?? state.quizBestScores[topicId];
        const nextBest = prevBest === undefined ? scorePercent : Math.max(prevBest, scorePercent);
        set({
          quizBestScores: {
            ...state.quizBestScores,
            [topicId]: nextBest,
          },
          bestScoreByTopic: {
            ...state.bestScoreByTopic,
            [topicId]: nextBest,
          },
        });
      },

      recordQuestionAnswer: (questionId: string, isCorrect: boolean) => {
        const state = get();
        const prevStat = state.questionStats[questionId];
        const nextStat = updateQuestionStat(prevStat, isCorrect);
        set({
          questionStats: {
            ...state.questionStats,
            [questionId]: nextStat,
          },
        });
        return nextStat;
      },

      awardDojoAnswerXP: (questionId: string, isCorrect: boolean) => {
        const state = get();
        const prevStat = state.questionStats[questionId];
        const nextStat = updateQuestionStat(prevStat, isCorrect);
        const newWeight = calculateQuestionWeight(nextStat);

        const todayKey = getLocalDateKey();
        const currentDailyXP =
          state.dojoDailyXP.date === todayKey ? state.dojoDailyXP.xp : 0;

        let xpAwarded = 0;
        if (isCorrect && currentDailyXP < DOJO_DAILY_XP_CAP) {
          xpAwarded = Math.min(DOJO_CORRECT_XP, DOJO_DAILY_XP_CAP - currentDailyXP);
        }

        const nextDailyTotal = currentDailyXP + xpAwarded;
        const oldLevel = calculateLevelFromXP(state.xp);
        const newXP = state.xp + xpAwarded;
        const newLevel = calculateLevelFromXP(newXP);
        const leveledUp = newLevel > oldLevel;

        const nextStreakInfo =
          xpAwarded > 0
            ? computeNextStreak(state.streak, state.lastActiveDate)
            : { streak: state.streak, lastActiveDate: state.lastActiveDate };

        set({
          questionStats: {
            ...state.questionStats,
            [questionId]: nextStat,
          },
          dojoDailyXP: {
            date: todayKey,
            xp: nextDailyTotal,
          },
          xp: newXP,
          streak: nextStreakInfo.streak,
          lastActiveDate: nextStreakInfo.lastActiveDate,
          levelUpModal: leveledUp
            ? {
                isOpen: true,
                oldLevel,
                newLevel,
                newTitle: getTitleForLevel(newLevel),
              }
            : state.levelUpModal,
        });

        return {
          xpAwarded,
          dailyTotal: nextDailyTotal,
          newWeight,
          leveledUp,
          newLevel,
        };
      },

      defeatRoom: (
        topicId: string,
        correctQuizAnswers: number = 0,
        quizScorePercent?: number,
        echoCorrect: boolean = false
      ) => {
        const state = get();
        const floor = FLOORS.find((f) => f.topics.some((t) => t.id === topicId));
        const topic = floor?.topics.find((t) => t.id === topicId);
        if (!floor || !topic) {
          return {
            xpGained: 0,
            baseXPGained: 0,
            bonusXPGained: 0,
            echoXPGained: 0,
            unlockedSpellId: null,
            leveledUp: false,
            newLevel: calculateLevelFromXP(state.xp),
          };
        }

        const alreadyCompleted = state.completedRooms.includes(topicId);
        const alreadyClaimedBonus = state.quizBonusClaimedRooms.includes(topicId);
        const alreadyClaimedEcho = state.echoBonusClaimedRooms.includes(topicId);

        const baseRoomXP = calculateRoomXP(topic.weeks);
        const baseXPGained = alreadyCompleted ? 0 : baseRoomXP;

        // Critical-hit XP bonus: +10% of room XP, applied once per room
        const bonusXPGained =
          correctQuizAnswers > 0
            ? calculateRoomCritBonusXP(baseRoomXP, alreadyClaimedBonus)
            : 0;

        // Echo question bonus: +5 XP, applied once per room
        const echoXPGained = echoCorrect && !alreadyClaimedEcho ? ECHO_BONUS_XP : 0;

        const xpGained = baseXPGained + bonusXPGained + echoXPGained;

        const oldLevel = calculateLevelFromXP(state.xp);
        const newXP = state.xp + xpGained;
        const newLevel = calculateLevelFromXP(newXP);
        const leveledUp = newLevel > oldLevel;

        const nextCompletedRooms = alreadyCompleted
          ? state.completedRooms
          : [...state.completedRooms, topicId];

        const nextBonusClaimedRooms =
          correctQuizAnswers > 0 && !alreadyClaimedBonus
            ? [...state.quizBonusClaimedRooms, topicId]
            : state.quizBonusClaimedRooms;

        const nextEchoClaimedRooms =
          echoCorrect && !alreadyClaimedEcho
            ? [...state.echoBonusClaimedRooms, topicId]
            : state.echoBonusClaimedRooms;

        // Unlock Spellbook Spell (Floor 1 or Floor 2) if applicable
        const spellbookContent = getTopicContent(topicId);
        const unlockedSpellId = spellbookContent ? spellbookContent.spell.id : null;
        const nextSpellsUnlocked =
          unlockedSpellId && !state.spellsUnlocked.includes(unlockedSpellId)
            ? [...state.spellsUnlocked, unlockedSpellId]
            : state.spellsUnlocked;

        const prevBest = state.bestScoreByTopic[topicId] ?? state.quizBestScores[topicId];
        const nextBestScore =
          quizScorePercent !== undefined
            ? prevBest === undefined
              ? quizScorePercent
              : Math.max(prevBest, quizScorePercent)
            : prevBest;

        const nextBestScores =
          nextBestScore !== undefined
            ? {
                ...state.quizBestScores,
                ...state.bestScoreByTopic,
                [topicId]: nextBestScore,
              }
            : state.bestScoreByTopic;

        // Check which rooms/boss on this floor just became unlocked
        const newlyUnlocked: string[] = [];
        for (const t of floor.topics) {
          const wasUnlocked = isRoomUnlocked(
            t,
            floor.topics,
            state.completedRooms,
            state.defeatedBosses
          );
          const nowUnlocked = isRoomUnlocked(
            t,
            floor.topics,
            nextCompletedRooms,
            state.defeatedBosses
          );
          if (!wasUnlocked && nowUnlocked) {
            newlyUnlocked.push(t.id);
          }
        }
        const bossWasUnlocked = floor.topics.every((t) => state.completedRooms.includes(t.id));
        const bossNowUnlocked = floor.topics.every((t) => nextCompletedRooms.includes(t.id));
        if (!bossWasUnlocked && bossNowUnlocked) {
          newlyUnlocked.push(floor.boss.id);
        }

        // Check if this topic drops a Guild Quest relic (Floor 5 topics)
        const nextRelics =
          topic.relic && !state.relics.includes(topic.relic.id)
            ? [...state.relics, topic.relic.id]
            : state.relics;

        const nextStreakInfo = computeNextStreak(state.streak, state.lastActiveDate);

        // Move active node pointer to next unlocked uncompleted topic or boss
        const nextTargetTopic = floor.topics.find(
          (t) =>
            !nextCompletedRooms.includes(t.id) &&
            isRoomUnlocked(t, floor.topics, nextCompletedRooms, state.defeatedBosses)
        );
        const nextNodeId = nextTargetTopic
          ? nextTargetTopic.id
          : bossNowUnlocked
          ? floor.boss.id
          : topicId;

        set({
          xp: newXP,
          completedRooms: nextCompletedRooms,
          quizBonusClaimedRooms: nextBonusClaimedRooms,
          echoBonusClaimedRooms: nextEchoClaimedRooms,
          spellsUnlocked: nextSpellsUnlocked,
          quizBestScores: nextBestScores,
          bestScoreByTopic: nextBestScores,
          relics: nextRelics,
          streak: nextStreakInfo.streak,
          lastActiveDate: nextStreakInfo.lastActiveDate,
          newlyUnlockedIds: newlyUnlocked,
          activeNodeByFloor: {
            ...state.activeNodeByFloor,
            [floor.id]: nextNodeId,
          },
          levelUpModal: leveledUp
            ? {
                isOpen: true,
                oldLevel,
                newLevel,
                newTitle: getTitleForLevel(newLevel),
              }
            : state.levelUpModal,
        });

        return {
          xpGained,
          baseXPGained,
          bonusXPGained,
          echoXPGained,
          unlockedSpellId,
          leveledUp,
          newLevel,
        };
      },

      useBossPotion: (floorId: number = 1) => {
        const state = get();
        const fp = state.bossProgress[floorId] ?? createDefaultBossProgressForFloor(floorId);
        if (fp.potions <= 0) return false;
        set({
          bossProgress: {
            ...state.bossProgress,
            [floorId]: {
              ...fp,
              potions: fp.potions - 1,
            },
          },
        });
        return true;
      },

      advanceBossPhaseVariant: (floorId: number, phase: number) => {
        const state = get();
        const fp = state.bossProgress[floorId] ?? createDefaultBossProgressForFloor(floorId);
        const prevIdx = fp.lastVariantByPhase[phase];
        const nextIdx = getNextBossVariantIndex(prevIdx);
        set({
          bossProgress: {
            ...state.bossProgress,
            [floorId]: {
              ...fp,
              lastVariantByPhase: {
                ...fp.lastVariantByPhase,
                [phase]: nextIdx,
              },
            },
          },
        });
        return nextIdx;
      },

      completeBossPhase: (floorId: number, phase: number) => {
        const state = get();
        const fp = state.bossProgress[floorId] ?? createDefaultBossProgressForFloor(floorId);
        if (fp.clearedPhases.includes(phase)) return;
        set({
          bossProgress: {
            ...state.bossProgress,
            [floorId]: {
              ...fp,
              clearedPhases: [...fp.clearedPhases, phase],
            },
          },
        });
      },

      faintBossFight: (floorId: number) => {
        const state = get();
        const fp = state.bossProgress[floorId] ?? createDefaultBossProgressForFloor(floorId);
        const recoveredPhases = recoverBossAfterFaint(fp.clearedPhases);
        set({
          bossProgress: {
            ...state.bossProgress,
            [floorId]: {
              ...fp,
              clearedPhases: recoveredPhases,
            },
          },
        });
      },

      resetBossFightProgress: (floorId?: number) => {
        const state = get();
        if (floorId !== undefined) {
          set({
            bossProgress: {
              ...state.bossProgress,
              [floorId]: createDefaultBossProgressForFloor(floorId),
            },
          });
        } else {
          set({
            bossProgress: createInitialBossProgressMap(),
          });
        }
      },

      defeatBoss: (floorId: number) => {
        const state = get();
        const floor = FLOORS.find((f) => f.id === floorId);
        if (!floor) {
          return { xpGained: 0, leveledUp: false, newLevel: calculateLevelFromXP(state.xp) };
        }

        const bossId = floor.boss.id;
        const alreadyDefeated = state.defeatedBosses.includes(bossId);
        const xpGained = alreadyDefeated ? 0 : BOSS_XP;
        const oldLevel = calculateLevelFromXP(state.xp);
        const newXP = state.xp + xpGained;
        const newLevel = calculateLevelFromXP(newXP);
        const leveledUp = newLevel > oldLevel;

        const nextDefeatedBosses = alreadyDefeated
          ? state.defeatedBosses
          : [...state.defeatedBosses, bossId];

        const nextBadges = !state.badges.includes(floor.boss.badge.id)
          ? [...state.badges, floor.boss.badge.id]
          : state.badges;

        const nextRelics = !state.relics.includes(floor.boss.relic.id)
          ? [...state.relics, floor.boss.relic.id]
          : state.relics;

        const nextStreakInfo = computeNextStreak(state.streak, state.lastActiveDate);
        const fp = state.bossProgress[floorId] ?? createDefaultBossProgressForFloor(floorId);
        const totalPhases = getTotalBossPhases(floorId);
        const allPhaseNumbers = Array.from({ length: totalPhases }, (_, idx) => idx + 1);

        set({
          xp: newXP,
          defeatedBosses: nextDefeatedBosses,
          badges: nextBadges,
          relics: nextRelics,
          bossProgress:
            floorId >= 1 && floorId <= 5
              ? {
                  ...state.bossProgress,
                  [floorId]: {
                    ...fp,
                    clearedPhases: allPhaseNumbers,
                  },
                }
              : state.bossProgress,
          streak: nextStreakInfo.streak,
          lastActiveDate: nextStreakInfo.lastActiveDate,
          levelUpModal: leveledUp
            ? {
                isOpen: true,
                oldLevel,
                newLevel,
                newTitle: getTitleForLevel(newLevel),
              }
            : state.levelUpModal,
        });

        return { xpGained, leveledUp, newLevel };
      },

      toggleTowerStep: (questId: string, stepId: string) => {
        const state = get();
        if (state.towerCompleted.includes(questId)) {
          return false;
        }
        const quest = getTowerQuestById(questId);
        if (!quest || !quest.steps.some((s) => s.id === stepId)) {
          return false;
        }
        const currentQuestSteps = state.towerSteps[questId] || {};
        const isCurrentlyTicked = Boolean(currentQuestSteps[stepId]);

        if (!isCurrentlyTicked && !canTickTowerStep(questId, stepId, state.specialization)) {
          return false;
        }

        const nextQuestSteps = { ...currentQuestSteps };
        if (isCurrentlyTicked) {
          delete nextQuestSteps[stepId];
        } else {
          nextQuestSteps[stepId] = true;
        }

        set({
          towerSteps: {
            ...state.towerSteps,
            [questId]: nextQuestSteps,
          },
        });
        return !isCurrentlyTicked;
      },

      setSpecialization: (specialization: string | null) => {
        const state = get();
        const cleanSpec =
          typeof specialization === 'string' && specialization.trim().length > 0
            ? specialization.trim()
            : null;

        // If specialization is cleared while m6 is not yet completed, untick m6s3
        let nextTowerSteps = state.towerSteps;
        if (!cleanSpec && !state.towerCompleted.includes('m6') && state.towerSteps.m6?.m6s3) {
          const m6Steps = { ...state.towerSteps.m6 };
          delete m6Steps.m6s3;
          nextTowerSteps = {
            ...state.towerSteps,
            m6: m6Steps,
          };
        }

        set({
          specialization: cleanSpec,
          towerSteps: nextTowerSteps,
        });
      },

      completeTowerQuest: (questId: string) => {
        const state = get();
        const quest = getTowerQuestById(questId);
        if (
          !quest ||
          !canCompleteTowerQuest(
            questId,
            state.towerSteps,
            state.towerCompleted,
            state.specialization
          )
        ) {
          return {
            xpGained: 0,
            relicName: null,
            relicId: null,
            leveledUp: false,
            newLevel: calculateLevelFromXP(state.xp),
          };
        }

        const xpGained = quest.xp || TOWER_QUEST_XP;
        const oldLevel = calculateLevelFromXP(state.xp);
        const newXP = state.xp + xpGained;
        const newLevel = calculateLevelFromXP(newXP);
        const leveledUp = newLevel > oldLevel;
        const nextStreakInfo = computeNextStreak(state.streak, state.lastActiveDate);

        const relicId = getTowerRelicId(quest.id);
        const nextRelics = state.relics.includes(relicId)
          ? state.relics
          : [...state.relics, relicId];

        const nextCompleted = state.towerCompleted.includes(quest.id)
          ? state.towerCompleted
          : [...state.towerCompleted, quest.id];

        set({
          xp: newXP,
          towerCompleted: nextCompleted,
          completedTowerQuests: nextCompleted,
          relics: nextRelics,
          streak: nextStreakInfo.streak,
          lastActiveDate: nextStreakInfo.lastActiveDate,
          levelUpModal: leveledUp
            ? {
                isOpen: true,
                oldLevel,
                newLevel,
                newTitle: getTitleForLevel(newLevel),
              }
            : state.levelUpModal,
        });

        return {
          xpGained,
          relicName: quest.relic,
          relicId,
          leveledUp,
          newLevel,
        };
      },

      setReflectionAnswer: (promptId: string, answer: string) => {
        const state = get();
        const safeAnswer = String(answer ?? '').slice(0, 500);
        set({
          reflections: {
            ...state.reflections,
            [promptId]: safeAnswer,
          },
        });
      },

      issueCertificate: () => {
        const state = get();
        if (state.certificateIssuedAt) {
          return state.certificateIssuedAt;
        }
        const nowIso = new Date().toISOString();
        set({
          certificateIssuedAt: nowIso,
        });
        return nowIso;
      },

      toggleTowerQuest: (questId: string) => {
        const state = get();
        const legacyMatch = /^tower-(\d+)$/.exec(questId);
        const normalizedId = legacyMatch ? `m${legacyMatch[1]}` : questId;
        const quest =
          getTowerQuestById(normalizedId) || TOWER_FLOOR.quests.find((q) => q.id === questId);
        if (!quest) {
          return { xpGained: 0, leveledUp: false, newLevel: calculateLevelFromXP(state.xp) };
        }

        const alreadyDone =
          state.towerCompleted.includes(normalizedId) ||
          state.completedTowerQuests.includes(questId);
        if (alreadyDone) {
          return { xpGained: 0, leveledUp: false, newLevel: calculateLevelFromXP(state.xp) };
        }

        const xpGained = TOWER_QUEST_XP;
        const oldLevel = calculateLevelFromXP(state.xp);
        const newXP = state.xp + xpGained;
        const newLevel = calculateLevelFromXP(newXP);
        const leveledUp = newLevel > oldLevel;
        const nextStreakInfo = computeNextStreak(state.streak, state.lastActiveDate);

        const nextCompleted = [...state.towerCompleted, normalizedId];
        const relicId = getTowerRelicId(normalizedId);
        const nextRelics = state.relics.includes(relicId)
          ? state.relics
          : [...state.relics, relicId];

        set({
          xp: newXP,
          completedTowerQuests: nextCompleted,
          towerCompleted: nextCompleted,
          relics: nextRelics,
          streak: nextStreakInfo.streak,
          lastActiveDate: nextStreakInfo.lastActiveDate,
          levelUpModal: leveledUp
            ? {
                isOpen: true,
                oldLevel,
                newLevel,
                newTitle: getTitleForLevel(newLevel),
              }
            : state.levelUpModal,
        });

        return { xpGained, leveledUp, newLevel };
      },

      logStudySession: (input: LogSessionInput) => {
        const state = get();
        const durationMinutes = Math.max(1, Math.min(1440, Math.round(input.durationMinutes)));
        const dateKey = input.date || getLocalDateKey();

        const newSession: StudySession = {
          id: `ses-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          topicId: input.topicId || 'topic-1',
          durationMinutes,
          date: dateKey,
          note: input.note?.trim() || undefined,
          source: input.source || 'manual',
          createdAt: Date.now(),
        };

        const nextSessions = [newSession, ...state.studySessions];
        const sessionWeekKey = getWeekStartDateKey(dateKey);

        const weekMinutes = nextSessions
          .filter((s) => getWeekStartDateKey(s.date) === sessionWeekKey)
          .reduce((sum, s) => sum + s.durationMinutes, 0);
        const weekHours = weekMinutes / 60;

        const alreadyClaimedWeek = state.claimedWeeklyBonusWeeks.includes(sessionWeekKey);
        const meetsWeeklyTarget = weekHours >= state.weeklyTargetHours;
        const bonusXPAwarded = !alreadyClaimedWeek && meetsWeeklyTarget ? WEEKLY_BONUS_XP : 0;

        const nextClaimedWeeks =
          bonusXPAwarded > 0
            ? [...state.claimedWeeklyBonusWeeks, sessionWeekKey]
            : state.claimedWeeklyBonusWeeks;

        const oldLevel = calculateLevelFromXP(state.xp);
        const newXP = state.xp + bonusXPAwarded;
        const newLevel = calculateLevelFromXP(newXP);
        const leveledUp = newLevel > oldLevel;

        const todayKey = getLocalDateKey();
        const nextStreakInfo =
          dateKey === todayKey
            ? computeNextStreak(state.streak, state.lastActiveDate)
            : { streak: state.streak, lastActiveDate: state.lastActiveDate };

        set({
          studySessions: nextSessions,
          claimedWeeklyBonusWeeks: nextClaimedWeeks,
          xp: newXP,
          streak: nextStreakInfo.streak,
          lastActiveDate: nextStreakInfo.lastActiveDate,
          levelUpModal: leveledUp
            ? {
                isOpen: true,
                oldLevel,
                newLevel,
                newTitle: getTitleForLevel(newLevel),
              }
            : state.levelUpModal,
        });

        return { session: newSession, bonusXPAwarded, leveledUp, newLevel };
      },

      deleteStudySession: (sessionId: string) => {
        set((s) => ({
          studySessions: s.studySessions.filter((item) => item.id !== sessionId),
        }));
      },

      setWeeklyTargetHours: (hours: number) => {
        const state = get();
        const safeHours = Math.max(1, Math.min(60, Math.round(hours * 10) / 10));
        const currentWeekKey = getWeekStartDateKey(new Date());
        const currentWeekMinutes = state.studySessions
          .filter((s) => getWeekStartDateKey(s.date) === currentWeekKey)
          .reduce((sum, s) => sum + s.durationMinutes, 0);
        const currentWeekHours = currentWeekMinutes / 60;

        const alreadyClaimed = state.claimedWeeklyBonusWeeks.includes(currentWeekKey);
        const meetsTarget = currentWeekHours > 0 && currentWeekHours >= safeHours;
        const bonusXPAwarded = !alreadyClaimed && meetsTarget ? WEEKLY_BONUS_XP : 0;

        const nextClaimedWeeks =
          bonusXPAwarded > 0
            ? [...state.claimedWeeklyBonusWeeks, currentWeekKey]
            : state.claimedWeeklyBonusWeeks;

        const oldLevel = calculateLevelFromXP(state.xp);
        const newXP = state.xp + bonusXPAwarded;
        const newLevel = calculateLevelFromXP(newXP);
        const leveledUp = newLevel > oldLevel;

        set({
          weeklyTargetHours: safeHours,
          claimedWeeklyBonusWeeks: nextClaimedWeeks,
          xp: newXP,
          levelUpModal: leveledUp
            ? {
                isOpen: true,
                oldLevel,
                newLevel,
                newTitle: getTitleForLevel(newLevel),
              }
            : state.levelUpModal,
        });

        return { bonusXPAwarded, leveledUp, newLevel };
      },

      exportSaveJSON: () => {
        const s = get();
        const payload = {
          version: CURRENT_VERSION,
          exportedAt: new Date().toISOString(),
          state: {
            version: s.version,
            hasStarted: s.hasStarted,
            playerName: s.playerName,
            avatarId: s.avatarId,
            xp: s.xp,
            streak: s.streak,
            lastActiveDate: s.lastActiveDate,
            completedRooms: s.completedRooms,
            defeatedBosses: s.defeatedBosses,
            completedTowerQuests: s.completedTowerQuests,
            towerSteps: s.towerSteps,
            towerCompleted: s.towerCompleted,
            reflections: s.reflections,
            specialization: s.specialization,
            certificateIssuedAt: s.certificateIssuedAt,
            relics: s.relics,
            badges: s.badges,
            quizBestScores: s.quizBestScores,
            bestScoreByTopic: s.bestScoreByTopic,
            quizBonusClaimedRooms: s.quizBonusClaimedRooms,
            echoBonusClaimedRooms: s.echoBonusClaimedRooms,
            spellsUnlocked: s.spellsUnlocked,
            questionStats: s.questionStats,
            bossProgress: s.bossProgress,
            dojoDailyXP: s.dojoDailyXP,
            evidenceNotes: s.evidenceNotes,
            studySessions: s.studySessions,
            weeklyTargetHours: s.weeklyTargetHours,
            claimedWeeklyBonusWeeks: s.claimedWeeklyBonusWeeks,
            activeFloorId: s.activeFloorId,
            activeNodeByFloor: s.activeNodeByFloor,
            soundEnabled: s.soundEnabled,
            reduceMotion: s.reduceMotion,
            lessonProgress: s.lessonProgress,
            summaries: s.summaries,
            taskDone: s.taskDone,
            reviewQueue: s.reviewQueue,
            settings: s.settings,
          },
        };
        return JSON.stringify(payload, null, 2);
      },

      importSaveJSON: (rawJson: string) => {
        const result = validateAndParseSaveJSON(rawJson);
        if (!result.valid) {
          return { success: false, message: result.error };
        }
        const migrated = migrateV1ToV2State(result.data);
        set((prev) => ({
          ...prev,
          ...migrated,
          hasStarted: true,
          version: CURRENT_VERSION,
        }));
        return {
          success: true,
          message: 'Data simpanan berhasil diimpor! Seluruh progres telah dipulihkan.',
        };
      },

      dismissLevelUpModal: () => {
        set({ levelUpModal: null });
      },

      clearNewlyUnlocked: () => {
        set({ newlyUnlockedIds: [] });
      },

      toggleSound: () => {
        set((s) => ({ soundEnabled: !s.soundEnabled }));
      },

      setSfxVolume: (volume: number) => {
        const clamped =
          typeof volume === 'number' && !Number.isNaN(volume)
            ? Math.max(0, Math.min(1, Number(volume.toFixed(2))))
            : 0.75;
        set({ sfxVolume: clamped });
      },

      toggleMusic: () => {
        set((s) => ({ musicEnabled: !s.musicEnabled }));
      },

      setMusicEnabled: (enabled: boolean) => {
        set({ musicEnabled: Boolean(enabled) });
      },

      setMusicVolume: (volume: number) => {
        const clamped =
          typeof volume === 'number' && !Number.isNaN(volume)
            ? Math.max(0, Math.min(1, Number(volume.toFixed(2))))
            : 0.35;
        set({ musicVolume: clamped });
      },

      toggleReduceMotion: () => {
        set((s) => ({ reduceMotion: !s.reduceMotion }));
      },

      recordChunkPracticeAttempt: (
        chunkId: string,
        activityId: string,
        totalPracticeIds?: string[]
      ) => {
        const state = get();
        const prev = state.lessonProgress[chunkId] || {
          done: false,
          attempts: 0,
          attemptedActivities: [],
        };
        const attemptedSet = new Set(prev.attemptedActivities || []);
        attemptedSet.add(activityId);

        const foundChunk = getLessonChunkById(chunkId);

        let allAttempted = prev.done;
        if (Array.isArray(totalPracticeIds) && totalPracticeIds.length > 0) {
          allAttempted =
            prev.done || totalPracticeIds.every((id) => attemptedSet.has(id));
        } else if (foundChunk) {
          allAttempted =
            prev.done ||
            foundChunk.practice.every((act) => attemptedSet.has(act.id));
        }

        const nextReviewQueue = { ...state.reviewQueue };
        if (allAttempted && foundChunk) {
          const todayKey = getLocalDateKey();
          for (const item of foundChunk.reviewItems || []) {
            if (!nextReviewQueue[item.id]) {
              nextReviewQueue[item.id] = {
                box: 0,
                due: todayKey,
              };
            }
          }
        }

        set({
          lessonProgress: {
            ...state.lessonProgress,
            [chunkId]: {
              done: allAttempted,
              attempts: prev.attempts + 1,
              attemptedActivities: Array.from(attemptedSet),
            },
          },
          reviewQueue: nextReviewQueue,
        });
      },

      completeLessonChunk: (chunkId: string, reviewItems: LessonReviewItem[]) => {
        const state = get();
        const prev = state.lessonProgress[chunkId] || {
          done: false,
          attempts: 0,
          attemptedActivities: [],
        };
        const attemptedSet = new Set(prev.attemptedActivities || []);
        let allAttempted = prev.done;
        for (let tId = 1; tId <= 28; tId++) {
          const found = getLessonChunksForTopic(tId).find((c) => c.chunkId === chunkId);
          if (found) {
            allAttempted =
              prev.done ||
              found.practice.every((act) => attemptedSet.has(act.id));
            break;
          }
        }

        const todayKey = getLocalDateKey();
        const nextReviewQueue = { ...state.reviewQueue };

        for (const item of reviewItems || []) {
          if (!nextReviewQueue[item.id]) {
            nextReviewQueue[item.id] = {
              box: 0,
              due: todayKey,
            };
          }
        }

        set({
          lessonProgress: {
            ...state.lessonProgress,
            [chunkId]: {
              ...prev,
              done: allAttempted,
              attempts: Math.max(1, prev.attempts),
            },
          },
          reviewQueue: nextReviewQueue,
        });
      },

      setChunkSummary: (chunkId: string, summary: string) => {
        const state = get();
        const cleanSummary = String(summary ?? '').slice(0, 400);
        set({
          summaries: {
            ...state.summaries,
            [chunkId]: cleanSummary,
          },
        });
      },

      toggleChunkRealTaskDone: (chunkId: string, done?: boolean) => {
        const state = get();
        const nextVal = typeof done === 'boolean' ? done : !state.taskDone[chunkId];
        const nextTaskDone = { ...state.taskDone };
        if (nextVal) {
          nextTaskDone[chunkId] = true;
        } else {
          delete nextTaskDone[chunkId];
        }
        set({ taskDone: nextTaskDone });
      },

      gradeReviewItem: (itemId: string, rating: ReviewRating) => {
        const state = get();
        const todayKey = getLocalDateKey();
        const currentEntry = state.reviewQueue[itemId];
        const nextEntry = scheduleReviewItem(
          currentEntry,
          rating,
          state.settings?.intervalScale ?? DEFAULT_INTERVAL_SCALE,
          todayKey
        );

        // Reviews count toward the daily streak but give no XP
        const nextStreakInfo = computeNextStreak(state.streak, state.lastActiveDate);

        set({
          reviewQueue: {
            ...state.reviewQueue,
            [itemId]: nextEntry,
          },
          streak: nextStreakInfo.streak,
          lastActiveDate: nextStreakInfo.lastActiveDate,
        });

        return nextEntry;
      },

      setIntervalScale: (scale: number) => {
        const state = get();
        const safeScale = clampIntervalScale(scale);
        set({
          settings: {
            ...state.settings,
            intervalScale: safeScale,
          },
        });
      },

      resetProgress: () => {
        set({
          ...INITIAL_PERSISTED_STATE,
          currentView: 'title',
          selectedTopicId: null,
          scrollOnlyTopicId: null,
          selectedBossFloorId: null,
          levelUpModal: null,
          newlyUnlockedIds: [],
        });
      },
    }),
    {
      name: STORAGE_KEY,
      version: CURRENT_VERSION,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        version: state.version,
        hasStarted: state.hasStarted,
        playerName: state.playerName,
        avatarId: state.avatarId,
        xp: state.xp,
        streak: state.streak,
        lastActiveDate: state.lastActiveDate,
        completedRooms: state.completedRooms,
        defeatedBosses: state.defeatedBosses,
        completedTowerQuests: state.completedTowerQuests,
        towerSteps: state.towerSteps,
        towerCompleted: state.towerCompleted,
        reflections: state.reflections,
        specialization: state.specialization,
        certificateIssuedAt: state.certificateIssuedAt,
        relics: state.relics,
        badges: state.badges,
        quizBestScores: state.quizBestScores,
        bestScoreByTopic: state.bestScoreByTopic,
        quizBonusClaimedRooms: state.quizBonusClaimedRooms,
        echoBonusClaimedRooms: state.echoBonusClaimedRooms,
        spellsUnlocked: state.spellsUnlocked,
        questionStats: state.questionStats,
        bossProgress: state.bossProgress,
        dojoDailyXP: state.dojoDailyXP,
        evidenceNotes: state.evidenceNotes,
        studySessions: state.studySessions,
        weeklyTargetHours: state.weeklyTargetHours,
        claimedWeeklyBonusWeeks: state.claimedWeeklyBonusWeeks,
        activeFloorId: state.activeFloorId,
        activeNodeByFloor: state.activeNodeByFloor,
        soundEnabled: state.soundEnabled,
        sfxVolume: state.sfxVolume,
        musicEnabled: state.musicEnabled,
        musicVolume: state.musicVolume,
        reduceMotion: state.reduceMotion,
        lessonProgress: state.lessonProgress,
        summaries: state.summaries,
        taskDone: state.taskDone,
        reviewQueue: state.reviewQueue,
        settings: state.settings,
      }),
      migrate: (persistedState: unknown, _version: number) => {
        try {
          if (!persistedState || typeof persistedState !== 'object') {
            return {
              ...INITIAL_PERSISTED_STATE,
              bossProgress: createInitialBossProgressMap(),
            };
          }
          return migrateStateToV3(persistedState as Record<string, unknown>);
        } catch {
          return {
            ...INITIAL_PERSISTED_STATE,
            bossProgress: createInitialBossProgressMap(),
          };
        }
      },
      merge: (persistedState: unknown, currentState: GameState) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return currentState;
        }
        const normalized = migrateStateToV3(persistedState as Record<string, unknown>);
        return {
          ...currentState,
          ...normalized,
        };
      },
    }
  )
);
