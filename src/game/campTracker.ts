import { ALL_TOPICS, FLOORS } from '../data/roadmap.js';

export const MAX_SAVE_FILE_BYTES = 1024 * 1024; // 1 MB


export function getLocalDateKey(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface StudySession {
  id: string;
  topicId: string;
  durationMinutes: number;
  date: string; // YYYY-MM-DD
  note?: string;
  source: 'manual' | 'pomodoro';
  createdAt: number;
}

export interface WeekBucket {
  weekKey: string; // Monday YYYY-MM-DD
  shortLabel: string;
  dateRangeLabel: string;
  totalMinutes: number;
  totalHours: number;
  sessionCount: number;
}

export interface CampfireStageInfo {
  stage: 0 | 1 | 2 | 3 | 4;
  percent: number;
  name: string;
  description: string;
}

export interface ProjectedCompletionInfo {
  remainingRoadmapWeeks: number;
  remainingEstimatedHours: number;
  actualAvgHoursPerWeek: number;
  effectiveHoursPerWeek: number;
  usingActualAverage: boolean;
  estimatedWeeksToFinish: number;
  projectedMonthYear: string;
}

export const WEEKLY_BONUS_XP = 50;
export const DEFAULT_WEEKLY_TARGET_HOURS = 9;
export const BASELINE_HOURS_PER_ROADMAP_WEEK = 9; // Midpoint of 8-10 hours/week roadmap assumption

const INDONESIAN_MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const INDONESIAN_MONTHS_FULL = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/**
 * Parses a YYYY-MM-DD string into a local Date at noon (to avoid DST boundary shifts).
 */
export function parseLocalDateString(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  }
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
}

/**
 * Returns the Monday YYYY-MM-DD key for the calendar week containing the given date.
 */
export function getWeekStartDateKey(dateInput: string | Date = new Date()): string {
  const d =
    typeof dateInput === 'string'
      ? parseLocalDateString(dateInput)
      : new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate(), 12, 0, 0);

  const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + diffToMonday);
  return getLocalDateKey(d);
}

function formatWeekDateRange(mondayDateStr: string): string {
  const monday = parseLocalDateString(mondayDateStr);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const mDay = monday.getDate();
  const mMonth = INDONESIAN_MONTHS_SHORT[monday.getMonth()];
  const sDay = sunday.getDate();
  const sMonth = INDONESIAN_MONTHS_SHORT[sunday.getMonth()];

  if (monday.getMonth() === sunday.getMonth()) {
    return `${mDay}-${sDay} ${mMonth}`;
  }
  return `${mDay} ${mMonth}-${sDay} ${sMonth}`;
}

/**
 * Builds 8 calendar week buckets ending at the week of referenceDate (oldest first, newest last).
 */
