import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { useSound } from '../../hooks/useSound.js';
import {
  ChatTurn,
  getSuggestedQuestionsForContext,
  LearningContext,
  MentorModelMode,
  resolveLearningContext,
  sendMentorMessage,
} from './chatService';
import { ChatPanel, MentorPixelSprite } from './ChatPanel';

function formatTimeHHMM(): string {
  const now = new Date();
  return now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function createWelcomeMessage(ctx: LearningContext): ChatTurn {
  const focusLabel = ctx.isBossChallenge
    ? `Tantangan Boss **${ctx.bossName}**`
    : ctx.topicName
    ? `Topik #${ctx.topicNumber ?? 1}: **${ctx.topicName}**`
    : ctx.phaseTitle;

  return {
    id: 'welcome-mentor',
    role: 'model',
    timestamp: formatTimeHHMM(),
    text: [
      `Salam Petualang! Aku adalah **AI Dungeon Mentor**, pendamping belajarmu di *Dungeon Belajar ML & DL*.`,
      '',
      `Saat ini kamu sedang berada di **Lantai ${ctx.floorNumber}** (${focusLabel}).`,
      `- Tanyakan konsep **Machine Learning / Deep Learning** atau intuisi rumus matematika`,
      `- Minta contoh kode **Python** langkah demi langkah`,
      `- Minta petunjuk (*hint*) saat menghadapi kuis atau Boss tanpa membocorkan kunci jawaban`,
    ].join('\n'),
  };
}

export const AIChatbot: React.FC = () => {
  const currentView = useGameStore((s) => s.currentView);
  const activeFloorId = useGameStore((s) => s.activeFloorId);
  const activeNodeByFloor = useGameStore((s) => s.activeNodeByFloor);
  const selectedTopicId = useGameStore((s) => s.selectedTopicId);
  const scrollOnlyTopicId = useGameStore((s) => s.scrollOnlyTopicId);
  const selectedBossFloorId = useGameStore((s) => s.selectedBossFloorId);
  const completedRooms = useGameStore((s) => s.completedRooms);
  const defeatedBosses = useGameStore((s) => s.defeatedBosses);
  const specialization = useGameStore((s) => s.specialization);
  const xp = useGameStore((s) => s.xp);
  const reduceMotion = useGameStore((s) => s.reduceMotion);

  const { playClick } = useSound();

  const learningContext = useMemo(
    () =>
      resolveLearningContext({
        currentView,
        activeFloorId,
        activeNodeByFloor,
        selectedTopicId,
        scrollOnlyTopicId,
        selectedBossFloorId,
        completedRooms,
        defeatedBosses,
        specialization,
        xp,
      }),
    [
      currentView,
      activeFloorId,
      activeNodeByFloor,
      selectedTopicId,
      scrollOnlyTopicId,
      selectedBossFloorId,
      completedRooms,
      defeatedBosses,
      specialization,
      xp,
    ]
  );

  const suggestedQuestions = useMemo(
    () => getSuggestedQuestionsForContext(learningContext),
    [learningContext]
  );

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mode, setMode] = useState<MentorModelMode>('general');
  const [customMessages, setCustomMessages] = useState<ChatTurn[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);

  const messages: ChatTurn[] = useMemo(() => {
    const welcome = createWelcomeMessage(learningContext);
    if (!customMessages || customMessages.length === 0) {
      return [welcome];
    }
    return [welcome, ...customMessages];
  }, [learningContext, customMessages]);

  const handleSendMessage = async (userText: string) => {
    playClick();
    setError(null);
    setLastFailedPrompt(null);

    const userTurn: ChatTurn = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: formatTimeHHMM(),
    };

    const nextHistory = [...(customMessages || []), userTurn];
    setCustomMessages(nextHistory);
    setIsLoading(true);

    try {
      const apiMessages = [createWelcomeMessage(learningContext), ...nextHistory].map(
        (m) => ({
          role: m.role,
          text: m.text,
        })
      );

      const result = await sendMentorMessage(apiMessages, learningContext, mode);

      const mentorTurn: ChatTurn = {
        id: `mentor-${Date.now()}`,
        role: 'model',
        text: result.reply,
        timestamp: formatTimeHHMM(),
        modelUsed: result.modelUsed,
      };

      setCustomMessages((prev) => [...(prev || []), mentorTurn]);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal terhubung ke AI Dungeon Mentor. Silakan coba lagi.';
      setError(msg);
      setLastFailedPrompt(userText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryLast = () => {
    if (!lastFailedPrompt || isLoading) return;
    // Remove the last failed user message before resending
    setCustomMessages((prev) => (prev && prev.length > 0 ? prev.slice(0, -1) : null));
    handleSendMessage(lastFailedPrompt);
  };

  const handleClearChat = () => {
    playClick();
    setCustomMessages(null);
    setError(null);
    setLastFailedPrompt(null);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 no-print flex flex-col items-end">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="mentor-chat-panel"
            initial={
              reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.95 }
            }
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.95 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.2 }}
          >
            <ChatPanel
              messages={messages}
              context={learningContext}
              suggestedQuestions={suggestedQuestions}
              isLoading={isLoading}
              error={error}
              isMinimized={isMinimized}
              mode={mode}
              onModeChange={(nextMode) => {
                playClick();
                setMode(nextMode);
              }}
              onSendMessage={handleSendMessage}
              onClearChat={handleClearChat}
              onMinimizeToggle={() => {
                playClick();
                setIsMinimized((prev) => !prev);
              }}
              onClose={() => {
                playClick();
                setIsOpen(false);
              }}
              onRetryLast={lastFailedPrompt ? handleRetryLast : undefined}
            />
          </motion.div>
        ) : (
          <motion.button
            key="mentor-floating-btn"
            type="button"
            data-testid="ai-mentor-floating-btn"
            onClick={() => {
              playClick();
              setIsOpen(true);
              setIsMinimized(false);
            }}
            aria-label="Buka AI Dungeon Mentor (Asisten Belajar AI)"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.18 }}
            className="pixel-btn px-3.5 py-2.5 bg-[#16112b] hover:bg-[#2b2352] border-2 border-[#38d864] text-[#f4f1ea] flex items-center gap-2.5 shadow-[0_0_14px_rgba(56,216,100,0.35)]"
          >
            <div className="w-8 h-8 bg-[#0d0a1a] border border-[#f5b935] flex items-center justify-center shrink-0">
              <MentorPixelSprite size={24} />
            </div>
            <div className="text-left">
              <div className="font-pixel text-[9px] text-[#38d864]">
                AI DUNGEON MENTOR
              </div>
              <div className="font-vt text-base text-[#f5b935] leading-none">
                Tanya Konsep &amp; Kode ML/DL
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
