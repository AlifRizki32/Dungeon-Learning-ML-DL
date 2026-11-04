import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LessonChunk,
  LessonChoicePractice,
  LessonFillNumberPractice,
  LessonMatchPractice,
  LessonOrderPractice,
  LessonPracticeActivity,
  LessonTerm,
  PreparedMatchRightOption,
  ShuffledLessonChoiceOption,
  ShuffledOrderItem,
  areAllTopicChunksComplete,
  evaluateFillNumber,
  evaluateMatchAttempt,
  evaluateOrderAttempt,
  isChunkComplete,
  prepareMatchRightOptions,
  shuffleChoiceOptions,
  shuffleOrderItems,
  tokenizeTextWithGlossaryTerms,
} from '../game/lessonEngine';
import { Floor1TopicContent, SPELL_VISUALS } from '../game/spellbookEngine';
import { useGameStore } from '../store/useGameStore';
import { useSound } from '../hooks/useSound.js';
import { AvatarSprite } from './PixelSprites';
import { LessonVisualRenderer } from './LessonVisuals';
import {
  LatencyMiniLabWidget,
  NeuronMiniLabWidget,
  QuantMiniLabWidget,
  SoftmaxMiniLabWidget,
} from './ScrollView';

export type LessonStage =
  | 'goal'
  | 'scene'
  | 'guess'
  | 'steps'
  | 'practice'
  | 'formula'
  | 'summary'
  | 'finish';

const STAGE_LABELS: { id: LessonStage; shortLabel: string; stepNum: number }[] = [
  { id: 'goal', shortLabel: '1. Tujuan', stepNum: 1 },
  { id: 'scene', shortLabel: '2. Dialog', stepNum: 2 },
  { id: 'guess', shortLabel: '3. Tebak', stepNum: 3 },
  { id: 'steps', shortLabel: '4. Langkah', stepNum: 4 },
  { id: 'practice', shortLabel: '5. Latihan', stepNum: 5 },
  { id: 'formula', shortLabel: '6. Rumus', stepNum: 6 },
  { id: 'summary', shortLabel: '7. Ringkasan', stepNum: 7 },
  { id: 'finish', shortLabel: '8. Selesai', stepNum: 8 },
];

/**
 * Pixel-art avatar for Guide "Rune" (Archmage of the Dungeon)
 */
const RuneGuideAvatar: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    shapeRendering="crispEdges"
    aria-label="Avatar Pemandu Rune"
    role="img"
    className="shrink-0"
  >
    {/* Wizard hat */}
    <rect x="6" y="1" width="4" height="1" fill="#9b5de5" />
    <rect x="5" y="2" width="6" height="2" fill="#9b5de5" />
    <rect x="3" y="4" width="10" height="1" fill="#f5b935" />
    <rect x="2" y="5" width="12" height="1" fill="#5c4e99" />
    {/* Face & glowing eyes */}
    <rect x="4" y="6" width="8" height="4" fill="#1e1538" />
    <rect x="5" y="7" width="2" height="2" fill="#3ac5eb" />
    <rect x="9" y="7" width="2" height="2" fill="#3ac5eb" />
    {/* White beard & rune robe */}
    <rect x="4" y="10" width="8" height="2" fill="#f4f1ea" />
    <rect x="5" y="12" width="6" height="2" fill="#e2e8f0" />
    <rect x="3" y="12" width="2" height="3" fill="#9b5de5" />
    <rect x="11" y="12" width="2" height="3" fill="#9b5de5" />
    <rect x="6" y="14" width="4" height="1" fill="#f5b935" />
  </svg>
);

const MATH_TOKEN_REGEX = /(\S*(?:[\u0300-\u036f]|[θTαβγεΣ√²³₂−÷×≈])\S*)/gu;