export function getLast8WeeksBuckets(
  sessions: StudySession[],
  referenceDate: string | Date = new Date()
): WeekBucket[] {
  const currentMondayStr = getWeekStartDateKey(referenceDate);
  const currentMonday = parseLocalDateString(currentMondayStr);

  // Group session minutes and counts by weekKey
  const minutesByWeek: Record<string, number> = {};
  const countByWeek: Record<string, number> = {};

  for (const s of sessions) {
    if (!s || typeof s.durationMinutes !== 'number' || s.durationMinutes <= 0) continue;
    const wk = getWeekStartDateKey(s.date);
    minutesByWeek[wk] = (minutesByWeek[wk] || 0) + s.durationMinutes;
    countByWeek[wk] = (countByWeek[wk] || 0) + 1;
  }

  const buckets: WeekBucket[] = [];
  for (let offset = 7; offset >= 0; offset--) {
    const d = new Date(currentMonday);
    d.setDate(currentMonday.getDate() - offset * 7);
    const wk = getLocalDateKey(d);
    const totalMinutes = Math.round(minutesByWeek[wk] || 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    buckets.push({
      weekKey: wk,
      shortLabel: offset === 0 ? 'Minggu Ini' : `M-${offset}`,
      dateRangeLabel: formatWeekDateRange(wk),
      totalMinutes,
      totalHours,
      sessionCount: countByWeek[wk] || 0,
    });
  }

  return buckets;
}

/**
 * Determines campfire visual growth stage from weekly hours vs target hours.
 */
export function getCampfireStage(
  weeklyHours: number,
  weeklyTargetHours: number
): CampfireStageInfo {
  const safeTarget = Math.max(1, weeklyTargetHours || DEFAULT_WEEKLY_TARGET_HOURS);
  const rawPercent = Math.round((Math.max(0, weeklyHours) / safeTarget) * 100);
  const percent = Math.min(100, rawPercent);

  if (weeklyHours <= 0) {
    return {
      stage: 0,
      percent: 0,
      name: 'Bara Kayu Padam',
      description: 'Belum ada sesi belajar minggu ini. Catat sesi atau mulai Pomodoro untuk menyalakan api!',
    };
  }
  if (rawPercent < 40) {
    return {
      stage: 1,
      percent,
      name: 'Percikan Api Kecil',
      description: 'Api mulai menyala hangat. Teruskan ritme belajarmu minggu ini!',
    };
  }
  if (rawPercent < 75) {
    return {
      stage: 2,
      percent,
      name: 'Api Unggun Hangat',
      description: 'Separuh perjalanan target mingguan telah ditempuh. Cahaya perkemahan makin terang!',
    };
  }
  if (rawPercent < 100) {
    return {
      stage: 3,
      percent,
      name: 'Api Berkobar Terang',
      description: 'Sedikit lagi menuju target mingguan! Bonus XP mingguan sudah di depan mata.',
    };
  }
  return {
    stage: 4,
    percent: 100,
    name: 'Api Unggun Legendaris',
    description: 'Target jam belajar minggu ini tercapai! Api berkobar penuh dengan berkah XP.',
  };
}

/**
 * Calculates rough projected completion month based on remaining topics and actual average hours/week.
 */
export function calculateProjectedCompletion(
  completedRoomIds: string[],
  sessions: StudySession[],
  weeklyTargetHours: number,
  referenceDate: Date = new Date()
): ProjectedCompletionInfo {
  let remainingRoadmapWeeks = 0;
  for (const topic of ALL_TOPICS) {
    if (!completedRoomIds.includes(topic.id)) {
      remainingRoadmapWeeks += (topic.weeks.min + topic.weeks.max) / 2;
    }
  }
  remainingRoadmapWeeks = Math.round(remainingRoadmapWeeks * 10) / 10;

  const remainingEstimatedHours = Math.round(
    remainingRoadmapWeeks * BASELINE_HOURS_PER_ROADMAP_WEEK * 10
  ) / 10;

  const buckets = getLast8WeeksBuckets(sessions, referenceDate);
  const activeBuckets = buckets.filter((b) => b.totalMinutes > 0);

  let actualAvgHoursPerWeek = 0;
  if (activeBuckets.length > 0) {
    const sumHours = activeBuckets.reduce((acc, b) => acc + b.totalMinutes / 60, 0);
    actualAvgHoursPerWeek = Math.round((sumHours / activeBuckets.length) * 10) / 10;
  }

  const safeTarget = Math.max(1, weeklyTargetHours || DEFAULT_WEEKLY_TARGET_HOURS);
  const usingActualAverage = actualAvgHoursPerWeek > 0;
  const effectiveHoursPerWeek = usingActualAverage ? actualAvgHoursPerWeek : safeTarget;

  if (remainingEstimatedHours <= 0) {
    const monthName = INDONESIAN_MONTHS_FULL[referenceDate.getMonth()];
    return {
      remainingRoadmapWeeks: 0,
      remainingEstimatedHours: 0,
      actualAvgHoursPerWeek,
      effectiveHoursPerWeek,
      usingActualAverage,
      estimatedWeeksToFinish: 0,
      projectedMonthYear: `Selesai (${monthName} ${referenceDate.getFullYear()})`,
    };
  }

  const estimatedWeeksToFinish = Math.max(
    1,
    Math.ceil(remainingEstimatedHours / Math.max(0.5, effectiveHoursPerWeek))
  );

  const projectedDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() + estimatedWeeksToFinish * 7,
    12,
    0,
    0
  );

  const projectedMonthYear = `${
    INDONESIAN_MONTHS_FULL[projectedDate.getMonth()]
  } ${projectedDate.getFullYear()}`;

  return {
    remainingRoadmapWeeks,
    remainingEstimatedHours,
    actualAvgHoursPerWeek,
    effectiveHoursPerWeek,
    usingActualAverage,
    estimatedWeeksToFinish,
    projectedMonthYear,
  };
}

