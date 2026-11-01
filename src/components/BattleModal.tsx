import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FLOORS } from '../data/roadmap.js';
import { useGameStore } from '../store/useGameStore';
import { calculateRoomXP } from '../game/formulas';
import { getMonsterDialogue } from '../game/quizEngine';
import {
  ECHO_BONUS_XP,
  MAX_HEARTS,
  PreparedBattleQuestion,
  SPELL_VISUALS,
  ShuffledOption,
  SpellVisualTheme,
  buildBattleDeck,
  calculateRoomCritBonusXP,
  evaluateFloor1Battle,
  getTopicContent,
} from '../game/spellbookEngine';
import {
  AvatarSprite,
  MonsterSprite,
  PixelHeartSprite,
  PixelSwordSprite,
  RelicSprite,
  SpriteCombatState,
} from './PixelSprites';
import { ScrollPanel } from './ScrollView';
import { useSound } from '../hooks/useSound.js';

const PARTICLE_OFFSETS = [
  { x: -55, y: -45, color: '#38d864' },
  { x: 55, y: -40, color: '#f5b935' },
  { x: -65, y: 15, color: '#3ac5eb' },
  { x: 65, y: 20, color: '#e83b47' },
  { x: -30, y: -65, color: '#9b5de5' },
  { x: 35, y: -60, color: '#f4f1ea' },
  { x: -40, y: 50, color: '#f5b935' },
  { x: 45, y: 55, color: '#38d864' },
];

type RoomStep = 'scroll' | 'battle' | 'reward';

