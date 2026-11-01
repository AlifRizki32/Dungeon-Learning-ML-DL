import React, { useEffect, useRef } from 'react';
import { ChatTurn, LearningContext, MentorModelMode } from './chatService';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  messages: ChatTurn[];
  context: LearningContext;
  suggestedQuestions: string[];
  isLoading: boolean;
  error: string | null;
  isMinimized: boolean;
  mode: MentorModelMode;
  onModeChange: (mode: MentorModelMode) => void;
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  onMinimizeToggle: () => void;
  onClose: () => void;
  onRetryLast?: () => void;
}

export const MentorPixelSprite: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    className="pixelated shrink-0"
    aria-hidden="true"
  >
    {/* Wizard Hat & Crystal Orb Mentor Sprite */}
    <rect x="6" y="1" width="4" height="1" fill="#f5b935" />
    <rect x="5" y="2" width="6" height="2" fill="#5c4e99" />
    <rect x="3" y="4" width="10" height="1" fill="#f5b935" />
    {/* Head / Hood */}
    <rect x="4" y="5" width="8" height="5" fill="#16112b" />
    {/* Glowing Phosphor Green Eyes */}
    <rect x="5" y="7" width="2" height="2" fill="#38d864" />
    <rect x="9" y="7" width="2" height="2" fill="#38d864" />
    {/* Robe & Rune Trim */}
    <rect x="3" y="10" width="10" height="4" fill="#2b2352" />
    <rect x="7" y="10" width="2" height="4" fill="#f5b935" />
    {/* Floating AI Rune Crystal */}
    <rect x="13" y="6" width="2" height="2" fill="#3ac5eb" />
    <rect x="1" y="6" width="2" height="2" fill="#3ac5eb" />
  </svg>
);

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  context,
  suggestedQuestions,
  isLoading,
  error,
  isMinimized,
  mode,
  onModeChange,
  onSendMessage,
  onClearChat,
  onMinimizeToggle,
  onClose,
  onRetryLast,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMinimized && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading, isMinimized]);

  return (
    <section
      aria-label="Panel Chat AI Dungeon Mentor"
      className="pixel-box w-[calc(100vw-24px)] sm:w-[450px] max-w-[460px] flex flex-col overflow-hidden border-2 border-[#38d864]"
    >
      {/* Header Bar */}
      <div className="bg-[#120d26] border-b-2 border-[#5c4e99] p-2.5 sm:p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 bg-[#0d0a1a] border-2 border-[#f5b935] flex items-center justify-center shrink-0">
            <MentorPixelSprite size={28} />
          </div>
          <div className="min-w-0">
            <h2 className="font-pixel text-[9px] sm:text-[10px] text-[#f4f1ea] whitespace-nowrap">
              AI Dungeon Mentor
            </h2>
            <div className="font-vt text-base text-[#38d864] flex items-center gap-1.5">
              <span>STATUS: TERHUBUNG</span>
              <span aria-hidden="true" className="text-[#5c4e99]">
                ·
              </span>
              <span className="text-[#f5b935]">
                L{context.floorNumber}
                {context.topicNumber ? ` #${context.topicNumber}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Clear, Minimize, Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onClearChat}
            title="Bersihkan riwayat percakapan"
            aria-label="Bersihkan percakapan"
            className="pixel-btn px-2 py-1 bg-[#1f193d] text-[#f5b935] font-pixel text-[8px]"
          >
            Bersihkan
          </button>
          <button
            type="button"
            onClick={onMinimizeToggle}
            title={isMinimized ? 'Perbesar panel chat' : 'Perkecil panel chat'}
            aria-label={isMinimized ? 'Perbesar panel chat' : 'Perkecil panel chat'}
            className="pixel-btn px-2 py-1 bg-[#1f193d] text-[#3ac5eb] font-pixel text-[9px]"
          >
            {isMinimized ? '▲' : '—'}
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Tutup AI Dungeon Mentor"
            aria-label="Tutup panel chat"
            className="pixel-btn px-2 py-1 bg-[#291324] text-[#e83b47] font-pixel text-[9px]"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body (hidden when minimized) */}
      {!isMinimized && (
        <>
          {/* Context Awareness Strip & Model Selector */}
          <div className="bg-[#16112b] border-b-2 border-[#3a306e] px-3 py-2 space-y-1.5">
            <div className="flex items-center justify-between gap-2 font-vt text-base">
              <div className="truncate text-[#f4f1ea]">
                <span className="text-[#f5b935]">Konteks: </span>
                {context.isBossChallenge
                  ? `Tantangan Boss — ${context.bossName}`
                  : context.topicName || context.phaseTitle}
              </div>
              <div className="flex items-center gap-1 shrink-0" role="group" aria-label="Mode Penalaran AI">
                {(
                  [
                    { id: 'fast', label: 'Cepat' },
                    { id: 'general', label: 'Umum' },
                    { id: 'complex', label: 'Mendalam' },
                  ] as { id: MentorModelMode; label: string }[]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onModeChange(item.id)}
                    className={`px-1.5 py-0.5 font-pixel text-[7px] border cursor-pointer ${
                      mode === item.id
                        ? 'bg-[#38d864] text-[#0d0a1a] border-[#f4f1ea]'
                        : 'bg-[#0d0a1a] text-[#b3aad1] border-[#5c4e99]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            {context.topicScope && (
              <div className="font-vt text-sm text-[#b3aad1] truncate">
                Cakupan: {context.topicScope}
              </div>
            )}
          </div>

          {/* Scrollable Message Thread */}
          <div
            ref={scrollContainerRef}
            className="h-[310px] sm:h-[350px] overflow-y-auto p-3 space-y-3 bg-[#0d0a1a]"
          >
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {/* Typing / Loading Indicator */}
            {isLoading && (
              <div
                role="status"
                aria-live="polite"
                className="p-2.5 bg-[#16112b] border-2 border-[#3ac5eb] font-vt text-lg text-[#3ac5eb]"
              >
                AI Dungeon Mentor sedang menyusun penjelasan...
              </div>
            )}

            {/* Error State */}
            {error && (
              <div
                role="alert"
                className="p-3 bg-[#291324] border-2 border-[#e83b47] space-y-2"
              >
                <p className="font-vt text-lg text-[#f4f1ea]">{error}</p>
                {onRetryLast && (
                  <button
                    type="button"
                    onClick={onRetryLast}
                    className="pixel-btn px-2.5 py-1 bg-[#e83b47] text-[#f4f1ea] font-pixel text-[8px]"
                  >
                    Coba Lagi
                  </button>
                )}
              </div>
            )}

            {/* Suggested Contextual Questions */}
            {messages.length <= 1 ? (
              <div className="pt-2 border-t border-[#2b2352] space-y-1.5">
                <div className="font-pixel text-[8px] text-[#f5b935]">
                  PERTANYAAN DISARANKAN (SESUAI TOPIK SAAT INI):
                </div>
                <div className="flex flex-col gap-1.5">
                  {suggestedQuestions.map((qText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isLoading}
                      onClick={() => onSendMessage(qText)}
                      className="text-left px-2.5 py-1.5 bg-[#16112b] hover:bg-[#2b2352] border border-[#5c4e99] hover:border-[#f5b935] font-vt text-base sm:text-lg text-[#f4f1ea] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      ▸ {qText}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pt-1.5 border-t border-[#2b2352] flex flex-wrap gap-1.5">
                {suggestedQuestions.slice(0, 2).map((qText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isLoading}
                    onClick={() => onSendMessage(qText)}
                    className="text-left px-2 py-1 bg-[#16112b] hover:bg-[#2b2352] border border-[#3a306e] hover:border-[#f5b935] font-vt text-sm text-[#b3aad1] hover:text-[#f4f1ea] truncate max-w-full cursor-pointer disabled:opacity-50"
                  >
                    ▸ {qText}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input Form */}
          <ChatInput onSend={onSendMessage} disabled={isLoading} />
        </>
      )}
    </section>
  );
};