/**
 * Validates whether a node ID is a valid topic ID or boss ID on the given floor (1..5).
 */
export function isValidFloorNodeId(floorId: number, nodeId: unknown): nodeId is string {
  if (typeof nodeId !== 'string' || !nodeId.trim()) return false;
  const floor = FLOORS.find((f) => f.id === floorId);
  if (!floor) return false;
  return floor.boss.id === nodeId || floor.topics.some((t) => t.id === nodeId);
}

/**
 * Validates and normalizes an imported JSON save file string.
 */
export function validateAndParseSaveJSON(
  rawJson: string
): { valid: true; data: Record<string, unknown> } | { valid: false; error: string } {
  if (!rawJson || typeof rawJson !== 'string' || !rawJson.trim()) {
    return { valid: false, error: 'Teks atau file JSON kosong.' };
  }

  const byteLength =
    typeof TextEncoder !== 'undefined'
      ? new TextEncoder().encode(rawJson).length
      : rawJson.length;
  if (byteLength > MAX_SAVE_FILE_BYTES) {
    return {
      valid: false,
      error: 'Ukuran file terlalu besar (maksimal 1 MB). File simpanan ditolak.',
    };
  }

  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { valid: false, error: 'Format JSON tidak valid: harus berupa objek data.' };
    }

    // Support both Zustand persist wrapper { state: {...}, version: 1 } and direct state object
    const candidate =
      parsed.state && typeof parsed.state === 'object' && !Array.isArray(parsed.state)
        ? (parsed.state as Record<string, unknown>)
        : (parsed as Record<string, unknown>);

    // Verify at least one recognizable game field exists
    const hasKnownKeys =
      'xp' in candidate ||
      'playerName' in candidate ||
      'completedRooms' in candidate ||
      'defeatedBosses' in candidate ||
      'towerCompleted' in candidate ||
      'completedTowerQuests' in candidate ||
      'studySessions' in candidate ||
      'lessonProgress' in candidate ||
      'reviewQueue' in candidate;

    if (!hasKnownKeys) {
      return {
        valid: false,
        error: 'JSON tidak dikenali sebagai data simpanan Dungeon Belajar ML & DL.',
      };
    }

    const sanitized: Record<string, unknown> = {};

    // 1. version
    if (
      typeof candidate.version === 'number' &&
      Number.isFinite(candidate.version) &&
      candidate.version >= 1
    ) {
      sanitized.version = Math.floor(candidate.version);
    }

    // 2. hasStarted
    if (typeof candidate.hasStarted === 'boolean') {
      sanitized.hasStarted = candidate.hasStarted;
    }

    // 3. playerName (<= 28 chars)
    if (typeof candidate.playerName === 'string') {
      sanitized.playerName = candidate.playerName.trim().slice(0, 28) || 'Petualang Tensor';
    }

    // 4. avatarId
    if (typeof candidate.avatarId === 'string' && candidate.avatarId.trim()) {
      sanitized.avatarId = candidate.avatarId.trim();
    }

    // 5. xp
    if (typeof candidate.xp === 'number' && Number.isFinite(candidate.xp) && candidate.xp >= 0) {
      sanitized.xp = Math.floor(candidate.xp);
    }

    // 6. streak
    if (
      typeof candidate.streak === 'number' &&
      Number.isFinite(candidate.streak) &&
      candidate.streak >= 0
    ) {
      sanitized.streak = Math.floor(candidate.streak);
    }

    // 7. lastActiveDate (null or YYYY-MM-DD)
    if (candidate.lastActiveDate === null) {
      sanitized.lastActiveDate = null;
    } else if (
      typeof candidate.lastActiveDate === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(candidate.lastActiveDate.trim())
    ) {
      sanitized.lastActiveDate = candidate.lastActiveDate.trim();
    }

    // 8. completedRooms
    if (Array.isArray(candidate.completedRooms)) {
      sanitized.completedRooms = candidate.completedRooms.filter((x) => typeof x === 'string');
    }

    // 9. defeatedBosses
    if (Array.isArray(candidate.defeatedBosses)) {
      sanitized.defeatedBosses = candidate.defeatedBosses.filter((x) => typeof x === 'string');
    }

    // 10. completedTowerQuests
    if (Array.isArray(candidate.completedTowerQuests)) {
      sanitized.completedTowerQuests = candidate.completedTowerQuests.filter(
        (x) => typeof x === 'string'
      );
    }

    // 11. towerSteps
    if (
      candidate.towerSteps &&
      typeof candidate.towerSteps === 'object' &&
      !Array.isArray(candidate.towerSteps)
    ) {
      const cleanSteps: Record<string, Record<string, boolean>> = {};
      for (const [qId, stepMap] of Object.entries(
        candidate.towerSteps as Record<string, unknown>
      )) {
        if (stepMap && typeof stepMap === 'object' && !Array.isArray(stepMap)) {
          cleanSteps[qId] = {};
          for (const [sId, val] of Object.entries(stepMap as Record<string, unknown>)) {
            if (typeof val === 'boolean' && val) {
              cleanSteps[qId][sId] = true;
            }
          }
        }
      }
      sanitized.towerSteps = cleanSteps;
    }

    // 12. towerCompleted
    if (Array.isArray(candidate.towerCompleted)) {
      sanitized.towerCompleted = candidate.towerCompleted.filter(
        (x) => typeof x === 'string'
      );
    }

    // 13. reflections (<= 500 chars)
    if (
      candidate.reflections &&
      typeof candidate.reflections === 'object' &&
      !Array.isArray(candidate.reflections)
    ) {
      const cleanReflections: Record<string, string> = {};
      for (const [pId, val] of Object.entries(candidate.reflections as Record<string, unknown>)) {
        if (typeof val === 'string') {
          cleanReflections[pId] = val.slice(0, 500);
        }
      }
      sanitized.reflections = cleanReflections;
    }

    // 14. specialization
    if (typeof candidate.specialization === 'string' || candidate.specialization === null) {
      sanitized.specialization =
        typeof candidate.specialization === 'string'
          ? candidate.specialization.trim() || null
          : null;
    }

    // 15. certificateIssuedAt
    if (
      typeof candidate.certificateIssuedAt === 'string' ||
      candidate.certificateIssuedAt === null
    ) {
      sanitized.certificateIssuedAt = candidate.certificateIssuedAt;
    }

    // 16. relics
    if (Array.isArray(candidate.relics)) {
      sanitized.relics = candidate.relics.filter((x) => typeof x === 'string');
    }

    // 17. badges
    if (Array.isArray(candidate.badges)) {
      sanitized.badges = candidate.badges.filter((x) => typeof x === 'string');
    }

    // 18. quizBestScores
    if (
      candidate.quizBestScores &&
      typeof candidate.quizBestScores === 'object' &&
      !Array.isArray(candidate.quizBestScores)
    ) {
      const cleanScores: Record<string, number> = {};
      for (const [k, v] of Object.entries(candidate.quizBestScores as Record<string, unknown>)) {
        if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100) {
          cleanScores[k] = v;
        }
      }
      sanitized.quizBestScores = cleanScores;
    }

    // 19. bestScoreByTopic
    if (
      candidate.bestScoreByTopic &&
      typeof candidate.bestScoreByTopic === 'object' &&
      !Array.isArray(candidate.bestScoreByTopic)
    ) {
      const cleanBestScores: Record<string, number> = {};
      for (const [k, v] of Object.entries(candidate.bestScoreByTopic as Record<string, unknown>)) {
        if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100) {
          cleanBestScores[k] = v;
        }
      }
      sanitized.bestScoreByTopic = cleanBestScores;
    }

    // 20. quizBonusClaimedRooms
    if (Array.isArray(candidate.quizBonusClaimedRooms)) {
      sanitized.quizBonusClaimedRooms = candidate.quizBonusClaimedRooms.filter(
        (x) => typeof x === 'string'
      );
    }

    // 21. echoBonusClaimedRooms
    if (Array.isArray(candidate.echoBonusClaimedRooms)) {
      sanitized.echoBonusClaimedRooms = candidate.echoBonusClaimedRooms.filter(
        (x) => typeof x === 'string'
      );
    }

    // 22. spellsUnlocked
    if (Array.isArray(candidate.spellsUnlocked)) {
      sanitized.spellsUnlocked = candidate.spellsUnlocked.filter((x) => typeof x === 'string');
    }

    // 23. questionStats
    if (
      candidate.questionStats &&
      typeof candidate.questionStats === 'object' &&
      !Array.isArray(candidate.questionStats)
    ) {
      const cleanStats: Record<string, { seen: number; wrong: number; correctStreak: number }> = {};
      for (const [qId, rawStat] of Object.entries(
        candidate.questionStats as Record<string, unknown>
      )) {
        if (rawStat && typeof rawStat === 'object' && !Array.isArray(rawStat)) {
          const st = rawStat as Record<string, unknown>;
          if (
            typeof st.seen === 'number' &&
            Number.isFinite(st.seen) &&
            st.seen >= 0 &&
            typeof st.wrong === 'number' &&
            Number.isFinite(st.wrong) &&
            st.wrong >= 0 &&
            typeof st.correctStreak === 'number' &&
            Number.isFinite(st.correctStreak) &&
            st.correctStreak >= 0
          ) {
            cleanStats[qId] = {
              seen: Math.floor(st.seen),
              wrong: Math.floor(st.wrong),
              correctStreak: Math.floor(st.correctStreak),
            };
          }
        }
      }
      sanitized.questionStats = cleanStats;
    }

    // 24. bossProgress (supports v2 flat object and v3 floor-keyed object)
    if (
      candidate.bossProgress &&
      typeof candidate.bossProgress === 'object' &&
      !Array.isArray(candidate.bossProgress)
    ) {
      sanitized.bossProgress = candidate.bossProgress;
    }

    // 25. dojoDailyXP
    if (
      candidate.dojoDailyXP &&
      typeof candidate.dojoDailyXP === 'object' &&
      !Array.isArray(candidate.dojoDailyXP)
    ) {
      const dj = candidate.dojoDailyXP as Record<string, unknown>;
      if (
        typeof dj.date === 'string' &&
        typeof dj.xp === 'number' &&
        Number.isFinite(dj.xp) &&
        dj.xp >= 0
      ) {
        sanitized.dojoDailyXP = {
          date: dj.date,
          xp: Math.floor(dj.xp),
        };
      }
    }

    // 26. evidenceNotes (<= 300 chars)
    if (
      candidate.evidenceNotes &&
      typeof candidate.evidenceNotes === 'object' &&
      !Array.isArray(candidate.evidenceNotes)
    ) {
      const cleanNotes: Record<string, string> = {};
      for (const [k, v] of Object.entries(candidate.evidenceNotes as Record<string, unknown>)) {
        if (typeof v === 'string') {
          cleanNotes[String(k)] = v.slice(0, 300);
        }
      }
      sanitized.evidenceNotes = cleanNotes;
    }

    // 27. studySessions
    if (Array.isArray(candidate.studySessions)) {
      sanitized.studySessions = candidate.studySessions.filter(
        (s) =>
          s &&
          typeof s === 'object' &&
          !Array.isArray(s) &&
          typeof (s as StudySession).id === 'string' &&
          typeof (s as StudySession).topicId === 'string' &&
          typeof (s as StudySession).durationMinutes === 'number' &&
          Number.isFinite((s as StudySession).durationMinutes) &&
          (s as StudySession).durationMinutes > 0 &&
          typeof (s as StudySession).date === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test((s as StudySession).date)
      );
    }

    // 28. weeklyTargetHours
    if (
      typeof candidate.weeklyTargetHours === 'number' &&
      Number.isFinite(candidate.weeklyTargetHours) &&
      candidate.weeklyTargetHours >= 1
    ) {
      sanitized.weeklyTargetHours = Math.min(80, Math.max(1, candidate.weeklyTargetHours));
    }

    // 29. claimedWeeklyBonusWeeks
    if (Array.isArray(candidate.claimedWeeklyBonusWeeks)) {
      sanitized.claimedWeeklyBonusWeeks = candidate.claimedWeeklyBonusWeeks.filter(
        (x) => typeof x === 'string'
      );
    }

    // 30. activeFloorId (valid floor ids 1..6 only)
    if (
      typeof candidate.activeFloorId === 'number' &&
      Number.isInteger(candidate.activeFloorId) &&
      candidate.activeFloorId >= 1 &&
      candidate.activeFloorId <= 6
    ) {
      sanitized.activeFloorId = candidate.activeFloorId;
    }

    // 31. activeNodeByFloor (valid floor ids 1..5 -> valid topic/boss id on that floor)
    if (
      candidate.activeNodeByFloor &&
      typeof candidate.activeNodeByFloor === 'object' &&
      !Array.isArray(candidate.activeNodeByFloor)
    ) {
      const cleanNodeByFloor: Record<number, string> = {};
      for (const [fKey, nodeVal] of Object.entries(
        candidate.activeNodeByFloor as Record<string, unknown>
      )) {
        const floorNum = Number(fKey);
        if (
          Number.isInteger(floorNum) &&
          floorNum >= 1 &&
          floorNum <= 5 &&
          isValidFloorNodeId(floorNum, nodeVal)
        ) {
          cleanNodeByFloor[floorNum] = nodeVal;
        }
      }
      sanitized.activeNodeByFloor = cleanNodeByFloor;
    }

    // 32. soundEnabled
    if (typeof candidate.soundEnabled === 'boolean') {
      sanitized.soundEnabled = candidate.soundEnabled;
    }

    // 33. sfxVolume (0..1)
    if (typeof candidate.sfxVolume === 'number' && Number.isFinite(candidate.sfxVolume)) {
      sanitized.sfxVolume = Math.max(0, Math.min(1, Number(candidate.sfxVolume.toFixed(2))));
    }

    // 34. musicEnabled
    if (typeof candidate.musicEnabled === 'boolean') {
      sanitized.musicEnabled = candidate.musicEnabled;
    }

    // 35. musicVolume (0..1)
    if (typeof candidate.musicVolume === 'number' && Number.isFinite(candidate.musicVolume)) {
      sanitized.musicVolume = Math.max(0, Math.min(1, Number(candidate.musicVolume.toFixed(2))));
    }

    // 36. reduceMotion
    if (typeof candidate.reduceMotion === 'boolean') {
      sanitized.reduceMotion = candidate.reduceMotion;
    }

    // 37. lessonProgress ({ done: boolean, attempts: number, attemptedActivities: string[] })
    if (
      candidate.lessonProgress &&
      typeof candidate.lessonProgress === 'object' &&
      !Array.isArray(candidate.lessonProgress)
    ) {
      const cleanLessonProgress: Record<
        string,
        { done: boolean; attempts: number; attemptedActivities: string[] }
      > = {};
      for (const [cId, val] of Object.entries(
        candidate.lessonProgress as Record<string, unknown>
      )) {
        if (!val || typeof val !== 'object' || Array.isArray(val)) continue;
        const obj = val as Record<string, unknown>;
        if ('done' in obj && typeof obj.done !== 'boolean') continue;
        if (
          'attempts' in obj &&
          (typeof obj.attempts !== 'number' || !Number.isFinite(obj.attempts) || obj.attempts < 0)
        ) {
          continue;
        }
        if ('attemptedActivities' in obj && !Array.isArray(obj.attemptedActivities)) {
          continue;
        }
        cleanLessonProgress[cId] = {
          done: Boolean(obj.done),
          attempts:
            typeof obj.attempts === 'number' && Number.isFinite(obj.attempts) && obj.attempts >= 0
              ? Math.floor(obj.attempts)
              : 0,
          attemptedActivities: Array.isArray(obj.attemptedActivities)
            ? obj.attemptedActivities.filter((x): x is string => typeof x === 'string')
            : [],
        };
      }
      sanitized.lessonProgress = cleanLessonProgress;
    }

    // 38. summaries (<= 400 chars)
    if (
      candidate.summaries &&
      typeof candidate.summaries === 'object' &&
      !Array.isArray(candidate.summaries)
    ) {
      const cleanSummaries: Record<string, string> = {};
      for (const [cId, val] of Object.entries(candidate.summaries as Record<string, unknown>)) {
        if (typeof val === 'string') {
          cleanSummaries[cId] = val.slice(0, 400);
        }
      }
      sanitized.summaries = cleanSummaries;
    }

    // 39. taskDone (booleans)
    if (
      candidate.taskDone &&
      typeof candidate.taskDone === 'object' &&
      !Array.isArray(candidate.taskDone)
    ) {
      const cleanTaskDone: Record<string, boolean> = {};
      for (const [cId, val] of Object.entries(candidate.taskDone as Record<string, unknown>)) {
        if (typeof val === 'boolean') {
          cleanTaskDone[cId] = val;
        }
      }
      sanitized.taskDone = cleanTaskDone;
    }

    // 40. reviewQueue ({ box: 0..4, due: YYYY-MM-DD })
    if (
      candidate.reviewQueue &&
      typeof candidate.reviewQueue === 'object' &&
      !Array.isArray(candidate.reviewQueue)
    ) {
      const cleanReviewQueue: Record<string, { box: number; due: string }> = {};
      for (const [itemId, val] of Object.entries(
        candidate.reviewQueue as Record<string, unknown>
      )) {
        if (!val || typeof val !== 'object' || Array.isArray(val)) continue;
        const obj = val as Record<string, unknown>;
        if (typeof obj.box !== 'number' || !Number.isFinite(obj.box)) continue;
        if (typeof obj.due !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(obj.due.trim())) continue;
        cleanReviewQueue[itemId] = {
          box: Math.max(0, Math.min(4, Math.floor(obj.box))),
          due: obj.due.trim(),
        };
      }
      sanitized.reviewQueue = cleanReviewQueue;
    }

    // 41. settings ({ intervalScale: 0.5..2 })
    if (
      candidate.settings &&
      typeof candidate.settings === 'object' &&
      !Array.isArray(candidate.settings)
    ) {
      const rawSettings = candidate.settings as Record<string, unknown>;
      if (
        typeof rawSettings.intervalScale === 'number' &&
        Number.isFinite(rawSettings.intervalScale)
      ) {
        const clampedScale = Math.max(
          0.5,
          Math.min(2, Math.round(rawSettings.intervalScale * 10) / 10)
        );
        sanitized.settings = { intervalScale: clampedScale };
      }
    }

    return { valid: true, data: sanitized };
  } catch {
    return {
      valid: false,
      error: 'Gagal membaca JSON. Pastikan format tanda kurung dan tanda kutip sudah benar.',
    };
  }
}

