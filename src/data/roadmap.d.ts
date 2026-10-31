export interface WeeksRange {
  min: number;
  max: number;
}

export interface RelicItem {
  id: string;
  name: string;
  source: string;
  iconType: string;
  description: string;
}

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
}

export interface TopicItem {
  id: string;
  number: number;
  floorId: number;
  name: string;
  scope: string;
  weeks: WeeksRange;
  understandingSign: string;
  parallel: boolean;
  parallelNote?: string;
  monsterName: string;
  flavor: string;
  relic?: RelicItem;
}

export interface BossItem {
  id: string;
  floorId: number;
  name: string;
  title: string;
  spriteType: string;
  challenge: string;
  badge: BadgeItem;
  relic: RelicItem;
}

export interface FloorItem {
  id: number;
  floorNumber: number;
  phaseTitle: string;
  shortTitle: string;
  subtitle: string;
  weeks: WeeksRange;
  monsterFamily: string;
  monsterType: string;
  themeColor: string;
  isGuildHall: boolean;
  parallelTag?: string;
  boss: BossItem;
  topics: TopicItem[];
}

export interface TowerQuestItem {
  id: string;
  number: number;
  title: string;
  description: string;
  references: string[];
  xp: number;
}

export interface AvatarItem {
  id: string;
  name: string;
  role: string;
  color: string;
}

export const ROADMAP_ASSUMPTIONS: {
  summaryShort: string;
  totalBeforeOverlap: { min: number; max: number; label: string };
  totalAfterPythonParallel: { min: number; max: number; label: string };
  totalEffective: {
    min: number;
    max: number;
    monthsMin: number;
    monthsMax: number;
    hoursPerWeek: string;
    label: string;
  };
  disclaimer: string;
};

export const AVATARS: AvatarItem[];
export const FLOORS: FloorItem[];
export const TOWER_FLOOR: {
  id: number;
  floorNumber: number;
  title: string;
  subtitle: string;
  unverifiedLinksNote: string;
  guardianName: string;
  quests: TowerQuestItem[];
};
export const ALL_TOPICS: TopicItem[];
export const ALL_RELICS: RelicItem[];
export const ALL_BADGES: BadgeItem[];