function renderMathSafeText(str: string): React.ReactNode {
  if (!str || !/(?:[\u0300-\u036f]|[θTαβγεΣ√²³₂−÷×≈])/u.test(str)) {
    return str;
  }
  const parts = str.split(MATH_TOKEN_REGEX);
  return parts.map((part, i) => {
    if (!part) return null;
    if (/(?:[\u0300-\u036f]|[θTαβγεΣ√²³₂−÷×≈])/u.test(part)) {
      return (
        <span key={i} className="whitespace-nowrap font-mono">
          {part}
        </span>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

/**
 * Renders text with inline dotted-underline glossary buttons for any term in `terms`.
 * Clicking, tapping, or focusing opens a popover with the plain explanation; Escape closes it.
 */
export const GlossaryText: React.FC<{
  text: string;
  terms: LessonTerm[];
  className?: string;
}> = ({ text, terms, className = '' }) => {
  const tokens = useMemo(
    () => tokenizeTextWithGlossaryTerms(text, terms),
    [text, terms]
  );
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (openIndex === null) return undefined;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setOpenIndex(null);
      }
    };
    const handlePointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpenIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, [openIndex]);

  return (
    <span ref={containerRef} className={className}>
      {tokens.map((tok, idx) => {
        if (!tok.termEntry) {
          return <React.Fragment key={idx}>{renderMathSafeText(tok.text)}</React.Fragment>;
        }
        const isOpen = openIndex === idx;
        const popoverId = `glossary-popover-${idx}-${tok.termEntry.term.replace(/\W+/g, '-')}`;
        return (
          <span key={idx} className="relative inline-block">
            <span
              role="button"
              tabIndex={0}
              data-testid="glossary-inline-term"
              aria-expanded={isOpen}
              aria-describedby={isOpen ? popoverId : undefined}
              onClick={(e) => {
                e.stopPropagation();
                setOpenIndex(idx);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenIndex(idx);
                }
              }}
              onFocus={() => setOpenIndex(idx)}
              onBlur={(e) => {
                if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) {
                  setOpenIndex((prev) => (prev === idx ? null : prev));
                }
              }}
              className="inline font-bold text-[#f5b935] border-b-2 border-dotted border-[#f5b935] hover:bg-[#f5b935]/15 focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-[#38d864] px-0.5 rounded-none cursor-help"
            >
              {tok.text}
            </span>
            {isOpen && (
              <span
                id={popoverId}
                role="tooltip"
                data-testid="glossary-popover"
                className="z-40 block sm:absolute sm:bottom-full sm:left-0 sm:mb-2 w-64 sm:w-72 bg-[#0d0a1a] border-2 border-[#f5b935] p-3 shadow-[0_4px_0_0_#000] text-left font-normal my-1 sm:my-0"
              >
                <span className="flex items-center justify-between gap-2 border-b border-[#3a306e] pb-1 mb-1">
                  <strong className="font-pixel text-[9px] text-[#f5b935]">
                    📖 {tok.termEntry.term}
                  </strong>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Tutup penjelasan istilah"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenIndex(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenIndex(null);
                      }
                    }}
                    className="font-pixel text-[8px] text-[#b3aad1] hover:text-[#f4f1ea] px-1 cursor-pointer"
                  >
                    ✕ ESC
                  </span>
                </span>
                <span className="block font-vt text-base sm:text-lg text-[#f4f1ea] leading-snug">
                  {tok.termEntry.plain}
                </span>
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
};

// ============================================================================
// PRACTICE ACTIVITY CARDS (choice, fillNumber, order, match)
// ============================================================================

const ChoiceActivityCard: React.FC<{
  activity: LessonChoicePractice;
  terms: LessonTerm[];
  isAttempted: boolean;
  onRecordAttempt: () => void;
}> = ({ activity, terms, isAttempted, onRecordAttempt }) => {
  const { playClick, playCast, playFizzle } = useSound();
  const [shuffledOptions, setShuffledOptions] = useState<ShuffledLessonChoiceOption[]>(() =>
    shuffleChoiceOptions(activity.options, activity.correctIndex)
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wrongTries, setWrongTries] = useState(0);
  const [revealedAnswer, setRevealedAnswer] = useState(false);

  // Reset if activity id changes
  useEffect(() => {
    setShuffledOptions(shuffleChoiceOptions(activity.options, activity.correctIndex));
    setSelectedId(null);
    setWrongTries(0);
    setRevealedAnswer(false);
  }, [activity]);

  const selectedOption = shuffledOptions.find((o) => o.optionId === selectedId);
  const isSubmitted = selectedId !== null || revealedAnswer;
  const isCorrect = revealedAnswer || Boolean(selectedOption?.isCorrect);

  const handleChoose = (opt: ShuffledLessonChoiceOption) => {
    if (isSubmitted) return;
    setSelectedId(opt.optionId);
    onRecordAttempt();
    if (opt.isCorrect) {
      playCast();
    } else {
      playFizzle();
      setWrongTries((w) => w + 1);
    }
  };

  const handleRetry = () => {
    playClick();
    setSelectedId(null);
    setRevealedAnswer(false);
    setShuffledOptions(shuffleChoiceOptions(activity.options, activity.correctIndex));
  };

  const handleRevealAnswer = () => {
    playClick();
    setRevealedAnswer(true);
    onRecordAttempt();
  };

  return (
    <div
      data-testid={`practice-card-${activity.id}`}
      className="bg-[#120d26] border-2 border-[#5c4e99] p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3a306e] pb-2">
        <span className="font-pixel text-[9px] text-[#3ac5eb]">
          PILIHAN GANDA · ID: {activity.id.toUpperCase()}
        </span>
        <span
          className={`font-pixel text-[9px] px-2 py-0.5 border ${
            isAttempted
              ? 'bg-[#0a1714] border-[#38d864] text-[#38d864]'
              : 'bg-[#0d0a1a] border-[#f5b935] text-[#f5b935]'
          }`}
        >
          {isAttempted ? '✓ SUDAH DICOBA' : 'BELUM DICOBA'}
        </span>
      </div>

      <div className="font-vt text-xl sm:text-2xl text-[#f4f1ea] leading-snug">
        <GlossaryText text={activity.question} terms={terms} />
      </div>

      <div className="space-y-2" role="group" aria-label={activity.question}>
        {shuffledOptions.map((opt, idx) => {
          const isThisSelected = selectedId === opt.optionId;
          let styleClass =
            'bg-[#16112b] border-[#5c4e99] text-[#f4f1ea] hover:border-[#f5b935]';
          let badgeText = `${String.fromCharCode(65 + idx)}.`;

          if (isSubmitted) {
            if (opt.isCorrect && (isThisSelected || revealedAnswer)) {
              styleClass = 'bg-[#0a1714] border-[#38d864] text-[#38d864] font-bold';
              badgeText = `✓ [BENAR] ${String.fromCharCode(65 + idx)}.`;
            } else if (isThisSelected && !opt.isCorrect) {
              styleClass = 'bg-[#291324] border-[#e83b47] text-[#e83b47]';
              badgeText = `✕ [BELUM TEPAT] ${String.fromCharCode(65 + idx)}.`;
            } else {
              styleClass = 'bg-[#0d0a1a] border-[#2b2352] text-[#b3aad1] opacity-75';
            }
          }

          return (
            <button
              key={opt.optionId}
              type="button"
              disabled={isSubmitted}
              data-correct={opt.isCorrect ? 'true' : undefined}
              onClick={() => handleChoose(opt)}
              className={`w-full text-left p-3 border-2 font-vt text-lg sm:text-xl flex items-start gap-2.5 ${styleClass}`}
            >
              <span className="font-pixel text-[9px] mt-1 shrink-0">{badgeText}</span>
              <span>
                <GlossaryText text={opt.text} terms={terms} />
              </span>
            </button>
          );
        })}
      </div>

      {/* Show "Lihat jawaban" button before or after submission once wrongTries >= 2 */}
      {!revealedAnswer && !isCorrect && wrongTries >= 2 && (
        <div className="flex justify-end">
          <button
            type="button"
            data-testid={`reveal-answer-${activity.id}`}
            onClick={handleRevealAnswer}
            className="pixel-btn px-3 py-1.5 bg-[#f5b935] text-[#0d0a1a] font-pixel text-[9px]"
          >
            👁 Lihat jawaban
          </button>
        </div>
      )}

      {isSubmitted && (
        <div
          role="status"
          className={`p-3.5 border-2 space-y-2 ${
            isCorrect
              ? 'bg-[#0a1714] border-[#38d864]'
              : 'bg-[#291324] border-[#e83b47]'
          }`}
        >
          <div className="font-pixel text-[10px] text-[#f5b935]">
            {revealedAnswer
              ? `👁 KUNCI JAWABAN: ${activity.options[activity.correctIndex]}`
              : isCorrect
              ? '✓ JAWABAN BENAR!'
              : '✕ BELUM TEPAT — TIDAK ADA PENALTI'}
          </div>
          <p className="font-vt text-lg sm:text-xl text-[#f4f1ea] leading-snug">
            <GlossaryText text={activity.why} terms={terms} />
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {!isCorrect && (
              <button
                type="button"
                data-testid={`retry-${activity.id}`}
                onClick={handleRetry}
                className="pixel-btn px-3 py-1.5 bg-[#1f193d] text-[#f4f1ea] font-pixel text-[9px]"
              >
                ↻ Coba lagi
              </button>
            )}
            {!isCorrect && !revealedAnswer && wrongTries >= 2 && (
              <button
                type="button"
                data-testid={`reveal-answer-inline-${activity.id}`}
                onClick={handleRevealAnswer}
                className="pixel-btn px-3 py-1.5 bg-[#f5b935] text-[#0d0a1a] font-pixel text-[9px]"
              >
                👁 Lihat jawaban
              </button>
            )}
            {isCorrect && (
              <button
                type="button"
                onClick={handleRetry}
                className="pixel-btn px-3 py-1 bg-[#16112b] text-[#b3aad1] font-pixel text-[8px]"
              >
                Ulangi latihan ini
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const FillNumberActivityCard: React.FC<{
  activity: LessonFillNumberPractice;
  terms: LessonTerm[];
  isAttempted: boolean;
  onRecordAttempt: () => void;
}> = ({ activity, terms, isAttempted, onRecordAttempt }) => {
  const { playClick, playCast, playFizzle } = useSound();
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState<{
    checked: boolean;
    isCorrect: boolean;
    revealed: boolean;
  }>({ checked: false, isCorrect: false, revealed: false });
  const [wrongTries, setWrongTries] = useState(0);

  useEffect(() => {
    setInputValue('');
    setResult({ checked: false, isCorrect: false, revealed: false });
    setWrongTries(0);
  }, [activity]);

  const handleCheck = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;
    const evalRes = evaluateFillNumber(inputValue, activity.answer, activity.tolerance);
    onRecordAttempt();
    if (evalRes.isCorrect) {
      playCast();
      setResult({ checked: true, isCorrect: true, revealed: false });
    } else {
      playFizzle();
      setWrongTries((w) => w + 1);
      setResult({ checked: true, isCorrect: false, revealed: false });
    }
  };

  const handleRetry = () => {
    playClick();
    setResult({ checked: false, isCorrect: false, revealed: false });
  };

  const handleReveal = () => {
    playClick();
    setInputValue(String(activity.answer));
    setResult({ checked: true, isCorrect: true, revealed: true });
    onRecordAttempt();
  };

  const inputId = `fill-number-input-${activity.id}`;

  return (
    <div
      data-testid={`practice-card-${activity.id}`}
      className="bg-[#120d26] border-2 border-[#5c4e99] p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3a306e] pb-2">
        <span className="font-pixel text-[9px] text-[#3ac5eb]">
          ISI ANGKA · ID: {activity.id.toUpperCase()}
        </span>
        <span
          className={`font-pixel text-[9px] px-2 py-0.5 border ${
            isAttempted
              ? 'bg-[#0a1714] border-[#38d864] text-[#38d864]'
              : 'bg-[#0d0a1a] border-[#f5b935] text-[#f5b935]'
          }`}
        >
          {isAttempted ? '✓ SUDAH DICOBA' : 'BELUM DICOBA'}
        </span>
      </div>

      <label
        htmlFor={inputId}
        className="block font-vt text-xl sm:text-2xl text-[#f4f1ea] leading-snug"
      >
        <GlossaryText text={activity.question} terms={terms} />
      </label>

      <form onSubmit={handleCheck} className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-2">
          <input
            id={inputId}
            type="text"
            inputMode="decimal"
            value={inputValue}
            disabled={result.checked && result.isCorrect}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (result.checked && !result.isCorrect) {
                setResult({ checked: false, isCorrect: false, revealed: false });
              }
            }}
            placeholder="Ketik angka (contoh: 2,5 atau -1.5)"
            className="w-48 sm:w-56 bg-[#0d0a1a] border-2 border-[#5c4e99] focus:border-[#f5b935] px-3 py-2 font-mono text-base text-[#f4f1ea] outline-none"
          />
          {activity.unit ? (
            <span className="font-mono text-sm text-[#f5b935] bg-[#0d0a1a] border border-[#5c4e99] px-2.5 py-2">
              {activity.unit}
            </span>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={!inputValue.trim() || (result.checked && result.isCorrect)}
          className="pixel-btn px-4 py-2 bg-[#38d864] text-[#0d0a1a] font-pixel text-[10px]"
        >
          Cek
        </button>

        {wrongTries >= 2 && !result.isCorrect && (
          <button
            type="button"
            data-testid={`reveal-answer-${activity.id}`}
            onClick={handleReveal}
            className="pixel-btn px-3 py-2 bg-[#f5b935] text-[#0d0a1a] font-pixel text-[9px]"
          >
            👁 Lihat jawaban
          </button>
        )}
      </form>

      {result.checked && (
        <div
          role="status"
          className={`p-3.5 border-2 space-y-2 ${
            result.isCorrect
              ? 'bg-[#0a1714] border-[#38d864]'
              : 'bg-[#291324] border-[#e83b47]'
          }`}
        >
          <div className="font-pixel text-[10px] text-[#f5b935]">
            {result.revealed
              ? `👁 KUNCI JAWABAN: ${activity.answer}${activity.unit ? ` ${activity.unit}` : ''}`
              : result.isCorrect
              ? `✓ TEPAT! (${activity.answer}${activity.unit ? ` ${activity.unit}` : ''})`
              : '✕ BELUM TEPAT — PERIKSA KEMBALI HITUNGANMU'}
          </div>
          <p className="font-vt text-lg sm:text-xl text-[#f4f1ea] leading-snug">
            <GlossaryText text={activity.why} terms={terms} />
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {!result.isCorrect && (
              <button
                type="button"
                data-testid={`retry-${activity.id}`}
                onClick={handleRetry}
                className="pixel-btn px-3 py-1.5 bg-[#1f193d] text-[#f4f1ea] font-pixel text-[9px]"
              >
                ↻ Coba lagi
              </button>
            )}
            {!result.isCorrect && wrongTries >= 2 && (
              <button
                type="button"
                onClick={handleReveal}
                className="pixel-btn px-3 py-1.5 bg-[#f5b935] text-[#0d0a1a] font-pixel text-[9px]"
              >
                👁 Lihat jawaban
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const OrderActivityCard: React.FC<{
  activity: LessonOrderPractice;
  terms: LessonTerm[];
  isAttempted: boolean;
  onRecordAttempt: () => void;
}> = ({ activity, terms, isAttempted, onRecordAttempt }) => {
  const { playClick, playCast, playFizzle } = useSound();
  const [pool, setPool] = useState<ShuffledOrderItem[]>(() =>
    shuffleOrderItems(activity.items)
  );
  const [selectedOrder, setSelectedOrder] = useState<ShuffledOrderItem[]>([]);
  const [checkState, setCheckState] = useState<{
    checked: boolean;
    isCorrect: boolean;
    wrongPositions: number[];
    revealed: boolean;
  }>({ checked: false, isCorrect: false, wrongPositions: [], revealed: false });
  const [wrongTries, setWrongTries] = useState(0);

  useEffect(() => {
    setPool(shuffleOrderItems(activity.items));
    setSelectedOrder([]);
    setCheckState({ checked: false, isCorrect: false, wrongPositions: [], revealed: false });
    setWrongTries(0);
  }, [activity]);

  const remainingPool = pool.filter(
    (item) => !selectedOrder.some((s) => s.id === item.id)
  );

  const handleAddItem = (item: ShuffledOrderItem) => {
    if (checkState.checked && checkState.isCorrect) return;
    playClick();
    setSelectedOrder((prev) => [...prev, item]);
    if (checkState.checked) {
      setCheckState({ checked: false, isCorrect: false, wrongPositions: [], revealed: false });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    if (checkState.checked && checkState.isCorrect) return;
    playClick();
    setSelectedOrder((prev) => prev.filter((i) => i.id !== itemId));
    if (checkState.checked) {
      setCheckState({ checked: false, isCorrect: false, wrongPositions: [], revealed: false });
    }
  };

  const handleCheck = () => {
    if (selectedOrder.length !== activity.items.length) return;
    const evalRes = evaluateOrderAttempt(
      selectedOrder.map((s) => s.text),
      activity.items
    );
    onRecordAttempt();
    if (evalRes.isCorrect) {
      playCast();
      setCheckState({
        checked: true,
        isCorrect: true,
        wrongPositions: [],
        revealed: false,
      });
    } else {
      playFizzle();
      setWrongTries((w) => w + 1);
      setCheckState({
        checked: true,
        isCorrect: false,
        wrongPositions: evalRes.wrongPositions,
        revealed: false,
      });
    }
  };

  const handleRetry = () => {
    playClick();
    setSelectedOrder([]);
    setPool(shuffleOrderItems(activity.items));
    setCheckState({ checked: false, isCorrect: false, wrongPositions: [], revealed: false });
  };

  const handleReveal = () => {
    playClick();
    const correctSeq: ShuffledOrderItem[] = activity.items.map((text, idx) => ({
      id: `ord-${idx}`,
      correctIndex: idx,
      text,
    }));
    setSelectedOrder(correctSeq);
    setCheckState({
      checked: true,
      isCorrect: true,
      wrongPositions: [],
      revealed: true,
    });
    onRecordAttempt();
  };

  return (
    <div
      data-testid={`practice-card-${activity.id}`}
      className="bg-[#120d26] border-2 border-[#5c4e99] p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3a306e] pb-2">
        <span className="font-pixel text-[9px] text-[#3ac5eb]">
          SUSUN URUTAN · ID: {activity.id.toUpperCase()}
        </span>
        <span
          className={`font-pixel text-[9px] px-2 py-0.5 border ${
            isAttempted
              ? 'bg-[#0a1714] border-[#38d864] text-[#38d864]'
              : 'bg-[#0d0a1a] border-[#f5b935] text-[#f5b935]'
          }`}
        >
          {isAttempted ? '✓ SUDAH DICOBA' : 'BELUM DICOBA'}
        </span>
      </div>

      <div className="font-vt text-xl sm:text-2xl text-[#f4f1ea] leading-snug">
        <GlossaryText text={activity.question} terms={terms} />
      </div>

      {/* Available items to tap/click */}
      <div className="space-y-1.5">
        <div className="font-pixel text-[8px] text-[#b3aad1]">
          PILIH LANGKAH DI BAWAH UNTUK MENYUSUN URUTAN ({remainingPool.length} TERSISA):
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Pilihan Langkah">
          {remainingPool.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleAddItem(item)}
              className="pixel-btn px-3 py-2 bg-[#16112b] text-[#f4f1ea] border-[#5c4e99] hover:border-[#f5b935] font-vt text-lg text-left"
            >
              + {item.text}
            </button>
          ))}
          {remainingPool.length === 0 && (
            <span className="font-vt text-base text-[#38d864]">
              Semua langkah telah dimasukkan ke urutan di bawah.
            </span>
          )}
        </div>
      </div>

      {/* Current built sequence */}
      <div className="bg-[#0d0a1a] border-2 border-[#3a306e] p-3 space-y-2">
        <div className="font-pixel text-[8px] text-[#f5b935]">
          URUTAN PILIHANMU (KLIK ITEM UNTUK MELEPAS):
        </div>
        {selectedOrder.length === 0 ? (
          <div className="font-vt text-lg text-[#64748b] italic">
            Belum ada langkah yang dipilih. Klik tombol di atas sesuai urutan pertama hingga terakhir.
          </div>
        ) : (
          <ol className="space-y-1.5">
            {selectedOrder.map((item, idx) => {
              const isPosWrong =
                checkState.checked &&
                !checkState.isCorrect &&
                checkState.wrongPositions.includes(idx);
              const isPosRight =
                checkState.checked && !checkState.wrongPositions.includes(idx);

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={checkState.checked && checkState.isCorrect}
                    onClick={() => handleRemoveItem(item.id)}
                    className={`w-full text-left px-3 py-2 border flex items-center justify-between gap-2 font-vt text-lg ${
                      isPosWrong
                        ? 'bg-[#291324] border-[#e83b47] text-[#e83b47]'
                        : isPosRight
                        ? 'bg-[#0a1714] border-[#38d864] text-[#38d864]'
                        : 'bg-[#16112b] border-[#5c4e99] text-[#f4f1ea]'
                    }`}
                  >
                    <span>
                      <strong className="font-pixel text-[9px] mr-2">#{idx + 1}</strong>
                      {item.text}
                    </span>
                    <span className="font-pixel text-[8px]">
                      {isPosWrong
                        ? '✕ POSISI SALAH'
                        : isPosRight
                        ? '✓ TEPAT'
                        : '✕ LEPAS'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          disabled={
            selectedOrder.length !== activity.items.length ||
            (checkState.checked && checkState.isCorrect)
          }
          onClick={handleCheck}
          className="pixel-btn px-4 py-2 bg-[#38d864] text-[#0d0a1a] font-pixel text-[10px]"
        >
          Cek
        </button>

        {selectedOrder.length > 0 && !(checkState.checked && checkState.isCorrect) && (
          <button
            type="button"
            onClick={handleRetry}
            className="pixel-btn px-3 py-2 bg-[#16112b] text-[#b3aad1] font-pixel text-[9px]"
          >
            Reset Urutan
          </button>
        )}

        {wrongTries >= 2 && !checkState.isCorrect && (
          <button
            type="button"
            data-testid={`reveal-answer-${activity.id}`}
            onClick={handleReveal}
            className="pixel-btn px-3 py-2 bg-[#f5b935] text-[#0d0a1a] font-pixel text-[9px]"
          >
            👁 Lihat jawaban
          </button>
        )}
      </div>

      {checkState.checked && (
        <div
          role="status"
          className={`p-3.5 border-2 space-y-2 ${
            checkState.isCorrect
              ? 'bg-[#0a1714] border-[#38d864]'
              : 'bg-[#291324] border-[#e83b47]'
          }`}
        >
          <div className="font-pixel text-[10px] text-[#f5b935]">
            {checkState.revealed
              ? '👁 URUTAN YANG BENAR DITAMPILKAN'
              : checkState.isCorrect
              ? '✓ URUTAN SEMPURNA!'
              : `✕ POSISI BELUM TEPAT DI NOMOR: ${checkState.wrongPositions
                  .map((p) => `#${p + 1}`)
                  .join(', ')}`}
          </div>
          <p className="font-vt text-lg sm:text-xl text-[#f4f1ea] leading-snug">
            <GlossaryText text={activity.why} terms={terms} />
          </p>
          {!checkState.isCorrect && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                data-testid={`retry-${activity.id}`}
                onClick={handleRetry}
                className="pixel-btn px-3 py-1.5 bg-[#1f193d] text-[#f4f1ea] font-pixel text-[9px]"
              >
                ↻ Coba lagi
              </button>
              {wrongTries >= 2 && (
                <button
                  type="button"
                  onClick={handleReveal}
                  className="pixel-btn px-3 py-1.5 bg-[#f5b935] text-[#0d0a1a] font-pixel text-[9px]"
                >
                  👁 Lihat jawaban
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MatchActivityCard: React.FC<{
  activity: LessonMatchPractice;
  terms: LessonTerm[];
  isAttempted: boolean;
  onRecordAttempt: () => void;
}> = ({ activity, terms, isAttempted, onRecordAttempt }) => {
  const { playClick, playCast, playFizzle } = useSound();
  const [rightOptions, setRightOptions] = useState<PreparedMatchRightOption[]>(() =>
    prepareMatchRightOptions(activity.pairs)
  );
  const [activeLeftIndex, setActiveLeftIndex] = useState<number | null>(null);
  // connections[leftIndex] = rightText
  const [connections, setConnections] = useState<Record<number, string>>({});
  const [checkState, setCheckState] = useState<{
    checked: boolean;
    isCorrect: boolean;
    wrongLeftIndices: number[];
    revealed: boolean;
  }>({ checked: false, isCorrect: false, wrongLeftIndices: [], revealed: false });
  const [wrongTries, setWrongTries] = useState(0);

  useEffect(() => {
    setRightOptions(prepareMatchRightOptions(activity.pairs));
    setActiveLeftIndex(null);
    setConnections({});
    setCheckState({ checked: false, isCorrect: false, wrongLeftIndices: [], revealed: false });
    setWrongTries(0);
  }, [activity]);

  const handleSelectLeft = (leftIdx: number) => {
    if (checkState.checked && checkState.isCorrect) return;
    playClick();
    setActiveLeftIndex((prev) => (prev === leftIdx ? null : leftIdx));
  };

  const handleSelectRight = (rightText: string) => {
    if (checkState.checked && checkState.isCorrect) return;
    playClick();
    setConnections((prev) => {
      const targetLeft =
        activeLeftIndex !== null
          ? activeLeftIndex
          : activity.pairs.findIndex((_, idx) => !prev[idx]);

      if (targetLeft === -1 || targetLeft === null) return prev;

      return {
        ...prev,
        [targetLeft]: rightText,
      };
    });
    setActiveLeftIndex(null);
    if (checkState.checked) {
      setCheckState({ checked: false, isCorrect: false, wrongLeftIndices: [], revealed: false });
    }
  };

  const allConnected =
    Object.keys(connections).length === activity.pairs.length &&
    activity.pairs.every((_, idx) => Boolean(connections[idx]));

  const handleCheck = () => {
    if (!allConnected) return;
    const evalRes = evaluateMatchAttempt(connections, activity.pairs);
    onRecordAttempt();
    if (evalRes.isCorrect) {
      playCast();
      setCheckState({
        checked: true,
        isCorrect: true,
        wrongLeftIndices: [],
        revealed: false,
      });
    } else {
      playFizzle();
      setWrongTries((w) => w + 1);
      setCheckState({
        checked: true,
        isCorrect: false,
        wrongLeftIndices: evalRes.wrongLeftIndices,
        revealed: false,
      });
    }
  };

  const handleRetry = () => {
    playClick();
    setConnections({});
    setActiveLeftIndex(null);
    setRightOptions(prepareMatchRightOptions(activity.pairs));
    setCheckState({ checked: false, isCorrect: false, wrongLeftIndices: [], revealed: false });
  };

  const handleReveal = () => {
    playClick();
    const solved: Record<number, string> = {};
    activity.pairs.forEach((p, idx) => {
      solved[idx] = p.right;
    });
    setConnections(solved);
    setActiveLeftIndex(null);
    setCheckState({
      checked: true,
      isCorrect: true,
      wrongLeftIndices: [],
      revealed: true,
    });
    onRecordAttempt();
  };

  return (
    <div
      data-testid={`practice-card-${activity.id}`}
      className="bg-[#120d26] border-2 border-[#5c4e99] p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3a306e] pb-2">
        <span className="font-pixel text-[9px] text-[#3ac5eb]">
          PASANGKAN · ID: {activity.id.toUpperCase()}
        </span>
        <span
          className={`font-pixel text-[9px] px-2 py-0.5 border ${
            isAttempted
              ? 'bg-[#0a1714] border-[#38d864] text-[#38d864]'
              : 'bg-[#0d0a1a] border-[#f5b935] text-[#f5b935]'
          }`}
        >
          {isAttempted ? '✓ SUDAH DICOBA' : 'BELUM DICOBA'}
        </span>
      </div>

      <div className="font-vt text-xl sm:text-2xl text-[#f4f1ea] leading-snug">
        <GlossaryText text={activity.question} terms={terms} />
      </div>

      <p className="font-vt text-base text-[#b3aad1]">
        Cara: Klik item di kolom <strong>Kiri</strong>, lalu klik pasangannya di kolom{' '}
        <strong>Kanan</strong>.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Left items in order */}
        <div className="space-y-2" role="group" aria-label="Kolom Kiri">
          <div className="font-pixel text-[8px] text-[#f5b935]">KOLOM KIRI</div>
          {activity.pairs.map((pair, idx) => {
            const isSelected = activeLeftIndex === idx;
            const connectedRight = connections[idx];
            const isPairWrong =
              checkState.checked &&
              !checkState.isCorrect &&
              checkState.wrongLeftIndices.includes(idx);
            const isPairRight =
              checkState.checked && !checkState.wrongLeftIndices.includes(idx);

            return (
              <button
                key={`left-${idx}`}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleSelectLeft(idx)}
                className={`w-full text-left p-2.5 border-2 font-vt text-lg transition-all ${
                  isSelected
                    ? 'bg-[#2b2352] border-[#f5b935] text-[#f5b935]'
                    : isPairWrong
                    ? 'bg-[#291324] border-[#e83b47] text-[#e83b47]'
                    : isPairRight
                    ? 'bg-[#0a1714] border-[#38d864] text-[#38d864]'
                    : 'bg-[#16112b] border-[#5c4e99] text-[#f4f1ea]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>
                    <strong className="font-pixel text-[8px] mr-1.5">{idx + 1}.</strong>
                    {pair.left}
                  </span>
                  {isSelected && (
                    <span className="font-pixel text-[8px] text-[#f5b935]">
                      PILIH KANAN →
                    </span>
                  )}
                </div>
                {connectedRight && (
                  <div className="mt-1 pt-1 border-t border-[#3a306e] font-mono text-xs text-[#3ac5eb] flex items-center justify-between">
                    <span>⇄ {connectedRight}</span>
                    {checkState.checked && (
                      <span>{isPairWrong ? '✕ SALAH' : '✓ BENAR'}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Right items shuffled */}
        <div className="space-y-2" role="group" aria-label="Kolom Kanan">
          <div className="font-pixel text-[8px] text-[#3ac5eb]">KOLOM KANAN (ACAK)</div>
          {rightOptions.map((ro) => {
            const usedByLeftIndex = Object.entries(connections).find(
              ([, rText]) => rText === ro.text
            )?.[0];
            return (
              <button
                key={ro.id}
                type="button"
                onClick={() => handleSelectRight(ro.text)}
                className={`w-full text-left p-2.5 border-2 font-vt text-lg transition-all ${
                  usedByLeftIndex !== undefined
                    ? 'bg-[#0d192b] border-[#3ac5eb] text-[#3ac5eb]'
                    : 'bg-[#16112b] border-[#5c4e99] text-[#f4f1ea] hover:border-[#f5b935]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{ro.text}</span>
                  {usedByLeftIndex !== undefined && (
                    <span className="font-pixel text-[8px] bg-[#0d0a1a] px-1.5 py-0.5 border border-[#3ac5eb]">
                      #{Number(usedByLeftIndex) + 1}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          disabled={!allConnected || (checkState.checked && checkState.isCorrect)}
          onClick={handleCheck}
          className="pixel-btn px-4 py-2 bg-[#38d864] text-[#0d0a1a] font-pixel text-[10px]"
        >
          Cek
        </button>

        {Object.keys(connections).length > 0 && !(checkState.checked && checkState.isCorrect) && (
          <button
            type="button"
            onClick={handleRetry}
            className="pixel-btn px-3 py-2 bg-[#16112b] text-[#b3aad1] font-pixel text-[9px]"
          >
            Reset Pasangan
          </button>
        )}

        {wrongTries >= 2 && !checkState.isCorrect && (
          <button
            type="button"
            data-testid={`reveal-answer-${activity.id}`}
            onClick={handleReveal}
            className="pixel-btn px-3 py-2 bg-[#f5b935] text-[#0d0a1a] font-pixel text-[9px]"
          >
            👁 Lihat jawaban
          </button>
        )}
      </div>

      {checkState.checked && (
        <div
          role="status"
          className={`p-3.5 border-2 space-y-2 ${
            checkState.isCorrect
              ? 'bg-[#0a1714] border-[#38d864]'
              : 'bg-[#291324] border-[#e83b47]'
          }`}
        >
          <div className="font-pixel text-[10px] text-[#f5b935]">
            {checkState.revealed
              ? '👁 PASANGAN YANG BENAR DITAMPILKAN'
              : checkState.isCorrect
              ? '✓ SEMUA PASANGAN TEPAT!'
              : `✕ PASANGAN BELUM TEPAT PADA BARIS: ${checkState.wrongLeftIndices
                  .map((i) => `#${i + 1}`)
                  .join(', ')}`}
          </div>
          <p className="font-vt text-lg sm:text-xl text-[#f4f1ea] leading-snug">
            <GlossaryText text={activity.why} terms={terms} />
          </p>
          {!checkState.isCorrect && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                data-testid={`retry-${activity.id}`}
                onClick={handleRetry}
                className="pixel-btn px-3 py-1.5 bg-[#1f193d] text-[#f4f1ea] font-pixel text-[9px]"
              >
                ↻ Coba lagi
              </button>
              {wrongTries >= 2 && (
                <button
                  type="button"
                  onClick={handleReveal}
                  className="pixel-btn px-3 py-1.5 bg-[#f5b935] text-[#0d0a1a] font-pixel text-[9px]"
                >
                  👁 Lihat jawaban
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PracticeActivityDispatcher: React.FC<{
  activity: LessonPracticeActivity;
  terms: LessonTerm[];
  isAttempted: boolean;
  onRecordAttempt: () => void;
}> = ({ activity, terms, isAttempted, onRecordAttempt }) => {
  switch (activity.type) {
    case 'choice':
      return (
        <ChoiceActivityCard
          activity={activity}
          terms={terms}
          isAttempted={isAttempted}
          onRecordAttempt={onRecordAttempt}
        />
      );
    case 'fillNumber':
      return (
        <FillNumberActivityCard
          activity={activity}
          terms={terms}
          isAttempted={isAttempted}
          onRecordAttempt={onRecordAttempt}
        />
      );
    case 'order':
      return (
        <OrderActivityCard
          activity={activity}
          terms={terms}
          isAttempted={isAttempted}
          onRecordAttempt={onRecordAttempt}
        />
      );
    case 'match':
      return (
        <MatchActivityCard
          activity={activity}
          terms={terms}
          isAttempted={isAttempted}
          onRecordAttempt={onRecordAttempt}
        />
      );
    default:
      return null;
  }
};

// ============================================================================
// MAIN MICRO-LESSON PLAYER COMPONENT
// ============================================================================

export interface LessonChunkPlayerProps {
  topicContent: Floor1TopicContent;
  topicTitle: string;
  chunks: LessonChunk[];
  reduceMotion: boolean;
  mode: 'battle-entry' | 'standalone' | 'tower-quest';
  questId?: string;
  onReadyToFight?: () => void;
  onSwitchToQuestChecklist?: () => void;
  onClose: () => void;
}

export const LessonChunkPlayer: React.FC<LessonChunkPlayerProps> = ({
  topicContent,
  topicTitle,
  chunks,
  reduceMotion,
  mode,
  questId,
  onReadyToFight,
  onSwitchToQuestChecklist,
  onClose,
}) => {
  const avatarId = useGameStore((s) => s.avatarId);
  const lessonProgress = useGameStore((s) => s.lessonProgress);
  const summaries = useGameStore((s) => s.summaries);
  const taskDone = useGameStore((s) => s.taskDone);
  const recordChunkPracticeAttempt = useGameStore((s) => s.recordChunkPracticeAttempt);
  const completeLessonChunk = useGameStore((s) => s.completeLessonChunk);
  const setChunkSummary = useGameStore((s) => s.setChunkSummary);
  const toggleChunkRealTaskDone = useGameStore((s) => s.toggleChunkRealTaskDone);

  const { playClick, playCast } = useSound();

  const [chunkIndex, setChunkIndex] = useState<number>(() => {
    const firstIncomplete = chunks.findIndex((c) => !isChunkComplete(c, lessonProgress));
    return firstIncomplete >= 0 ? firstIncomplete : 0;
  });
  const [stage, setStage] = useState<LessonStage>('goal');
  const [skippedToFormula, setSkippedToFormula] = useState(false);

  // Per-stage sub-states
  const [sceneShownCount, setSceneShownCount] = useState(1);
  const [guessChoiceIdx, setGuessChoiceIdx] = useState<number | null>(null);
  const [stepsShownCount, setStepsShownCount] = useState(1);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [kamusDrawerOpen, setKamusDrawerOpen] = useState(false);

  const currentChunk = chunks[chunkIndex] || chunks[0];
  const spellTheme = SPELL_VISUALS[topicContent.spell.id] || SPELL_VISUALS.s1;

  // Reset per-chunk transient states when changing chunk
  useEffect(() => {
    setStage('goal');
    setSkippedToFormula(false);
    setSceneShownCount(1);
    setGuessChoiceIdx(null);
    setStepsShownCount(1);
    setActiveStepIdx(0);
  }, [currentChunk.chunkId]);

  // Close Kamus drawer on Escape
  useEffect(() => {
    if (!kamusDrawerOpen) return undefined;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setKamusDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [kamusDrawerOpen]);

  const currentChunkState = lessonProgress[currentChunk.chunkId];
  const attemptedPracticeIds = currentChunkState?.attemptedActivities || [];
  const allPracticeIds = useMemo(
    () => currentChunk.practice.map((p) => p.id),
    [currentChunk]
  );
  const chunkIsComplete = isChunkComplete(currentChunk, lessonProgress);
  const topicAllChunksComplete = areAllTopicChunksComplete(
    topicContent.topicId,
    lessonProgress
  );

  const handleRecordAttempt = (activityId: string) => {
    recordChunkPracticeAttempt(currentChunk.chunkId, activityId, allPracticeIds);
  };

  // Trigger reviewItem scheduling + chunk completion when entering 'finish' stage
  useEffect(() => {
    if (stage === 'finish') {
      completeLessonChunk(currentChunk.chunkId, currentChunk.reviewItems);
    }
  }, [stage, currentChunk, completeLessonChunk]);

  const currentSummaryText = summaries[currentChunk.chunkId] || '';

  const activeStepHighlight =
    currentChunk.steps[activeStepIdx]?.highlight ||
    currentChunk.steps[Math.max(0, stepsShownCount - 1)]?.highlight ||
    [];

  return (
    <div
      data-testid="lesson-chunk-player"
      className={`relative flex flex-col bg-[#16112b] ${
        mode === 'tower-quest'
          ? 'border-2 border-[#f5b935]'
          : 'max-h-[88vh] overflow-hidden'
      }`}
    >
      {/* Top Header: Topic Title + Kamus Drawer Trigger + Close */}
      <div
        className="p-3.5 sm:p-4 border-b-4 bg-[#120d26] flex flex-wrap items-center justify-between gap-2 relative z-10 shrink-0"
        style={{ borderColor: spellTheme.color }}
      >
        <div>
          <div className="font-pixel text-[9px] mb-1" style={{ color: spellTheme.color }}>
            {mode === 'tower-quest'
              ? `PANDUAN INTERAKTIF · QUEST MENARA ${(questId || '').toUpperCase()} (${chunks.length} POTONGAN)`
              : `MICRO-LESSON INTERAKTIF · TOPIK #${topicContent.topicId} (${chunks.length} POTONGAN)`}
          </div>
          <h2 className="font-pixel text-xs sm:text-sm text-[#f4f1ea]">
            {mode === 'tower-quest'
              ? `${topicTitle}`
              : `${topicTitle} — ${topicContent.spell.name}`}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="open-kamus-drawer-btn"
            onClick={() => {
              playClick();
              setKamusDrawerOpen(true);
            }}
            className="pixel-btn px-3 py-1.5 bg-[#1a102b] text-[#f5b935] border-[#f5b935] font-pixel text-[10px]"
          >
            📖 Kamus ({currentChunk.terms.length})
          </button>

          {mode === 'tower-quest' ? (
            onSwitchToQuestChecklist && (
              <button
                type="button"
                data-testid="switch-to-quest-checklist-btn"
                onClick={() => {
                  playClick();
                  onSwitchToQuestChecklist();
                }}
                className="pixel-btn px-3 py-1.5 bg-[#1f193d] text-[#f4f1ea] font-pixel text-[10px]"
              >
                Langkah Quest →
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={() => {
                playClick();
                onClose();
              }}
              aria-label="Tutup Gulungan"
              className="pixel-btn px-3 py-1.5 bg-[#1f193d] text-[#f4f1ea] font-pixel text-[10px]"
            >
              ✕ TUTUP
            </button>
          )}
        </div>
      </div>

      {/* Chunk Title Bar & Progress Dots */}
      <div className="bg-[#0d0a1a] border-b-2 border-[#3a306e] px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-pixel text-[9px] px-2 py-0.5 bg-[#16112b] border border-[#f5b935] text-[#f5b935] shrink-0">
            POTONGAN {chunkIndex + 1}/{chunks.length}
          </span>
          <h3
            data-testid="chunk-title-bar"
            className="font-pixel text-[10px] sm:text-xs text-[#f4f1ea] truncate"
          >
            {currentChunk.title}
          </h3>
          {chunkIsComplete && (
            <span
              data-testid="chunk-complete-pill"
              className="font-pixel text-[8px] px-1.5 py-0.5 bg-[#0a1714] border border-[#38d864] text-[#38d864] shrink-0"
            >
              ✓ SELESAI
            </span>
          )}
        </div>

        {/* Progress Dots for Chunks */}
        <div
          className="flex items-center gap-1.5"
          role="tablist"
          aria-label="Navigasi Potongan Pelajaran"
        >
          {chunks.map((c, idx) => {
            const done = isChunkComplete(c, lessonProgress);
            const isCurrent = idx === chunkIndex;
            return (
              <button
                key={c.chunkId}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                aria-label={`Potongan ${idx + 1}: ${c.title}${done ? ' (Selesai)' : ''}`}
                data-testid={`chunk-dot-${idx}`}
                onClick={() => {
                  playClick();
                  setChunkIndex(idx);
                }}
                className={`h-7 px-2 font-pixel text-[9px] border-2 transition-all flex items-center gap-1 ${
                  isCurrent
                    ? 'bg-[#f5b935] text-[#0d0a1a] border-[#f4f1ea] font-bold'
                    : done
                    ? 'bg-[#0a1714] text-[#38d864] border-[#38d864]'
                    : 'bg-[#16112b] text-[#b3aad1] border-[#5c4e99]'
                }`}
              >
                <span>{idx + 1}</span>
                {done && <span aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 8-Step Stage Indicator Strip */}
      <div
        className="bg-[#120d26] border-b border-[#2b2352] px-4 py-1.5 flex items-center gap-1 overflow-x-auto shrink-0"
        aria-label="Tahapan di Dalam Potongan"
      >
        {STAGE_LABELS.map((s) => {
          const isCurrentStage = stage === s.id;
          const displayLabel =
            s.id === 'formula' && currentChunk.formulaTitle
              ? `6. ${currentChunk.formulaTitle}`
              : s.shortLabel;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                playClick();
                setStage(s.id);
              }}
              className={`font-pixel text-[8px] px-2 py-1 border whitespace-nowrap ${
                isCurrentStage
                  ? 'bg-[#3ac5eb] text-[#0d0a1a] border-[#f4f1ea] font-bold'
                  : 'bg-[#16112b] text-[#b3aad1] border-[#3a306e] hover:text-[#f4f1ea]'
              }`}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>

      {/* Scrollable Stage Content Body */}
      <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
        {/* STEP 1: GOAL CARD */}
        {stage === 'goal' && (
          <section
            data-testid="stage-goal"
            aria-label="Kartu Tujuan Belajar"
            className="pixel-box-gold p-5 sm:p-6 space-y-4"
          >
            <div className="font-pixel text-[10px] text-[#f5b935]">
              ★ LANGKAH 1 · TUJUAN POTONGAN INI
            </div>
            <h4 className="font-pixel text-xs sm:text-sm text-[#38d864]">
              Setelah ini kamu bisa...
            </h4>
            <p className="font-vt text-2xl sm:text-3xl text-[#f4f1ea] leading-relaxed bg-[#0d0a1a] border-l-4 border-[#f5b935] p-4">
              <GlossaryText text={currentChunk.goal} terms={currentChunk.terms} />
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                data-testid="goal-start-btn"
                onClick={() => {
                  playClick();
                  setSkippedToFormula(false);
                  setStage('scene');
                }}
                className="pixel-btn px-5 py-2.5 bg-[#38d864] text-[#0d0a1a] font-pixel text-xs"
              >
                Mulai →
              </button>

              <button
                type="button"
                data-testid="goal-skip-to-formula-btn"
                onClick={() => {
                  playClick();
                  setSkippedToFormula(true);
                  setStage('formula');
                }}
                className="pixel-btn px-4 py-2.5 bg-[#16112b] text-[#3ac5eb] border-[#3ac5eb] font-pixel text-xs"
              >
                Lewati ke rumus ⏭
              </button>
            </div>
          </section>
        )}

        {/* STEP 2: SCENE (Dialog bubbles one at a time with "Lanjut") */}
        {stage === 'scene' && (
          <section
            data-testid="stage-scene"
            aria-label="Adegan Dialog Petualang dan Pemandu Rune"
            className="space-y-4"
          >
            <div className="font-pixel text-[10px] text-[#3ac5eb]">
              💬 LANGKAH 2 · DIALOG DENGAN RUNE ({Math.min(sceneShownCount, currentChunk.scene.length)}/
              {currentChunk.scene.length})
            </div>

            <div className="space-y-3">
              {currentChunk.scene.slice(0, sceneShownCount).map((line, idx) => {
                const isRune = line.who === 'Rune';
                return (
                  <div
                    key={idx}
                    data-testid={`scene-bubble-${idx}`}
                    className={`flex items-start gap-3 p-3.5 border-2 ${
                      isRune
                        ? 'bg-[#120d26] border-[#9b5de5]'
                        : 'bg-[#0d192b] border-[#3ac5eb] flex-row-reverse text-right'
                    }`}
                  >
                    <div className="w-12 h-12 bg-[#0d0a1a] border-2 border-[#f5b935] flex items-center justify-center shrink-0">
                      {isRune ? (
                        <RuneGuideAvatar size={40} />
                      ) : (
                        <AvatarSprite avatarId={avatarId} size={40} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-pixel text-[9px] mb-1 ${
                          isRune ? 'text-[#f5b935]' : 'text-[#38d864]'
                        }`}
                      >
                        {isRune ? 'RUNE (PEMANDU DUNGEON)' : 'KAMU (PETUALANG)'}
                      </div>
                      <p className="font-vt text-xl sm:text-2xl text-[#f4f1ea] leading-snug">
                        <GlossaryText text={line.text} terms={currentChunk.terms} />
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              {sceneShownCount < currentChunk.scene.length ? (
                <button
                  type="button"
                  data-testid="scene-next-btn"
                  onClick={() => {
                    playClick();
                    setSceneShownCount((c) => c + 1);
                  }}
                  className="pixel-btn px-5 py-2.5 bg-[#f5b935] text-[#0d0a1a] font-pixel text-xs"
                >
                  Lanjut →
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="scene-next-btn"
                  onClick={() => {
                    playClick();
                    setStage('guess');
                  }}
                  className="pixel-btn px-5 py-2.5 bg-[#38d864] text-[#0d0a1a] font-pixel text-xs"
                >
                  Lanjut →
                </button>
              )}
            </div>
          </section>
        )}

        {/* STEP 3: GUESS (Single ungraded question, neutral reveal, no penalty styling) */}
        {stage === 'guess' && (
          <section
            data-testid="stage-guess"
            aria-label="Tebakan Awal Tanpa Nilai"
            className="pixel-box p-4 sm:p-5 space-y-4 border-[#3ac5eb]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3a306e] pb-2">
              <span className="font-pixel text-[10px] text-[#3ac5eb]">
                🤔 LANGKAH 3 · TEBAK DULU (TANPA NILAI / PENALTI)
              </span>
              <span className="font-vt text-base text-[#b3aad1]">
                Pilih intuisi pertamamu untuk membuka penjelasan
              </span>
            </div>

            <div className="font-vt text-xl sm:text-2xl text-[#f4f1ea] leading-snug">
              <GlossaryText text={currentChunk.guess.question} terms={currentChunk.terms} />
            </div>

            <div className="space-y-2" role="group" aria-label={currentChunk.guess.question}>
              {currentChunk.guess.options.map((optText, idx) => {
                const isChosen = guessChoiceIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    data-testid={`guess-option-${idx}`}
                    aria-pressed={isChosen}
                    onClick={() => {
                      playClick();
                      setGuessChoiceIdx(idx);
                    }}
                    className={`w-full text-left p-3 border-2 font-vt text-lg sm:text-xl flex items-start gap-2.5 ${
                      isChosen
                        ? 'bg-[#1a2238] border-[#3ac5eb] text-[#3ac5eb] font-bold'
                        : 'bg-[#120d26] border-[#5c4e99] text-[#f4f1ea] hover:border-[#f5b935]'
                    }`}
                  >
                    <span className="font-pixel text-[9px] mt-1 shrink-0">
                      {isChosen ? '▸ PILIHANMU' : `${String.fromCharCode(65 + idx)}.`}
                    </span>
                    <span>
                      <GlossaryText text={optText} terms={currentChunk.terms} />
                    </span>
                  </button>
                );
              })}
            </div>

            {guessChoiceIdx !== null && (
              <div
                data-testid="guess-reveal-box"
                className="bg-[#0d192b] border-2 border-[#3ac5eb] p-4 space-y-2"
              >
                <div className="font-pixel text-[9px] text-[#f5b935]">
                  💡 PENJELASAN RUNE (PILIHANMU: {currentChunk.guess.options[guessChoiceIdx]})
                </div>
                <p className="font-vt text-xl text-[#f4f1ea] leading-snug">
                  <GlossaryText text={currentChunk.guess.reveal} terms={currentChunk.terms} />
                </p>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    data-testid="guess-continue-btn"
                    onClick={() => {
                      playClick();
                      setStage('steps');
                    }}
                    className="pixel-btn px-5 py-2 bg-[#38d864] text-[#0d0a1a] font-pixel text-xs"
                  >
                    Lanjut →
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* STEP 4: VISUAL + STEPS (Revealed one at a time with "Lanjut", highlight glows) */}
        {stage === 'steps' && (
          <section
            data-testid="stage-steps"
            aria-label="Visual Interaktif dan Langkah Bertahap"
            className="space-y-4"
          >
            <div className="font-pixel text-[10px] text-[#f5b935]">
              🔍 LANGKAH 4 · VISUAL &amp; BEDAH BERTAHAP ({Math.min(stepsShownCount, currentChunk.steps.length)}/
              {currentChunk.steps.length})
            </div>

            <div
              className={`grid grid-cols-1 ${
                currentChunk.visual && mode !== 'tower-quest' ? 'lg:grid-cols-12' : ''
              } gap-4 items-start`}
            >
              {currentChunk.visual && (
                <div
                  className={
                    mode !== 'tower-quest' ? 'lg:col-span-6 lg:sticky lg:top-2' : 'w-full'
                  }
                >
                  <LessonVisualRenderer
                    visual={currentChunk.visual}
                    activeHighlights={activeStepHighlight}
                    reduceMotion={reduceMotion}
                  />
                </div>
              )}

              <div
                className={`${
                  currentChunk.visual && mode !== 'tower-quest' ? 'lg:col-span-6' : ''
                } space-y-2.5`}
              >
                {currentChunk.steps.slice(0, stepsShownCount).map((stepObj, idx) => {
                  const isLatestOrFocused = idx === activeStepIdx;
                  return (
                    <div
                      key={idx}
                      data-testid={`lesson-step-${idx}`}
                      onClick={() => setActiveStepIdx(idx)}
                      className={`p-3.5 border-2 cursor-pointer transition-all ${
                        isLatestOrFocused
                          ? 'bg-[#1a1438] border-[#f5b935] shadow-[0_0_0_2px_rgba(245,185,53,0.3)]'
                          : 'bg-[#120d26] border-[#3a306e] opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`font-pixel text-[9px] ${
                            isLatestOrFocused ? 'text-[#f5b935]' : 'text-[#b3aad1]'
                          }`}
                        >
                          LANGKAH #{idx + 1} {isLatestOrFocused ? '· ★ DISOROT' : ''}
                        </span>
                        {stepObj.highlight.length > 0 && (
                          <span className="font-mono text-xs text-[#3ac5eb]">
                            Sorotan: [{stepObj.highlight.join(', ')}]
                          </span>
                        )}
                      </div>
                      <p className="font-vt text-xl sm:text-2xl text-[#f4f1ea] leading-snug">
                        <GlossaryText text={stepObj.text} terms={currentChunk.terms} />
                      </p>
                    </div>
                  );
                })}

                <div className="flex justify-end pt-2">
                  {stepsShownCount < currentChunk.steps.length ? (
                    <button
                      type="button"
                      data-testid="steps-next-btn"
                      onClick={() => {
                        playClick();
                        const nextCount = stepsShownCount + 1;
                        setStepsShownCount(nextCount);
                        setActiveStepIdx(nextCount - 1);
                      }}
                      className="pixel-btn px-5 py-2.5 bg-[#f5b935] text-[#0d0a1a] font-pixel text-xs"
                    >
                      Lanjut →
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-testid="steps-next-btn"
                      onClick={() => {
                        playClick();
                        setStage('practice');
                      }}
                      className="pixel-btn px-5 py-2.5 bg-[#38d864] text-[#0d0a1a] font-pixel text-xs"
                    >
                      Lanjut →
                    </button>
                  )}
                </div>
              </div>
            </div>

            {currentChunk.miniLab === 'neuron' && (
              <div className="pt-2">
                <NeuronMiniLabWidget reduceMotion={reduceMotion} />
              </div>
            )}
            {currentChunk.miniLab === 'softmax' && (
              <div className="pt-2">
                <SoftmaxMiniLabWidget reduceMotion={reduceMotion} />
              </div>
            )}
            {currentChunk.miniLab === 'quant' && (
              <div className="pt-2">
                <QuantMiniLabWidget reduceMotion={reduceMotion} />
              </div>
            )}
            {currentChunk.miniLab === 'latency' && (
              <div className="pt-2">
                <LatencyMiniLabWidget reduceMotion={reduceMotion} />
              </div>
            )}
          </section>
        )}

        {/* STEP 5: PRACTICE (Instant feedback, unlimited retries, no hearts/XP) */}
        {stage === 'practice' && (
          <section
            data-testid="stage-practice"
            aria-label="Latihan Praktik Tanpa Risiko"
            className="space-y-4"
          >
            {currentChunk.miniLab === 'neuron' && (
              <NeuronMiniLabWidget reduceMotion={reduceMotion} />
            )}
            {currentChunk.miniLab === 'softmax' && (
              <SoftmaxMiniLabWidget reduceMotion={reduceMotion} />
            )}
            {currentChunk.miniLab === 'quant' && (
              <QuantMiniLabWidget reduceMotion={reduceMotion} />
            )}
            {currentChunk.miniLab === 'latency' && (
              <LatencyMiniLabWidget reduceMotion={reduceMotion} />
            )}

            <div className="bg-[#120d26] border-2 border-[#38d864] p-3.5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-pixel text-[10px] text-[#38d864]">
                  ⚔ LANGKAH 5 · LATIHAN POTONGAN ({attemptedPracticeIds.length}/
                  {currentChunk.practice.length} DICOBA)
                </div>
                <p className="font-vt text-lg text-[#b3aad1]">
                  Tanpa kehilangan hati &amp; tanpa penalti. Coba setiap latihan minimal 1 kali untuk menyelesaikan potongan ini.
                </p>
              </div>
              <span className="font-pixel text-[9px] px-2.5 py-1 bg-[#0d0a1a] border border-[#f5b935] text-[#f5b935]">
                {chunkIsComplete ? '✓ SEMUA DICOBA' : 'COBA SEMUA AKTIVITAS'}
              </span>
            </div>

            <div className="space-y-4">
              {currentChunk.practice.map((act) => (
                <PracticeActivityDispatcher
                  key={act.id}
                  activity={act}
                  terms={currentChunk.terms}
                  isAttempted={attemptedPracticeIds.includes(act.id)}
                  onRecordAttempt={() => handleRecordAttempt(act.id)}
                />
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                data-testid="practice-to-formula-btn"
                onClick={() => {
                  playClick();
                  setStage('formula');
                }}
                className="pixel-btn px-5 py-2.5 bg-[#38d864] text-[#0d0a1a] font-pixel text-xs"
              >
                Lanjut ke {currentChunk.formulaTitle || 'Rumus'} →
              </button>
            </div>
          </section>
        )}

        {/* STEP 6: FORMULA REVEAL (Rune plate + "Dibaca: ..." + "Jebakan Monster" + practice available if skipped) */}
        {stage === 'formula' && (
          <section
            data-testid="stage-formula"
            aria-label="Pelat Rune Rumus dan Jebakan Monster"
            className="space-y-4"
          >
            {/* Rune Plate */}
            <div
              className="p-4 sm:p-5 border-4 bg-[#0d0a1a] shadow-[inset_0_0_0_2px_#2b2352] space-y-3"
              style={{ borderColor: spellTheme.color }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#3a306e] pb-2">
                <div>
                  <div className="font-pixel text-[9px] text-[#b3aad1] mb-0.5">
                    ★ LANGKAH 6 · {currentChunk.title}
                  </div>
                  <h4
                    data-testid="formula-step-heading"
                    className="font-pixel text-xs sm:text-sm"
                    style={{ color: spellTheme.color }}
                  >
                    {currentChunk.formulaTitle || 'Rumus'}
                  </h4>
                </div>
                <span className="font-pixel text-[9px] text-[#b3aad1] bg-[#16112b] px-2 py-0.5 border border-[#5c4e99]">
                  {currentChunk.chunkId.toUpperCase()}
                </span>
              </div>

              <ul className="space-y-2" data-testid="formula-lines-list">
                {currentChunk.formula.lines.map((line, idx) => (
                  <li
                    key={idx}
                    className="font-mono text-sm sm:text-base text-[#f4f1ea] bg-[#16112b] border border-[#5c4e99] px-3 py-2 tracking-wide"
                  >
                    <GlossaryText text={line} terms={currentChunk.terms} />
                  </li>
                ))}
              </ul>

              {/* Read Aloud ("Dibaca: ...") */}
              <div
                data-testid="formula-read-aloud"
                className="bg-[#120d26] border-l-4 border-[#3ac5eb] p-3 font-vt text-xl sm:text-2xl text-[#f4f1ea]"
              >
                <strong className="font-pixel text-[9px] text-[#3ac5eb] block mb-1">
                  CARA BACA RUNE:
                </strong>
                Dibaca: <GlossaryText text={currentChunk.formula.readAloud} terms={currentChunk.terms} />
              </div>
            </div>

            {/* Common Mistake ("Jebakan Monster") */}
            <div
              data-testid="formula-common-mistake"
              className="bg-[#291324] border-2 border-[#e83b47] p-4 space-y-1.5"
            >
              <div className="font-pixel text-[10px] text-[#e83b47]">
                ⚠ Jebakan Monster
              </div>
              <p className="font-vt text-xl sm:text-2xl text-[#f4f1ea] leading-snug">
                <GlossaryText text={currentChunk.commonMistake} terms={currentChunk.terms} />
              </p>
            </div>

            {/* Keep practice available when user jumped via "Lewati ke rumus" or hasn't finished practice */}
            {(skippedToFormula || !chunkIsComplete) && (
              <div
                data-testid="formula-embedded-practice"
                className="border-2 border-[#f5b935] bg-[#120d26]/90 p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-pixel text-[10px] text-[#f5b935]">
                    ⚔ LATIHAN POTONGAN INI ({attemptedPracticeIds.length}/{currentChunk.practice.length} DICOBA)
                  </div>
                  <span className="font-vt text-base text-[#b3aad1]">
                    Latihan tetap tersedia agar potongan ini dapat ditandai selesai
                  </span>
                </div>
                <div className="space-y-3">
                  {currentChunk.practice.map((act) => (
                    <PracticeActivityDispatcher
                      key={act.id}
                      activity={act}
                      terms={currentChunk.terms}
                      isAttempted={attemptedPracticeIds.includes(act.id)}
                      onRecordAttempt={() => handleRecordAttempt(act.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                data-testid="formula-to-summary-btn"
                onClick={() => {
                  playClick();
                  setStage('summary');
                }}
                className="pixel-btn px-5 py-2.5 bg-[#38d864] text-[#0d0a1a] font-pixel text-xs"
              >
                Lanjut →
              </button>
            </div>
          </section>
        )}

        {/* STEP 7: SUMMARY (summaryPrompt + optional textarea max 400 chars + "Lewati") */}
        {stage === 'summary' && (
          <section
            data-testid="stage-summary"
            aria-label="Catatan Ringkasan Pribadi"
            className="pixel-box p-4 sm:p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3a306e] pb-2">
              <span className="font-pixel text-[10px] text-[#f5b935]">
                ✍ LANGKAH 7 · CATATAN RINGKASAN PRIBADI (OPSIONAL)
              </span>
              <span className="font-mono text-xs text-[#b3aad1]">
                {currentSummaryText.length}/400 karakter
              </span>
            </div>

            <label
              htmlFor={`summary-textarea-${currentChunk.chunkId}`}
              className="block font-vt text-xl sm:text-2xl text-[#f4f1ea] leading-snug"
            >
              <GlossaryText text={currentChunk.summaryPrompt} terms={currentChunk.terms} />
            </label>

            <textarea
              id={`summary-textarea-${currentChunk.chunkId}`}
              data-testid="summary-textarea"
              rows={3}
              maxLength={400}
              value={currentSummaryText}
              onChange={(e) => setChunkSummary(currentChunk.chunkId, e.target.value)}
              placeholder="Tulis dengan kata-katamu sendiri (opsional, maks 400 karakter)..."
              className="w-full bg-[#0d0a1a] border-2 border-[#5c4e99] focus:border-[#f5b935] p-3 font-vt text-xl text-[#f4f1ea] outline-none"
            />

            {currentChunk.realTask && (
              <div
                data-testid="real-task-card"
                className="bg-[#120d26] border-2 border-[#fb923c] p-4 space-y-2.5 text-left"
              >
                <div className="font-pixel text-[10px] text-[#fb923c]">
                  Tugas nyata (opsional)
                </div>
                <p
                  data-testid="real-task-text"
                  className="font-vt text-xl sm:text-2xl text-[#f4f1ea] leading-snug"
                >
                  {currentChunk.realTask}
                </p>
                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    data-testid={`real-task-checkbox-${currentChunk.chunkId}`}
                    checked={Boolean(taskDone[currentChunk.chunkId])}
                    onChange={(e) => {
                      playClick();
                      toggleChunkRealTaskDone(currentChunk.chunkId, e.target.checked);
                    }}
                    className="w-4 h-4 accent-[#38d864] cursor-pointer"
                  />
                  <span className="font-vt text-lg sm:text-xl text-[#38d864]">
                    Sudah kucoba
                  </span>
                </label>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                data-testid="summary-skip-btn"
                onClick={() => {
                  playClick();
                  setStage('finish');
                }}
                className="font-vt text-xl text-[#3ac5eb] underline hover:text-[#f5b935] px-2 py-1"
              >
                Lewati →
              </button>

              <button
                type="button"
                data-testid="summary-save-continue-btn"
                onClick={() => {
                  playCast();
                  setStage('finish');
                }}
                className="pixel-btn px-5 py-2.5 bg-[#38d864] text-[#0d0a1a] font-pixel text-xs"
              >
                Simpan &amp; Selesai →
              </button>
            </div>
          </section>
        )}

        {/* STEP 8: FINISH ("Potongan selesai" banner + reviewItems added + next chunk / ready to fight) */}
        {stage === 'finish' && (
          <section
            data-testid="stage-finish"
            aria-label="Potongan Selesai"
            className="bg-[#0a1714] border-4 border-[#38d864] p-5 sm:p-6 space-y-4 text-center"
          >
            <div className="font-pixel text-sm sm:text-base text-[#38d864]">
              ★ Potongan selesai!
            </div>

            <p className="font-vt text-xl sm:text-2xl text-[#f4f1ea]">
              Kamu telah menuntaskan potongan <strong>{currentChunk.title}</strong>.{' '}
              <span className="text-[#f5b935]">
                +{currentChunk.reviewItems.length} kartu kilas balik
              </span>{' '}
              telah ditambahkan ke antrean <strong>Ulasan Harian</strong>.
            </p>

            {currentChunk.realTask && (
              <div
                data-testid="real-task-card"
                className="bg-[#120d26] border-2 border-[#fb923c] p-4 space-y-2.5 text-left"
              >
                <div className="font-pixel text-[10px] text-[#fb923c]">
                  Tugas nyata (opsional)
                </div>
                <p
                  data-testid="real-task-text"
                  className="font-vt text-xl sm:text-2xl text-[#f4f1ea] leading-snug"
                >
                  {currentChunk.realTask}
                </p>
                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    data-testid={`real-task-checkbox-${currentChunk.chunkId}`}
                    checked={Boolean(taskDone[currentChunk.chunkId])}
                    onChange={(e) => {
                      playClick();
                      toggleChunkRealTaskDone(currentChunk.chunkId, e.target.checked);
                    }}
                    className="w-4 h-4 accent-[#38d864] cursor-pointer"
                  />
                  <span className="font-vt text-lg sm:text-xl text-[#38d864]">
                    Sudah kucoba
                  </span>
                </label>
              </div>
            )}

            {!chunkIsComplete && (
              <div className="bg-[#291324] border-2 border-[#f5b935] p-3 text-left font-vt text-lg text-[#f4f1ea]">
                Catatan: Kamu masih memiliki latihan yang belum dicoba di potongan ini. Klik{' '}
                <button
                  type="button"
                  onClick={() => setStage('practice')}
                  className="text-[#f5b935] underline font-bold"
                >
                  Langkah 5 (Latihan)
                </button>{' '}
                untuk mencobanya agar seluruh potongan topik ini berstatus lengkap.
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {chunkIndex + 1 < chunks.length ? (
                <button
                  type="button"
                  data-testid="next-chunk-btn"
                  onClick={() => {
                    playClick();
                    setChunkIndex((idx) => idx + 1);
                  }}
                  className="pixel-btn px-5 py-2.5 bg-[#f5b935] text-[#0d0a1a] font-pixel text-xs"
                >
                  Potongan Berikutnya ({chunkIndex + 2}/{chunks.length}) →
                </button>
              ) : (
                <div className="font-pixel text-xs text-[#f5b935]">
                  {mode === 'tower-quest'
                    ? `✓ Ini adalah potongan terakhir di Quest ${(questId || '').toUpperCase()}!`
                    : `✓ Ini adalah potongan terakhir di Topik #${topicContent.topicId}!`}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Footer Actions: "Aku siap bertarung" enabled when all chunks of the topic are complete */}
      <div className="p-3.5 sm:p-4 bg-[#120d26] border-t-2 border-[#3a306e] flex flex-wrap items-center justify-between gap-3 relative z-10 shrink-0">
        {mode === 'battle-entry' ? (
          <>
            <div className="font-vt text-lg text-[#b3aad1]">
              {topicAllChunksComplete
                ? '✓ Semua potongan topik ini selesai! Kamu siap menghadapi monster.'
                : `Selesaikan latihan di semua potongan (${
                    chunks.filter((c) => isChunkComplete(c, lessonProgress)).length
                  }/${chunks.length} potongan selesai) untuk mengaktifkan tombol bertarung.`}
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                data-testid="ready-to-fight-btn"
                disabled={!topicAllChunksComplete}
                onClick={() => {
                  playClick();
                  onReadyToFight?.();
                }}
                className="pixel-btn px-5 py-2.5 bg-[#38d864] text-[#0d0a1a] font-pixel text-xs"
              >
                Aku siap bertarung →
              </button>
            </div>
          </>
        ) : mode === 'tower-quest' ? (
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <span className="font-vt text-lg text-[#b3aad1]">
              Panduan ini tidak mencentang langkah quest secara otomatis. Tandai langkah quest secara manual setelah kamu mengerjakannya.
            </span>
            {onSwitchToQuestChecklist && (
              <button
                type="button"
                data-testid="footer-switch-to-quest-checklist-btn"
                onClick={() => {
                  playClick();
                  onSwitchToQuestChecklist();
                }}
                className="pixel-btn px-4 py-2 bg-[#f5b935] text-[#0d0a1a] font-pixel text-xs shrink-0"
              >
                Ke Daftar Langkah Quest →
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="font-vt text-lg text-[#38d864]">
              Potongan pelajaran ini dapat kamu ulangi kapan saja dari Grimoire.
            </span>
            <button
              type="button"
              onClick={() => {
                playClick();
                onClose();
              }}
              className="pixel-btn px-4 py-2 bg-[#f5b935] text-[#0d0a1a] font-pixel text-xs"
            >
              Kembali ke Grimoire
            </button>
          </div>
        )}
      </div>

      {/* KAMUS DRAWER (All terms of the current chunk, plain text only) */}
      {kamusDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Kamus Istilah ${currentChunk.title}`}
          data-testid="kamus-drawer"
          className="fixed inset-0 z-50 bg-black/80 flex justify-end"
          onClick={() => setKamusDrawerOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#120d26] border-l-4 border-[#f5b935] h-full flex flex-col p-4 sm:p-5 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b-2 border-[#3a306e] pb-3 mb-4">
              <div>
                <div className="font-pixel text-[9px] text-[#f5b935]">
                  KAMUS ISTILAH POTONGAN {chunkIndex + 1}/{chunks.length}
                </div>
                <h3 className="font-pixel text-xs text-[#f4f1ea] mt-1">
                  {currentChunk.title}
                </h3>
              </div>
              <button
                type="button"
                data-testid="close-kamus-drawer-btn"
                onClick={() => setKamusDrawerOpen(false)}
                className="pixel-btn px-3 py-1.5 bg-[#1f193d] text-[#f4f1ea] font-pixel text-[10px]"
              >
                ✕ TUTUP
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {currentChunk.terms.map((t, idx) => (
                <div
                  key={idx}
                  className="bg-[#0d0a1a] border-2 border-[#5c4e99] p-3 space-y-1"
                >
                  <div className="font-pixel text-[10px] text-[#f5b935]">{t.term}</div>
                  <p className="font-vt text-xl text-[#f4f1ea] leading-snug">{t.plain}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
