import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ALL_RELICS, ALL_TOPICS, FLOORS } from '../data/roadmap.js';
import { useGameStore } from '../store/useGameStore';
import { getLevelProgress, isFloorUnlocked } from '../game/formulas';
import {
  areAllReflectionsAnswered,
  canCompleteTowerQuest,
  canTickTowerStep,
  canUnlockCerminPuncak,
  FLOOR6_CONTENT,
  formatCertificateSummaryText,
  getTowerQuestStepProgress,
  getTowerQuestStatus,
  TOWER_RELICS,
} from '../game/spellbookEngine';
import {
  AvatarSprite,
  CerminPuncakSprite,
  CerminPuncakState,
  DungeonDoorSprite,
  PixelLockSprite,
  RelicSprite,
} from '../components/PixelSprites';
import { useSound } from '../hooks/useSound.js';

/**
 * Short flavor line per landing (max 2 sentences, in Indonesian, no new technical claims).
 */
const LANDING_FLAVOR_LINES: Record<string, string> = {
  m1: 'Anak tangga batu pertama diterangi lentera emas di bawah langit malam. Di balkon ini, rumus dan bukti dirangkai kembali dengan tenang.',
  m2: 'Angin malam membawa gema kuliah dari menara jauh. Jadwal rutin dan latihan tangan menjadi pijakan agar langkahmu tidak goyah.',
  m3: 'Di ruang prasasti ini, klaim di atas kertas diuji langsung lewat kode buatanmu sendiri. Angka yang jujur lebih berharga daripada sekadar hafalan.',
  m4: 'Balkon tengah menampilkan deretan karya yang pernah gagal lalu diperbaiki. Setiap keputusan teknis tercatat rapi sebagai jejak perjalanan.',
  m5: 'Angin kencang menguji ketenanganmu di ketinggian menara. Tekanan waktu dan kolaborasi terbuka menempa ketahanan kerjamu.',
  m6: 'Kompas emas di lantai enam menunjuk ke satu arah fokus di cakrawala malam. Memilih satu jalur membuat langkah berikutnya lebih tajam.',
  m7: 'Obor di balkon teratas menyala untuk dibagikan kepada sesama pejalan. Menjelaskan kembali membuat bagian yang samar terlihat terang.',
};

