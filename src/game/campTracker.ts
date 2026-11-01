import { ALL_TOPICS } from '../data/roadmap.js';

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

export const WEEKLY_BONUS_XP = 150;
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
 * Validates and normalizes an imported JSON save file string.
 */
export function validateAndParseSaveJSON(
  rawJson: string
): { valid: true; data: Record<string, unknown> } | { valid: false; error: string } {
  if (!rawJson || !rawJson.trim()) {
    return { valid: false, error: 'Teks atau file JSON kosong.' };
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
      'studySessions' in candidate;

    if (!hasKnownKeys) {
      return {
        valid: false,
        error: 'JSON tidak dikenali sebagai data simpanan Dungeon Belajar ML & DL.',
      };
    }

    const sanitized: Record<string, unknown> = {};

    if (typeof candidate.playerName === 'string') {
      sanitized.playerName = candidate.playerName.trim().slice(0, 28) || 'Petualang Tensor';
    }
    if (typeof candidate.avatarId === 'string') {
      sanitized.avatarId = candidate.avatarId;
    }
    if (typeof candidate.xp === 'number' && Number.isFinite(candidate.xp) && candidate.xp >= 0) {
      sanitized.xp = Math.floor(candidate.xp);
    }
    if (
      typeof candidate.streak === 'number' &&
      Number.isFinite(candidate.streak) &&
      candidate.streak >= 0
    ) {
      sanitized.streak = Math.floor(candidate.streak);
    }
    if (typeof candidate.lastActiveDate === 'string' || candidate.lastActiveDate === null) {
      sanitized.lastActiveDate = candidate.lastActiveDate;
    }
    if (Array.isArray(candidate.completedRooms)) {
      sanitized.completedRooms = candidate.completedRooms.filter((x) => typeof x === 'string');
    }
    if (Array.isArray(candidate.defeatedBosses)) {
      sanitized.defeatedBosses = candidate.defeatedBosses.filter((x) => typeof x === 'string');
    }
    if (Array.isArray(candidate.completedTowerQuests)) {
      sanitized.completedTowerQuests = candidate.completedTowerQuests.filter(
        (x) => typeof x === 'string'
      );
    }
    if (Array.isArray(candidate.towerCompleted)) {
      sanitized.towerCompleted = candidate.towerCompleted.filter(
        (x) => typeof x === 'string'
      );
    }
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
    if (typeof candidate.specialization === 'string' || candidate.specialization === null) {
      sanitized.specialization =
        typeof candidate.specialization === 'string'
          ? candidate.specialization.trim() || null
          : null;
    }
    if (
      typeof candidate.certificateIssuedAt === 'string' ||
      candidate.certificateIssuedAt === null
    ) {
      sanitized.certificateIssuedAt = candidate.certificateIssuedAt;
    }
    if (Array.isArray(candidate.relics)) {
      sanitized.relics = candidate.relics.filter((x) => typeof x === 'string');
    }
    if (Array.isArray(candidate.badges)) {
      sanitized.badges = candidate.badges.filter((x) => typeof x === 'string');
    }
    if (candidate.quizBestScores && typeof candidate.quizBestScores === 'object') {
      sanitized.quizBestScores = candidate.quizBestScores;
    }
    if (candidate.bestScoreByTopic && typeof candidate.bestScoreByTopic === 'object') {
      sanitized.bestScoreByTopic = candidate.bestScoreByTopic;
    }
    if (Array.isArray(candidate.quizBonusClaimedRooms)) {
      sanitized.quizBonusClaimedRooms = candidate.quizBonusClaimedRooms.filter(
        (x) => typeof x === 'string'
      );
    }
    if (Array.isArray(candidate.echoBonusClaimedRooms)) {
      sanitized.echoBonusClaimedRooms = candidate.echoBonusClaimedRooms.filter(
        (x) => typeof x === 'string'
      );
    }
    if (Array.isArray(candidate.spellsUnlocked)) {
      sanitized.spellsUnlocked = candidate.spellsUnlocked.filter((x) => typeof x === 'string');
    }
    if (candidate.questionStats && typeof candidate.questionStats === 'object') {
      sanitized.questionStats = candidate.questionStats;
    }
    if (candidate.bossProgress && typeof candidate.bossProgress === 'object') {
      sanitized.bossProgress = candidate.bossProgress;
    }
    if (candidate.dojoDailyXP && typeof candidate.dojoDailyXP === 'object') {
      sanitized.dojoDailyXP = candidate.dojoDailyXP;
    }
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
    if (Array.isArray(candidate.studySessions)) {
      sanitized.studySessions = candidate.studySessions.filter(
        (s) =>
          s &&
          typeof s === 'object' &&
          typeof (s as StudySession).id === 'string' &&
          typeof (s as StudySession).durationMinutes === 'number' &&
          typeof (s as StudySession).date === 'string'
      );
    }
    if (
      typeof candidate.weeklyTargetHours === 'number' &&
      Number.isFinite(candidate.weeklyTargetHours) &&
      candidate.weeklyTargetHours >= 1
    ) {
      sanitized.weeklyTargetHours = Math.min(80, Math.max(1, candidate.weeklyTargetHours));
    }
    if (Array.isArray(candidate.claimedWeeklyBonusWeeks)) {
      sanitized.claimedWeeklyBonusWeeks = candidate.claimedWeeklyBonusWeeks.filter(
        (x) => typeof x === 'string'
      );
    }
    if (typeof candidate.soundEnabled === 'boolean') {
      sanitized.soundEnabled = candidate.soundEnabled;
    }
    if (typeof candidate.reduceMotion === 'boolean') {
      sanitized.reduceMotion = candidate.reduceMotion;
    }

    return { valid: true, data: sanitized };
  } catch {
    return {
      valid: false,
      error: 'Gagal membaca JSON. Pastikan format tanda kurung dan tanda kutip sudah benar.',
    };
  }
}
