import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FLOORS } from '../data/roadmap.js';
import {
  createDefaultBossProgressForFloor,
  useGameStore,
} from '../store/useGameStore';
import { BOSS_XP } from '../game/formulas';
import {
  MAX_HEARTS,
  SPELL_VISUALS,
  ShuffledOption,
  getAllSpells,
  getEffectiveBossSpellId,
  getFloorContent,
  getInitialBossPotions,
  getSpellsByFloor,
  getTotalBossPhases,
  shuffleOptionsByIdentity,
} from '../game/spellbookEngine';
import {
  AvatarSprite,
  MonsterSprite,
  PixelHeartSprite,
  PixelSwordSprite,
  RelicSprite,
  SpriteCombatState,
} from './PixelSprites';
import { useSound } from '../hooks/useSound.js';

const SEGMENT_PARTICLES = [
  { x: -45, y: -35, color: '#38d864' },
  { x: 45, y: -35, color: '#f5b935' },
  { x: -55, y: 20, color: '#3ac5eb' },
  { x: 55, y: 20, color: '#e83b47' },
  { x: 0, y: -50, color: '#f4f1ea' },
  { x: 0, y: 45, color: '#9b5de5' },
];

const WITHERING_LEAVES = [
  { x: '15%', delay: 0, color: '#f5b935' },
  { x: '30%', delay: 0.15, color: '#1d8a3d' },
  { x: '48%', delay: 0.05, color: '#a87312' },
  { x: '65%', delay: 0.22, color: '#38d864' },
  { x: '80%', delay: 0.1, color: '#f5b935' },
  { x: '90%', delay: 0.28, color: '#a87312' },
];

const HYDRA_HEAD_SPARKS = [
  { head: 1, label: 'Kepala 1 (Neuron)', x: '14%', delay: 0, color: '#b3aad1' },
  { head: 2, label: 'Kepala 2 (PyTorch)', x: '28%', delay: 0.12, color: '#e83b47' },
  { head: 3, label: 'Kepala 3 (Konvolusi)', x: '43%', delay: 0.24, color: '#3ac5eb' },
  { head: 4, label: 'Kepala 4 (Urutan)', x: '57%', delay: 0.36, color: '#f5b935' },
  { head: 5, label: 'Kepala 5 (Atensi)', x: '71%', delay: 0.48, color: '#fcd34d' },
  { head: 6, label: 'Kepala 6 (Latihan)', x: '85%', delay: 0.6, color: '#9b5de5' },
];

const MECHA_CIRCUIT_TRACES = [
  { trace: 1, label: 'Jalur 1 (Pipeline)', delay: 0, color: '#0891b2' },
  { trace: 2, label: 'Jalur 2 (Kuantis)', delay: 0.12, color: '#2dd4bf' },
  { trace: 3, label: 'Jalur 3 (Edge IoT)', delay: 0.24, color: '#3ac5eb' },
  { trace: 4, label: 'Jalur 4 (Gema L2-3)', delay: 0.36, color: '#fb923c' },
  { trace: 5, label: 'Jalur 5 (Inti Daya)', delay: 0.48, color: '#f5b935' },
];

const MECHA_DEFEAT_SPARKS = [
  { x: '16%', y: -32, delay: 0, color: '#3ac5eb' },
  { x: '32%', y: -44, delay: 0.1, color: '#f5b935' },
  { x: '48%', y: -38, delay: 0.18, color: '#fb923c' },
  { x: '66%', y: -46, delay: 0.08, color: '#2dd4bf' },
  { x: '82%', y: -30, delay: 0.22, color: '#e83b47' },
];

const CLOCK_SHATTER_FRAGMENTS = [
  { x: '14%', y: -38, rotate: -35, delay: 0, color: '#e83b47' },
  { x: '26%', y: -52, rotate: 28, delay: 0.06, color: '#fb923c' },
  { x: '38%', y: -42, rotate: -48, delay: 0.12, color: '#f5b935' },
  { x: '50%', y: -56, rotate: 42, delay: 0.04, color: '#f4f1ea' },
  { x: '62%', y: -44, rotate: -25, delay: 0.15, color: '#fb923c' },
  { x: '74%', y: -50, rotate: 36, delay: 0.09, color: '#e83b47' },
  { x: '86%', y: -36, rotate: -40, delay: 0.18, color: '#f5b935' },
];