function formatIndonesianDate(isoString: string | null): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export const TowerPage: React.FC = () => {
  const playerName = useGameStore((s) => s.playerName);
  const avatarId = useGameStore((s) => s.avatarId);
  const xp = useGameStore((s) => s.xp);
  const completedRooms = useGameStore((s) => s.completedRooms);
  const defeatedBosses = useGameStore((s) => s.defeatedBosses);
  const relics = useGameStore((s) => s.relics);
  const towerSteps = useGameStore((s) => s.towerSteps);
  const towerCompleted = useGameStore((s) => s.towerCompleted);
  const reflections = useGameStore((s) => s.reflections);
  const specialization = useGameStore((s) => s.specialization);
  const certificateIssuedAt = useGameStore((s) => s.certificateIssuedAt);
  const evidenceNotes = useGameStore((s) => s.evidenceNotes);
  const reduceMotion = useGameStore((s) => s.reduceMotion);

  const toggleTowerStep = useGameStore((s) => s.toggleTowerStep);
  const setSpecialization = useGameStore((s) => s.setSpecialization);
  const completeTowerQuest = useGameStore((s) => s.completeTowerQuest);
  const setEvidenceNote = useGameStore((s) => s.setEvidenceNote);
  const setReflectionAnswer = useGameStore((s) => s.setReflectionAnswer);
  const issueCertificate = useGameStore((s) => s.issueCertificate);
  const selectFloor = useGameStore((s) => s.selectFloor);

  const { playClick, playVictory, playSpellCast } = useSound();

  const towerUnlocked = isFloorUnlocked(6, defeatedBosses);
  const summitUnlocked = canUnlockCerminPuncak(towerCompleted);
  const allReflectionsDone = areAllReflectionsAnswered(reflections);

  // Active selection in the vertical climb: 'm1'..'m7' or 'summit'
  const [activeLandingId, setActiveLandingId] = useState<string>('m1');
  const [climbDirection, setClimbDirection] = useState<1 | -1>(1);

  // Celebratory "RELIK DITEMUKAN!" banner state when a quest is marked complete
  const [relicBanner, setRelicBanner] = useState<{
    questId: string;
    questTitle: string;
    relicName: string;
    xpGained: number;
  } | null>(null);

  // Summit Cermin Puncak state
  const [activePromptIndex, setActivePromptIndex] = useState<number>(0);
  const [ceremonyPlaying, setCeremonyPlaying] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const copyFallbackRef = useRef<HTMLTextAreaElement | null>(null);

  // Automatically issue certificate if all 7 quests and all 5 reflections are already complete on load
  useEffect(() => {
    if (summitUnlocked && allReflectionsDone && !certificateIssuedAt) {
      issueCertificate();
    }
  }, [summitUnlocked, allReflectionsDone, certificateIssuedAt, issueCertificate]);

  const landingOrder = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'summit'];
  const currentLandingIndex = Math.max(0, landingOrder.indexOf(activeLandingId));

  // Subtle vertical starlight parallax shift as you climb from Landing 1 (bottom) to Summit (top)
  const parallaxY = reduceMotion ? 0 : currentLandingIndex * 22;

  const handleSelectLanding = (targetId: string) => {
    playClick();
    const prevIdx = landingOrder.indexOf(activeLandingId);
    const nextIdx = landingOrder.indexOf(targetId);
    setClimbDirection(nextIdx >= prevIdx ? 1 : -1);
    setActiveLandingId(targetId);
  };

  const activeQuest = FLOOR6_CONTENT.quests.find((q) => q.id === activeLandingId);
  const levelInfo = getLevelProgress(xp);
  const totalRelicsAvailable = ALL_RELICS.length + TOWER_RELICS.length;

  const handleCompleteQuest = (questId: string) => {
    const res = completeTowerQuest(questId);
    if (res.xpGained > 0 && res.relicName) {
      playVictory();
      const q = FLOOR6_CONTENT.quests.find((item) => item.id === questId);
      setRelicBanner({
        questId,
        questTitle: q?.title || questId,
        relicName: res.relicName,
        xpGained: res.xpGained,
      });
    }
  };

  const prompts = FLOOR6_CONTENT.guardian.reflectionPrompts;
  const currentPrompt = prompts[activePromptIndex] || prompts[0];
  const currentReflectionText = reflections[currentPrompt.id] || '';
  const canProceedPrompt = currentReflectionText.trim().length > 0;

  const guardianSpriteState: CerminPuncakState =
    ceremonyPlaying || Boolean(certificateIssuedAt)
      ? 'shattered-into-light'
      : currentReflectionText.trim().length > 0
      ? 'speaking'
      : 'idle';

  const handleFinishReflections = () => {
    if (!areAllReflectionsAnswered(reflections)) return;
    playSpellCast();
    setCeremonyPlaying(true);
    issueCertificate();
    playVictory();
  };

  const handleCopySummary = async () => {
    playClick();
    const summaryText = formatCertificateSummaryText({
      playerName,
      level: levelInfo.level,
      levelTitle: levelInfo.title,
      roomsDefeated: completedRooms.length,
      totalRooms: ALL_TOPICS.length,
      bossesDefeated: defeatedBosses.length,
      totalBosses: 5,
      relicsCount: relics.length,
      totalRelics: totalRelicsAvailable,
      towerQuestsCompleted: towerCompleted.length,
      totalTowerQuests: FLOOR6_CONTENT.quests.length,
      specialization,
      issuedDateFormatted: formatIndonesianDate(
        certificateIssuedAt || new Date().toISOString()
      ),
    });

    let copied = false;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(summaryText);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied) {
      try {
        const ta = copyFallbackRef.current;
        if (ta) {
          ta.value = summaryText;
          ta.style.display = 'block';
          ta.focus();
          ta.select();
          document.execCommand('copy');
          ta.style.display = 'none';
          copied = true;
        }
      } catch {
        copied = false;
      }
    }

    setCopyFeedback(
      copied
        ? 'Ringkasan piagam berhasil disalin ke papan klip!'
        : 'Gagal menyalin otomatis. Silakan salin manual.'
    );
    window.setTimeout(() => {
      setCopyFeedback(null);
    }, 3500);
  };

  const handlePrintCertificate = () => {
    playClick();
    window.print();
  };

  return (
    <div
      className="w-full max-w-6xl mx-auto px-3 pb-16 space-y-6 tower-night-sky rounded-none p-3 sm:p-5 border-2 border-[#f5b935]"
      style={{
        backgroundPosition: `0px ${parallaxY}px, 0px ${parallaxY}px, 0px ${parallaxY}px, 0px ${parallaxY}px, 0px ${parallaxY}px, 0px ${parallaxY}px, 0px ${parallaxY}px, 0px ${parallaxY}px, 0px 0px`,
      }}
    >
      {/* Hidden textarea fallback for clipboard copy */}
      <textarea
        ref={copyFallbackRef}
        readOnly
        aria-hidden="true"
        tabIndex={-1}
        style={{ position: 'fixed', left: '-9999px', top: '0', display: 'none' }}
      />

      {/* Celebratory "RELIK DITEMUKAN!" Banner (Variant of "MANTRA DIPELAJARI!") */}
      <AnimatePresence>
        {relicBanner && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: -12 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-live="polite"
            className="pixel-box-gold p-4 sm:p-5 border-2 border-[#f5b935] bg-[#16101f] no-print"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#0d0a1a] border-2 border-[#f5b935] flex items-center justify-center shrink-0">
                  <RelicSprite iconType={`tower-${relicBanner.questId}`} size={48} />
                </div>
                <div>
                  <div className="inline-block px-2 py-0.5 bg-[#f5b935] text-[#0d0a1a] font-pixel text-[10px] mb-1">
                    ★ RELIK DITEMUKAN! ★
                  </div>
                  <h2 className="font-pixel text-xs sm:text-sm text-[#f4f1ea]">
                    {relicBanner.relicName} — {relicBanner.questTitle}
                  </h2>
                  <p className="font-vt text-xl text-[#38d864] mt-0.5">
                    +{relicBanner.xpGained} XP diraih! Artefak disimpan ke Inventori Relik Menara Master.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setRelicBanner(null);
                }}
                className="pixel-btn px-3.5 py-2 bg-[#f5b935] text-[#0d0a1a] font-pixel text-[10px] shrink-0"
              >
                LANJUT MENDAKI ✓
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tower Header & Honest Intro Banner */}
      <section aria-label="Header Menara Master" className="pixel-box-gold p-4 sm:p-6 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-[#0d0a1a] border-2 border-[#f5b935] flex items-center justify-center shrink-0">
              <CerminPuncakSprite state={summitUnlocked ? 'speaking' : 'idle'} size={52} />
            </div>
            <div>
              <div className="inline-block px-2 py-0.5 bg-[#0d0a1a] border border-[#f5b935] font-pixel text-[9px] text-[#f5b935] mb-1">
                LANTAI 6 — ENDGAME · AKSEN EMAS (#F5B935)
              </div>
              <h1 className="font-pixel text-sm sm:text-lg text-[#f4f1ea]">
                Menara Master: Jalan Menuju Master
              </h1>
              <p className="font-vt text-xl text-[#f5b935] mt-1">
                7 Tantangan Panjang (+150 XP / Quest) &amp; Penjaga Akhir: {FLOOR6_CONTENT.guardian.name}
              </p>
            </div>
          </div>

          <div className="bg-[#0d0a1a] border-2 border-[#f5b935] px-4 py-3 text-right shrink-0">
            <div className="font-pixel text-[10px] text-[#b3aad1]">PROGRES MENARA</div>
            <div className="font-pixel text-base text-[#f5b935] mt-1 tabular-nums">
              {towerCompleted.length}/{FLOOR6_CONTENT.quests.length} QUEST
            </div>
            <div className="font-vt text-lg text-[#38d864] tabular-nums">
              Total Bonus: +{towerCompleted.length * 150} XP
            </div>
          </div>
        </div>

        {/* Honest Reality Check Intro from floor6.content.json */}
        <div className="mt-4 bg-[#0d0a1a] border-l-4 border-[#f5b935] p-3.5">
          <div className="font-pixel text-[10px] text-[#f5b935] mb-1">
            PESAN PENJAGA MENARA:
          </div>
          <p className="font-vt text-xl text-[#f4f1ea] leading-relaxed">
            {FLOOR6_CONTENT.intro}
          </p>
        </div>
      </section>

      {/* LOCKED TOWER VIEW: When fewer than 5 bosses are defeated */}
      {!towerUnlocked ? (
        <div className="space-y-6 no-print">
          <section
            aria-label="Gerbang Menara Master Terkunci"
            className="pixel-box-red p-5 sm:p-6 text-center space-y-4"
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-20 h-20 bg-[#0d0a1a] border-2 border-[#f5b935] flex items-center justify-center">
                <DungeonDoorSprite
                  unlocked={false}
                  completed={false}
                  accentColor="#f5b935"
                  size={56}
                />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0d0a1a] border-2 border-[#f5b935]">
                <PixelLockSprite size={18} />
                <span className="font-pixel text-xs sm:text-sm text-[#f5b935] tabular-nums">
                  Boss dikalahkan: {defeatedBosses.length}/5
                </span>
              </div>
              <h2 className="font-pixel text-xs sm:text-sm text-[#f4f1ea]">
                PINTU MENARA MASTER MASIH TERKUNCI
              </h2>
              <p className="font-vt text-xl text-[#b3aad1] max-w-2xl mx-auto">
                Kalahkan kelima Boss Lantai (Lantai 1 sampai Lantai 5) untuk membuka segel pintu Menara Master. Di bawah ini adalah pratinjau baca-saja dari 7 quest yang menantimu di dalam menara.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2.5 pt-2">
              {FLOORS.map((f) => {
                const done = defeatedBosses.includes(f.boss.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      selectFloor(f.id);
                    }}
                    className={`pixel-btn px-3 py-2 font-pixel text-[9px] ${
                      done
                        ? 'bg-[#132924] text-[#38d864] border-[#38d864]'
                        : 'bg-[#1f193d] text-[#f5b935] border-[#f5b935]'
                    }`}
                  >
                    Lantai {f.floorNumber}: {f.boss.name} {done ? '✓' : '🔒'}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Read-only preview of the 7 quests (titles and summaries only, NO checkboxes) */}
          <section
            aria-label="Pratinjau Baca-Saja 7 Quest Menara Master"
            className="pixel-box p-4 sm:p-6 border-[#f5b935]"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#f5b935] pb-3 mb-4">
              <div>
                <h2 className="font-pixel text-xs sm:text-sm text-[#f5b935]">
                  PRATINJAU 7 QUEST MENARA MASTER (BACA-SAJA)
                </h2>
                <p className="font-vt text-lg text-[#b3aad1]">
                  Daftar cek langkah, pemilihan spesialisasi, dan Cermin Puncak akan terbuka setelah 5/5 Boss dikalahkan.
                </p>
              </div>
              <span className="font-pixel text-[9px] text-[#f5b935] bg-[#0d0a1a] border border-[#f5b935] px-2.5 py-1">
                MODE PRATINJAU
              </span>
            </div>

            <div className="space-y-3">
              {[...FLOOR6_CONTENT.quests].reverse().map((quest) => {
                const landingNumber = Number(quest.id.replace('m', ''));
                return (
                  <div
                    key={quest.id}
                    className="bg-[#0d0a1a] border-2 border-[#5c4e99] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-pixel text-[9px] text-[#f5b935]">
                          LANTAI MENARA {landingNumber} · {quest.id.toUpperCase()}
                        </span>
                        <span className="font-vt text-base text-[#b3aad1]">
                          · Hadiah: +{quest.xp} XP &amp; Relik {quest.relic}
                        </span>
                      </div>
                      <h3 className="font-pixel text-xs sm:text-sm text-[#f4f1ea]">
                        {quest.title}
                      </h3>
                      <p className="font-vt text-xl text-[#b3aad1] mt-1 leading-snug">
                        {quest.summary}
                      </p>
                    </div>
                    <div className="shrink-0 self-start sm:self-center">
                      <span className="font-pixel text-[9px] text-[#64748b] border border-[#3a306e] px-2.5 py-1">
                        TERKUNCI
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        /* UNLOCKED TOWER VIEW: Vertical Climb (7 Landings from bottom to top + Summit Cermin Puncak) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Vertical Tower Climb Map (Summit at top, Landing 7 down to Landing 1 at bottom) */}
          <nav
            aria-label="Pendakian Vertikal Menara Master"
            className="lg:col-span-5 pixel-box p-4 border-[#f5b935] space-y-3 no-print"
          >
            <div className="border-b-2 border-[#f5b935] pb-2.5 mb-2 flex items-center justify-between">
              <div>
                <h2 className="font-pixel text-xs text-[#f5b935]">
                  MENARA VERTIKAL (BEBAS URUTAN)
                </h2>
                <p className="font-vt text-lg text-[#b3aad1]">
                  Daki dari lantai dasar (m1) hingga puncak (m7), kerjakan dalam urutan apa pun.
                </p>
              </div>
              <span className="font-pixel text-[9px] text-[#38d864] tabular-nums">
                {towerCompleted.length}/7
              </span>
            </div>

            {/* Summit Node: Cermin Puncak (Top of the vertical tower) */}
            <button
              type="button"
              onClick={() => handleSelectLanding('summit')}
              className={`w-full text-left p-3.5 border-2 transition-colors flex items-center justify-between gap-3 ${
                activeLandingId === 'summit'
                  ? 'bg-[#241b2f] border-[#f5b935] shadow-[0_0_0_2px_#f5b935]'
                  : summitUnlocked
                  ? 'bg-[#16112b] border-[#38d864] hover:border-[#f5b935]'
                  : 'bg-[#0d0a1a] border-[#3a306e] opacity-75'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 bg-[#0d0a1a] border-2 border-[#f5b935] flex items-center justify-center shrink-0">
                  {summitUnlocked ? (
                    <CerminPuncakSprite
                      state={certificateIssuedAt ? 'shattered-into-light' : 'idle'}
                      size={36}
                    />
                  ) : (
                    <PixelLockSprite size={22} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-pixel text-[9px] text-[#f5b935]">
                    PUNCAK MENARA · PENJAGA AKHIR
                  </div>
                  <div className="font-pixel text-xs text-[#f4f1ea] truncate">
                    {FLOOR6_CONTENT.guardian.name}
                  </div>
                  <div className="font-vt text-base text-[#b3aad1]">
                    {certificateIssuedAt
                      ? 'Piagam Diterbitkan ★'
                      : summitUnlocked
                      ? 'Terbuka! Jawab 5 refleksi jujur'
                      : `Terkunci (${towerCompleted.length}/7 quest selesai)`}
                  </div>
                </div>
              </div>
              <span
                className={`font-pixel text-[8px] px-2 py-1 border shrink-0 ${
                  certificateIssuedAt
                    ? 'bg-[#132924] text-[#38d864] border-[#38d864]'
                    : summitUnlocked
                    ? 'bg-[#0d0a1a] text-[#f5b935] border-[#f5b935]'
                    : 'bg-[#0d0a1a] text-[#64748b] border-[#3a306e]'
                }`}
              >
                {certificateIssuedAt ? 'PIAGAM ✓' : summitUnlocked ? 'TERBUKA' : '7/7 QUEST'}
              </span>
            </button>

            {/* Vertical connector spire */}
            <div className="flex justify-center" aria-hidden="true">
              <div className="w-1 h-3 bg-[#f5b935]" />
            </div>

            {/* 7 Quest Landings rendered from top (m7) to bottom (m1) so visually it is a vertical tower climb from bottom to top */}
            <div className="space-y-2.5">
              {[...FLOOR6_CONTENT.quests].reverse().map((quest, revIdx) => {
                const landingNum = FLOOR6_CONTENT.quests.length - revIdx;
                const progress = getTowerQuestStepProgress(quest.id, towerSteps);
                const status = getTowerQuestStatus(quest.id, towerSteps, towerCompleted);
                const isSelected = activeLandingId === quest.id;

                return (
                  <React.Fragment key={quest.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectLanding(quest.id)}
                      className={`w-full text-left p-3 border-2 transition-colors flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#241b2f] border-[#f5b935] shadow-[0_0_0_2px_#f5b935]'
                          : status === 'Selesai'
                          ? 'bg-[#132924] border-[#38d864] hover:border-[#f5b935]'
                          : status === 'Berjalan'
                          ? 'bg-[#16112b] border-[#3ac5eb] hover:border-[#f5b935]'
                          : 'bg-[#0d0a1a] border-[#5c4e99] hover:border-[#f5b935]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-[#0d0a1a] border-2 border-[#f5b935] flex items-center justify-center shrink-0">
                          <RelicSprite iconType={`tower-${quest.id}`} size={28} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-pixel text-[9px] text-[#f5b935]">
                            LANTAI MENARA {landingNum} · {quest.id.toUpperCase()}
                          </div>
                          <div className="font-pixel text-xs text-[#f4f1ea] leading-snug">
                            {quest.title}
                          </div>
                          <div className="font-vt text-base text-[#b3aad1] tabular-nums">
                            Langkah: {progress.ticked}/{progress.total} · Relik: {quest.relic}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`font-pixel text-[8px] px-2 py-0.5 border ${
                            status === 'Selesai'
                              ? 'bg-[#0a1714] text-[#38d864] border-[#38d864]'
                              : status === 'Berjalan'
                              ? 'bg-[#0d1b2a] text-[#3ac5eb] border-[#3ac5eb]'
                              : 'bg-[#120d26] text-[#b3aad1] border-[#5c4e99]'
                          }`}
                        >
                          {status}
                        </span>
                        <span className="font-pixel text-[9px] text-[#f5b935] tabular-nums">
                          {progress.ticked}/{progress.total}
                        </span>
                      </div>
                    </button>

                    {landingNum > 1 && (
                      <div className="flex justify-center" aria-hidden="true">
                        <div className="w-0.5 h-2 bg-[#5c4e99]" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#3a306e] text-center font-vt text-base text-[#f5b935]">
              ▲ Dasar Menara (Lantai Menara 1 — m1) berada di bawah; daki ke Puncak di atas ▲
            </div>
          </nav>

          {/* Right Column: Active Landing Quest Panel OR Summit Cermin Puncak + Certificate */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {activeLandingId !== 'summit' && activeQuest ? (
                <motion.section
                  key={activeQuest.id}
                  initial={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: climbDirection > 0 ? -24 : 24 }
                  }
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: climbDirection > 0 ? 24 : -24 }
                  }
                  transition={{ duration: reduceMotion ? 0.12 : 0.24 }}
                  aria-label={`Panel Quest ${activeQuest.title}`}
                  className="pixel-box-gold p-4 sm:p-6 space-y-5 no-print"
                >
                  {(() => {
                    const landingNumber = Number(activeQuest.id.replace('m', ''));
                    const progress = getTowerQuestStepProgress(activeQuest.id, towerSteps);
                    const status = getTowerQuestStatus(
                      activeQuest.id,
                      towerSteps,
                      towerCompleted
                    );
                    const isCompleted = status === 'Selesai';
                    const readyToComplete = canCompleteTowerQuest(
                      activeQuest.id,
                      towerSteps,
                      towerCompleted,
                      specialization
                    );
                    const questStepMap = towerSteps[activeQuest.id] || {};
                    const noteValue = evidenceNotes[activeQuest.id] || '';

                    return (
                      <>
                        {/* Quest Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b-2 border-[#f5b935] pb-4">
                          <div className="flex items-start gap-3.5">
                            <div className="w-14 h-14 bg-[#0d0a1a] border-2 border-[#f5b935] flex items-center justify-center shrink-0">
                              <RelicSprite iconType={`tower-${activeQuest.id}`} size={42} />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="font-pixel text-[9px] text-[#f5b935]">
                                  LANTAI MENARA {landingNumber} ({activeQuest.id.toUpperCase()})
                                </span>
                                <span
                                  className={`font-pixel text-[8px] px-2 py-0.5 border ${
                                    status === 'Selesai'
                                      ? 'bg-[#132924] text-[#38d864] border-[#38d864]'
                                      : status === 'Berjalan'
                                      ? 'bg-[#0d1b2a] text-[#3ac5eb] border-[#3ac5eb]'
                                      : 'bg-[#0d0a1a] text-[#b3aad1] border-[#5c4e99]'
                                  }`}
                                >
                                  Status: {status} ({progress.ticked}/{progress.total})
                                </span>
                              </div>
                              <h2 className="font-pixel text-sm sm:text-base text-[#f4f1ea]">
                                {activeQuest.title}
                              </h2>
                              <div className="font-vt text-lg text-[#38d864] mt-0.5">
                                Hadiah Selesai: +{activeQuest.xp} XP · Relik: {activeQuest.relic}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Short Flavor Line for this Landing */}
                        <div className="bg-[#0d0a1a] border-l-4 border-[#f5b935] px-3.5 py-2.5">
                          <p className="font-vt text-lg text-[#f5b935] italic">
                            “{LANDING_FLAVOR_LINES[activeQuest.id]}”
                          </p>
                        </div>

                        {/* Quest Summary */}
                        <div className="bg-[#120d26] border-2 border-[#5c4e99] p-3.5">
                          <div className="font-pixel text-[9px] text-[#f5b935] mb-1">
                            RINGKASAN QUEST:
                          </div>
                          <p className="font-vt text-xl text-[#f4f1ea] leading-relaxed">
                            {activeQuest.summary}
                          </p>
                        </div>

                        {/* Specialization Picker (ONLY in Quest m6) */}
                        {activeQuest.id === 'm6' && (
                          <div className="bg-[#0d0a1a] border-2 border-[#f5b935] p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <label
                                htmlFor="tower-specialization-select"
                                className="font-pixel text-[10px] text-[#f5b935]"
                              >
                                PILIH SPESIALISASI UTAMA:
                              </label>
                              {specialization && (
                                <span className="font-pixel text-[8px] px-2 py-0.5 bg-[#132924] text-[#38d864] border border-[#38d864]">
                                  Tersimpan: {specialization}
                                </span>
                              )}
                            </div>

                            <p className="font-vt text-lg text-[#3ac5eb]">
                              {FLOOR6_CONTENT.specializationNote}
                            </p>

                            <select
                              id="tower-specialization-select"
                              value={specialization || ''}
                              onChange={(e) => {
                                playClick();
                                setSpecialization(e.target.value || null);
                              }}
                              className="w-full bg-[#16112b] border-2 border-[#f5b935] px-3 py-2.5 font-vt text-xl text-[#f4f1ea] focus:outline-none"
                            >
                              <option value="">-- Pilih satu spesialisasi --</option>
                              {FLOOR6_CONTENT.specializations.map((spec) => (
                                <option key={spec} value={spec}>
                                  {spec}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Checklist of Suggested Steps */}
                        <div className="space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <h3 className="font-pixel text-[10px] text-[#f5b935]">
                              DAFTAR LANGKAH ({progress.ticked}/{progress.total})
                            </h3>
                            {FLOOR6_CONTENT.stepsAreSuggestions && (
                              <span className="font-vt text-base text-[#b3aad1]">
                                Catatan: Langkah-langkah ini adalah saran praktis dari peta belajar.
                              </span>
                            )}
                          </div>

                          <div className="space-y-2">
                            {activeQuest.steps.map((step, sIdx) => {
                              const checked = Boolean(questStepMap[step.id]);
                              const stepAllowed = canTickTowerStep(
                                activeQuest.id,
                                step.id,
                                specialization
                              );
                              const disabled = isCompleted || (!checked && !stepAllowed);

                              return (
                                <label
                                  key={step.id}
                                  className={`flex items-start gap-3 p-3 border-2 transition-colors ${
                                    checked
                                      ? 'bg-[#132924] border-[#38d864]'
                                      : disabled
                                      ? 'bg-[#0d0a1a] border-[#3a306e] opacity-65 cursor-not-allowed'
                                      : 'bg-[#0d0a1a] border-[#5c4e99] hover:border-[#f5b935] cursor-pointer'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={() => {
                                      if (disabled) return;
                                      playClick();
                                      toggleTowerStep(activeQuest.id, step.id);
                                    }}
                                    className="mt-1 w-5 h-5 accent-[#38d864] shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-vt text-xl text-[#f4f1ea] leading-snug">
                                      <span className="font-pixel text-[9px] text-[#f5b935] mr-2">
                                        {sIdx + 1}.
                                      </span>
                                      {step.text}
                                    </div>
                                    {activeQuest.id === 'm6' &&
                                      step.id === 'm6s3' &&
                                      !stepAllowed && (
                                        <div className="font-vt text-base text-[#f5b935] mt-1">
                                          ⚠ Pilih satu spesialisasi pada dropdown di atas terlebih dahulu untuk mencentang langkah ini.
                                        </div>
                                      )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* References */}
                        <div className="bg-[#0d0a1a] border-2 border-[#5c4e99] p-3.5 space-y-2">
                          <div className="font-pixel text-[9px] text-[#3ac5eb]">
                            REFERENSI &amp; RUJUKAN:
                          </div>
                          <ul className="space-y-1.5 font-vt text-lg">
                            {activeQuest.references.map((ref, rIdx) => (
                              <li key={rIdx} className="flex items-start gap-2 text-[#f4f1ea]">
                                <span className="text-[#f5b935]">•</span>
                                {ref.url ? (
                                  <a
                                    href={ref.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#3ac5eb] underline hover:text-[#f5b935] break-words"
                                  >
                                    {ref.label} ↗
                                  </a>
                                ) : (
                                  <span className="text-[#b3aad1] break-words">{ref.label}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Optional "Catatan bukti" Single-Line Input (max 300 chars, plain text) */}
                        <div className="bg-[#120d26] border-2 border-[#f5b935] p-3.5 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <label
                              htmlFor={`evidence-note-${activeQuest.id}`}
                              className="font-pixel text-[9px] text-[#f5b935]"
                            >
                              CATATAN BUKTI (OPSIONAL):
                            </label>
                            <span className="font-vt text-base text-[#b3aad1] tabular-nums">
                              {noteValue.length}/300 karakter
                            </span>
                          </div>
                          <p className="font-vt text-base text-[#b3aad1]">
                            Saran bukti: {activeQuest.evidenceHint}
                          </p>
                          <input
                            id={`evidence-note-${activeQuest.id}`}
                            type="text"
                            maxLength={300}
                            value={noteValue}
                            onChange={(e) => setEvidenceNote(activeQuest.id, e.target.value)}
                            placeholder={activeQuest.evidenceHint}
                            className="w-full bg-[#0d0a1a] border-2 border-[#5c4e99] focus:border-[#f5b935] px-3 py-2 font-vt text-xl text-[#f4f1ea] focus:outline-none"
                          />
                          <div className="font-vt text-base text-[#b3aad1]">
                            Catatan ini hanya tersimpan di browser ini.
                          </div>
                        </div>

                        {/* "Tandai selesai" Action Footer */}
                        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          {isCompleted ? (
                            <div className="w-full space-y-3">
                              {relicBanner && relicBanner.questId === activeQuest.id && (
                                <motion.div
                                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="pixel-box-gold p-4 border-2 border-[#f5b935] bg-[#16101f] flex flex-col sm:flex-row items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-[#0d0a1a] border-2 border-[#f5b935] flex items-center justify-center shrink-0">
                                      <RelicSprite iconType={`tower-${activeQuest.id}`} size={36} />
                                    </div>
                                    <div>
                                      <div className="inline-block px-2 py-0.5 bg-[#f5b935] text-[#0d0a1a] font-pixel text-[9px] mb-1">
                                        ★ RELIK DITEMUKAN! ★
                                      </div>
                                      <div className="font-pixel text-xs text-[#f4f1ea]">
                                        {relicBanner.relicName} (+{relicBanner.xpGained} XP)
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                              <div className="w-full bg-[#132924] border-2 border-[#38d864] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="font-pixel text-[10px] text-[#38d864]">
                                  ✓ QUEST MENARA SELESAI (+{activeQuest.xp} XP · Relik{' '}
                                  {activeQuest.relic} Diraih)
                                </div>
                                {summitUnlocked && (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectLanding('summit')}
                                    className="pixel-btn px-3 py-1.5 bg-[#f5b935] text-[#0d0a1a] font-pixel text-[9px]"
                                  >
                                    MENUJU CERMIN PUNCAK →
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="font-vt text-lg text-[#b3aad1]">
                                {readyToComplete
                                  ? 'Semua langkah telah dicentang! Kamu siap menandai quest ini selesai.'
                                  : `Centang seluruh langkah (${progress.ticked}/${progress.total}) untuk mengaktifkan tombol selesai.`}
                              </div>
                              <button
                                type="button"
                                disabled={!readyToComplete}
                                onClick={() => handleCompleteQuest(activeQuest.id)}
                                className="pixel-btn px-5 py-3 bg-[#38d864] text-[#0d0a1a] font-pixel text-xs shrink-0"
                              >
                                Tandai selesai (+{activeQuest.xp} XP)
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </motion.section>
              ) : (
                /* SUMMIT PANEL: Final Guardian "Cermin Puncak" & Certificate ("Piagam") */
                <motion.section
                  key="summit-cermin-puncak"
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  aria-label="Puncak Menara: Cermin Puncak dan Piagam"
                  className="space-y-6"
                >
                  {!summitUnlocked ? (
                    <div className="pixel-box p-6 text-center space-y-4 border-[#f5b935] no-print">
                      <div className="w-20 h-20 mx-auto bg-[#0d0a1a] border-2 border-[#f5b935] flex items-center justify-center">
                        <PixelLockSprite size={36} />
                      </div>
                      <h2 className="font-pixel text-sm text-[#f5b935]">
                        PUNCAK MENARA BELUM TERBUKA ({towerCompleted.length}/7 QUEST)
                      </h2>
                      <p className="font-vt text-xl text-[#b3aad1] max-w-xl mx-auto">
                        Selesaikan ketujuh Quest Menara Master (m1 sampai m7) untuk menghadap penjaga terakhir:{' '}
                        <strong className="text-[#f4f1ea]">{FLOOR6_CONTENT.guardian.name}</strong>.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Guardian Cermin Puncak Reflection Dialogue Box */}
                      <div className="pixel-box-gold p-4 sm:p-6 space-y-5 no-print">
                        <div className="flex flex-col sm:flex-row items-center gap-4 border-b-2 border-[#f5b935] pb-4">
                          <div className="w-24 h-24 bg-[#0d0a1a] border-2 border-[#f5b935] flex items-center justify-center shrink-0">
                            <CerminPuncakSprite state={guardianSpriteState} size={84} />
                          </div>
                          <div>
                            <div className="inline-block px-2 py-0.5 bg-[#f5b935] text-[#0d0a1a] font-pixel text-[9px] mb-1">
                              PENJAGA PUNCAK MENARA
                            </div>
                            <h2 className="font-pixel text-sm sm:text-base text-[#f4f1ea]">
                              {FLOOR6_CONTENT.guardian.name}
                            </h2>
                            <p className="font-vt text-xl text-[#f5b935] mt-1 leading-snug">
                              “{FLOOR6_CONTENT.guardian.intro}”
                            </p>
                          </div>
                        </div>

                        {/* 5 Reflection Prompts Step-by-Step */}
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-pixel text-[10px] text-[#3ac5eb]">
                              PERTANYAAN REFLEKSI {activePromptIndex + 1} DARI {prompts.length} (
                              {currentPrompt.id.toUpperCase()})
                            </span>
                            <div className="flex items-center gap-1.5">
                              {prompts.map((p, idx) => {
                                const answered = Boolean(reflections[p.id]?.trim());
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      playClick();
                                      setActivePromptIndex(idx);
                                    }}
                                    className={`font-pixel text-[9px] px-2 py-1 border ${
                                      idx === activePromptIndex
                                        ? 'bg-[#f5b935] text-[#0d0a1a] border-[#f4f1ea]'
                                        : answered
                                        ? 'bg-[#132924] text-[#38d864] border-[#38d864]'
                                        : 'bg-[#0d0a1a] text-[#b3aad1] border-[#5c4e99]'
                                    }`}
                                  >
                                    {idx + 1}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="bg-[#0d0a1a] border-2 border-[#f5b935] p-4 space-y-3">
                            <label
                              htmlFor={`reflection-textarea-${currentPrompt.id}`}
                              className="block font-vt text-2xl text-[#f4f1ea] leading-snug"
                            >
                              {currentPrompt.text}
                            </label>

                            <textarea
                              id={`reflection-textarea-${currentPrompt.id}`}
                              rows={4}
                              maxLength={500}
                              value={currentReflectionText}
                              onChange={(e) =>
                                setReflectionAnswer(currentPrompt.id, e.target.value)
                              }
                              placeholder="Tulis refleksi jujurmu di sini (maksimal 500 karakter, teks biasa)..."
                              className="w-full bg-[#16112b] border-2 border-[#5c4e99] focus:border-[#f5b935] p-3 font-vt text-xl text-[#f4f1ea] focus:outline-none"
                            />

                            <div className="flex items-center justify-between font-vt text-base text-[#b3aad1]">
                              <span>Tersimpan otomatis di perangkatmu (teks biasa).</span>
                              <span className="tabular-nums">
                                {currentReflectionText.length}/500 karakter
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <button
                              type="button"
                              disabled={activePromptIndex === 0}
                              onClick={() => {
                                playClick();
                                setActivePromptIndex((i) => Math.max(0, i - 1));
                              }}
                              className="pixel-btn px-3.5 py-2 bg-[#1f193d] text-[#f4f1ea] font-pixel text-[10px]"
                            >
                              ← SEBELUMNYA
                            </button>

                            {activePromptIndex < prompts.length - 1 ? (
                              <button
                                type="button"
                                disabled={!canProceedPrompt}
                                onClick={() => {
                                  if (!canProceedPrompt) return;
                                  playClick();
                                  setActivePromptIndex((i) => Math.min(prompts.length - 1, i + 1));
                                }}
                                className="pixel-btn px-4 py-2.5 bg-[#f5b935] text-[#0d0a1a] font-pixel text-[10px]"
                              >
                                PERTANYAAN BERIKUTNYA →
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={!allReflectionsDone}
                                onClick={handleFinishReflections}
                                className="pixel-btn px-5 py-2.5 bg-[#38d864] text-[#0d0a1a] font-pixel text-[10px]"
                              >
                                {certificateIssuedAt
                                  ? 'LIHAT PIAGAM DI BAWAH ↓'
                                  : 'SELESAIKAN REFLEKSI & TERBITKAN PIAGAM ★'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* CERTIFICATE ("Piagam Penyelesai Peta Belajar") */}
                      {(certificateIssuedAt || allReflectionsDone) && (
                        <div
                          id="tower-certificate-print-area"
                          aria-label={FLOOR6_CONTENT.certificate.title}
                          className="pixel-box-gold p-5 sm:p-8 border-4 border-[#f5b935] bg-[#16112b] space-y-6"
                        >
                          <div className="text-center border-b-2 border-[#f5b935] pb-5 space-y-2">
                            <div className="font-pixel text-[10px] text-[#f5b935] tracking-wider">
                              ★ DUNGEON BELAJAR ML &amp; DL · MENARA MASTER ★
                            </div>
                            <h2 className="font-pixel text-base sm:text-xl text-[#f4f1ea]">
                              {FLOOR6_CONTENT.certificate.title}
                            </h2>
                            <div className="font-vt text-lg text-[#b3aad1]">
                              Diterbitkan pada:{' '}
                              {formatIndonesianDate(
                                certificateIssuedAt || new Date().toISOString()
                              )}
                            </div>
                          </div>

                          {/* Adventurer Identity & Avatar */}
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0d0a1a] border-2 border-[#f5b935] p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-[#16112b] border-2 border-[#f5b935] flex items-center justify-center shrink-0">
                                <AvatarSprite avatarId={avatarId} size={52} />
                              </div>
                              <div>
                                <div className="font-pixel text-sm text-[#f4f1ea]">
                                  {playerName}
                                </div>
                                <div className="font-vt text-2xl text-[#38d864]">
                                  Level {levelInfo.level} — Gelar: {levelInfo.title}
                                </div>
                                <div className="font-vt text-xl text-[#f5b935]">
                                  Spesialisasi Pilihan:{' '}
                                  <strong className="text-[#f4f1ea]">
                                    {specialization || 'Belum dipilih'}
                                  </strong>
                                </div>
                              </div>
                            </div>

                            <div className="w-16 h-16 bg-[#16112b] border-2 border-[#f5b935] flex items-center justify-center shrink-0">
                              <CerminPuncakSprite state="shattered-into-light" size={52} />
                            </div>
                          </div>

                          {/* Completion Statistics Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-[#0d0a1a] border-2 border-[#5c4e99] p-3 text-center">
                              <div className="font-pixel text-[8px] text-[#b3aad1]">
                                RUANG/QUEST DIKALAHKAN
                              </div>
                              <div className="font-pixel text-sm text-[#38d864] mt-1 tabular-nums">
                                {completedRooms.length}/{ALL_TOPICS.length}
                              </div>
                            </div>
                            <div className="bg-[#0d0a1a] border-2 border-[#5c4e99] p-3 text-center">
                              <div className="font-pixel text-[8px] text-[#b3aad1]">
                                BOSS DIKALAHKAN
                              </div>
                              <div className="font-pixel text-sm text-[#e83b47] mt-1 tabular-nums">
                                {defeatedBosses.length}/5
                              </div>
                            </div>
                            <div className="bg-[#0d0a1a] border-2 border-[#5c4e99] p-3 text-center">
                              <div className="font-pixel text-[8px] text-[#b3aad1]">
                                JUMLAH RELIK
                              </div>
                              <div className="font-pixel text-sm text-[#3ac5eb] mt-1 tabular-nums">
                                {relics.length}/{totalRelicsAvailable}
                              </div>
                            </div>
                            <div className="bg-[#0d0a1a] border-2 border-[#5c4e99] p-3 text-center">
                              <div className="font-pixel text-[8px] text-[#b3aad1]">
                                QUEST MENARA SELESAI
                              </div>
                              <div className="font-pixel text-sm text-[#f5b935] mt-1 tabular-nums">
                                {towerCompleted.length}/{FLOOR6_CONTENT.quests.length}
                              </div>
                            </div>
                          </div>

                          {/* Honest Note & Closing from floor6.content.json */}
                          <div className="bg-[#0d0a1a] border-2 border-[#f5b935] p-4 space-y-2 text-center">
                            <p className="font-vt text-xl text-[#f4f1ea] leading-relaxed">
                              {FLOOR6_CONTENT.certificate.honestNote}
                            </p>
                            <p className="font-pixel text-xs text-[#f5b935] pt-1">
                              {FLOOR6_CONTENT.certificate.closing}
                            </p>
                          </div>

                          {/* Plain-text Reflections Summary inside Certificate */}
                          <div className="bg-[#0d0a1a] border border-[#5c4e99] p-4 space-y-2.5">
                            <div className="font-pixel text-[9px] text-[#f5b935]">
                              PANTULAN CERMIN PUNCAK (5 REFLEKSI):
                            </div>
                            {prompts.map((p, idx) => (
                              <div key={p.id} className="border-b border-[#2b2352] pb-2 last:border-b-0">
                                <div className="font-vt text-base text-[#b3aad1]">
                                  {idx + 1}. {p.text}
                                </div>
                                <div className="font-vt text-lg text-[#f4f1ea] break-words mt-0.5">
                                  {reflections[p.id] || '-'}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Action Buttons (Hidden in @media print) */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 no-print">
                            <div className="font-vt text-lg text-[#38d864]">
                              {copyFeedback || 'Salin ringkasan teks atau cetak piagam ini.'}
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                onClick={handleCopySummary}
                                className="pixel-btn px-4 py-2.5 bg-[#3ac5eb] text-[#0d0a1a] font-pixel text-[10px]"
                              >
                                Salin ringkasan
                              </button>
                              <button
                                type="button"
                                onClick={handlePrintCertificate}
                                className="pixel-btn px-4 py-2.5 bg-[#f5b935] text-[#0d0a1a] font-pixel text-[10px]"
                              >
                                Cetak
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