export const BattleModal: React.FC = () => {
  const selectedTopicId = useGameStore((s) => s.selectedTopicId);
  const completedRooms = useGameStore((s) => s.completedRooms);
  const quizBonusClaimedRooms = useGameStore((s) => s.quizBonusClaimedRooms);
  const echoBonusClaimedRooms = useGameStore((s) => s.echoBonusClaimedRooms);
  const bestScoreByTopic = useGameStore((s) => s.bestScoreByTopic);
  const questionStats = useGameStore((s) => s.questionStats);
  const avatarId = useGameStore((s) => s.avatarId);
  const playerName = useGameStore((s) => s.playerName);
  const reduceMotion = useGameStore((s) => s.reduceMotion);
  const closeRoomBattle = useGameStore((s) => s.closeRoomBattle);
  const defeatRoom = useGameStore((s) => s.defeatRoom);
  const recordQuizAttempt = useGameStore((s) => s.recordQuizAttempt);
  const recordQuestionAnswer = useGameStore((s) => s.recordQuestionAnswer);
  const evidenceNotes = useGameStore((s) => s.evidenceNotes);
  const setEvidenceNote = useGameStore((s) => s.setEvidenceNote);
  const setView = useGameStore((s) => s.setView);

  const { playAttack, playDefeat, playPlayerHit, playClick, playCast, playFizzle } = useSound();

  const modalRef = useRef<HTMLDivElement | null>(null);

  const floor = FLOORS.find((f) => f.topics.some((t) => t.id === selectedTopicId));
  const topic = floor?.topics.find((t) => t.id === selectedTopicId);
  const floor1TopicContent = topic ? getTopicContent(topic.id) : undefined;
  const isFloor1Room = Boolean(floor1TopicContent);

  const alreadyCompleted = topic ? completedRooms.includes(topic.id) : false;
  const bonusAlreadyClaimed = topic ? quizBonusClaimedRooms.includes(topic.id) : false;
  const echoAlreadyClaimed = topic ? echoBonusClaimedRooms.includes(topic.id) : false;

  const [roomStep, setRoomStep] = useState<RoomStep>('scroll');
  const [isChecked, setIsChecked] = useState(false);
  const [monsterHP, setMonsterHP] = useState(100);
  const [monsterState, setMonsterState] = useState<SpriteCombatState>('idle');
  const [playerHitAlert, setPlayerHitAlert] = useState(false);
  const [spellCastEffect, setSpellCastEffect] = useState<{
    spellId: string;
    spellName: string;
    color: string;
    runeSymbol: string;
    animStyle: SpellVisualTheme['animStyle'];
  } | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [victoryReward, setVictoryReward] = useState<{
    totalXP: number;
    baseXP: number;
    bonusXP: number;
    echoXP: number;
    unlockedSpellId: string | null;
  } | null>(null);

  // Battle Question Deck state
  const [battleDeck, setBattleDeck] = useState<PreparedBattleQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [topicCorrectCount, setTopicCorrectCount] = useState(0);
  const [echoAnsweredCorrectly, setEchoAnsweredCorrectly] = useState(false);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [isFainted, setIsFainted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    if (!topic) return;
    const done = completedRooms.includes(topic.id);
    const f1Content = getTopicContent(topic.id);

    setRoomStep(f1Content && !done ? 'scroll' : 'battle');
    setIsChecked(done);
    setMonsterHP(done ? 0 : 100);
    setMonsterState(done ? 'defeated' : 'idle');
    setPlayerHitAlert(false);
    setSpellCastEffect(null);
    setRetryMessage(null);
    setVictoryReward(null);

    if (f1Content) {
      const deck = buildBattleDeck(topic.id, completedRooms, questionStats);
      setBattleDeck(deck);
      setCurrentQIndex(0);
      setSelectedOptionId(null);
      setTopicCorrectCount(done ? 5 : 0);
      setEchoAnsweredCorrectly(false);
      setHearts(MAX_HEARTS);
      setIsFainted(false);
      setQuizCompleted(done);
    } else {
      setBattleDeck([]);
      setCurrentQIndex(0);
      setSelectedOptionId(null);
      setTopicCorrectCount(0);
      setEchoAnsweredCorrectly(false);
      setHearts(MAX_HEARTS);
      setIsFainted(false);
      setQuizCompleted(true);
    }
  }, [selectedTopicId]);

  // Keyboard Escape + Focus Trap inside Modal
  useEffect(() => {
    if (!selectedTopicId) return undefined;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeRoomBattle();
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
  }, [selectedTopicId, closeRoomBattle]);

  if (!selectedTopicId || !floor || !topic) return null;

  const baseRoomXP = calculateRoomXP(topic.weeks);
  const monsterDialogue = getMonsterDialogue(topic.id);
  const currentQuestion = battleDeck[currentQIndex];

  const quizEval = isFloor1Room
    ? evaluateFloor1Battle(topicCorrectCount, 5)
    : { passedQuiz: true, scorePercent: 100 };

  const canAttack =
    isChecked &&
    (!isFloor1Room || (quizCompleted && quizEval.passedQuiz && !isFainted)) &&
    roomStep === 'battle';

  const handleSelectOption = (option: ShuffledOption) => {
    if (selectedOptionId !== null || isFainted || quizCompleted || !currentQuestion) return;
    setSelectedOptionId(option.optionId);
    setRetryMessage(null);

    // Record per-question history for Dojo weighted sampling
    recordQuestionAnswer(currentQuestion.id, option.isCorrect);

    if (option.isCorrect) {
      playCast();
      const visual = SPELL_VISUALS[currentQuestion.spellId] || SPELL_VISUALS.s1;
      setSpellCastEffect({
        spellId: currentQuestion.spellId,
        spellName: currentQuestion.spellName,
        color: visual.color,
        runeSymbol: visual.runeSymbol,
        animStyle: visual.animStyle,
      });

      if (currentQuestion.isEcho) {
        setEchoAnsweredCorrectly(true);
      } else {
        setTopicCorrectCount((prev) => prev + 1);
      }

      setMonsterState('hit');
      setMonsterHP((prev) => Math.max(15, prev - 18));
      setTimeout(() => {
        setSpellCastEffect(null);
        setMonsterState((prev) => (prev === 'defeated' ? 'defeated' : 'idle'));
      }, 650);
    } else {
      playFizzle();
      playPlayerHit();
      setPlayerHitAlert(true);
      const nextHearts = Math.max(0, hearts - 1);
      setHearts(nextHearts);
      setTimeout(() => {
        setPlayerHitAlert(false);
      }, 500);
      if (nextHearts === 0) {
        setIsFainted(true);
      }
    }
  };

  const handleNextQuestion = () => {
    playClick();
    if (currentQIndex + 1 < battleDeck.length) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOptionId(null);
    } else {
      setQuizCompleted(true);
      setSelectedOptionId(null);
      const finalEval = evaluateFloor1Battle(topicCorrectCount, 5);
      recordQuizAttempt(topic.id, finalEval.scorePercent);
    }
  };

  const handleRetryQuiz = () => {
    playClick();
    if (isFloor1Room && topicCorrectCount > 0) {
      const partialEval = evaluateFloor1Battle(topicCorrectCount, 5);
      recordQuizAttempt(topic.id, partialEval.scorePercent);
    }
    const reshuffledDeck = buildBattleDeck(topic.id, completedRooms, questionStats);
    setBattleDeck(reshuffledDeck);
    setCurrentQIndex(0);
    setSelectedOptionId(null);
    setTopicCorrectCount(0);
    setEchoAnsweredCorrectly(false);
    setHearts(MAX_HEARTS);
    setIsFainted(false);
    setQuizCompleted(false);
    setMonsterHP(100);
    setMonsterState('idle');
    setRetryMessage(null);
  };

  const handleAttack = () => {
    if (!canAttack) return;
    playAttack();
    setRetryMessage(null);
    setMonsterState('hit');
    setMonsterHP(0);

    setTimeout(() => {
      playDefeat();
      setMonsterState('defeated');
      const result = defeatRoom(
        topic.id,
        isFloor1Room ? topicCorrectCount : 0,
        isFloor1Room ? quizEval.scorePercent : undefined,
        isFloor1Room ? echoAnsweredCorrectly : false
      );
      setVictoryReward({
        totalXP: result.xpGained,
        baseXP: result.baseXPGained,
        bonusXP: result.bonusXPGained,
        echoXP: result.echoXPGained,
        unlockedSpellId: result.unlockedSpellId,
      });
      setRoomStep('reward');
    }, 360);
  };

  const handleNotReady = () => {
    playPlayerHit();
    setPlayerHitAlert(true);
    setRetryMessage('Ulangi topik ini sebelum lanjut');
    setTimeout(() => {
      setPlayerHitAlert(false);
    }, 550);
  };

  const bestScore = bestScoreByTopic[topic.id];
  const potentialCritBonusXP = calculateRoomCritBonusXP(baseRoomXP, bonusAlreadyClaimed);
  const activeSpellTheme = floor1TopicContent
    ? SPELL_VISUALS[floor1TopicContent.spell.id] || SPELL_VISUALS.s1
    : SPELL_VISUALS.s1;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="battle-modal-title"
      >
        <motion.div
          ref={modalRef}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
          animate={
            playerHitAlert && !reduceMotion
              ? { opacity: 1, scale: 1, x: [-12, 12, -10, 10, -5, 5, 0] }
              : { opacity: 1, scale: 1, x: 0, y: 0 }
          }
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: reduceMotion ? 0.12 : 0.28 }}
          className={`w-full max-w-3xl my-auto ${
            playerHitAlert ? 'pixel-box-red' : 'pixel-box'
          } bg-[#16112b] overflow-hidden`}
        >
          {/* STEP 1: SCROLL ("GULUNGAN") SCREEN FOR FLOOR 1 */}
          {isFloor1Room && floor1TopicContent && roomStep === 'scroll' && (
            <ScrollPanel
              topicContent={floor1TopicContent}
              topicTitle={`Topik #${topic.number}: ${topic.name}`}
              reduceMotion={reduceMotion}
              mode="battle-entry"
              onReadyToFight={() => setRoomStep('battle')}
              onClose={closeRoomBattle}
            />
          )}

          {/* STEP 2 & 3: BATTLE & REWARD SCREENS */}
          {(!isFloor1Room || roomStep !== 'scroll') && (
            <>
              {/* Top Header Bar */}
              <div className="bg-[#120d26] border-b-4 border-[#3a306e] p-3.5 sm:p-4 flex items-center justify-between gap-2">
                <div>
                  <div className="font-pixel text-[9px] text-[#f5b935]">
                    LANTAI {floor.id} · RUANG TOPIK #{topic.number}
                    {topic.parallel ? ' · SIDE QUEST PARALEL' : ''}
                  </div>
                  <h2
                    id="battle-modal-title"
                    className="font-pixel text-xs sm:text-sm text-[#f4f1ea] mt-1"
                  >
                    {topic.name}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {isFloor1Room && roomStep === 'battle' && (
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setRoomStep('scroll');
                      }}
                      className="pixel-btn px-2.5 py-1.5 bg-[#120d26] text-[#3ac5eb] border-[#3ac5eb] font-pixel text-[9px]"
                    >
                      📖 Buka Gulungan
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      closeRoomBattle();
                    }}
                    aria-label="Tutup Panel Pertarungan"
                    className="pixel-btn px-2.5 py-1.5 bg-[#1f193d] text-[#f4f1ea] font-pixel text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Battle Arena Visual (Player with 3 Heart-HP vs Monster with 3 States + Spell Cast Projectile) */}
              <div className="p-4 sm:p-5 bg-[#0d0a1a] border-b-4 border-[#3a306e] relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
                  {/* Player Side + 3 Heart-HP */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      animate={
                        playerHitAlert && !reduceMotion
                          ? { filter: 'brightness(2) sepia(1) hue-rotate(-50deg)', scale: 0.9 }
                          : { filter: 'none', scale: 1 }
                      }
                      className="w-20 h-20 bg-[#16112b] border-2 border-[#38d864] flex items-center justify-center"
                    >
                      <AvatarSprite avatarId={avatarId} size={60} />
                    </motion.div>
                    <span className="font-pixel text-[10px] text-[#38d864] mt-2">
                      {playerName}
                    </span>

                    {isFloor1Room && (
                      <div
                        className="mt-1.5 flex items-center gap-1 bg-[#16112b] border border-[#5c4e99] px-2.5 py-1"
                        aria-label={`Hati Pemain: ${hearts} dari ${MAX_HEARTS}`}
                      >
                        {Array.from({ length: MAX_HEARTS }).map((_, idx) => (
                          <PixelHeartSprite key={idx} filled={idx < hearts} size={16} />
                        ))}
                        <span className="font-pixel text-[8px] text-[#f4f1ea] ml-1 tabular-nums">
                          {hearts}/{MAX_HEARTS} HP
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Center VS / Spell Cast Projectile & Rune Circle Animation */}
                  <div className="flex flex-col items-center relative min-w-[130px]">
                    <span className="font-pixel text-sm text-[#f5b935]">VS</span>
                    <AnimatePresence>
                      {spellCastEffect && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.6, x: -30 }}
                          animate={
                            reduceMotion
                              ? { opacity: 1, scale: 1, x: 0 }
                              : spellCastEffect.animStyle === 'roots'
                              ? { opacity: 1, scale: [0.7, 1.18, 1], y: [18, -6, 0] }
                              : spellCastEffect.animStyle === 'leaves'
                              ? { opacity: 1, rotate: [-8, 8, -4, 0], x: [-20, 20, 0] }
                              : spellCastEffect.animStyle === 'prisms'
                              ? { opacity: 1, scale: [0.6, 1.22, 1], rotate: [0, 4, -4, 0] }
                              : spellCastEffect.animStyle === 'forge'
                              ? { opacity: 1, y: [-18, 6, 0], scale: [1.2, 0.92, 1] }
                              : spellCastEffect.animStyle === 'constellation'
                              ? { opacity: 1, scale: [0.5, 1.15, 1], x: [-15, 15, 0] }
                              : spellCastEffect.animStyle === 'synapse'
                              ? { opacity: 1, scale: [0.75, 1.2, 1], y: [-10, 6, 0] }
                              : spellCastEffect.animStyle === 'tensor'
                              ? { opacity: 1, x: [-30, 18, 0], scale: [0.9, 1.18, 1] }
                              : spellCastEffect.animStyle === 'kernel'
                              ? { opacity: 1, scale: [0.6, 1.16, 1], rotate: [-5, 5, 0] }
                              : spellCastEffect.animStyle === 'sequence'
                              ? { opacity: 1, x: [-28, 12, -6, 0], scale: [0.85, 1.1, 1] }
                              : spellCastEffect.animStyle === 'attention'
                              ? { opacity: 1, scale: [0.5, 1.25, 1], y: [-14, 4, 0] }
                              : spellCastEffect.animStyle === 'schedule'
                              ? { opacity: 1, rotate: [0, 10, -10, 0], scale: [0.7, 1.15, 1] }
                              : spellCastEffect.animStyle === 'pipeline'
                              ? { opacity: 1, x: [-30, 15, 0], scale: [0.85, 1.15, 1] }
                              : spellCastEffect.animStyle === 'quantize'
                              ? { opacity: 1, scale: [1.3, 0.75, 1], y: [-12, 4, 0] }
                              : spellCastEffect.animStyle === 'edge'
                              ? { opacity: 1, scale: [0.65, 1.2, 1], rotate: [-4, 4, 0] }
                              : spellCastEffect.animStyle === 'compass'
                              ? { opacity: 1, rotate: [-15, 15, 0], scale: [0.7, 1.18, 1] }
                              : spellCastEffect.animStyle === 'lens'
                              ? { opacity: 1, scale: [0.5, 1.25, 1], x: [-12, 12, 0] }
                              : spellCastEffect.animStyle === 'circuit'
                              ? { opacity: 1, x: [-28, 14, 0], scale: [0.85, 1.15, 1] }
                              : spellCastEffect.animStyle === 'scale'
                              ? { opacity: 1, rotate: [-10, 10, -5, 0], scale: [0.8, 1.15, 1] }
                              : spellCastEffect.animStyle === 'shield'
                              ? { opacity: 1, scale: [1.25, 0.9, 1], y: [-8, 4, 0] }
                              : spellCastEffect.animStyle === 'mic'
                              ? { opacity: 1, scale: [0.6, 1.22, 1], y: [-12, 6, 0] }
                              : spellCastEffect.animStyle === 'map'
                              ? { opacity: 1, x: [-22, 16, 0], scale: [0.75, 1.15, 1] }
                              : spellCastEffect.animStyle === 'vault'
                              ? { opacity: 1, scale: [0.7, 1.2, 1], rotate: [0, -8, 8, 0] }
                              : { opacity: 1, scale: [0.8, 1.15, 1], x: [-25, 25, 0] }
                          }
                          exit={{ opacity: 0 }}
                          style={{
                            borderColor: spellCastEffect.color,
                            backgroundColor: '#0d0a1a',
                            color: spellCastEffect.color,
                          }}
                          className="mt-1.5 px-2.5 py-1 border-2 font-pixel text-[8px] text-center shadow-[0_0_12px_rgba(56,216,100,0.4)]"
                        >
                          <div>★ {spellCastEffect.spellName.toUpperCase()}!</div>
                          <div className="font-mono text-[10px] text-[#f4f1ea] mt-0.5">
                            [{spellCastEffect.runeSymbol}] KRITIKAL!
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Monster Side + HP Bar */}
                  <div className="flex flex-col items-center relative w-48">
                    <div className="w-full mb-2">
                      <div className="flex justify-between font-pixel text-[9px] text-[#f4f1ea] mb-1">
                        <span className="truncate">{topic.monsterName}</span>
                        <span className="text-[#e83b47] tabular-nums">{monsterHP}/100 HP</span>
                      </div>
                      <div
                        className="w-full h-3.5 bg-[#16112b] border-2 border-[#f4f1ea] p-0.5"
                        role="progressbar"
                        aria-valuenow={monsterHP}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`HP Monster ${topic.monsterName}`}
                      >
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${monsterHP}%`,
                            backgroundColor:
                              floor.id === 1
                                ? '#38d864'
                                : floor.id === 2
                                ? '#1d8a3d'
                                : floor.id === 3
                                ? '#9b5de5'
                                : floor.id === 4
                                ? '#3ac5eb'
                                : '#e83b47',
                          }}
                        />
                      </div>
                    </div>

                    <div className="w-20 h-20 bg-[#16112b] border-2 border-[#e83b47] flex items-center justify-center relative">
                      <motion.div
                        animate={
                          monsterState === 'defeated'
                            ? { opacity: 0.75, scale: 0.92 }
                            : monsterState === 'hit' && !reduceMotion
                            ? { x: [-8, 8, -6, 6, 0], scale: [1, 1.12, 0.95, 1] }
                            : { opacity: 1, scale: 1 }
                        }
                        transition={{ duration: reduceMotion ? 0.1 : 0.35 }}
                      >
                        <MonsterSprite
                          type={floor.monsterType}
                          size={60}
                          state={monsterState}
                        />
                      </motion.div>

                      {/* Pixel Particle Burst on Defeat */}
                      {roomStep === 'reward' && !reduceMotion && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          {PARTICLE_OFFSETS.map((p, idx) => (
                            <motion.span
                              key={idx}
                              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                              animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.4 }}
                              transition={{ duration: 0.55, ease: 'easeOut' }}
                              style={{ backgroundColor: p.color }}
                              className="w-2.5 h-2.5 absolute"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Monster Flavor Dialogue */}
                <div className="mt-3 bg-[#120d26] border-2 border-[#38d864] px-3 py-2 text-center">
                  <span className="font-pixel text-[9px] text-[#38d864] mr-2">
                    DIALOG {topic.monsterName.toUpperCase()}:
                  </span>
                  <span className="font-vt text-lg sm:text-xl text-[#f4f1ea] italic">
                    &ldquo;{monsterDialogue || topic.flavor}&rdquo;
                  </span>
                </div>
              </div>

              {/* Main Body: Either BATTLE or REWARD ("MANTRA DIPELAJARI!") */}
              {roomStep === 'reward' ? (
                <div className="p-4 sm:p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                  {/* "MANTRA DIPELAJARI!" Banner */}
                  {floor1TopicContent && (
                    <motion.div
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      style={{ borderColor: activeSpellTheme.color }}
                      className="p-5 border-4 bg-[#0d0a1a] text-center space-y-3 shadow-[0_0_24px_rgba(56,216,100,0.25)]"
                    >
                      <div
                        className="font-pixel text-xs sm:text-sm tracking-wider"
                        style={{ color: activeSpellTheme.color }}
                      >
                        ★ MANTRA DIPELAJARI! ★
                      </div>
                      <h3 className="font-pixel text-base sm:text-lg text-[#f4f1ea]">
                        {floor1TopicContent.spell.name}
                      </h3>
                      <p className="font-vt text-xl text-[#b3aad1]">
                        Mantra ini kini telah terbuka di <strong>Grimoire</strong> dan siap digunakan
                        untuk melawan{' '}
                        <strong>
                          {floor.id === 5
                            ? 'Raja Deadline'
                            : floor.id === 4
                            ? 'Mecha-Core'
                            : floor.id === 3
                            ? 'Hydra Berkepala Banyak'
                            : floor.id === 2
                            ? 'Golem Pohon Purba'
                            : 'Raja Matematika'}
                        </strong>
                        !
                      </p>
                      <div className="bg-[#16112b] border-2 border-[#5c4e99] p-3 text-left max-w-xl mx-auto">
                        <div className="font-pixel text-[9px] text-[#f5b935] mb-1.5">
                          RUMUS MANTRA ({floor1TopicContent.spell.id.toUpperCase()}):
                        </div>
                        <ul className="space-y-1">
                          {floor1TopicContent.spell.formulas.map((f, i) => (
                            <li key={i} className="font-mono text-xs sm:text-sm text-[#f4f1ea]">
                              • {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}

                  {/* Victory XP Breakdown */}
                  <div
                    role="status"
                    aria-live="polite"
                    className="pixel-box-green p-4 flex flex-col sm:flex-row items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-pixel text-xs text-[#38d864]">
                        MONSTER DITAKLUKKAN!
                      </div>
                      <div className="font-vt text-xl text-[#f4f1ea] mt-1">
                        {victoryReward ? (
                          victoryReward.totalXP > 0 ? (
                            <>
                              Kamu memperoleh total{' '}
                              <strong className="text-[#f5b935]">
                                +{victoryReward.totalXP} XP
                              </strong>{' '}
                              (Basis: +{victoryReward.baseXP} XP
                              {victoryReward.bonusXP > 0
                                ? `, Bonus Kritikal +10%: +${victoryReward.bonusXP} XP`
                                : ''}
                              {victoryReward.echoXP > 0
                                ? `, Bonus Gema Masa Lalu: +${victoryReward.echoXP} XP`
                                : ''}
                              )!
                            </>
                          ) : (
                            'Ruangan ini sudah ditaklukkan sebelumnya (XP basis dan bonus sudah diklaim).'
                          )
                        ) : (
                          `Ruangan selesai! (+${baseRoomXP} XP)`
                        )}
                      </div>
                    </div>

                    {topic.relic && (
                      <div className="flex items-center gap-2 bg-[#0d0a1a] border-2 border-[#f5b935] px-3 py-2 shrink-0">
                        <RelicSprite iconType={topic.relic.iconType} size={32} />
                        <div>
                          <div className="font-pixel text-[8px] text-[#f5b935]">RELIK BARU!</div>
                          <div className="font-vt text-lg text-[#f4f1ea]">
                            {floor1TopicContent?.relic || topic.relic.name}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reward Action Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    {isFloor1Room && (
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          closeRoomBattle();
                          setView('grimoire');
                        }}
                        className="pixel-btn px-4 py-2.5 bg-[#120d26] text-[#3ac5eb] border-[#3ac5eb] font-pixel text-xs"
                      >
                        Buka Grimoire Mantra
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        closeRoomBattle();
                      }}
                      className="pixel-btn px-5 py-2.5 bg-[#38d864] text-[#0d0a1a] font-pixel text-xs ml-auto"
                    >
                      Lanjut ke Ruangan Berikutnya →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Core Scope & XP Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#120d26] border-2 border-[#5c4e99] p-3">
                      <div className="font-pixel text-[9px] text-[#3ac5eb] mb-1">
                        CAKUPAN INTI
                      </div>
                      <div className="font-vt text-xl text-[#f4f1ea] leading-snug">
                        {topic.scope}
                      </div>
                    </div>
                    <div className="bg-[#120d26] border-2 border-[#5c4e99] p-3">
                      <div className="font-pixel text-[9px] text-[#f5b935] mb-1">
                        ESTIMASI WAKTU &amp; HADIAH
                      </div>
                      <div className="font-vt text-xl text-[#f4f1ea] tabular-nums">
                        {topic.weeks.min}-{topic.weeks.max} minggu · Basis:{' '}
                        <span className="text-[#38d864]">+{baseRoomXP} XP</span>
                      </div>
                      {isFloor1Room && (
                        <div className="font-vt text-base text-[#f5b935] mt-0.5">
                          {bonusAlreadyClaimed
                            ? '✓ Bonus Kritikal (+10% XP) sudah diklaim'
                            : `★ Bonus Kritikal: +${potentialCritBonusXP} XP (+10% XP ruang, sekali per ruang)`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 1: Honest Self-Assessment Criterion */}
                  <div className="bg-[#120d26] border-2 border-[#f5b935] p-3.5">
                    <div className="font-pixel text-[10px] text-[#f5b935] mb-1.5">
                      SYARAT 1 — PENILAIAN DIRI JUJUR (TANDA SUDAH PAHAM)
                    </div>
                    <p className="font-vt text-xl sm:text-2xl text-[#f4f1ea] leading-snug mb-2.5">
                      &ldquo;{topic.understandingSign}&rdquo;
                    </p>

                    <label
                      htmlFor="self-assessment-checkbox"
                      className="flex items-start gap-3 cursor-pointer select-none bg-[#16112b] border-2 border-[#5c4e99] hover:border-[#38d864] p-3 transition-colors"
                    >
                      <input
                        id="self-assessment-checkbox"
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          playClick();
                          setIsChecked(e.target.checked);
                          if (e.target.checked) setRetryMessage(null);
                        }}
                        className="mt-1 w-5 h-5 accent-[#38d864] cursor-pointer shrink-0"
                      />
                      <span className="font-vt text-lg sm:text-xl text-[#f4f1ea] leading-snug">
                        Saya jujur sudah memahami materi ini dan benar-benar mampu melakukan kriteria{' '}
                        <strong className="text-[#38d864]">Tanda sudah paham</strong> di atas.
                      </span>
                    </label>
                  </div>

                  {/* Optional "Catatan bukti" Input for Floor 5 Guild Quests (Plain text only, max 300 chars) */}
                  {floor.id === 5 && (
                    <div className="bg-[#120d26] border-2 border-[#fb923c] p-3.5 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label
                          htmlFor="evidence-note-input"
                          className="font-pixel text-[10px] text-[#fb923c]"
                        >
                          CATATAN BUKTI (OPSIONAL — TIDAK MENGHALANGI KELULUSAN RUANG)
                        </label>
                        <span className="font-mono text-xs text-[#b3aad1] tabular-nums">
                          {(evidenceNotes[topic.id] || '').length}/300 karakter
                        </span>
                      </div>
                      <input
                        id="evidence-note-input"
                        type="text"
                        maxLength={300}
                        value={evidenceNotes[topic.id] || ''}
                        onChange={(e) => setEvidenceNote(topic.id, e.target.value)}
                        placeholder={
                          floor1TopicContent?.evidenceHint ||
                          'Catatan singkat bukti proyek (opsional)'
                        }
                        className="w-full bg-[#0d0a1a] border-2 border-[#5c4e99] focus:border-[#fb923c] px-3 py-2 font-vt text-xl text-[#f4f1ea] placeholder-[#64748b] outline-none"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2 font-vt text-base text-[#b3aad1]">
                        <span>Catatan ini hanya tersimpan di browser ini.</span>
                        {floor1TopicContent?.relic && (
                          <span className="text-[#f5b935]">
                            Hadiah Relik Quest: <strong>{floor1TopicContent.relic}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Floor 1 Spellbook Quiz + "Gema Masa Lalu" Echo Question */}
                  {isFloor1Room && floor1TopicContent && (
                    <div className="bg-[#120d26] border-2 border-[#3ac5eb] p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#3a306e] pb-2">
                        <div>
                          <span className="font-pixel text-[10px] text-[#3ac5eb]">
                            SYARAT 2 — UJIAN MANTRA: {floor1TopicContent.spell.name.toUpperCase()}
                          </span>
                          <div className="font-vt text-base text-[#b3aad1]">
                            Jawab minimal 4 dari 5 soal topik dengan benar. Soal Gema Masa Lalu memberi
                            +5 XP (tidak memengaruhi kelulusan).
                          </div>
                        </div>
                        {bestScore !== undefined && (
                          <span className="font-pixel text-[9px] px-2 py-1 bg-[#0d0a1a] border border-[#f5b935] text-[#f5b935]">
                            SKOR TERBAIK: {bestScore}%
                          </span>
                        )}
                      </div>

                      {/* Fainted State (0 Hearts) */}
                      {isFainted && (
                        <div
                          role="alert"
                          className="pixel-box-red p-4 text-center space-y-3"
                        >
                          <div className="font-pixel text-xs text-[#e83b47]">
                            ✕ PINGSAN — HATI HABIS (0/{MAX_HEARTS} HP)!
                          </div>
                          <p className="font-vt text-xl text-[#f4f1ea]">
                            Kamu kehilangan seluruh hati sebelum menyelesaikan ujian mantra. Tenang,
                            baca kembali penjelasan dan coba lagi dengan soal serta opsi yang diacak!
                          </p>
                          <button
                            type="button"
                            onClick={handleRetryQuiz}
                            className="pixel-btn px-4 py-2 bg-[#f5b935] text-[#0d0a1a] font-pixel text-xs"
                          >
                            Bangkit &amp; Ulangi Pertarungan (Acak Soal)
                          </button>
                        </div>
                      )}

                      {/* Active Question View */}
                      {!isFainted && !quizCompleted && currentQuestion && (
                        <div className="space-y-3">
                          {/* Echo Question Callout Banner if isEcho */}
                          {currentQuestion.isEcho && (
                            <div className="bg-[#291324] border-2 border-[#f5b935] px-3 py-2 flex items-center justify-between gap-2">
                              <span className="font-pixel text-[9px] text-[#f5b935]">
                                ★ GEMA MASA LALU (DARI TOPIK #{currentQuestion.topicId})
                              </span>
                              <span className="font-vt text-base text-[#f4f1ea]">
                                Bonus +{ECHO_BONUS_XP} XP · Tidak memengaruhi lulus/gagal
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between font-vt text-lg text-[#b3aad1]">
                            <span>
                              Pertanyaan{' '}
                              <strong className="text-[#f4f1ea]">{currentQIndex + 1}</strong> dari{' '}
                              {battleDeck.length}
                            </span>
                            <span className="uppercase font-pixel text-[9px] px-2 py-0.5 bg-[#16112b] border border-[#5c4e99] text-[#f5b935]">
                              Tingkat: {currentQuestion.difficulty}
                            </span>
                          </div>

                          <div className="bg-[#0d0a1a] border-2 border-[#5c4e99] p-3.5 font-vt text-xl sm:text-2xl text-[#f4f1ea] leading-snug">
                            {currentQuestion.question}
                          </div>

                          <div className="space-y-2">
                            {currentQuestion.shuffledOptions.map((opt, idx) => {
                              const isSelected = selectedOptionId === opt.optionId;
                              const showResult = selectedOptionId !== null;

                              let btnStyle =
                                'bg-[#16112b] border-[#5c4e99] text-[#f4f1ea] hover:border-[#f5b935]';
                              let statusPrefix = `${String.fromCharCode(65 + idx)}.`;

                              if (showResult) {
                                if (opt.isCorrect) {
                                  btnStyle =
                                    'bg-[#0a1714] border-[#38d864] text-[#38d864] font-bold';
                                  statusPrefix = `✓ [BENAR] ${String.fromCharCode(65 + idx)}.`;
                                } else if (isSelected && !opt.isCorrect) {
                                  btnStyle = 'bg-[#291324] border-[#e83b47] text-[#e83b47]';
                                  statusPrefix = `✕ [SALAH] ${String.fromCharCode(65 + idx)}.`;
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
                                  data-option-id={opt.optionId}
                                  data-correct={opt.isCorrect ? 'true' : undefined}
                                  onClick={() => handleSelectOption(opt)}
                                  className={`w-full text-left p-3 border-2 font-vt text-lg sm:text-xl transition-colors flex items-start gap-2.5 ${btnStyle}`}
                                >
                                  <span className="font-pixel text-[10px] mt-1 shrink-0">
                                    {statusPrefix}
                                  </span>
                                  <span>{opt.text}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation Box + Next Button */}
                          {selectedOptionId !== null && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`p-3.5 border-2 ${
                                currentQuestion.shuffledOptions.find(
                                  (o) => o.optionId === selectedOptionId
                                )?.isCorrect
                                  ? 'bg-[#0a1714] border-[#38d864]'
                                  : 'bg-[#291324] border-[#e83b47]'
                              }`}
                            >
                              <div className="font-pixel text-[10px] mb-1 text-[#f5b935]">
                                {currentQuestion.shuffledOptions.find(
                                  (o) => o.optionId === selectedOptionId
                                )?.isCorrect
                                  ? `✓ MANTRA ${currentQuestion.spellName.toUpperCase()} MENGHANTAM MONSTER!`
                                  : '✕ MANTRA MELESET (-1 HATI) — PENJELASAN:'}
                              </div>
                              <p className="font-vt text-lg sm:text-xl text-[#f4f1ea] leading-snug">
                                {currentQuestion.explanation}
                              </p>
                              <div className="mt-3 flex justify-end">
                                <button
                                  type="button"
                                  onClick={handleNextQuestion}
                                  className="pixel-btn px-4 py-2 bg-[#f5b935] text-[#0d0a1a] font-pixel text-[10px]"
                                >
                                  {currentQIndex + 1 < battleDeck.length
                                    ? 'Pertanyaan Berikutnya →'
                                    : 'Lihat Hasil Ujian Mantra →'}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}

                      {/* Quiz Summary View */}
                      {!isFainted && quizCompleted && (
                        <div
                          className={`p-4 border-2 ${
                            quizEval.passedQuiz
                              ? 'bg-[#0a1714] border-[#38d864]'
                              : 'bg-[#291324] border-[#e83b47]'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div
                                className={`font-pixel text-xs ${
                                  quizEval.passedQuiz ? 'text-[#38d864]' : 'text-[#e83b47]'
                                }`}
                              >
                                {quizEval.passedQuiz
                                  ? `✓ UJIAN MANTRA LULUS! (SKOR TOPIK: ${topicCorrectCount}/5 — ${quizEval.scorePercent}%)`
                                  : `✕ UJIAN BELUM LULUS (SKOR TOPIK: ${topicCorrectCount}/5 — ${quizEval.scorePercent}%, MINIMAL 4/5)`}
                              </div>
                              <p className="font-vt text-xl text-[#f4f1ea] mt-1">
                                {quizEval.passedQuiz
                                  ? `Pastikan kotak Penilaian Diri di atas dicentang, lalu klik tombol "Serang!" untuk menaklukkan ${topic.monsterName} dan mempelajari ${floor1TopicContent.spell.name}!`
                                  : 'Kamu harus menjawab minimal 4 dari 5 soal topik dengan benar untuk mengalahkan monster ini.'}
                              </p>
                              {echoAnsweredCorrectly && (
                                <p className="font-vt text-lg text-[#f5b935] mt-1">
                                  ★ Gema Masa Lalu dijawab benar! (
                                  {echoAlreadyClaimed
                                    ? 'Bonus +5 XP sudah pernah diklaim di ruang ini'
                                    : `+${ECHO_BONUS_XP} Bonus XP siap diklaim saat menang`}
                                  )
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={handleRetryQuiz}
                              className="pixel-btn px-3 py-2 bg-[#16112b] text-[#f5b935] font-pixel text-[9px] shrink-0"
                            >
                              Ulangi &amp; Acak Soal
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Retry Warning Message ("Aku belum bisa") */}
                  {retryMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      role="alert"
                      className="pixel-box-red p-3.5 text-center"
                    >
                      <div className="font-pixel text-xs text-[#e83b47]">
                        ⚠ {retryMessage.toUpperCase()}
                      </div>
                      <p className="font-vt text-lg text-[#f4f1ea] mt-1">
                        Tidak apa-apa! Pelajari kembali Gulungan Mantra di ruangan ini sampai kamu
                        benar-benar siap.
                      </p>
                    </motion.div>
                  )}

                  {/* Bottom Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleNotReady}
                      className="pixel-btn px-4 py-2.5 bg-[#291324] text-[#f4f1ea] font-pixel text-xs"
                    >
                      Aku belum bisa
                    </button>

                    <button
                      type="button"
                      disabled={!canAttack}
                      onClick={handleAttack}
                      className="pixel-btn px-5 py-2.5 bg-[#38d864] text-[#0d0a1a] font-pixel text-xs gap-2"
                    >
                      <PixelSwordSprite size={18} />
                      <span>Serang!</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
