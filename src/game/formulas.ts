import { ALL_TOPICS, FLOORS, TopicItem } from '../data/roadmap.js';

export const BOSS_XP = 300;
export const TOWER_QUEST_XP = 150;

/**
 * Room XP = round(((min + max) / 2) * 50)
 */
export function calculateRoomXP(weeks: { min: number; max: number }): number {
  return Math.round(((weeks.min + weeks.max) / 2) * 50);
}

/**
 * XP needed to reach level L = 60 * (L - 1)^2
 * L1 = 0, L2 = 60, L3 = 240, L10 = 4860
 */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return 60 * Math.pow(level - 1, 2);
}

/**
 * Derive current level from total XP (no level cap)
 */
export function calculateLevelFromXP(xp: number): number {
  if (xp <= 0) return 1;
  return Math.floor(Math.sqrt(xp / 60)) + 1;
}

/**
 * Titles:
 * Lv1-2 "Novice Data"
 * Lv3-4 "Data Apprentice"
 * Lv5-6 "Neural Knight"
 * Lv7-9 "Edge Ranger"
 * Lv10+ "ML Archmage"
 */
export function getTitleForLevel(level: number): string {
  if (level <= 2) return 'Novice Data';
  if (level <= 4) return 'Data Apprentice';
  if (level <= 6) return 'Neural Knight';
  if (level <= 9) return 'Edge Ranger';
  return 'ML Archmage';
}

export function getLevelProgress(xp: number) {
  const safeXP = Math.max(0, xp);
  const level = calculateLevelFromXP(safeXP);
  const currentLevelXP = xpRequiredForLevel(level);
  const nextLevelXP = xpRequiredForLevel(level + 1);
  const xpInCurrentLevel = safeXP - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  const progressPercent =
    xpNeededForNextLevel > 0
      ? Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)))
      : 100;

  return {
    level,
    title: getTitleForLevel(level),
    currentLevelXP,
    nextLevelXP,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progressPercent,
  };
}

/**
 * Floor unlock logic:
 * - Floor 1: unlocked from start
 * - Floor 5 (Guild Hall): unlocked from start of the game
 * - Floors 2-4: unlocked when previous floor's boss is defeated
 * - Floor 6 (Menara Master): unlocked when all 5 bosses are defeated
 */
export function isFloorUnlocked(floorId: number, defeatedBosses: string[]): boolean {
  if (floorId === 1 || floorId === 5) return true;
  if (floorId === 2) return defeatedBosses.includes('boss-1');
  if (floorId === 3) return defeatedBosses.includes('boss-2');
  if (floorId === 4) return defeatedBosses.includes('boss-3');
  if (floorId === 6) {
    return ['boss-1', 'boss-2', 'boss-3', 'boss-4', 'boss-5'].every((id) =>
      defeatedBosses.includes(id)
    );
  }
  return false;
}

/**
 * Room unlock logic:
 * - Must be on an unlocked floor.
 * - Rooms flagged `parallel: true` (Topic 6 on Floor 1, Topics 21-28 on Floor 5)
 *   are unlocked from the start of that floor.
 * - Non-parallel rooms are unlocked sequentially when the previous non-parallel
 *   room on the same floor is defeated.
 */
export function isRoomUnlocked(
  topic: TopicItem,
  floorTopics: TopicItem[],
  completedRooms: string[],
  defeatedBosses: string[]
): boolean {
  if (!isFloorUnlocked(topic.floorId, defeatedBosses)) {
    return false;
  }
  if (topic.parallel) {
    return true;
  }
  const sequentialTopics = floorTopics.filter((t) => !t.parallel);
  const idx = sequentialTopics.findIndex((t) => t.id === topic.id);
  if (idx <= 0) return true;
  const prevTopic = sequentialTopics[idx - 1];
  return completedRooms.includes(prevTopic.id);
}

/**
 * Boss unlocks when all rooms of that floor are defeated
 * (Floor 5 boss: when all 8 guild quests are defeated).
 */
export function isBossUnlocked(
  floorId: number,
  floorTopics: TopicItem[],
  completedRooms: string[],
  defeatedBosses: string[]
): boolean {
  if (!isFloorUnlocked(floorId, defeatedBosses)) {
    return false;
  }
  return floorTopics.every((t) => completedRooms.includes(t.id));
}

/**
 * Format local calendar date as YYYY-MM-DD
 */
export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Difference in calendar days between two YYYY-MM-DD strings (b - a)
 */
export function diffCalendarDays(dateStrA: string, dateStrB: string): number {
  const [yA, mA, dA] = dateStrA.split('-').map(Number);
  const [yB, mB, dB] = dateStrB.split('-').map(Number);
  const utcA = Date.UTC(yA, mA - 1, dA);
  const utcB = Date.UTC(yB, mB - 1, dB);
  return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
}

/**
 * Streak: +1 for each calendar day (local time) with at least one room, boss, or quest completed;
 * resets if a day is skipped.
 */
export function computeNextStreak(
  currentStreak: number,
  lastActiveDate: string | null,
  todayDateStr: string = formatLocalDate()
): { streak: number; lastActiveDate: string } {
  if (!lastActiveDate) {
    return { streak: 1, lastActiveDate: todayDateStr };
  }
  const dayDiff = diffCalendarDays(lastActiveDate, todayDateStr);
  if (dayDiff === 0) {
    return { streak: Math.max(1, currentStreak), lastActiveDate: todayDateStr };
  }
  if (dayDiff === 1) {
    return { streak: Math.max(0, currentStreak) + 1, lastActiveDate: todayDateStr };
  }
  // If dayDiff > 1 (skipped at least a day) or negative clock shift, reset to 1 for today's activity
  return { streak: 1, lastActiveDate: todayDateStr };
}

export function getDisplayStreak(
  currentStreak: number,
  lastActiveDate: string | null,
  todayDateStr: string = formatLocalDate()
): number {
  if (!lastActiveDate || currentStreak <= 0) return 0;
  const dayDiff = diffCalendarDays(lastActiveDate, todayDateStr);
  if (dayDiff === 0 || dayDiff === 1) {
    return currentStreak;
  }
  return 0;
}

/**
 * Calculate weeks conquered vs total estimated weeks
 */
export function calculateWeeksConquered(completedRooms: string[]) {
  let conqueredMin = 0;
  let conqueredMax = 0;

  for (const topic of ALL_TOPICS) {
    if (completedRooms.includes(topic.id)) {
      conqueredMin += topic.weeks.min;
      conqueredMax += topic.weeks.max;
    }
  }

  const rawTotalMin = FLOORS.reduce((acc, f) => acc + f.weeks.min, 0); // 79
  const rawTotalMax = FLOORS.reduce((acc, f) => acc + f.weeks.max, 0); // 104

  // Effective weeks calculation (proportional to raw progress capped to 66-88 scale)
  const ratioMin = rawTotalMin > 0 ? conqueredMin / rawTotalMin : 0;
  const ratioMax = rawTotalMax > 0 ? conqueredMax / rawTotalMax : 0;

  const effectiveConqueredMin = Math.round(ratioMin * 66);
  const effectiveConqueredMax = Math.round(ratioMax * 88);

  return {
    conqueredMin,
    conqueredMax,
    rawTotalMin,
    rawTotalMax,
    effectiveConqueredMin,
    effectiveConqueredMax,
    effectiveTotalMin: 66,
    effectiveTotalMax: 88,
    percentConquered: Math.round(((conqueredMin + conqueredMax) / (rawTotalMin + rawTotalMax)) * 100),
  };
}
