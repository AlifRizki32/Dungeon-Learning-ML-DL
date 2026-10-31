import React from 'react';
import { motion } from 'framer-motion';
import { TopicItem } from '../data/roadmap.js';
import { calculateRoomXP } from '../game/formulas';
import { AvatarSprite, MonsterSprite, PixelLockSprite, PixelSwordSprite } from './PixelSprites';

interface RoomNodeProps {
  topic: TopicItem;
  monsterType: string;
  unlocked: boolean;
  completed: boolean;
  isPlayerHere: boolean;
  newlyUnlocked: boolean;
  avatarId: string;
  reduceMotion: boolean;
  bestQuizScore?: number;
  zigzagAlign: 'left' | 'center' | 'right';
  onSelect: (topicId: string) => void;
}

export const RoomNode: React.FC<RoomNodeProps> = ({
  topic,
  monsterType,
  unlocked,
  completed,
  isPlayerHere,
  newlyUnlocked,
  avatarId,
  reduceMotion,
  bestQuizScore,
  zigzagAlign,
  onSelect,
}) => {
  const roomXP = calculateRoomXP(topic.weeks);

  const alignmentClass =
    zigzagAlign === 'left'
      ? 'md:mr-auto md:ml-4'
      : zigzagAlign === 'right'
      ? 'md:ml-auto md:mr-4'
      : 'md:mx-auto';

  const statusBorderClass = completed
    ? 'pixel-box-green'
    : unlocked
    ? 'pixel-box-gold'
    : 'pixel-box opacity-75';

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={
        newlyUnlocked && !reduceMotion
          ? { opacity: 1, y: 0, scale: [1, 1.06, 1] }
          : { opacity: 1, y: 0, scale: 1 }
      }
      transition={{ duration: reduceMotion ? 0.1 : 0.25 }}
      className={`relative w-full md:w-[76%] lg:w-[68%] ${alignmentClass}`}
    >
      <button
        type="button"
        disabled={!unlocked}
        onClick={() => onSelect(topic.id)}
        aria-label={`Ruang Topik ${topic.number}: ${topic.name}. Status: ${
          completed ? 'Sudah Ditaklukkan' : unlocked ? 'Terbuka, Siap Diserang' : 'Terkunci'
        }`}
        className={`w-full text-left p-3.5 sm:p-4 transition-transform ${statusBorderClass} ${
          unlocked
            ? 'cursor-pointer hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-dashed focus-visible:outline-[#f5b935]'
            : 'cursor-not-allowed'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Monster or Lock Sprite + Topic Info */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
            <div
              className={`w-14 h-14 shrink-0 border-2 flex items-center justify-center relative ${
                completed
                  ? 'bg-[#0a1714] border-[#38d864]'
                  : unlocked
                  ? 'bg-[#16101f] border-[#f5b935]'
                  : 'bg-[#120d26] border-[#5c4e99]'
              }`}
            >
              {unlocked ? (
                <MonsterSprite
                  type={monsterType}
                  size={44}
                  state={completed ? 'defeated' : 'idle'}
                />
              ) : (
                <PixelLockSprite size={28} />
              )}

              {/* Room Number Corner Tag */}
              <span className="absolute -top-2 -left-2 bg-[#0d0a1a] border border-[#f4f1ea] px-1.5 py-0.5 font-pixel text-[9px] text-[#f5b935]">
                #{topic.number}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              {/* Parallel / Guild Quest Kicker */}
              {topic.parallel && (
                <div className="font-pixel text-[9px] text-[#3ac5eb] mb-1">
                  {topic.floorId === 1
                    ? '★ SIDE QUEST PARALEL (TERBUKA SEJAK AWAL LANTAI 1)'
                    : '★ GUILD QUEST PARALEL (EFEKTIF BERSAMA FASE 2-4)'}
                </div>
              )}

              <div className="font-pixel text-xs sm:text-sm text-[#f4f1ea] leading-snug">
                {topic.name}
              </div>

              <div className="font-vt text-lg sm:text-xl text-[#b3aad1] mt-0.5 leading-snug">
                Cakupan: {topic.scope}
              </div>

              <div className="font-vt text-base sm:text-lg text-[#f5b935] mt-1 flex flex-wrap items-center gap-x-2 tabular-nums">
                <span>Monster: {topic.monsterName}</span>
                <span aria-hidden="true">·</span>
                <span>
                  Estimasi: {topic.weeks.min}-{topic.weeks.max} minggu
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-[#38d864]">+{roomXP} XP</span>
                {bestQuizScore !== undefined && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        bestQuizScore >= 70 ? 'text-[#3ac5eb]' : 'text-[#e83b47]'
                      }
                    >
                      Skor Kuis Terbaik: {bestQuizScore}%
                    </span>
                  </>
                )}
                {topic.relic && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#3ac5eb]">Relik: {topic.relic.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Player Sprite Presence & Action CTA Badge */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 border-[#3a306e] pt-2 sm:pt-0">
            {isPlayerHere && (
              <motion.div
                layoutId={reduceMotion ? undefined : 'player-map-token'}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: 'tween', duration: 0.35, ease: 'linear' }
                }
                className="flex items-center gap-1.5 bg-[#0d0a1a] border-2 border-[#38d864] px-2 py-1"
                title="Posisi Petualang Saat Ini"
              >
                <AvatarSprite avatarId={avatarId} size={28} />
                <span className="font-pixel text-[8px] text-[#38d864]">POSISI</span>
              </motion.div>
            )}

            <div
              className={`px-3 py-1.5 font-pixel text-[10px] border-2 flex items-center gap-1.5 whitespace-nowrap ${
                completed
                  ? 'bg-[#1d8a3d] text-[#f4f1ea] border-[#f4f1ea]'
                  : unlocked
                  ? 'bg-[#f5b935] text-[#0d0a1a] border-[#f4f1ea]'
                  : 'bg-[#16112b] text-[#b3aad1] border-[#5c4e99]'
              }`}
            >
              {completed ? (
                <span>✓ TAKLUK</span>
              ) : unlocked ? (
                <>
                  <PixelSwordSprite size={14} />
                  <span>MASUK RUANG</span>
                </>
              ) : (
                <span>TERKUNCI</span>
              )}
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
};
