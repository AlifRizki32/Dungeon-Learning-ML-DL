import floor1QuizData from '../data/quizzes/floor1.json';
import { ALL_TOPICS } from '../data/roadmap.js';

export type QuizDifficulty = 'mudah' | 'sedang' | 'sulit';

export interface QuizQuestion {
  topicId: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  difficulty: QuizDifficulty;
}

export interface QuizBankFile {
  reviewStatus: string;
  floorId: number;
  floorName: string;
  monsterDialogue?: Record<string, string>;
  questions: QuizQuestion[];
}

export const QUIZ_PASS_THRESHOLD_PERCENT = 70;
export const MAX_PLAYER_HEARTS = 3;
export const CRIT_HP_DROP = 25;

const FLOOR_BANKS: QuizBankFile[] = [floor1QuizData as unknown as QuizBankFile];

/**
 * Retrieve all quiz questions for a given topicId.
 * Returns an empty array if the floor's quiz bank has not been added yet.
 */
export function getQuestionsForTopic(topicId: string): QuizQuestion[] {
  for (const bank of FLOOR_BANKS) {
    const matches = bank.questions.filter((q) => q.topicId === topicId);
    if (matches.length > 0) {
      return matches;
    }
  }
  return [];
}

const FLOOR2_MONSTER_DIALOGUE: Record<string, string> = {
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
};

/**
 * Retrieve the Floor monster's short in-world dialogue (<= 2 sentences) if available.
 */
export function getMonsterDialogue(topicId: string, fallbackFlavor: string = ''): string {
  if (FLOOR2_MONSTER_DIALOGUE[topicId]) {
    return FLOOR2_MONSTER_DIALOGUE[topicId];
  }
  for (const bank of FLOOR_BANKS) {
    if (bank.monsterDialogue && bank.monsterDialogue[topicId]) {
      return bank.monsterDialogue[topicId];
    }
  }
  return fallbackFlavor;
}

/**
 * Deterministically or randomly shuffle questions when retrying after 0 hearts.
 */
export function shuffleQuizQuestions(
  questions: QuizQuestion[],
  rng: () => number = Math.random
): QuizQuestion[] {
  const copy = [...questions];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

/**
 * Calculate quiz score percentage (0 - 100) and whether it passes (>= 70%).
 */
export function evaluateQuizRun(correctCount: number, totalQuestions: number) {
  if (totalQuestions <= 0) {
    return { scorePercent: 100, passed: true };
  }
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);
  return {
    scorePercent,
    passed: scorePercent >= QUIZ_PASS_THRESHOLD_PERCENT,
  };
}

/**
 * Calculate Critical Hit Bonus XP:
 * Each correct answer is a critical hit granting +10% bonus XP for that room,
 * applied once per room.
 */
export function calculateCritBonusXP(
  baseRoomXP: number,
  correctCount: number,
  alreadyClaimedBonus: boolean
): number {
  if (alreadyClaimedBonus || correctCount <= 0 || baseRoomXP <= 0) {
    return 0;
  }
  return Math.round(baseRoomXP * 0.1 * correctCount);
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
