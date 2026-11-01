import { ALL_TOPICS, FLOORS, TOWER_FLOOR } from '../../data/roadmap.js';
import { getLevelProgress } from '../../game/formulas';

export interface ChatTurn {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

export type MentorModelMode = 'general' | 'fast' | 'complex';

export interface LearningContext {
  currentView: string;
  floorNumber: number;
  floorTitle: string;
  phaseTitle: string;
  topicId: string | null;
  topicNumber: number | null;
  topicName: string | null;
  topicScope: string | null;
  understandingSign: string | null;
  monsterName: string | null;
  isBossChallenge: boolean;
  bossName: string | null;
  isTowerView: boolean;
  specialization: string | null;
  completedRoomsCount: number;
  totalRoomsCount: number;
  defeatedBossesCount: number;
  playerLevel: number;
  playerTitle: string;
}

export interface GameStoreSnapshotForContext {
  currentView: string;
  activeFloorId: number;
  activeNodeByFloor: Record<number, string>;
  selectedTopicId: string | null;
  scrollOnlyTopicId: string | null;
  selectedBossFloorId: number | null;
  completedRooms: string[];
  defeatedBosses: string[];
  specialization: string | null;
  xp: number;
}

/**
 * Pure function that derives the active learning context from the current game state
 * and src/data/roadmap.js without mutating any existing state or roadmap data.
 */
export function resolveLearningContext(state: GameStoreSnapshotForContext): LearningContext {
  const levelInfo = getLevelProgress(state.xp || 0);
  const isTowerView = state.currentView === 'tower' || state.activeFloorId === 6;

  if (isTowerView) {
    return {
      currentView: state.currentView,
      floorNumber: 6,
      floorTitle: TOWER_FLOOR.title,
      phaseTitle: 'Menara Master: Jalan Menuju Master',
      topicId: 'tower-master',
      topicNumber: null,
      topicName: state.specialization
        ? `Menara Master (Spesialisasi: ${state.specialization})`
        : 'Menara Master (7 Quest Road to Master)',
      topicScope:
        'Teori mendalam, replikasi paper klasik, portofolio end-to-end, spesialisasi AI/IoT, dan mengajar orang lain',
      understandingSign:
        'Membangun, merusak, dan memperbaiki sistem nyata secara mandiri serta mampu mengajarkannya kembali',
      monsterName: TOWER_FLOOR.guardianName,
      isBossChallenge: false,
      bossName: null,
      isTowerView: true,
      specialization: state.specialization,
      completedRoomsCount: state.completedRooms.length,
      totalRoomsCount: ALL_TOPICS.length,
      defeatedBossesCount: state.defeatedBosses.length,
      playerLevel: levelInfo.level,
      playerTitle: levelInfo.title,
    };
  }

  const floorId =
    state.selectedBossFloorId ||
    (state.activeFloorId >= 1 && state.activeFloorId <= 5 ? state.activeFloorId : 1);
  const floor = FLOORS.find((f) => f.id === floorId) || FLOORS[0];

  const isBossChallenge = Boolean(state.selectedBossFloorId);
  const activeTopicId =
    state.selectedTopicId ||
    state.scrollOnlyTopicId ||
    state.activeNodeByFloor?.[floor.id] ||
    floor.topics[0]?.id ||
    null;

  const activeTopic =
    ALL_TOPICS.find((t) => t.id === activeTopicId) || floor.topics[0] || null;

  return {
    currentView: state.currentView,
    floorNumber: floor.floorNumber,
    floorTitle: floor.shortTitle || floor.phaseTitle,
    phaseTitle: floor.phaseTitle,
    topicId: activeTopic ? activeTopic.id : null,
    topicNumber: activeTopic ? activeTopic.number : null,
    topicName: activeTopic ? activeTopic.name : null,
    topicScope: activeTopic ? activeTopic.scope : null,
    understandingSign: activeTopic ? activeTopic.understandingSign : null,
    monsterName: activeTopic ? activeTopic.monsterName : null,
    isBossChallenge,
    bossName: floor.boss?.name || null,
    isTowerView: false,
    specialization: state.specialization,
    completedRoomsCount: state.completedRooms.length,
    totalRoomsCount: ALL_TOPICS.length,
    defeatedBossesCount: state.defeatedBosses.length,
    playerLevel: levelInfo.level,
    playerTitle: levelInfo.title,
  };
}

/**
 * Generates 4 contextual Indonesian questions based on the active learning context.
 */
export function getSuggestedQuestionsForContext(ctx: LearningContext): string[] {
  if (ctx.isBossChallenge && ctx.bossName) {
    return [
      `Berikan petunjuk konseptual untuk menghadapi ${ctx.bossName} di Lantai ${ctx.floorNumber}.`,
      `Apa kesalahan paling umum pada materi ${ctx.phaseTitle}?`,
      `Bagaimana cara memilih mantra/algoritma yang tepat untuk ujian Boss ini?`,
      `Buatkan ringkasan kilat rumus kunci untuk Lantai ${ctx.floorNumber}.`,
    ];
  }

  if (ctx.isTowerView) {
    return [
      `Bagaimana cara efektif membaca dan mereplikasi paper klasik seperti ResNet atau Attention?`,
      `Berikan ide proyek portofolio end-to-end untuk spesialisasi ${ctx.specialization || 'TinyML & IoT'}.`,
      `Konsep matematika ML apa yang paling penting untuk diperdalam di tahap Master?`,
      `Bagaimana cara menjelaskan konsep jaringan saraf kepada pemula agar mudah dipahami?`,
    ];
  }

  if (ctx.topicName) {
    return [
      `Jelaskan konsep "${ctx.topicName}" dengan analogi sederhana untuk pemula.`,
      `Berikan contoh kode Python langkah demi langkah untuk ${ctx.topicName}.`,
      `Bagaimana cara mencapai tanda paham: "${ctx.understandingSign}"?`,
      `Apa hubungan antara ${ctx.topicScope} dalam proyek Machine Learning nyata?`,
    ];
  }

  return [
    'Jelaskan perbedaan antara Machine Learning klasik dan Deep Learning.',
    'Berikan contoh kode Python sederhana untuk regresi linear dengan NumPy.',
    'Apa itu overfitting dan bagaimana cara mengatasinya?',
    'Bagaimana cara kerja backpropagation dan gradient descent pada neural network?',
  ];
}

export interface ParsedMarkdownBlock {
  type: 'paragraph' | 'heading' | 'list' | 'code';
  content: string;
  language?: string;
  items?: string[];
  level?: number;
}

/**
 * Pure parser that splits markdown responses into structured blocks
 * (paragraphs, headings, bullet/numbered lists, and fenced code blocks).
 */
export function parseMarkdownBlocks(rawText: string): ParsedMarkdownBlock[] {
  const text = String(rawText ?? '').replace(/\r\n/g, '\n');
  const fenceRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const blocks: ParsedMarkdownBlock[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const parseProseChunk = (chunk: string) => {
    const lines = chunk.split('\n');
    let currentList: string[] = [];
    let currentParagraph: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const joined = currentParagraph.join(' ').trim();
        if (joined) {
          blocks.push({ type: 'paragraph', content: joined });
        }
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (currentList.length > 0) {
        blocks.push({
          type: 'list',
          content: '',
          items: [...currentList],
        });
        currentList = [];
      }
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        flushParagraph();
        flushList();
        continue;
      }

      const headingMatch = /^(#{1,4})\s+(.*)$/.exec(line);
      if (headingMatch) {
        flushParagraph();
        flushList();
        blocks.push({
          type: 'heading',
          level: headingMatch[1].length,
          content: headingMatch[2].trim(),
        });
        continue;
      }

      const listMatch = /^(?:[-*•]|\d+\.)\s+(.*)$/.exec(line);
      if (listMatch) {
        flushParagraph();
        currentList.push(listMatch[1].trim());
        continue;
      }

      flushList();
      currentParagraph.push(line);
    }

    flushParagraph();
    flushList();
  };

  while ((match = fenceRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parseProseChunk(text.slice(lastIndex, match.index));
    }
    const lang = (match[1] || 'python').toLowerCase();
    const codeContent = match[2].replace(/\n$/, '');
    blocks.push({
      type: 'code',
      language: lang,
      content: codeContent,
    });
    lastIndex = fenceRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parseProseChunk(text.slice(lastIndex));
  }

  return blocks;
}

export async function sendMentorMessage(
  messages: Pick<ChatTurn, 'role' | 'text'>[],
  context: LearningContext,
  mode: MentorModelMode = 'general'
): Promise<{ reply: string; modelUsed: string }> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      context,
      mode,
    }),
  });

  let data: { reply?: string; modelUsed?: string; error?: string } = {};
  try {
    data = await response.json();
  } catch {
    throw new Error('Respons server tidak valid. Silakan coba lagi.');
  }

  if (!response.ok || !data.reply) {
    throw new Error(
      data.error || `Gagal menghubungi AI Dungeon Mentor (Status ${response.status}).`
    );
  }

  return {
    reply: data.reply,
    modelUsed: data.modelUsed || 'gemini-3.8-flash',
  };
}
