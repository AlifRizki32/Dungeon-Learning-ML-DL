import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FLOORS } from '../data/roadmap.js';
import { useGameStore } from '../store/useGameStore';
import { getLocalDateKey } from '../game/campTracker';
import {
  DOJO_CORRECT_XP,
  DOJO_DAILY_XP_CAP,
  EnrichedSpell,
  PreparedBattleQuestion,
  SPELL_VISUALS,
  ShuffledOption,
  buildDojoQuestionSet,
  calculateQuestionWeight,
  getAllSpells,
  getSpellsByFloor,
} from '../game/spellbookEngine';
import { PixelLockSprite, PixelSwordSprite } from '../components/PixelSprites';
import { useSound } from '../hooks/useSound.js';

export const GrimoirePage: React.FC = () => {
  const spellsUnlocked = useGameStore((s) => s.spellsUnlocked);
  const completedRooms = useGameStore((s) => s.completedRooms);
  const questionStats = useGameStore((s) => s.questionStats);
  const dojoDailyXP = useGameStore((s) => s.dojoDailyXP);
  const reduceMotion = useGameStore((s) => s.reduceMotion);
  const openScrollViewer = useGameStore((s) => s.openScrollViewer);
  const awardDojoAnswerXP = useGameStore((s) => s.awardDojoAnswerXP);
  const setView = useGameStore((s) => s.setView);

  const { playClick, playCast, playFizzle } = useSound();

  const [activeTab, setActiveTab] = useState<'grimoire' | 'dojo'>('grimoire');
  const [equippedSpellId, setEquippedSpellId] = useState<string | null>(null);

  // Dojo Latihan State
  const [dojoDeck, setDojoDeck] = useState<(PreparedBattleQuestion & { weight: number })[]>([]);
  const [dojoIndex, setDojoIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [dojoSessionCorrect, setDojoSessionCorrect] = useState(0);
  const [dojoSessionXPEarned, setDojoSessionXPEarned] = useState(0);
  const [dojoFinished, setDojoFinished] = useState(false);
  const [lastAnswerFeedback, setLastAnswerFeedback] = useState<{
    isCorrect: boolean;
    xpAwarded: number;
    oldWeight: number;
    newWeight: number;
  } | null>(null);

  const floor1Spells = useMemo(() => getSpellsByFloor(1), []);
  const floor2Spells = useMemo(() => getSpellsByFloor(2), []);
  const floor3Spells = useMemo(() => getSpellsByFloor(3), []);
  const floor4Spells = useMemo(() => getSpellsByFloor(4), []);
  const floor5Spells = useMemo(() => getSpellsByFloor(5), []);
  const allSpells = useMemo(() => getAllSpells(), []);

  const todayKey = getLocalDateKey();
  const todayDojoXP = dojoDailyXP.date === todayKey ? dojoDailyXP.xp : 0;

  const defeatedSpellbookTopicsCount = useMemo(
    () =>
      allSpells.filter((s) => completedRooms.includes(s.roadmapTopicId)).length,
    [allSpells, completedRooms]
  );

  const startDojoSession = () => {
    playClick();
    const deck = buildDojoQuestionSet(completedRooms, questionStats, 8);
    setDojoDeck(deck);
    setDojoIndex(0);
    setSelectedOptionId(null);
    setDojoSessionCorrect(0);
    setDojoSessionXPEarned(0);
    setDojoFinished(false);
    setLastAnswerFeedback(null);
    setActiveTab('dojo');
  };

  const currentDojoQ = dojoDeck[dojoIndex];

  const handleSelectDojoOption = (opt: ShuffledOption) => {
    if (selectedOptionId !== null || !currentDojoQ) return;
    setSelectedOptionId(opt.optionId);

    const oldWeight = calculateQuestionWeight(questionStats[currentDojoQ.id]);
    const res = awardDojoAnswerXP(currentDojoQ.id, opt.isCorrect);

    if (opt.isCorrect) {
      playCast();
      setDojoSessionCorrect((c) => c + 1);
      setDojoSessionXPEarned((x) => x + res.xpAwarded);
    } else {
      playFizzle();
    }

    setLastAnswerFeedback({
      isCorrect: opt.isCorrect,
      xpAwarded: res.xpAwarded,
      oldWeight,
      newWeight: res.newWeight,
    });
  };

  const handleNextDojoQuestion = () => {
    playClick();
    if (dojoIndex + 1 < dojoDeck.length) {
      setDojoIndex((idx) => idx + 1);
      setSelectedOptionId(null);
      setLastAnswerFeedback(null);
    } else {
      setDojoFinished(true);
      setSelectedOptionId(null);
    }
  };

  const renderSpellGroup = (
    floorId: 1 | 2 | 3 | 4 | 5,
    groupTitle: string,
    groupSubtitle: string,
    accentColor: string,
    spells: EnrichedSpell[]
  ) => {
    const floorObj = FLOORS.find((f) => f.id === floorId);
    const unlockedInGroup = spells.filter(
      (s) => spellsUnlocked.includes(s.id) || completedRooms.includes(s.roadmapTopicId)
    ).length;

    return (
      <div
        key={floorId}
        className="pixel-box p-4 sm:p-5 space-y-4"
        style={{ borderColor: accentColor }}
      >
        <div
          className="flex flex-wrap items-center justify-between gap-2 border-b-2 pb-3"
          style={{ borderColor: accentColor }}
        >
          <div>
            <div className="font-pixel text-[10px]" style={{ color: accentColor }}>
              KELOMPOK MANTRA LANTAI {floorId}
            </div>
            <h2 className="font-pixel text-xs sm:text-sm text-[#f4f1ea] mt-1">
              {groupTitle}
            </h2>
            <p className="font-vt text-lg text-[#b3aad1]">{groupSubtitle}</p>
          </div>
          <span
            className="font-pixel text-[10px] px-2.5 py-1 bg-[#0d0a1a] border"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            TERBUKA: {unlockedInGroup}/{spells.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spells.map((spell) => {
            const isUnlocked =
              spellsUnlocked.includes(spell.id) ||
              completedRooms.includes(spell.roadmapTopicId);
            const visual = SPELL_VISUALS[spell.id] || SPELL_VISUALS.s1;
            const topicMeta = floorObj?.topics.find((t) => t.id === spell.roadmapTopicId);
            const isEquipped = equippedSpellId === spell.id;

            return (
              <motion.article
                key={spell.id}
                animate={
                  isEquipped && !reduceMotion
                    ? { rotateY: [0, 180, 360], scale: [1, 1.03, 1] }
                    : { rotateY: 0, scale: 1 }
                }
                transition={{ duration: reduceMotion ? 0.1 : 0.45 }}
                style={{
                  borderColor: isUnlocked ? visual.color : '#3a306e',
                }}
                className={`border-4 p-4 flex flex-col justify-between bg-[#120d26] ${
                  isUnlocked ? 'shadow-[0_4px_0_0_#070510]' : 'opacity-80'
                }`}
              >
                {isUnlocked ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className="font-pixel text-[9px] px-2 py-0.5 bg-[#0d0a1a] border"
                          style={{ borderColor: visual.color, color: visual.color }}
                        >
                          L{floorId} · MANTRA #{spell.topicId} ({spell.id.toUpperCase()})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            playCast();
                            setEquippedSpellId(spell.id);
                          }}
                          className="font-pixel text-[8px] px-2 py-0.5 bg-[#16112b] border border-[#f5b935] text-[#f5b935] hover:bg-[#f5b935] hover:text-[#0d0a1a]"
                        >
                          {isEquipped ? '★ SIAP TEMPUR' : 'UJI RUNE'}
                        </button>
                      </div>

                      <h3
                        className="font-pixel text-xs sm:text-sm leading-snug mb-2"
                        style={{ color: visual.color }}
                      >
                        {spell.name}
                      </h3>

                      {/* Short Summary */}
                      <p className="font-vt text-lg sm:text-xl text-[#b3aad1] leading-snug mb-3">
                        {spell.summary}
                      </p>

                      {/* Formulas on Rune Plate */}
                      <div className="bg-[#0d0a1a] border-2 border-[#5c4e99] p-3 mb-4">
                        <div className="font-pixel text-[8px] text-[#f5b935] mb-1.5">
                          RUMUS MANTRA:
                        </div>
                        <ul className="space-y-1">
                          {spell.formulas.map((f, idx) => (
                            <li
                              key={idx}
                              className="font-mono text-xs text-[#f4f1ea] bg-[#16112b] px-2 py-1 border border-[#3a306e]"
                            >
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* "Buka gulungan" link/button */}
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        openScrollViewer(spell.roadmapTopicId);
                      }}
                      className="w-full pixel-btn py-2.5 bg-[#16112b] text-[#3ac5eb] border-[#3ac5eb] font-pixel text-[10px]"
                    >
                      📖 Buka gulungan
                    </button>
                  </>
                ) : (
                  /* Locked Silhouette Card */
                  <div className="flex flex-col items-center justify-between text-center py-6 h-full space-y-4">
                    <div className="w-16 h-16 bg-[#070510] border-2 border-[#3a306e] flex items-center justify-center">
                      <PixelLockSprite size={32} />
                    </div>
                    <div>
                      <div className="font-pixel text-[9px] text-[#64748b] mb-1">
                        SILUET MANTRA #{spell.topicId} (LANTAI {floorId})
                      </div>
                      <h3 className="font-pixel text-xs text-[#64748b]">
                        ??? (Mantra Terkunci)
                      </h3>
                      <p className="font-vt text-lg text-[#64748b] mt-2">
                        Taklukkan Ruang Topik #{spell.topicId} (
                        {topicMeta?.name || `Lantai ${floorId}`}) untuk membuka nama dan rumus
                        mantra ini.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setView('dungeon');
                      }}
                      className="pixel-btn px-3 py-1.5 bg-[#0d0a1a] text-[#b3aad1] font-pixel text-[9px]"
                    >
                      Ke Peta Lantai {floorId} →
                    </button>
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3 pb-14 space-y-6">
      {/* Header Banner & Tab Switcher */}
      <section aria-label="Kitab Grimoire dan Dojo Latihan" className="pixel-box-gold p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="font-pixel text-[10px] text-[#3ac5eb] mb-1">
              KITAB SIHIR LANTAI 1–5 · KATALOG MANTRA &amp; LATIHAN
            </div>
            <h1 className="font-pixel text-sm sm:text-base text-[#f5b935]">
              GRIMOIRE MANTRA &amp; DOJO LATIHAN
            </h1>
            <p className="font-vt text-xl text-[#b3aad1] mt-1">
              Mantra Terbuka:{' '}
              <strong className="text-[#38d864]">
                {spellsUnlocked.length} / {allSpells.length}
              </strong>{' '}
              · XP Dojo Hari Ini:{' '}
              <strong className="text-[#f5b935]">
                {todayDojoXP} / {DOJO_DAILY_XP_CAP} XP
              </strong>{' '}
              (+{DOJO_CORRECT_XP} XP per jawaban benar, tanpa kehilangan hati)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                playClick();
                setActiveTab('grimoire');
              }}
              aria-pressed={activeTab === 'grimoire'}
              className={`pixel-btn px-4 py-2.5 font-pixel text-xs ${
                activeTab === 'grimoire'
                  ? 'bg-[#38d864] text-[#0d0a1a]'
                  : 'bg-[#16112b] text-[#f4f1ea]'
              }`}
            >
              📖 Kitab Grimoire (28 Mantra)
            </button>

            <button
              type="button"
              onClick={startDojoSession}
              aria-pressed={activeTab === 'dojo'}
              className={`pixel-btn px-4 py-2.5 font-pixel text-xs gap-1.5 ${
                activeTab === 'dojo'
                  ? 'bg-[#f5b935] text-[#0d0a1a]'
                  : 'bg-[#291324] text-[#f5b935]'
              }`}
            >
              <PixelSwordSprite size={16} />
              <span>Dojo Latihan</span>
            </button>
          </div>
        </div>
      </section>

      {/* TAB 1: GRIMOIRE GROUPED BY FLOOR (LANTAI 1, LANTAI 2, LANTAI 3, LANTAI 4, LANTAI 5) */}
      {activeTab === 'grimoire' && (
        <section aria-label="Daftar Kartu Mantra per Lantai" className="space-y-6">
          {renderSpellGroup(
            1,
            'Mantra Lantai 1: Fondasi Matematika & Python (6 Mantra)',
            'Digunakan untuk mengalahkan Slime Angka dan Raja Matematika.',
            '#38d864',
            floor1Spells
          )}
          {renderSpellGroup(
            2,
            'Mantra Lantai 2: Machine Learning Klasik (5 Mantra)',
            'Digunakan untuk mengalahkan Golem Pohon dan Golem Pohon Purba.',
            '#1d8a3d',
            floor2Spells
          )}
          {renderSpellGroup(
            3,
            'Mantra Lantai 3: Deep Learning (6 Mantra)',
            'Digunakan untuk mengalahkan Hydra Neural dan Hydra Berkepala Banyak.',
            '#9b5de5',
            floor3Spells
          )}
          {renderSpellGroup(
            4,
            'Mantra Lantai 4: Deployment, Edge AI & Proyek Nyata (3 Mantra)',
            'Digunakan untuk mengalahkan Mecha-Bot IoT dan Mecha-Core.',
            '#3ac5eb',
            floor4Spells
          )}
          {renderSpellGroup(
            5,
            'Mantra Lantai 5: Aula Guild — Kompetensi Dunia Nyata (8 Mantra)',
            'Digunakan untuk menaklukkan Guild Quest dan Raja Deadline.',
            '#fb923c',
            floor5Spells
          )}
        </section>
      )}

      {/* TAB 2: DOJO LATIHAN (WEIGHTED TRAINING MODE) */}
      {activeTab === 'dojo' && (
        <section aria-label="Area Dojo Latihan" className="pixel-box p-4 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#3a306e] pb-3">
            <div>
              <div className="font-pixel text-[10px] text-[#f5b935]">
                MODE LATIHAN TANPA KEHILANGAN HATI (LANTAI 1–5)
              </div>
              <h2 className="font-pixel text-xs sm:text-sm text-[#38d864] mt-1">
                DOJO LATIHAN MANTRA (MAKSIMAL 8 SOAL TERBOBOT)
              </h2>
            </div>
            <div className="font-vt text-lg text-[#b3aad1] bg-[#120d26] border border-[#5c4e99] px-3 py-1.5">
              Rumus Bobot Soal: <code>max(1, 1 + 2×salah − beruntunBenar)</code>
            </div>
          </div>

          {defeatedSpellbookTopicsCount === 0 ? (
            <div className="bg-[#120d26] border-2 border-[#f5b935] p-6 text-center space-y-3">
              <div className="font-pixel text-xs text-[#f5b935]">
                BELUM ADA TOPIK SPELLBOOK YANG DITAKLUKKAN
              </div>
              <p className="font-vt text-xl text-[#f4f1ea] max-w-xl mx-auto">
                Dojo Latihan menarik soal dari topik-topik yang sudah kamu kalahkan. Taklukkan
                minimal 1 ruangan di Lantai 1 terlebih dahulu untuk mulai berlatih di Dojo!
              </p>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setView('dungeon');
                }}
                className="pixel-btn px-4 py-2.5 bg-[#38d864] text-[#0d0a1a] font-pixel text-xs"
              >
                Ke Peta Dungeon Lantai 1 →
              </button>
            </div>
          ) : dojoFinished ? (
            <div className="bg-[#0a1714] border-2 border-[#38d864] p-6 text-center space-y-4">
              <div className="font-pixel text-sm text-[#38d864]">
                ✓ SESI DOJO LATIHAN SELESAI!
              </div>
              <p className="font-vt text-2xl text-[#f4f1ea]">
                Kamu menjawab benar{' '}
                <strong className="text-[#f5b935]">
                  {dojoSessionCorrect} dari {dojoDeck.length}
                </strong>{' '}
                soal dan memperoleh{' '}
                <strong className="text-[#38d864]">+{dojoSessionXPEarned} XP</strong>!
              </p>
              <p className="font-vt text-lg text-[#b3aad1]">
                XP Dojo Hari Ini: {todayDojoXP} / {DOJO_DAILY_XP_CAP} XP. Bobot soal telah
                diperbarui otomatis berdasarkan jawabanmu.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={startDojoSession}
                  className="pixel-btn px-4 py-2.5 bg-[#f5b935] text-[#0d0a1a] font-pixel text-xs"
                >
                  Latihan 8 Soal Lagi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setActiveTab('grimoire');
                  }}
                  className="pixel-btn px-4 py-2.5 bg-[#16112b] text-[#f4f1ea] font-pixel text-xs"
                >
                  Kembali ke Grimoire
                </button>
              </div>
            </div>
          ) : currentDojoQ ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#120d26] border border-[#5c4e99] px-3.5 py-2 font-vt text-lg">
                <span>
                  Soal Latihan{' '}
                  <strong className="text-[#f5b935]">{dojoIndex + 1}</strong> / {dojoDeck.length} ·{' '}
                  <span className="text-[#3ac5eb]">{currentDojoQ.spellName}</span>
                </span>
                <div className="flex items-center gap-3">
                  <span
                    data-testid="dojo-question-weight"
                    className="font-pixel text-[9px] px-2 py-0.5 bg-[#0d0a1a] border border-[#f5b935] text-[#f5b935]"
                  >
                    Bobot Soal ({currentDojoQ.id}):{' '}
                    {calculateQuestionWeight(questionStats[currentDojoQ.id])}
                  </span>
                  <span className="font-pixel text-[9px] px-2 py-0.5 bg-[#0a1714] border border-[#38d864] text-[#38d864]">
                    ♥ TANPA RISIKO HATI
                  </span>
                </div>
              </div>

              <div className="bg-[#0d0a1a] border-2 border-[#5c4e99] p-4 font-vt text-xl sm:text-2xl text-[#f4f1ea]">
                {currentDojoQ.question}
              </div>

              <div className="space-y-2.5">
                {currentDojoQ.shuffledOptions.map((opt, idx) => {
                  const isSelected = selectedOptionId === opt.optionId;
                  const showResult = selectedOptionId !== null;

                  let btnStyle =
                    'bg-[#16112b] border-[#5c4e99] text-[#f4f1ea] hover:border-[#f5b935]';
                  let prefix = `${String.fromCharCode(65 + idx)}.`;

                  if (showResult) {
                    if (opt.isCorrect) {
                      btnStyle = 'bg-[#0a1714] border-[#38d864] text-[#38d864] font-bold';
                      prefix = `✓ [BENAR] ${String.fromCharCode(65 + idx)}.`;
                    } else if (isSelected && !opt.isCorrect) {
                      btnStyle = 'bg-[#291324] border-[#e83b47] text-[#e83b47]';
                      prefix = `✕ [SALAH] ${String.fromCharCode(65 + idx)}.`;
                    } else {
                      btnStyle = 'bg-[#0d0a1a] border-[#2b2352] text-[#b3aad1] opacity-65';
                    }
                  }

                  return (
                    <button
                      key={opt.optionId}
                      type="button"
                      disabled={showResult}
                      data-correct={opt.isCorrect ? 'true' : undefined}
                      onClick={() => handleSelectDojoOption(opt)}
                      className={`w-full text-left p-3 border-2 font-vt text-lg sm:text-xl flex items-start gap-2.5 ${btnStyle}`}
                    >
                      <span className="font-pixel text-[10px] mt-1 shrink-0">{prefix}</span>
                      <span>{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {selectedOptionId !== null && lastAnswerFeedback && (
                <div
                  className={`p-4 border-2 ${
                    lastAnswerFeedback.isCorrect
                      ? 'bg-[#0a1714] border-[#38d864]'
                      : 'bg-[#291324] border-[#e83b47]'
                  }`}
                >
                  <div className="font-pixel text-[10px] text-[#f5b935] mb-1">
                    {lastAnswerFeedback.isCorrect
                      ? `✓ JAWABAN BENAR! (+${lastAnswerFeedback.xpAwarded} XP${
                          lastAnswerFeedback.xpAwarded === 0
                            ? ' — Batas harian 20 XP Dojo tercapai'
                            : ''
                        } · Bobot: ${lastAnswerFeedback.oldWeight} → ${lastAnswerFeedback.newWeight})`
                      : `✕ JAWABAN BELUM TEPAT (Bobot Latihan Naik: ${lastAnswerFeedback.oldWeight} → ${lastAnswerFeedback.newWeight})`}
                  </div>
                  <p className="font-vt text-xl text-[#f4f1ea] leading-snug">
                    {currentDojoQ.explanation}
                  </p>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNextDojoQuestion}
                      className="pixel-btn px-4 py-2 bg-[#f5b935] text-[#0d0a1a] font-pixel text-[10px]"
                    >
                      {dojoIndex + 1 < dojoDeck.length
                        ? 'Soal Dojo Berikutnya →'
                        : 'Selesaikan Sesi Dojo →'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
};
