import React, { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { getLocalDateKey } from '../game/campTracker';
import {
  EnrichedReviewItem,
  REVIEW_BOX_INTERVALS,
  ReviewRating,
  getAllReviewItems,
  getDueReviewItems,
  scheduleReviewItem,
} from '../game/lessonEngine';
import { useSound } from '../hooks/useSound.js';

export const ReviewPage: React.FC = () => {
  const reviewQueue = useGameStore((s) => s.reviewQueue);
  const intervalScale = useGameStore((s) => s.settings?.intervalScale ?? 1);
  const gradeReviewItem = useGameStore((s) => s.gradeReviewItem);
  const setView = useGameStore((s) => s.setView);
  const { playClick, playCast, playFizzle } = useSound();

  const todayKey = getLocalDateKey();

  // Compute current live due state
  const liveDueInfo = useMemo(
    () => getDueReviewItems(reviewQueue, todayKey, 10),
    [reviewQueue, todayKey]
  );

  // Lock in up to 10 cards per session so grading an item advances cleanly through the session deck
  const [sessionDeck, setSessionDeck] = useState<
    (EnrichedReviewItem & { box: number; due: string })[]
  >(() => getDueReviewItems(useGameStore.getState().reviewQueue, todayKey, 10).dueItems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [sessionCompletedCount, setSessionCompletedCount] = useState(0);
  const [sessionFinished, setSessionFinished] = useState(false);

  // If the session had 0 cards initially but cards were added later, sync deck
  useEffect(() => {
    if (sessionDeck.length === 0 && !sessionFinished && liveDueInfo.dueItems.length > 0) {
      setSessionDeck(liveDueInfo.dueItems);
      setCurrentIndex(0);
      setShowBack(false);
    }
  }, [liveDueInfo.dueItems, sessionDeck.length, sessionFinished]);

  const currentCard = sessionDeck[currentIndex];

  const handleGrade = (rating: ReviewRating) => {
    if (!currentCard) return;
    if (rating === 'ingat') {
      playCast();
    } else if (rating === 'ragu') {
      playClick();
    } else {
      playFizzle();
    }

    gradeReviewItem(currentCard.id, rating);
    setSessionCompletedCount((c) => c + 1);

    if (currentIndex + 1 < sessionDeck.length) {
      setCurrentIndex((idx) => idx + 1);
      setShowBack(false);
    } else {
      setSessionFinished(true);
      setShowBack(false);
    }
  };

  const handleStartNextBatch = () => {
    playClick();
    const freshDue = getDueReviewItems(useGameStore.getState().reviewQueue, todayKey, 10);
    setSessionDeck(freshDue.dueItems);
    setCurrentIndex(0);
    setShowBack(false);
    setSessionCompletedCount(0);
    setSessionFinished(false);
  };

  // Compute preview intervals for the current card
  const previewSchedules = useMemo(() => {
    if (!currentCard) return null;
    const entry = reviewQueue[currentCard.id] || {
      box: currentCard.box,
      due: currentCard.due,
    };
    return {
      lupa: scheduleReviewItem(entry, 'lupa', intervalScale, todayKey),
      ragu: scheduleReviewItem(entry, 'ragu', intervalScale, todayKey),
      ingat: scheduleReviewItem(entry, 'ingat', intervalScale, todayKey),
    };
  }, [currentCard, reviewQueue, todayKey, intervalScale]);

  // Box distribution summary across all queued items
  const boxCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    for (const entry of Object.values(reviewQueue)) {
      const b = Math.max(0, Math.min(4, Math.floor(entry.box || 0)));
      counts[b] += 1;
    }
    return counts;
  }, [reviewQueue]);

  const totalCatalogItems = useMemo(() => getAllReviewItems().length, []);
  const totalQueuedCount = Object.keys(reviewQueue).length;

  return (
    <div
      data-testid="review-page"
      className="w-full max-w-4xl mx-auto px-3 pb-14 space-y-6"
    >
      {/* Header Banner */}
      <section aria-label="Header Ulasan Harian" className="pixel-box-gold p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-pixel text-[10px] text-[#3ac5eb] mb-1">
              SPACED REPETITION · KOTAK LEITNER 0–4
            </div>
            <h1 className="font-pixel text-sm sm:text-base text-[#f5b935]">
              ULASAN HARIAN (KARTU KILAS BALIK)
            </h1>
            <p className="font-vt text-xl text-[#b3aad1] mt-1">
              Jatuh Tempo Hari Ini:{' '}
              <strong
                data-testid="review-due-count-banner"
                className="text-[#38d864] tabular-nums"
              >
                {liveDueInfo.totalDueCount} kartu
              </strong>{' '}
              · Total di Antrean:{' '}
              <strong className="text-[#f4f1ea] tabular-nums">
                {totalQueuedCount}/{totalCatalogItems}
              </strong>{' '}
              · Skala Interval:{' '}
              <strong className="text-[#f5b935] tabular-nums">{intervalScale}x</strong>
            </p>
            <p className="font-vt text-base text-[#b3aad1] mt-0.5">
              Maksimal 10 kartu per sesi. Ulasan menjaga Streak Harianmu tetap menyala (Tanpa XP).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                playClick();
                setView('settings');
              }}
              className="pixel-btn px-3 py-2 bg-[#16112b] text-[#b3aad1] font-pixel text-[9px]"
            >
              ⚙ Atur Skala ({intervalScale}x)
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setView('dungeon');
              }}
              className="pixel-btn px-3 py-2 bg-[#1f193d] text-[#f4f1ea] font-pixel text-[9px]"
            >
              Ke Peta Dungeon →
            </button>
          </div>
        </div>
      </section>

      {/* Main Flashcard Review Area */}
      <section aria-label="Area Kartu Ulasan Harian" className="pixel-box p-4 sm:p-6">
        {sessionDeck.length === 0 ? (
          <div
            data-testid="review-empty-state"
            className="bg-[#120d26] border-2 border-[#38d864] p-6 text-center space-y-4"
          >
            <div className="font-pixel text-sm text-[#38d864]">
              ✓ TIDAK ADA KARTU YANG JATUH TEMPO SAAT INI
            </div>
            <p className="font-vt text-xl sm:text-2xl text-[#f4f1ea] max-w-xl mx-auto">
              {totalQueuedCount === 0
                ? 'Antrean Ulasan Harianmu masih kosong. Selesaikan potongan pelajaran (Langkah 8) di Ruang Topik Lantai 1 & 2 untuk mengumpulkan kartu kilas balik!'
                : 'Semua kartu di antreanmu sudah diulas untuk hari ini. Kembalilah besok sesuai jadwal interval kotakmu!'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setView('dungeon');
                }}
                className="pixel-btn px-4 py-2.5 bg-[#38d864] text-[#0d0a1a] font-pixel text-xs"
              >
                Pelajari Potongan di Peta Dungeon →
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setView('grimoire');
                }}
                className="pixel-btn px-4 py-2.5 bg-[#16112b] text-[#f4f1ea] font-pixel text-xs"
              >
                Buka Grimoire
              </button>
            </div>
          </div>
        ) : sessionFinished ? (
          <div
            data-testid="review-session-finished"
            className="bg-[#0a1714] border-2 border-[#38d864] p-6 text-center space-y-4"
          >
            <div className="font-pixel text-sm text-[#38d864]">
              ★ SESI ULASAN HARIAN SELESAI!
            </div>
            <p className="font-vt text-2xl text-[#f4f1ea]">
              Kamu telah mengulas{' '}
              <strong className="text-[#f5b935]">{sessionCompletedCount} kartu</strong> pada sesi ini.
              Streak harianmu telah diperbarui!
            </p>
            {liveDueInfo.totalDueCount > 0 ? (
              <div className="space-y-3">
                <p className="font-vt text-xl text-[#b3aad1]">
                  Masih ada <strong className="text-[#f5b935]">{liveDueInfo.totalDueCount}</strong> kartu
                  lagi yang jatuh tempo hari ini.
                </p>
                <button
                  type="button"
                  data-testid="review-next-batch-btn"
                  onClick={handleStartNextBatch}
                  className="pixel-btn px-5 py-2.5 bg-[#f5b935] text-[#0d0a1a] font-pixel text-xs"
                >
                  Ulas Sesi Berikutnya (Maks 10 Kartu) →
                </button>
              </div>
            ) : (
              <p className="font-vt text-xl text-[#38d864]">
                Seluruh kartu yang jatuh tempo hari ini telah tuntas!
              </p>
            )}
          </div>
        ) : currentCard ? (
          <div className="space-y-5">
            {/* Progress Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#120d26] border border-[#5c4e99] px-3.5 py-2">
              <div className="font-vt text-lg text-[#f4f1ea]">
                Kartu <strong className="text-[#f5b935]">{currentIndex + 1}</strong> dari{' '}
                <strong>{sessionDeck.length}</strong> (Sesi Ini) ·{' '}
                <span className="text-[#3ac5eb]">
                  Topik #{currentCard.topicId}: {currentCard.chunkTitle}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  data-testid="review-card-box-badge"
                  className="font-pixel text-[9px] px-2 py-0.5 bg-[#0d0a1a] border border-[#f5b935] text-[#f5b935]"
                >
                  KOTAK {currentCard.box}
                </span>
                <span className="font-mono text-xs text-[#b3aad1]">
                  ID: {currentCard.id}
                </span>
              </div>
            </div>

            {/* Front of Card */}
            <div
              data-testid="review-card-front"
              className="bg-[#0d0a1a] border-4 border-[#5c4e99] p-6 sm:p-8 text-center space-y-3"
            >
              <div className="font-pixel text-[9px] text-[#3ac5eb]">
                PERTANYAAN KILAS BALIK (SISI DEPAN)
              </div>
              <p className="font-vt text-2xl sm:text-3xl text-[#f4f1ea] leading-relaxed">
                {currentCard.front}
              </p>
            </div>

            {/* Reveal Button OR Back of Card + 3 Rating Buttons */}
            {!showBack ? (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  data-testid="review-show-answer-btn"
                  onClick={() => {
                    playClick();
                    setShowBack(true);
                  }}
                  className="pixel-btn px-6 py-3 bg-[#f5b935] text-[#0d0a1a] font-pixel text-xs"
                >
                  Tampilkan jawaban
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  data-testid="review-card-back"
                  className="bg-[#0a1714] border-4 border-[#38d864] p-6 text-center space-y-2"
                >
                  <div className="font-pixel text-[9px] text-[#38d864]">
                    JAWABAN (SISI BELAKANG)
                  </div>
                  <p className="font-mono text-lg sm:text-xl text-[#f4f1ea] leading-relaxed">
                    {currentCard.back}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="font-pixel text-[9px] text-center text-[#b3aad1]">
                    SEBERAPA KUAT INGATANMU TENTANG KARTU INI?
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      data-testid="review-rate-lupa"
                      onClick={() => handleGrade('lupa')}
                      className="pixel-btn p-3.5 bg-[#291324] text-[#e83b47] border-[#e83b47] flex flex-col items-center gap-1"
                    >
                      <span className="font-pixel text-xs">Lupa</span>
                      <span className="font-vt text-base text-[#f4f1ea]">
                        Ke Kotak 0 · Ulas besok (1 hari)
                      </span>
                    </button>

                    <button
                      type="button"
                      data-testid="review-rate-ragu"
                      onClick={() => handleGrade('ragu')}
                      className="pixel-btn p-3.5 bg-[#241b2f] text-[#f5b935] border-[#f5b935] flex flex-col items-center gap-1"
                    >
                      <span className="font-pixel text-xs">Ragu</span>
                      <span className="font-vt text-base text-[#f4f1ea]">
                        Tetap Kotak {previewSchedules?.ragu.box ?? currentCard.box} · +
                        {previewSchedules?.ragu.intervalDays ?? 1} hari
                      </span>
                    </button>

                    <button
                      type="button"
                      data-testid="review-rate-ingat"
                      onClick={() => handleGrade('ingat')}
                      className="pixel-btn p-3.5 bg-[#0a1714] text-[#38d864] border-[#38d864] flex flex-col items-center gap-1"
                    >
                      <span className="font-pixel text-xs">Ingat</span>
                      <span className="font-vt text-base text-[#f4f1ea]">
                        Naik Kotak {previewSchedules?.ingat.box ?? Math.min(4, currentCard.box + 1)}{' '}
                        · +{previewSchedules?.ingat.intervalDays ?? 3} hari
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </section>

      {/* Leitner Box Overview */}
      <section aria-label="Distribusi Kotak Ulasan" className="pixel-box p-4 sm:p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-pixel text-xs text-[#3ac5eb]">
            DISTRIBUSI KOTAK INGATAN (INTERVAL DASAR: [1, 3, 7, 14, 30] HARI × {intervalScale}x)
          </h2>
          <span className="font-vt text-base text-[#b3aad1]">
            Kartu baru dimulai dari Kotak 0 dan langsung jatuh tempo
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {REVIEW_BOX_INTERVALS.map((baseDays, boxIdx) => {
            const scaledDays = Math.max(1, Math.round(baseDays * intervalScale));
            return (
              <div
                key={boxIdx}
                className="bg-[#120d26] border-2 border-[#5c4e99] p-3 text-center space-y-1"
              >
                <div className="font-pixel text-[9px] text-[#f5b935]">KOTAK {boxIdx}</div>
                <div className="font-pixel text-sm text-[#f4f1ea] tabular-nums">
                  {boxCounts[boxIdx]} kartu
                </div>
                <div className="font-vt text-base text-[#3ac5eb]">
                  Interval: {scaledDays} hari
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