export const BossModal: React.FC = () => {
  const selectedBossFloorId = useGameStore((s) => s.selectedBossFloorId);
  const defeatedBosses = useGameStore((s) => s.defeatedBosses);
  const completedRooms = useGameStore((s) => s.completedRooms);
  const spellsUnlocked = useGameStore((s) => s.spellsUnlocked);
  const bossProgressMap = useGameStore((s) => s.bossProgress);
  const avatarId = useGameStore((s) => s.avatarId);
  const playerName = useGameStore((s) => s.playerName);
  const reduceMotion = useGameStore((s) => s.reduceMotion);
  const closeBossBattle = useGameStore((s) => s.closeBossBattle);
  const defeatBoss = useGameStore((s) => s.defeatBoss);
  const useBossPotion = useGameStore((s) => s.useBossPotion);
  const advanceBossPhaseVariant = useGameStore((s) => s.advanceBossPhaseVariant);
  const completeBossPhase = useGameStore((s) => s.completeBossPhase);
  const faintBossFight = useGameStore((s) => s.faintBossFight);
  const selectFloor = useGameStore((s) => s.selectFloor);

  const {
    playBossAppear,
    playAttack,
    playDefeat,
    playClick,
    playCast,
    playFizzle,
    playPlayerHit,
    playBossSegmentBreak,
  } = useSound();

  const modalRef = useRef<HTMLDivElement | null>(null);

  const floor = FLOORS.find((f) => f.id === selectedBossFloorId);
  const floorId = floor?.id ?? 1;
  const alreadyDefeated = floor ? defeatedBosses.includes(floor.boss.id) : false;

  const floorSpellbookContent = floor ? getFloorContent(floor.id) : undefined;
  const isSpellbookBoss = Boolean(floorSpellbookContent);
  const isFloor2Boss = floor?.id === 2;
  const isFloor3Boss = floor?.id === 3;
  const isFloor4Boss = floor?.id === 4;
  const isFloor5Boss = floor?.id === 5;

  const totalSpellbookPhases = getTotalBossPhases(floorId);
  const maxPotionsForFloor = getInitialBossPotions(floorId);

  const bossDisplayName = floorSpellbookContent?.boss.name || floor?.boss.name || 'Bos Lantai';
  const bossRelicDisplayName =
    floor?.id === 2
      ? 'Daun Emas'
      : floor?.id === 3
      ? 'Inti Neuron'
      : floor?.id === 4
      ? 'Chip Edge'
      : floor?.id === 5
      ? 'Stopwatch Perak'
      : floor?.boss.relic.name || 'Relik Bos';

  const currentFloorBossProgress =
    bossProgressMap[floorId] ?? createDefaultBossProgressForFloor(floorId);

  // Shared Checklist & Victory State
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [challengeReady, setChallengeReady] = useState(false);
  const [bossDefeatedAnim, setBossDefeatedAnim] = useState(false);
  const [claimedBossXP, setClaimedBossXP] = useState<number | null>(null);
  const [bossSpriteState, setBossSpriteState] = useState<SpriteCombatState>('idle');
  const [shakeScreen, setShakeScreen] = useState(false);
  const [showIntroBanner, setShowIntroBanner] = useState(false);
  const [segmentBreakBurst, setSegmentBreakBurst] = useState(false);

  // Multi-Phase Spellbook Boss Fight State (Floors 1, 2, 3, 4, 5)
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [phaseStep, setPhaseStep] = useState<'spell' | 'calc'>('spell');
  const [selectedSpellFloorTab, setSelectedSpellFloorTab] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [formulaPeekActive, setFormulaPeekActive] = useState(false);
  const [deadlineClockTick, setDeadlineClockTick] = useState<'00:03' | '00:02' | '00:01' | '00:00!'>('00:03');
  const [spellFeedback, setSpellFeedback] = useState<{
    isCorrect: boolean;
    chosenSpellId: string;
    correctSpellName: string;
  } | null>(null);
  const [selectedCalcOptionId, setSelectedCalcOptionId] = useState<string | null>(null);
  const [calcFeedback, setCalcFeedback] = useState<{
    isCorrect: boolean;
    explanation: string;
  } | null>(null);

  const allSpells = useMemo(() => getAllSpells(), []);
  const floor1Spells = useMemo(() => getSpellsByFloor(1), []);
  const floor2Spells = useMemo(() => getSpellsByFloor(2), []);
  const floor3Spells = useMemo(() => getSpellsByFloor(3), []);
  const floor4Spells = useMemo(() => getSpellsByFloor(4), []);
  const floor5Spells = useMemo(() => getSpellsByFloor(5), []);

  const unlockedFloor1Spells = useMemo(() => {
    const filtered = floor1Spells.filter(
      (s) => spellsUnlocked.includes(s.id) || completedRooms.includes(s.roadmapTopicId)
    );
    return filtered.length > 0 ? filtered : floor1Spells;
  }, [floor1Spells, spellsUnlocked, completedRooms]);

  const unlockedFloor2Spells = useMemo(() => {
    const filtered = floor2Spells.filter(
      (s) => spellsUnlocked.includes(s.id) || completedRooms.includes(s.roadmapTopicId)
    );
    return filtered.length > 0 ? filtered : floor2Spells;
  }, [floor2Spells, spellsUnlocked, completedRooms]);

  const unlockedFloor3Spells = useMemo(() => {
    const filtered = floor3Spells.filter(
      (s) => spellsUnlocked.includes(s.id) || completedRooms.includes(s.roadmapTopicId)
    );
    return filtered.length > 0 ? filtered : floor3Spells;
  }, [floor3Spells, spellsUnlocked, completedRooms]);

  const unlockedFloor4Spells = useMemo(() => {
    const filtered = floor4Spells.filter(
      (s) => spellsUnlocked.includes(s.id) || completedRooms.includes(s.roadmapTopicId)
    );
    return filtered.length > 0 ? filtered : floor4Spells;
  }, [floor4Spells, spellsUnlocked, completedRooms]);

  const unlockedFloor5Spells = useMemo(() => {
    const filtered = floor5Spells.filter(
      (s) => spellsUnlocked.includes(s.id) || completedRooms.includes(s.roadmapTopicId)
    );
    return filtered.length > 0 ? filtered : floor5Spells;
  }, [floor5Spells, spellsUnlocked, completedRooms]);

  // Determine active Spellbook phase (1..totalSpellbookPhases)
  const activePhaseNumber = useMemo(() => {
    for (let p = 1; p <= totalSpellbookPhases; p++) {
      if (!currentFloorBossProgress.clearedPhases.includes(p)) {
        return p;
      }
    }
    return totalSpellbookPhases + 1; // All phases cleared!
  }, [currentFloorBossProgress.clearedPhases, totalSpellbookPhases]);

  const currentPhaseData = useMemo(
    () => floorSpellbookContent?.boss.phases.find((p) => p.phase === activePhaseNumber),
    [floorSpellbookContent, activePhaseNumber]
  );

  // Current variant index (0 = Variant A first, 1 = Variant B after miss, alternating on later retries)
  const currentVariantIndex: 0 | 1 = useMemo(() => {
    if (!currentPhaseData) return 0;
    const saved = currentFloorBossProgress.lastVariantByPhase[currentPhaseData.phase];
    return saved === 1 ? 1 : 0;
  }, [currentPhaseData, currentFloorBossProgress.lastVariantByPhase]);

  const currentVariant = currentPhaseData?.variants[currentVariantIndex];

  // Effective required spellId (supports variant-level spellId override in Floor 2 Phase 6 & Floor 3 Phase 7)
  const effectiveRequiredSpellId = useMemo(() => {
    if (!currentPhaseData) return '';
    return getEffectiveBossSpellId(currentPhaseData, currentVariant);
  }, [currentPhaseData, currentVariant]);

  const shuffledCalcOptions: ShuffledOption[] = useMemo(() => {
    if (!currentVariant) return [];
    return shuffleOptionsByIdentity(currentVariant.options, currentVariant.correctIndex);
  }, [floorId, currentPhaseData?.phase, currentVariantIndex, currentVariant]);

  useEffect(() => {
    if (floor) {
      playBossAppear();
      const done = defeatedBosses.includes(floor.boss.id);
      const initialChecks: Record<string, boolean> = {};
      floor.topics.forEach((t) => {
        initialChecks[t.id] = done;
      });
      setCheckedItems(initialChecks);
      setChallengeReady(done);
      setBossDefeatedAnim(done);
      setClaimedBossXP(null);
      setBossSpriteState(done ? 'defeated' : 'idle');
      setShowIntroBanner(!done);
      setHearts(MAX_HEARTS);
      setPhaseStep('spell');
      setSelectedSpellFloorTab(
        floor.id === 5
          ? 5
          : floor.id === 4
          ? 4
          : floor.id === 3
          ? 3
          : floor.id === 2
          ? 2
          : 1
      );
      setFormulaPeekActive(false);
      setDeadlineClockTick('00:03');
      setSpellFeedback(null);
      setSelectedCalcOptionId(null);
      setCalcFeedback(null);

      if (!reduceMotion) {
        if (floor.id === 5) {
          // Digital countdown clock ticks down 00:03 -> 00:02 -> 00:01 -> 00:00! then cracks with screen shake
          const tick1 = setTimeout(() => setDeadlineClockTick('00:02'), 350);
          const tick2 = setTimeout(() => setDeadlineClockTick('00:01'), 700);
          const tick3 = setTimeout(() => {
            setDeadlineClockTick('00:00!');
            setShakeScreen(true);
          }, 1050);
          const shakeEnd = setTimeout(() => setShakeScreen(false), 1550);
          const introTimer = setTimeout(() => setShowIntroBanner(false), 2600);
          return () => {
            clearTimeout(tick1);
            clearTimeout(tick2);
            clearTimeout(tick3);
            clearTimeout(shakeEnd);
            clearTimeout(introTimer);
          };
        }
        if (floor.id === 3 || floor.id === 4) {
          // Hydra heads or Mecha-Core circuit traces light up one at a time, with screen shake on power-up
          const shakeStart = setTimeout(() => setShakeScreen(true), 550);
          const shakeEnd = setTimeout(() => setShakeScreen(false), 1000);
          const introTimer = setTimeout(() => setShowIntroBanner(false), 2300);
          return () => {
            clearTimeout(shakeStart);
            clearTimeout(shakeEnd);
            clearTimeout(introTimer);
          };
        }
        setShakeScreen(true);
        const t = setTimeout(() => setShakeScreen(false), 450);
        const introTimer = setTimeout(() => setShowIntroBanner(false), 2100);
        return () => {
          clearTimeout(t);
          clearTimeout(introTimer);
        };
      } else {
        setDeadlineClockTick('00:00!');
        const introTimer = setTimeout(() => setShowIntroBanner(false), 900);
        return () => clearTimeout(introTimer);
      }
    }
    return undefined;
  }, [selectedBossFloorId]);

  // Keyboard Escape + Focus Trap
  useEffect(() => {
    if (!selectedBossFloorId) return undefined;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeBossBattle();
        return;
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBossFloorId, closeBossBattle]);

  if (!selectedBossFloorId || !floor) return null;

  const totalChecklistCount = floor.topics.length;
  const checkedCount = floor.topics.filter((t) => checkedItems[t.id]).length;
  const allTopicsChecked = checkedCount === totalChecklistCount;

  const clearedPhasesCount = currentFloorBossProgress.clearedPhases.length;
  const allPhasesCleared = clearedPhasesCount >= totalSpellbookPhases || alreadyDefeated;

  // Floor 1 requires all 6 phases + all topics checked.
  // Floor 2 & Floor 3 require all phases cleared + all topics checked + boss challenge checkbox ticked.
  // Floors 4-5 require all topics checked + boss challenge checkbox ticked.
  const canClaimBossVictory = isSpellbookBoss
    ? floor.id === 1
      ? allPhasesCleared && allTopicsChecked
      : allPhasesCleared && allTopicsChecked && challengeReady
    : allTopicsChecked && challengeReady;

  const handleToggleTopicCheck = (topicId: string) => {
    playClick();
    setCheckedItems((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  const handleCheckAll = () => {
    playClick();
    const allTrue: Record<string, boolean> = {};
    floor.topics.forEach((t) => {
      allTrue[t.id] = true;
    });
    setCheckedItems(allTrue);
    setChallengeReady(true);
  };

  // STEP 1: Choose Spell
  const handleSelectBossSpell = (spellId: string) => {
    if (!currentPhaseData || spellFeedback !== null || hearts <= 0) return;
    const correctSpell = allSpells.find((s) => s.id === effectiveRequiredSpellId);
    const isCorrect = spellId === effectiveRequiredSpellId;

    if (isCorrect) {
      playCast();
      setSpellFeedback({
        isCorrect: true,
        chosenSpellId: spellId,
        correctSpellName: correctSpell?.name || effectiveRequiredSpellId,
      });
      setTimeout(() => {
        setSpellFeedback(null);
        setPhaseStep('calc');
      }, 450);
    } else {
      playFizzle();
      playPlayerHit();
      const nextHearts = Math.max(0, hearts - 1);
      setHearts(nextHearts);
      setSpellFeedback({
        isCorrect: false,
        chosenSpellId: spellId,
        correctSpellName: correctSpell?.name || effectiveRequiredSpellId,
      });
      if (!reduceMotion) {
        setShakeScreen(true);
        setTimeout(() => setShakeScreen(false), 380);
      }
    }
  };

  // STEP 2: Answer Calculation Question
  const handleSelectBossCalcOption = (opt: ShuffledOption) => {
    if (!currentPhaseData || !currentVariant || selectedCalcOptionId !== null || hearts <= 0)
      return;
    setSelectedCalcOptionId(opt.optionId);

    if (opt.isCorrect) {
      playBossSegmentBreak();
      setBossSpriteState('hit');
      setSegmentBreakBurst(true);
      if (!reduceMotion) {
        setShakeScreen(true);
        setTimeout(() => setShakeScreen(false), 420);
      }
      setCalcFeedback({
        isCorrect: true,
        explanation: currentVariant.explanation,
      });
      setTimeout(() => {
        setBossSpriteState('idle');
        setSegmentBreakBurst(false);
      }, 600);
    } else {
      playFizzle();
      playPlayerHit();
      const nextHearts = Math.max(0, hearts - 1);
      setHearts(nextHearts);
      setCalcFeedback({
        isCorrect: false,
        explanation: currentVariant.explanation,
      });
    }
  };

  const handleProceedAfterCalc = () => {
    if (!currentPhaseData || !calcFeedback) return;
    playClick();

    if (calcFeedback.isCorrect) {
      // Break segment and advance to next phase
      completeBossPhase(floor.id, currentPhaseData.phase);
      setPhaseStep('spell');
      setSelectedSpellFloorTab(
        floor.id === 5
          ? 5
          : floor.id === 4
          ? 4
          : floor.id === 3
          ? 3
          : floor.id === 2
          ? 2
          : 1
      );
      setFormulaPeekActive(false);
      setSpellFeedback(null);
      setSelectedCalcOptionId(null);
      setCalcFeedback(null);
    } else {
      // Wrong calculation answer: repeat phase once with the OTHER variant (A <-> B)
      const nextVariantIdx = advanceBossPhaseVariant(floor.id, currentPhaseData.phase);
      const nextVariant = currentPhaseData.variants[nextVariantIdx];
      const nextSpellId = getEffectiveBossSpellId(currentPhaseData, nextVariant);
      setSelectedCalcOptionId(null);
      setCalcFeedback(null);
      setPhaseStep(nextSpellId !== effectiveRequiredSpellId ? 'spell' : 'calc');
    }
  };

  // Faint Recovery at 0 Hearts: refill hearts, boss regains 1 segment (never above full), alternate variant
  const handleBossFaintRetry = () => {
    playClick();
    if (currentPhaseData) {
      advanceBossPhaseVariant(floor.id, currentPhaseData.phase);
    }
    faintBossFight(floor.id);
    setHearts(MAX_HEARTS);
    setPhaseStep('spell');
    setSelectedSpellFloorTab(
      floor.id === 5
        ? 5
        : floor.id === 4
        ? 4
        : floor.id === 3
        ? 3
        : floor.id === 2
        ? 2
        : 1
    );
    setFormulaPeekActive(false);
    setSpellFeedback(null);
    setSelectedCalcOptionId(null);
    setCalcFeedback(null);
  };

  const handleDefeatBoss = () => {
    if (!canClaimBossVictory) return;
    playAttack();
    setBossSpriteState('hit');
    if (!reduceMotion) {
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 400);
    }
    setTimeout(() => {
      playDefeat();
      setBossSpriteState('defeated');
      const res = defeatBoss(floor.id);
      setClaimedBossXP(res.xpGained);
      setBossDefeatedAnim(true);
    }, 380);
  };

  const segmentBarColor =
    floor.id === 1
      ? '#38d864'
      : floor.id === 2
      ? '#1d8a3d'
      : floor.id === 3
      ? '#9b5de5'
      : floor.id === 4
      ? '#3ac5eb'
      : '#fb923c';

  const activeSpellTabList =
    selectedSpellFloorTab === 5
      ? unlockedFloor5Spells
      : selectedSpellFloorTab === 4
      ? unlockedFloor4Spells
      : selectedSpellFloorTab === 3
      ? unlockedFloor3Spells
      : selectedSpellFloorTab === 2
      ? unlockedFloor2Spells
      : unlockedFloor1Spells;

  const undefeatedBossFloors = FLOORS.filter(
    (f) => !defeatedBosses.includes(f.boss.id)
  );

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="boss-modal-title"
      >
        <motion.div
          ref={modalRef}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
          animate={
            shakeScreen && !reduceMotion
              ? {
                  opacity: 1,
                  scale: 1,
                  x: [-14, 14, -10, 10, -6, 6, 0],
                  y: [-6, 6, -4, 4, 0],
                }
              : { opacity: 1, scale: 1, x: 0, y: 0 }
          }
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.4 }}
          className="w-full max-w-4xl my-auto pixel-box-red bg-[#16101f] overflow-hidden"
        >
          {/* Boss Header */}
          <div
            className="border-b-4 p-4 flex items-center justify-between gap-3"
            style={{
              backgroundColor: isFloor5Boss
                ? '#210d14'
                : isFloor4Boss
                ? '#0a1924'
                : isFloor3Boss
                ? '#1a102b'
                : isFloor2Boss
                ? '#141f16'
                : '#291324',
              borderColor: isFloor5Boss
                ? '#fb923c'
                : isFloor4Boss
                ? '#3ac5eb'
                : isFloor3Boss
                ? '#9b5de5'
                : isFloor2Boss
                ? '#1d8a3d'
                : '#e83b47',
            }}
          >
            <div>
              <div className="font-pixel text-[10px] text-[#f5b935]">
                ⚔ PERTARUNGAN BOS LANTAI {floor.id} · HADIAH +{BOSS_XP} XP + LENCANA + RELIK
              </div>
              <h2
                id="boss-modal-title"
                className="font-pixel text-sm sm:text-base text-[#f4f1ea] mt-1"
              >
                {bossDisplayName} — {floor.boss.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                playClick();
                closeBossBattle();
              }}
              aria-label="Tutup Panel Bos"
              className="pixel-btn px-3 py-1.5 bg-[#120d26] text-[#f4f1ea] font-pixel text-xs"
            >
              ✕
            </button>
          </div>

          {/* Boss Intro Animation Banner */}
          <AnimatePresence>
            {showIntroBanner && !bossDefeatedAnim && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  backgroundColor: isFloor5Boss
                    ? '#9a1c28'
                    : isFloor4Boss
                    ? '#0891b2'
                    : isFloor3Boss
                    ? '#7e22ce'
                    : isFloor2Boss
                    ? '#1d8a3d'
                    : '#e83b47',
                }}
                className="text-[#f4f1ea] px-4 py-2.5 text-center font-pixel text-[10px] sm:text-xs tracking-wider border-b-2 border-[#f4f1ea] relative overflow-hidden"
              >
                {isFloor5Boss ? (
                  <div className="space-y-1.5">
                    <div>
                      ⏱ JAM HITUNG MUNDUR BERDETAK DAN RETAK — RAJA DEADLINE BANGKIT DARI RETAKAN! ⏱
                    </div>
                    <div
                      className="inline-flex items-center gap-2 bg-[#0d0a1a] border-2 border-[#fb923c] px-3 py-1 font-mono text-sm text-[#e83b47]"
                      aria-hidden="true"
                    >
                      <span>[{deadlineClockTick}]</span>
                      {deadlineClockTick === '00:00!' && (
                        <span className="font-pixel text-[9px] text-[#f5b935]">
                          ⚡ KACA JAM RETAK!
                        </span>
                      )}
                    </div>
                  </div>
                ) : isFloor4Boss ? (
                  <div className="space-y-1.5">
                    <div>
                      🔌 JALUR SIRKUIT MENYALA SATU DEMI SATU HINGGA MECHA-CORE AKTIF PENUH! 🔌
                    </div>
                    {!reduceMotion && (
                      <div
                        className="flex items-center justify-center gap-2 pt-1"
                        aria-hidden="true"
                      >
                        {MECHA_CIRCUIT_TRACES.map((tr, idx) => (
                          <motion.div
                            key={tr.trace}
                            initial={{ opacity: 0.15, scaleX: 0.3 }}
                            animate={{ opacity: 1, scaleX: [0.4, 1.2, 1] }}
                            transition={{ duration: 0.3, delay: idx * 0.1 }}
                            style={{ backgroundColor: tr.color }}
                            className="w-6 h-3 border border-[#f4f1ea] shadow-[0_0_8px_#3ac5eb]"
                            title={tr.label}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : isFloor3Boss ? (
                  <div className="space-y-1.5">
                    <div>
                      ⚡ KEPALA-KEPALA HYDRANYA MENYALA SATU DEMI SATU SEPERTI LAPISAN NEURON! ⚡
                    </div>
                    {!reduceMotion && (
                      <div
                        className="flex items-center justify-center gap-2 pt-1"
                        aria-hidden="true"
                      >
                        {HYDRA_HEAD_SPARKS.map((h, idx) => (
                          <motion.div
                            key={h.head}
                            initial={{ opacity: 0.15, scale: 0.5 }}
                            animate={{ opacity: 1, scale: [0.6, 1.3, 1] }}
                            transition={{ duration: 0.32, delay: idx * 0.1 }}
                            style={{ backgroundColor: h.color }}
                            className="w-4 h-4 border border-[#f4f1ea] shadow-[0_0_8px_#f4f1ea]"
                            title={h.label}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : isFloor2Boss ? (
                  <div className="space-y-1">
                    <div>
                      🌿 AKAR PURBA MENEMBUS LANTAI DAN TUMBUH MENJADI CABANG POHON KEPUTUSAN! 🌿
                    </div>
                    {!reduceMotion && (
                      <div
                        className="flex items-center justify-center gap-3 pt-1"
                        aria-hidden="true"
                      >
                        {[0, 1, 2, 3, 4].map((idx) => (
                          <motion.div
                            key={idx}
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ duration: 0.45, delay: idx * 0.08 }}
                            className="w-3 h-3 bg-[#a87312] border border-[#f5b935]"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <span>
                    ⚠ PERINGATAN: {bossDisplayName.toUpperCase()} MENGADANG JALANMU! ⚠
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Boss Arena + Multi-Phase HP Bar */}
          <div
            className="p-4 sm:p-5 bg-[#0d0a1a] border-b-4 relative overflow-hidden"
            style={{
              borderColor: isFloor5Boss
                ? '#fb923c'
                : isFloor4Boss
                ? '#3ac5eb'
                : isFloor3Boss
                ? '#9b5de5'
                : isFloor2Boss
                ? '#1d8a3d'
                : '#e83b47',
            }}
          >
            {/* Floor 2 Defeat Animation: Withered branches falling as pixel leaves */}
            {(bossDefeatedAnim || (isFloor2Boss && allPhasesCleared)) &&
              isFloor2Boss &&
              !reduceMotion && (
                <div
                  className="pointer-events-none absolute inset-0 overflow-hidden"
                  aria-hidden="true"
                >
                  {WITHERING_LEAVES.map((leaf, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ y: -12, opacity: 0.9, rotate: 0 }}
                      animate={{
                        y: [0, 110],
                        x: [-6, 8, -4],
                        opacity: [0.95, 0.7, 0],
                        rotate: [0, 45, -25, 0],
                      }}
                      transition={{
                        duration: 2.6,
                        repeat: Infinity,
                        delay: leaf.delay,
                        ease: 'easeInOut',
                      }}
                      style={{ left: leaf.x, backgroundColor: leaf.color }}
                      className="w-3 h-2 absolute top-0 border border-[#0d0a1a]"
                    />
                  ))}
                </div>
              )}

            {/* Floor 3 Defeat Animation: Hydra heads fading out one by one into pixel sparks */}
            {(bossDefeatedAnim || (isFloor3Boss && allPhasesCleared)) &&
              isFloor3Boss &&
              !reduceMotion && (
                <div
                  className="pointer-events-none absolute inset-0 overflow-hidden"
                  aria-hidden="true"
                >
                  {HYDRA_HEAD_SPARKS.map((spark, idx) => (
                    <motion.div
                      key={spark.head}
                      initial={{ y: 20, opacity: 1, scale: 1 }}
                      animate={{
                        y: [20, -35],
                        opacity: [1, 0.8, 0],
                        scale: [1, 1.3, 0.3],
                      }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        delay: idx * 0.22,
                        ease: 'easeOut',
                      }}
                      style={{ left: spark.x, backgroundColor: spark.color }}
                      className="w-3 h-3 absolute bottom-3 border border-[#f4f1ea]"
                    />
                  ))}
                </div>
              )}

            {/* Floor 4 Defeat Animation: Sparks fly, then screen dims as if power went off */}
            {(bossDefeatedAnim || (isFloor4Boss && allPhasesCleared)) && isFloor4Boss && (
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden"
                aria-hidden="true"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: reduceMotion ? 0.35 : [0, 0.15, 0.48, 0.38] }}
                  transition={{ duration: reduceMotion ? 0.1 : 1.1 }}
                  className="absolute inset-0 bg-[#05030a]"
                />
                {!reduceMotion &&
                  MECHA_DEFEAT_SPARKS.map((sp, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ y: 10, opacity: 1, scale: 1 }}
                      animate={{
                        y: [10, sp.y, 35],
                        x: [0, idx % 2 === 0 ? 18 : -18],
                        opacity: [1, 0.9, 0],
                        scale: [1, 1.25, 0.3],
                      }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        delay: sp.delay,
                        ease: 'easeOut',
                      }}
                      style={{ left: sp.x, backgroundColor: sp.color }}
                      className="w-2.5 h-2.5 absolute bottom-6 border border-[#f4f1ea]"
                    />
                  ))}
              </div>
            )}

            {/* Floor 5 Defeat Animation: Clock shatters into pixel fragments and gentle light wash as time resumes */}
            {(bossDefeatedAnim || (isFloor5Boss && allPhasesCleared)) && isFloor5Boss && (
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden"
                aria-hidden="true"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: reduceMotion ? 0.22 : [0, 0.35, 0.18, 0.25] }}
                  transition={{ duration: reduceMotion ? 0.1 : 1.5 }}
                  className="absolute inset-0 bg-gradient-to-r from-[#f5b935]/20 via-[#fb923c]/25 to-[#f4f1ea]/20"
                />
                {!reduceMotion &&
                  CLOCK_SHATTER_FRAGMENTS.map((frag, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                      animate={{
                        y: [0, frag.y, 45],
                        x: [0, idx % 2 === 0 ? 22 : -22],
                        rotate: [0, frag.rotate],
                        opacity: [1, 0.85, 0],
                        scale: [1, 1.15, 0.35],
                      }}
                      transition={{
                        duration: 2.1,
                        repeat: Infinity,
                        delay: frag.delay,
                        ease: 'easeOut',
                      }}
                      style={{ left: frag.x, backgroundColor: frag.color }}
                      className="w-3 h-3 absolute bottom-5 border border-[#0d0a1a]"
                    />
                  ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 relative z-10">
              {/* Player Side + 3 Hearts & Potions (2 on Floors 1-2, 3 on Floor 3) */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-[#16112b] border-2 border-[#38d864] flex items-center justify-center">
                  <AvatarSprite avatarId={avatarId} size={60} />
                </div>
                <span className="font-pixel text-[10px] text-[#38d864] mt-2">
                  {playerName}
                </span>

                {isSpellbookBoss && (
                  <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2">
                    <div
                      className="flex items-center gap-1 bg-[#16112b] border border-[#5c4e99] px-2.5 py-1"
                      aria-label={`Hati Pemain: ${hearts} dari ${MAX_HEARTS}`}
                    >
                      {Array.from({ length: MAX_HEARTS }).map((_, idx) => (
                        <PixelHeartSprite key={idx} filled={idx < hearts} size={15} />
                      ))}
                      <span className="font-pixel text-[8px] text-[#f4f1ea] ml-1 tabular-nums">
                        {hearts}/{MAX_HEARTS}
                      </span>
                    </div>

                    <div
                      className="bg-[#16112b] border border-[#3ac5eb] px-2.5 py-1 font-pixel text-[8px] text-[#3ac5eb]"
                      aria-label={`Ramuan Ingatan tersisa: ${currentFloorBossProgress.potions}`}
                    >
                      🧪 RAMUAN: {currentFloorBossProgress.potions}/{maxPotionsForFloor}
                    </div>
                  </div>
                )}
              </div>

              <div className="font-pixel text-base text-[#e83b47]">VS BOS</div>

              {/* Boss Sprite + Multi-Segment HP Bar (6 segments on Floors 1-2, 7 segments on Floor 3) */}
              <div className="flex flex-col items-center w-64 sm:w-72">
                <div className="w-full mb-2">
                  <div className="flex justify-between font-pixel text-[9px] text-[#f4f1ea] mb-1">
                    <span>{bossDisplayName}</span>
                    <span className="text-[#f5b935] tabular-nums">
                      {isSpellbookBoss
                        ? bossDefeatedAnim
                          ? `0/${totalSpellbookPhases} SEGMEN`
                          : `${Math.max(
                              0,
                              totalSpellbookPhases - clearedPhasesCount
                            )}/${totalSpellbookPhases} SEGMEN`
                        : `${totalChecklistCount - checkedCount}/${totalChecklistCount} FASE`}
                    </span>
                  </div>

                  {/* Multi-Segment HP Bar */}
                  <div
                    className="w-full h-4 bg-[#16112b] border-2 border-[#f4f1ea] p-0.5 grid gap-0.5"
                    style={{
                      gridTemplateColumns: `repeat(${
                        isSpellbookBoss ? totalSpellbookPhases : totalChecklistCount
                      }, minmax(0, 1fr))`,
                    }}
                    role="progressbar"
                    aria-valuenow={
                      isSpellbookBoss
                        ? Math.max(0, totalSpellbookPhases - clearedPhasesCount)
                        : totalChecklistCount - checkedCount
                    }
                    aria-valuemin={0}
                    aria-valuemax={isSpellbookBoss ? totalSpellbookPhases : totalChecklistCount}
                    aria-label={`HP Multi-Fase Bos ${bossDisplayName}`}
                  >
                    {isSpellbookBoss
                      ? Array.from({ length: totalSpellbookPhases }, (_, i) => i + 1).map(
                          (phaseNum) => {
                            const segmentIntact =
                              !bossDefeatedAnim &&
                              !currentFloorBossProgress.clearedPhases.includes(phaseNum);
                            return (
                              <div
                                key={phaseNum}
                                className="h-full transition-all duration-300"
                                style={{
                                  backgroundColor: segmentIntact ? segmentBarColor : '#120d26',
                                  opacity: segmentIntact ? 1 : 0.25,
                                }}
                                title={`Segmen Fase ${phaseNum}: ${
                                  segmentIntact ? 'Aktif' : 'Hancur'
                                }`}
                              />
                            );
                          }
                        )
                      : floor.topics.map((t, idx) => {
                          const segmentActive = !bossDefeatedAnim && !checkedItems[t.id];
                          return (
                            <div
                              key={t.id}
                              className="h-full transition-all duration-300"
                              style={{
                                backgroundColor: segmentActive ? '#e83b47' : '#1f193d',
                              }}
                              title={`Fase ${idx + 1}`}
                            />
                          );
                        })}
                  </div>
                </div>

                <div
                  className="w-24 h-24 bg-[#16112b] border-2 flex items-center justify-center relative"
                  style={{
                    borderColor: isFloor4Boss
                      ? '#3ac5eb'
                      : isFloor3Boss
                      ? '#9b5de5'
                      : isFloor2Boss
                      ? '#a87312'
                      : '#f5b935',
                  }}
                >
                  <motion.div
                    animate={
                      bossSpriteState === 'defeated'
                        ? { opacity: 0.75, scale: 0.88 }
                        : bossSpriteState === 'hit' && !reduceMotion
                        ? { x: [-10, 10, -8, 8, 0], scale: [1, 1.12, 0.94, 1] }
                        : { opacity: 1, scale: 1 }
                    }
                    transition={{ duration: reduceMotion ? 0.1 : 0.38 }}
                  >
                    <MonsterSprite
                      type={floor.boss.spriteType}
                      size={76}
                      state={bossSpriteState}
                    />
                  </motion.div>

                  {/* Segment Break Particle Burst */}
                  {segmentBreakBurst && !reduceMotion && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      {SEGMENT_PARTICLES.map((p, idx) => (
                        <motion.span
                          key={idx}
                          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.3 }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          style={{ backgroundColor: p.color }}
                          className="w-3 h-3 absolute"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Body */}
          <div className="p-4 sm:p-6 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* SPELLBOOK MULTI-PHASE COMBAT (FLOORS 1, 2, 3, 4) */}
            {isSpellbookBoss && !allPhasesCleared && (
              <div className="space-y-4">
                {/* Fainted at 0 Hearts */}
                {hearts <= 0 ? (
                  <div role="alert" className="pixel-box-red p-5 text-center space-y-3">
                    <div className="font-pixel text-xs sm:text-sm text-[#e83b47]">
                      ✕ KAMU PINGSAN DI HADAPAN {bossDisplayName.toUpperCase()}! (0/3 HATI)
                    </div>
                    <p className="font-vt text-xl text-[#f4f1ea]">
                      Saat kamu pingsan, hatimu pulih penuh kembali (3/3), namun{' '}
                      <strong className="text-[#f5b935]">
                        {bossDisplayName} memulihkan 1 segmen HP-nya
                      </strong>{' '}
                      (tidak pernah melebihi penuh). Bangkit dan tantang kembali!
                    </p>
                    <button
                      type="button"
                      onClick={handleBossFaintRetry}
                      className="pixel-btn px-5 py-2.5 bg-[#f5b935] text-[#0d0a1a] font-pixel text-xs"
                    >
                      Bangkit Kembali (Hati Penuh, Bos Pulih 1 Segmen)
                    </button>
                  </div>
                ) : currentPhaseData && currentVariant ? (
                  <div
                    className="bg-[#120d26] border-2 p-4 space-y-4"
                    style={{
                      borderColor: isFloor4Boss
                        ? '#3ac5eb'
                        : isFloor3Boss
                        ? '#9b5de5'
                        : isFloor2Boss
                        ? '#1d8a3d'
                        : '#38d864',
                    }}
                  >
                    {/* Phase Header & Scenario Intro */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#3a306e] pb-2.5">
                      <div>
                        <span className="font-pixel text-[10px] text-[#38d864]">
                          FASE {currentPhaseData.phase} DARI {totalSpellbookPhases} ·{' '}
                          {currentPhaseData.title
                            ? `${currentPhaseData.title.toUpperCase()} (TOPIK #${currentPhaseData.topicId})`
                            : `SEGMEN TOPIK #${currentPhaseData.topicId}`}
                        </span>
                        <div className="font-vt text-base text-[#b3aad1]">
                          Varian Soal: {currentVariantIndex === 0 ? 'Varian A' : 'Varian B'} ·{' '}
                          {phaseStep === 'spell'
                            ? 'LANGKAH 1: Pilih Mantra yang Tepat'
                            : 'LANGKAH 2: Selesaikan Perhitungan'}
                        </div>
                      </div>

                      {phaseStep === 'spell' && (
                        <button
                          type="button"
                          disabled={
                            currentFloorBossProgress.potions <= 0 || formulaPeekActive
                          }
                          onClick={() => {
                            playClick();
                            if (useBossPotion(floor.id)) {
                              setFormulaPeekActive(true);
                            }
                          }}
                          className="pixel-btn px-3 py-1.5 bg-[#0d1b2a] text-[#3ac5eb] border-[#3ac5eb] font-pixel text-[9px]"
                        >
                          {formulaPeekActive
                            ? '✓ Rumus Mantra Terlihat (Ramuan Aktif)'
                            : `🧪 Gunakan Ramuan Ingatan (Sisa: ${currentFloorBossProgress.potions})`}
                        </button>
                      )}
                    </div>

                    {/* Special Callout for Echo Boss Phases ("Gema Lantai 1" / "Gema Lantai 1-2" / "Gema Lantai 2-3") */}
                    {currentPhaseData.title && (
                      <div className="bg-[#291324] border-2 border-[#f5b935] px-3.5 py-2 flex items-center justify-between gap-2">
                        <span className="font-pixel text-[9px] text-[#f5b935]">
                          ★ FASE KHUSUS: {currentPhaseData.title.toUpperCase()}
                        </span>
                        <span className="font-vt text-base text-[#f4f1ea]">
                          {isFloor4Boss
                            ? 'Gunakan tab Lantai 1, Lantai 2, atau Lantai 3 untuk memilih mantra gema yang tepat!'
                            : isFloor3Boss
                            ? 'Gunakan tab Lantai 1 atau Lantai 2 untuk memilih mantra gema yang tepat!'
                            : 'Pilih mantra yang sesuai dari tab Mantra Lantai 1!'}
                        </span>
                      </div>
                    )}

                    {/* Boss Scenario Text */}
                    <div className="bg-[#0d0a1a] border-2 border-[#f5b935] p-4">
                      <div className="font-pixel text-[9px] text-[#f5b935] mb-1">
                        SKENARIO SERANGAN {bossDisplayName.toUpperCase()}:
                      </div>
                      <p className="font-vt text-xl sm:text-2xl text-[#f4f1ea] leading-snug">
                        &ldquo;{currentVariant.scenario}&rdquo;
                      </p>
                    </div>

                    {/* STEP 1: Choose the Spell */}
                    {phaseStep === 'spell' && (
                      <div className="space-y-3">
                        <div className="font-pixel text-[10px] text-[#3ac5eb]">
                          LANGKAH 1 — PILIH MANTRA UNTUK MENANGKAL SKENARIO INI (RUMUS TERSEMBUNYI):
                        </div>

                        {/* Floors 2, 3, 4, 5: Grouped under Floor Tabs, current floor tab open by default */}
                        {floor.id >= 2 ? (
                          <div
                            className="space-y-3 border-2 border-[#3a306e] p-3 bg-[#0d0a1a]"
                            aria-label="Daftar Mantra Terbuka Berdasarkan Tab Lantai"
                          >
                            {/* Floor Tabs */}
                            <div
                              role="tablist"
                              aria-label="Tab Kelompok Mantra per Lantai"
                              className="flex flex-wrap items-center gap-2 border-b-2 border-[#3a306e] pb-2.5"
                            >
                              {(isFloor5Boss
                                ? ([5, 4, 3, 2, 1] as const)
                                : isFloor4Boss
                                ? ([4, 3, 2, 1] as const)
                                : isFloor3Boss
                                ? ([3, 2, 1] as const)
                                : ([2, 1] as const)
                              ).map((tabFloorId) => {
                                const isTabActive = selectedSpellFloorTab === tabFloorId;
                                const tabCount =
                                  tabFloorId === 5
                                    ? unlockedFloor5Spells.length
                                    : tabFloorId === 4
                                    ? unlockedFloor4Spells.length
                                    : tabFloorId === 3
                                    ? unlockedFloor3Spells.length
                                    : tabFloorId === 2
                                    ? unlockedFloor2Spells.length
                                    : unlockedFloor1Spells.length;
                                const tabLabel =
                                  tabFloorId === 5
                                    ? `Lantai 5 (${tabCount} Mantra)`
                                    : tabFloorId === 4
                                    ? `Lantai 4 (${tabCount} Mantra)`
                                    : tabFloorId === 3
                                    ? `Lantai 3 (${tabCount} Mantra)`
                                    : tabFloorId === 2
                                    ? `Lantai 2 (${tabCount} Mantra)`
                                    : `Lantai 1 (${tabCount} Mantra)`;

                                return (
                                  <button
                                    key={tabFloorId}
                                    type="button"
                                    role="tab"
                                    aria-selected={isTabActive}
                                    data-floor-tab={tabFloorId}
                                    onClick={() => {
                                      playClick();
                                      setSelectedSpellFloorTab(tabFloorId);
                                    }}
                                    className={`pixel-btn px-3 py-1.5 font-pixel text-[9px] ${
                                      isTabActive
                                        ? tabFloorId === 5
                                          ? 'bg-[#fb923c] text-[#0d0a1a]'
                                          : tabFloorId === 4
                                          ? 'bg-[#3ac5eb] text-[#0d0a1a]'
                                          : tabFloorId === 3
                                          ? 'bg-[#9b5de5] text-[#0d0a1a]'
                                          : tabFloorId === 2
                                          ? 'bg-[#1d8a3d] text-[#f4f1ea]'
                                          : 'bg-[#38d864] text-[#0d0a1a]'
                                        : 'bg-[#16112b] text-[#b3aad1]'
                                    }`}
                                  >
                                    {tabLabel}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Active Floor Tab Spell Cards */}
                            <div
                              role="tabpanel"
                              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1"
                            >
                              {activeSpellTabList.map((spell) => {
                                const visual = SPELL_VISUALS[spell.id] || SPELL_VISUALS.s1;
                                const isCorrectTarget = spell.id === effectiveRequiredSpellId;

                                return (
                                  <button
                                    key={spell.id}
                                    type="button"
                                    disabled={spellFeedback !== null}
                                    data-spell-id={spell.id}
                                    data-correct-spell={isCorrectTarget ? 'true' : undefined}
                                    onClick={() => handleSelectBossSpell(spell.id)}
                                    style={{ borderColor: visual.color }}
                                    className="p-2.5 bg-[#16112b] hover:bg-[#1f193d] border-2 text-left flex flex-col justify-between transition-colors"
                                  >
                                    <div>
                                      <div
                                        className="font-pixel text-[8px] mb-1"
                                        style={{ color: visual.color }}
                                      >
                                        L{spell.floorId} · MANTRA #{spell.topicId} (
                                        {spell.id.toUpperCase()})
                                      </div>
                                      <div className="font-pixel text-[11px] text-[#f4f1ea]">
                                        {spell.name}
                                      </div>
                                    </div>

                                    {formulaPeekActive && (
                                      <div className="mt-2 pt-1.5 border-t border-[#3a306e] font-mono text-[10px] text-[#3ac5eb] space-y-0.5">
                                        {spell.formulas.map((f, i) => (
                                          <div key={i}>• {f}</div>
                                        ))}
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          /* Floor 1 Boss: 6 Floor 1 spell cards */
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {floor1Spells.map((spell) => {
                              const visual = SPELL_VISUALS[spell.id] || SPELL_VISUALS.s1;
                              const isCorrectTarget = spell.id === effectiveRequiredSpellId;

                              return (
                                <button
                                  key={spell.id}
                                  type="button"
                                  disabled={spellFeedback !== null}
                                  data-spell-id={spell.id}
                                  data-correct-spell={isCorrectTarget ? 'true' : undefined}
                                  onClick={() => handleSelectBossSpell(spell.id)}
                                  style={{ borderColor: visual.color }}
                                  className="p-3 bg-[#16112b] hover:bg-[#1f193d] border-2 text-left flex flex-col justify-between transition-colors"
                                >
                                  <div>
                                    <div
                                      className="font-pixel text-[8px] mb-1"
                                      style={{ color: visual.color }}
                                    >
                                      MANTRA #{spell.topicId} ({spell.id.toUpperCase()})
                                    </div>
                                    <div className="font-pixel text-xs text-[#f4f1ea]">
                                      {spell.name}
                                    </div>
                                  </div>

                                  {formulaPeekActive && (
                                    <div className="mt-2 pt-2 border-t border-[#3a306e] font-mono text-[11px] text-[#3ac5eb] space-y-0.5">
                                      {spell.formulas.map((f, i) => (
                                        <div key={i}>• {f}</div>
                                      ))}
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Wrong Spell Fizzle Feedback */}
                        {spellFeedback && !spellFeedback.isCorrect && (
                          <div className="bg-[#291324] border-2 border-[#e83b47] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="font-pixel text-[10px] text-[#e83b47]">
                                ✕ MANTRA GAGAL / MELEMPEM! (-1 HATI)
                              </div>
                              <p className="font-vt text-xl text-[#f4f1ea] mt-1">
                                Mantra yang tepat untuk fase ini adalah:{' '}
                                <strong className="text-[#38d864]">
                                  {spellFeedback.correctSpellName}
                                </strong>
                                .
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                playClick();
                                setSpellFeedback(null);
                                setPhaseStep('calc');
                              }}
                              className="pixel-btn px-4 py-2 bg-[#f5b935] text-[#0d0a1a] font-pixel text-[10px] shrink-0"
                            >
                              Lanjut ke Langkah 2 →
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* STEP 2: Answer the Calculation Question (4 shuffled options) */}
                    {phaseStep === 'calc' && (
                      <div className="space-y-3">
                        <div className="font-pixel text-[10px] text-[#38d864]">
                          LANGKAH 2 — HITUNG &amp; HANCURKAN SEGMEN PERISAI BOS:
                        </div>

                        <div className="space-y-2">
                          {shuffledCalcOptions.map((opt, idx) => {
                            const isSelected = selectedCalcOptionId === opt.optionId;
                            const showResult = selectedCalcOptionId !== null;

                            let btnStyle =
                              'bg-[#16112b] border-[#5c4e99] text-[#f4f1ea] hover:border-[#f5b935]';
                            let prefix = `${String.fromCharCode(65 + idx)}.`;

                            if (showResult) {
                              if (opt.isCorrect) {
                                btnStyle =
                                  'bg-[#0a1714] border-[#38d864] text-[#38d864] font-bold';
                                prefix = `✓ [BENAR] ${String.fromCharCode(65 + idx)}.`;
                              } else if (isSelected && !opt.isCorrect) {
                                btnStyle = 'bg-[#291324] border-[#e83b47] text-[#e83b47]';
                                prefix = `✕ [SALAH] ${String.fromCharCode(65 + idx)}.`;
                              } else {
                                btnStyle =
                                  'bg-[#0d0a1a] border-[#2b2352] text-[#b3aad1] opacity-65';
                              }
                            }

                            return (
                              <button
                                key={opt.optionId}
                                type="button"
                                disabled={showResult}
                                data-correct={opt.isCorrect ? 'true' : undefined}
                                onClick={() => handleSelectBossCalcOption(opt)}
                                className={`w-full text-left p-3 border-2 font-vt text-lg sm:text-xl flex items-start gap-2.5 ${btnStyle}`}
                              >
                                <span className="font-pixel text-[10px] mt-1 shrink-0">
                                  {prefix}
                                </span>
                                <span>{opt.text}</span>
                              </button>
                            );
                          })}
                        </div>

                        {calcFeedback && (
                          <div
                            className={`p-3.5 border-2 ${
                              calcFeedback.isCorrect
                                ? 'bg-[#0a1714] border-[#38d864]'
                                : 'bg-[#291324] border-[#e83b47]'
                            }`}
                          >
                            <div className="font-pixel text-[10px] text-[#f5b935] mb-1">
                              {calcFeedback.isCorrect
                                ? `✓ SEGMEN FASE ${currentPhaseData.phase} HANCUR!`
                                : '✕ PERHITUNGAN MELESET (-1 HATI) — PENJELASAN:'}
                            </div>
                            <p className="font-vt text-xl text-[#f4f1ea]">
                              {calcFeedback.explanation}
                            </p>
                            {hearts > 0 && (
                              <div className="mt-3 flex justify-end">
                                <button
                                  type="button"
                                  onClick={handleProceedAfterCalc}
                                  className="pixel-btn px-4 py-2 bg-[#f5b935] text-[#0d0a1a] font-pixel text-[10px]"
                                >
                                  {calcFeedback.isCorrect
                                    ? currentPhaseData.phase < totalSpellbookPhases
                                      ? `Lanjut ke Fase ${currentPhaseData.phase + 1} →`
                                      : 'Lanjut ke Segel Akhir Bos →'
                                    : 'Ulangi Fase Ini (Varian Berikutnya) →'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* COMBINED "TANDA SUDAH PAHAM" CHECKLIST (Shown after all phases cleared on Floors 1-4, or always on Floor 5) */}
            {(!isSpellbookBoss || allPhasesCleared) && (
              <>
                {isSpellbookBoss && !bossDefeatedAnim && (
                  <div className="bg-[#0a1714] border-2 border-[#38d864] p-3.5 font-vt text-xl text-[#38d864]">
                    {isFloor5Boss ? (
                      <>
                        ⏱ Seluruh 8 segmen waktu <strong>Raja Deadline</strong> telah dihancurkan —
                        jam raksasa pecah berkeping-keping dan aliran waktu kembali normal! Sekarang
                        centang daftar gabungan <strong>Tanda sudah paham</strong> (Topik 21–28)
                        serta <strong>Tantangan Bos</strong> di bawah untuk mengklaim lencana, relik{' '}
                        <strong>Stopwatch Perak</strong>, dan +{BOSS_XP} XP!
                      </>
                    ) : isFloor4Boss ? (
                      <>
                        ⚡ Seluruh 5 segmen inti <strong>Mecha-Core</strong> telah dilumpuhkan —
                        percikan listrik berterbangan lalu daya padam! Sekarang centang daftar
                        gabungan <strong>Tanda sudah paham</strong> (Topik 18–20) serta{' '}
                        <strong>Tantangan Bos</strong> di bawah untuk mengklaim lencana, relik{' '}
                        <strong>Chip Edge</strong>, dan +{BOSS_XP} XP!
                      </>
                    ) : isFloor3Boss ? (
                      <>
                        ✨ Seluruh 7 kepala <strong>Hydra Berkepala Banyak</strong> telah memudar
                        satu demi satu menjadi percikan cahaya piksel! Sekarang centang daftar
                        gabungan <strong>Tanda sudah paham</strong> (Topik 12–17) serta{' '}
                        <strong>Tantangan Bos</strong> di bawah untuk mengklaim lencana, relik{' '}
                        <strong>Inti Neuron</strong>, dan +{BOSS_XP} XP!
                      </>
                    ) : isFloor2Boss ? (
                      <>
                        🍂 Seluruh 6 segmen dahan <strong>Golem Pohon Purba</strong> telah luruh
                        menjadi guguran daun piksel! Sekarang centang daftar gabungan{' '}
                        <strong>Tanda sudah paham</strong> (Topik 7–11) serta{' '}
                        <strong>Tantangan Bos</strong> di bawah untuk mengklaim lencana, relik{' '}
                        <strong>Daun Emas</strong>, dan +{BOSS_XP} XP!
                      </>
                    ) : (
                      <>
                        ★ Seluruh 6 segmen perisai <strong>{bossDisplayName}</strong> telah
                        dihancurkan! Sekarang centang daftar gabungan{' '}
                        <strong>Tanda sudah paham</strong> di bawah untuk mengklaim Lencana,
                        Relik, dan +{BOSS_XP} XP!
                      </>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="font-pixel text-xs text-[#f5b935]">
                      DAFTAR GABUNGAN &ldquo;TANDA SUDAH PAHAM&rdquo; ({checkedCount}/
                      {totalChecklistCount})
                    </div>
                    {!allTopicsChecked && (
                      <button
                        type="button"
                        onClick={handleCheckAll}
                        className="pixel-btn px-2.5 py-1 bg-[#1f193d] text-[#38d864] font-vt text-base"
                      >
                        Centang Semua Kriteria
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {floor.topics.map((t) => {
                      const isItemChecked = Boolean(checkedItems[t.id]);
                      return (
                        <label
                          key={t.id}
                          className={`flex items-start gap-3 p-3 border-2 cursor-pointer select-none transition-colors ${
                            isItemChecked
                              ? 'bg-[#0a1714] border-[#38d864]'
                              : 'bg-[#120d26] border-[#5c4e99] hover:border-[#f5b935]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isItemChecked}
                            onChange={() => handleToggleTopicCheck(t.id)}
                            className="mt-1 w-5 h-5 accent-[#38d864] cursor-pointer shrink-0"
                          />
                          <div className="font-vt text-lg sm:text-xl text-[#f4f1ea] leading-snug">
                            <span className="text-[#f5b935] font-bold">
                              #{t.number} {t.name}:
                            </span>{' '}
                            {t.understandingSign}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Floors 2-5 Real-world Challenge Confirmation */}
                {floor.id !== 1 && (
                  <div className="bg-[#120d26] border-2 border-[#e83b47] p-4">
                    <div className="font-pixel text-xs text-[#e83b47] mb-2">
                      TANTANGAN BOS LANTAI {floor.id}
                    </div>
                    <p className="font-vt text-xl sm:text-2xl text-[#f4f1ea] leading-snug mb-3">
                      &ldquo;{floor.boss.challenge}&rdquo;
                    </p>
                    <label className="flex items-start gap-3 cursor-pointer select-none bg-[#16112b] border-2 border-[#f5b935] p-3">
                      <input
                        type="checkbox"
                        checked={challengeReady}
                        onChange={(e) => {
                          playClick();
                          setChallengeReady(e.target.checked);
                        }}
                        className="mt-1 w-5 h-5 accent-[#f5b935] cursor-pointer shrink-0"
                      />
                      <span className="font-vt text-lg sm:text-xl text-[#f4f1ea]">
                        Saya siap menyelesaikan <strong className="text-[#f5b935]">Tantangan Bos</strong>{' '}
                        gabungan di atas secara mandiri!
                      </span>
                    </label>
                  </div>
                )}

                {/* Victory Banner + Relic Drop */}
                {bossDefeatedAnim && (
                  <motion.div
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    role="status"
                    aria-live="polite"
                    className="pixel-box-gold p-4 bg-[#120d26] space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <div className="font-pixel text-xs text-[#38d864]">
                          ★ {bossDisplayName.toUpperCase()} DITAKLUKKAN! (+
                          {claimedBossXP !== null ? claimedBossXP : alreadyDefeated ? 0 : BOSS_XP}{' '}
                          XP)
                        </div>
                        <div className="font-vt text-xl text-[#f4f1ea] mt-1">
                          Lencana diperoleh:{' '}
                          <strong className="text-[#f5b935]">{floor.boss.badge.name}</strong>
                        </div>
                        <div className="font-vt text-lg text-[#3ac5eb]">
                          {floor.id === 5 ? (
                            <div className="space-y-1">
                              <div className="font-bold text-[#fb923c]">
                                Boss dikalahkan: {defeatedBosses.length}/5
                              </div>
                              {defeatedBosses.length < 5 ? (
                                <div className="text-[#f4f1ea]">
                                  Menara Master (Lantai 6) baru terbuka setelah semua 5 Bos
                                  dikalahkan. Bos yang belum dikalahkan:{' '}
                                  <strong className="text-[#f5b935]">
                                    {undefeatedBossFloors
                                      .map((f) => `Lantai ${f.id} (${f.boss.name})`)
                                      .join(', ')}
                                  </strong>
                                  .
                                </div>
                              ) : (
                                <div className="text-[#38d864]">
                                  Seluruh 5 Bos Lantai telah ditaklukkan! Menara Master (Lantai 6)
                                  kini terbuka!
                                </div>
                              )}
                            </div>
                          ) : floor.id === 4 ? (
                            `Guild Hall menunggu: 8 quest paralel · Bos ditaklukkan untuk syarat Menara Master: ${defeatedBosses.length}/5`
                          ) : floor.id < 4 ? (
                            `Pintu Lantai ${floor.id + 1} kini telah terbuka!`
                          ) : (
                            'Menara Master (Lantai 6) kini telah terbuka!'
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-[#0d0a1a] border-2 border-[#f5b935] p-3 shrink-0">
                        <RelicSprite iconType={floor.boss.relic.iconType} size={42} />
                        <div>
                          <div className="font-pixel text-[9px] text-[#f5b935]">
                            RELIK BOS JATUH!
                          </div>
                          <div className="font-vt text-xl text-[#f4f1ea]">
                            {bossRelicDisplayName}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Action Footer */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      closeBossBattle();
                    }}
                    className="pixel-btn px-4 py-2.5 bg-[#1f193d] text-[#f4f1ea] font-pixel text-xs"
                  >
                    Kembali ke Peta
                  </button>

                  {!bossDefeatedAnim ? (
                    <button
                      type="button"
                      disabled={!canClaimBossVictory}
                      onClick={handleDefeatBoss}
                      className="pixel-btn px-5 py-3 bg-[#e83b47] text-[#f4f1ea] font-pixel text-xs gap-2"
                    >
                      <PixelSwordSprite size={18} />
                      <span>Klaim Kemenangan Bos!</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        const nextFloor = floor.id < 5 ? floor.id + 1 : 6;
                        closeBossBattle();
                        selectFloor(nextFloor);
                      }}
                      className="pixel-btn px-5 py-3 bg-[#38d864] text-[#0d0a1a] font-pixel text-xs"
                    >
                      {floor.id === 4
                        ? 'Kunjungi Guild Hall (8 Quest Paralel) →'
                        : floor.id < 4
                        ? `Masuki Lantai ${floor.id + 1} →`
                        : 'Masuki Menara Master (Lantai 6) →'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
