import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FLOORS, TOWER_FLOOR } from '../data/roadmap.js';
import { useGameStore } from '../store/useGameStore';
import {
  BOSS_XP,
  calculateRoomXP,
  isBossUnlocked,
  isFloorUnlocked,
  isRoomUnlocked,
} from '../game/formulas';
import { getTopicContent } from '../game/spellbookEngine';
import { RoomNode } from './RoomNode';
import {
  AvatarSprite,
  DungeonDoorSprite,
  MonsterSprite,
  PixelLockSprite,
  PixelSwordSprite,
  RelicSprite,
} from './PixelSprites';
import { useSound } from '../hooks/useSound.js';

export const DungeonMap: React.FC = () => {
  const activeFloorId = useGameStore((s) => s.activeFloorId);
  const completedRooms = useGameStore((s) => s.completedRooms);
  const defeatedBosses = useGameStore((s) => s.defeatedBosses);
  const completedTowerQuests = useGameStore((s) => s.completedTowerQuests);
  const quizBestScores = useGameStore((s) => s.quizBestScores);
  const evidenceNotes = useGameStore((s) => s.evidenceNotes);
  const avatarId = useGameStore((s) => s.avatarId);
  const activeNodeByFloor = useGameStore((s) => s.activeNodeByFloor);
  const newlyUnlockedIds = useGameStore((s) => s.newlyUnlockedIds);
  const reduceMotion = useGameStore((s) => s.reduceMotion);

  const selectFloor = useGameStore((s) => s.selectFloor);
  const openRoomBattle = useGameStore((s) => s.openRoomBattle);
  const openBossBattle = useGameStore((s) => s.openBossBattle);
  const clearNewlyUnlocked = useGameStore((s) => s.clearNewlyUnlocked);

  const { playClick, playBossAppear } = useSound();

  useEffect(() => {
    if (newlyUnlockedIds.length > 0) {
      const timer = setTimeout(() => {
        clearNewlyUnlocked();
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [newlyUnlockedIds, clearNewlyUnlocked]);

  const currentFloor = FLOORS.find((f) => f.id === activeFloorId) || FLOORS[0];
  const floorBossUnlocked = isBossUnlocked(
    currentFloor.id,
    currentFloor.topics,
    completedRooms,
    defeatedBosses
  );
  const floorBossDefeated = defeatedBosses.includes(currentFloor.boss.id);
  const activeNodeId = activeNodeByFloor[currentFloor.id] || currentFloor.topics[0].id;
  const completedOnFloor = currentFloor.topics.filter((t) =>
    completedRooms.includes(t.id)
  ).length;

  const handleSelectDoor = (floorId: number, unlocked: boolean) => {
    if (!unlocked) return;
    playClick();
    selectFloor(floorId);
  };

  const handleOpenRoom = (topicId: string) => {
    playClick();
    openRoomBattle(topicId);
  };

  const handleOpenBoss = () => {
    if (!floorBossUnlocked) return;
    playBossAppear();
    openBossBattle(currentFloor.id);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3 pb-14 space-y-6">
      {/* Section 1: 6 Dungeon Doors Selector */}
      <section aria-label="Pilihan 6 Pintu Lantai Dungeon" className="pixel-box p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h1 className="font-pixel text-xs sm:text-sm text-[#f5b935]">
              GERBANG DUNGEON (6 LANTAI)
            </h1>
            <p className="font-vt text-lg sm:text-xl text-[#b3aad1]">
              Pilih pintu lantai untuk menjelajahi ruang topik. Lantai 1 dan Lantai 5 (Aula Guild) terbuka sejak awal!
            </p>
          </div>
          <div className="font-vt text-base sm:text-lg text-[#38d864] tabular-nums">
            Bos Ditaklukkan: {defeatedBosses.length}/5
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {FLOORS.map((floor) => {
            const unlocked = isFloorUnlocked(floor.id, defeatedBosses);
            const doneCount = floor.topics.filter((t) => completedRooms.includes(t.id)).length;
            const totalCount = floor.topics.length;
            const bossDone = defeatedBosses.includes(floor.boss.id);
            const isSelected = currentFloor.id === floor.id;

            return (
              <button
                key={floor.id}
                type="button"
                disabled={!unlocked}
                onClick={() => handleSelectDoor(floor.id, unlocked)}
                aria-label={`Pintu Lantai ${floor.floorNumber}: ${floor.phaseTitle}. Progres ${doneCount} dari ${totalCount} ruang. Estimasi ${floor.weeks.min}-${floor.weeks.max} minggu. ${
                  unlocked ? 'Terbuka' : 'Terkunci'
                }`}
                className={`p-2.5 text-left transition-transform flex flex-col justify-between ${
                  isSelected
                    ? 'pixel-box-gold'
                    : bossDone
                    ? 'pixel-box-green'
                    : 'pixel-box'
                } ${
                  unlocked
                    ? 'cursor-pointer hover:-translate-y-0.5'
                    : 'opacity-55 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <DungeonDoorSprite
                    unlocked={unlocked}
                    completed={bossDone}
                    accentColor={floor.themeColor}
                    size={34}
                  />
                  <div className="text-right">
                    <span className="font-pixel text-[10px] text-[#f5b935] block">
                      LANTAI {floor.floorNumber}
                    </span>
                    <span className="font-vt text-sm text-[#b3aad1] tabular-nums">
                      {floor.weeks.min}-{floor.weeks.max} mgg
                    </span>
                  </div>
                </div>

                <div>
                  <div className="font-pixel text-[9px] text-[#f4f1ea] leading-snug line-clamp-2">
                    {floor.isGuildHall ? 'Aula Guild (Fase 5)' : `Fase ${floor.floorNumber}`}
                  </div>
                  <div className="font-vt text-base text-[#38d864] mt-1 tabular-nums flex items-center justify-between">
                    <span>
                      Ruang: {doneCount}/{totalCount}
                    </span>
                    <span>{bossDone ? '★ BOS' : unlocked ? 'BUKA' : 'KUNCI'}</span>
                  </div>
                </div>
              </button>
            );
          })}

          {/* Door 6: Menara Master */}
          {(() => {
            const towerUnlocked = isFloorUnlocked(6, defeatedBosses);
            const towerDoneCount = completedTowerQuests.length;
            const towerTotal = TOWER_FLOOR.quests.length;

            return (
              <button
                type="button"
                onClick={() => selectFloor(6)}
                aria-label={`Pintu Lantai 6: Menara Master. Progres ${towerDoneCount} dari ${towerTotal} quest. ${
                  towerUnlocked ? 'Terbuka' : 'Terkunci hingga 5 Bos dikalahkan'
                }`}
                className={`p-2.5 text-left transition-transform flex flex-col justify-between ${
                  towerDoneCount === towerTotal ? 'pixel-box-green' : 'pixel-box'
                } cursor-pointer hover:-translate-y-0.5`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <DungeonDoorSprite
                    unlocked={towerUnlocked}
                    completed={towerDoneCount === towerTotal}
                    accentColor="#9b5de5"
                    size={34}
                  />
                  <div className="text-right">
                    <span className="font-pixel text-[10px] text-[#9b5de5] block">
                      LANTAI 6
                    </span>
                    <span className="font-vt text-sm text-[#b3aad1]">
                      Endgame
                    </span>
                  </div>
                </div>

                <div>
                  <div className="font-pixel text-[9px] text-[#f4f1ea] leading-snug">
                    Menara Master
                  </div>
                  <div className="font-vt text-base text-[#f5b935] mt-1 tabular-nums flex items-center justify-between">
                    <span>
                      Quest: {towerDoneCount}/{towerTotal}
                    </span>
                    <span>{towerUnlocked ? 'BUKA' : '5 BOS'}</span>
                  </div>
                </div>
              </button>
            );
          })()}
        </div>
      </section>

      {/* Section 2: Active Floor Dungeon Chamber & Zigzag Path (with Floor Accent Theme) */}
      <motion.section
        key={currentFloor.id}
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0.1 : 0.25 }}
        aria-label={`Peta ${currentFloor.phaseTitle}`}
        style={{
          borderColor:
            currentFloor.id === 2
              ? '#1d8a3d'
              : currentFloor.id === 3
              ? '#9b5de5'
              : currentFloor.id === 4
              ? '#3ac5eb'
              : currentFloor.id === 5
              ? '#fb923c'
              : currentFloor.themeColor,
        }}
        className={`pixel-box p-4 sm:p-6 relative overflow-hidden ${
          currentFloor.id === 1
            ? 'bg-[#111e24]'
            : currentFloor.id === 2
            ? 'bg-[#141f16]'
            : currentFloor.id === 3
            ? 'bg-[#1a102b]'
            : currentFloor.id === 4
            ? 'bg-[#0a1924]'
            : currentFloor.id === 5
            ? 'bg-[#210d14]'
            : ''
        }`}
      >
        {/* Floor Header Banner */}
        <div
          className="border-b-2 pb-4 mb-6"
          style={{
            borderColor:
              currentFloor.id === 2
                ? '#a87312'
                : currentFloor.id === 3
                ? '#9b5de5'
                : currentFloor.id === 4
                ? '#0891b2'
                : currentFloor.id === 5
                ? '#fb923c'
                : currentFloor.themeColor,
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div
                className="font-pixel text-[10px] mb-1"
                style={{
                  color:
                    currentFloor.id === 2
                      ? '#38d864'
                      : currentFloor.id === 3
                      ? '#b3aad1'
                      : currentFloor.id === 4
                      ? '#3ac5eb'
                      : currentFloor.id === 5
                      ? '#fb923c'
                      : currentFloor.themeColor,
                }}
              >
                LANTAI {currentFloor.floorNumber} · KELUARGA MONSTER:{' '}
                {currentFloor.monsterFamily.toUpperCase()}
              </div>
              <h2 className="font-pixel text-sm sm:text-base text-[#f4f1ea] leading-relaxed">
                {currentFloor.phaseTitle} ({currentFloor.weeks.min}-{currentFloor.weeks.max} minggu)
              </h2>
              <p className="font-vt text-xl text-[#b3aad1] mt-1">
                {currentFloor.subtitle}
              </p>
            </div>

            <div
              className="bg-[#120d26] border-2 px-3.5 py-2 shrink-0 self-start md:self-center"
              style={{
                borderColor:
                  currentFloor.id === 2
                    ? '#a87312'
                    : currentFloor.id === 3
                    ? '#9b5de5'
                    : currentFloor.id === 4
                    ? '#3ac5eb'
                    : currentFloor.id === 5
                    ? '#fb923c'
                    : currentFloor.themeColor,
              }}
            >
              <div className="font-pixel text-[10px] text-[#38d864] tabular-nums">
                PROGRES LANTAI: {completedOnFloor}/{currentFloor.topics.length} RUANG
              </div>
              <div className="font-vt text-lg text-[#f5b935] mt-0.5">
                Bos:{' '}
                {floorBossDefeated
                  ? 'Sudah Dikalahkan ✓'
                  : floorBossUnlocked
                  ? 'Siap Ditantang!'
                  : 'Terkunci'}
              </div>
            </div>
          </div>

          {currentFloor.parallelTag && (
            <div
              className={`mt-3 border-2 px-3 py-2 font-vt text-lg sm:text-xl ${
                currentFloor.id === 5
                  ? 'bg-[#291324] border-[#fb923c] text-[#fb923c]'
                  : 'bg-[#132924] border-[#38d864] text-[#38d864]'
              }`}
            >
              ⚡ Aturan Paralel:{' '}
              <span className="text-[#f4f1ea]">{currentFloor.parallelTag}</span>
            </div>
          )}
        </div>

        {/* FLOOR 5: GUILD HALL (8 QUEST DOORS GRID + CENTRAL BOSS DOOR) */}
        {currentFloor.isGuildHall ? (
          <div className="space-y-6" data-testid="guild-hall-layout">
            {/* Central Boss Door Banner at the Center of the Guild Hall */}
            <div
              data-testid="guild-hall-boss-door"
              className={`w-full p-4 sm:p-5 border-4 transition-transform ${
                floorBossDefeated
                  ? 'bg-[#0a1714] border-[#38d864]'
                  : floorBossUnlocked
                  ? 'bg-[#291324] border-[#fb923c] shadow-[0_0_20px_rgba(232,59,71,0.35)]'
                  : 'bg-[#16101f] border-[#e83b47]'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4">
                  <div
                    className={`w-20 h-20 shrink-0 border-2 flex items-center justify-center relative ${
                      floorBossDefeated
                        ? 'bg-[#0a1714] border-[#38d864]'
                        : floorBossUnlocked
                        ? 'bg-[#210d14] border-[#fb923c]'
                        : 'bg-[#120d26] border-[#e83b47]'
                    }`}
                  >
                    {floorBossUnlocked || floorBossDefeated ? (
                      <MonsterSprite
                        type={currentFloor.boss.spriteType}
                        size={68}
                        state={floorBossDefeated ? 'defeated' : 'idle'}
                      />
                    ) : (
                      <PixelLockSprite size={36} />
                    )}
                    <span className="absolute -top-2 -left-2 bg-[#e83b47] border border-[#f4f1ea] px-1.5 py-0.5 font-pixel text-[8px] text-[#f4f1ea]">
                      PINTU TENGAH BOS
                    </span>
                  </div>

                  <div>
                    <div className="font-pixel text-xs sm:text-sm text-[#fb923c]">
                      PINTU TENGAH AULA GUILD: RAJA DEADLINE
                    </div>
                    <div className="font-vt text-lg sm:text-xl text-[#f5b935]">
                      {currentFloor.boss.title} · Hadiah: +{BOSS_XP} XP,{' '}
                      {currentFloor.boss.badge.name} &amp; Relik Stopwatch Perak
                    </div>
                    <p className="font-vt text-lg text-[#f4f1ea] mt-1">
                      {floorBossDefeated
                        ? `Raja Deadline telah dikalahkan! Boss dikalahkan: ${defeatedBosses.length}/5.`
                        : floorBossUnlocked
                        ? 'Seluruh 8 Guild Quest telah ditaklukkan! Pintu Tengah Raja Deadline kini terbuka!'
                        : `Pintu Tengah Bos terbuka setelah seluruh 8 Guild Quest di Aula ini ditaklukkan (${completedOnFloor}/8 Guild Quest selesai).`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                  {activeNodeId === currentFloor.boss.id && (
                    <div className="flex items-center gap-1.5 bg-[#0d0a1a] border-2 border-[#38d864] px-2 py-1">
                      <AvatarSprite avatarId={avatarId} size={28} />
                      <span className="font-pixel text-[8px] text-[#38d864]">POSISI</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <RelicSprite iconType="stopwatch-perak" size={34} />
                    <button
                      type="button"
                      disabled={!floorBossUnlocked}
                      onClick={handleOpenBoss}
                      className={`pixel-btn px-4 py-2.5 font-pixel text-[10px] sm:text-xs gap-2 whitespace-nowrap ${
                        floorBossDefeated
                          ? 'bg-[#1d8a3d] text-[#f4f1ea]'
                          : floorBossUnlocked
                          ? 'bg-[#e83b47] text-[#f4f1ea]'
                          : 'bg-[#16112b] text-[#b3aad1]'
                      }`}
                    >
                      <PixelSwordSprite size={16} />
                      <span>
                        {floorBossDefeated
                          ? 'LIHAT TANTANGAN BOS'
                          : floorBossUnlocked
                          ? 'TANTANG RAJA DEADLINE!'
                          : `BOS TERKUNCI (${completedOnFloor}/8)`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 8 Guild Quest Doors Grid (All Unlocked from the Start, Any Order) */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              aria-label="Grid 8 Pintu Guild Quest Lantai 5"
            >
              {currentFloor.topics.map((topic) => {
                const unlocked = isRoomUnlocked(
                  topic,
                  currentFloor.topics,
                  completedRooms,
                  defeatedBosses
                );
                const completed = completedRooms.includes(topic.id);
                const isPlayerHere = activeNodeId === topic.id;
                const bestQuizScore = quizBestScores[topic.id];
                const roomXP = calculateRoomXP(topic.weeks);
                const topicContent = getTopicContent(topic.id);
                const relicDisplayName = topicContent?.relic || topic.relic?.name || 'Relik Quest';
                const savedEvidenceNote = (evidenceNotes[topic.id] || '').trim();

                return (
                  <div
                    key={topic.id}
                    data-testid={`guild-quest-card-${topic.number}`}
                    className={`flex flex-col justify-between border-4 p-4 transition-transform ${
                      completed
                        ? 'bg-[#0a1714] border-[#38d864]'
                        : 'bg-[#160b12] border-[#e83b47] hover:border-[#fb923c]'
                    } shadow-[0_4px_0_0_#070510]`}
                  >
                    <button
                      type="button"
                      disabled={!unlocked}
                      onClick={() => handleOpenRoom(topic.id)}
                      aria-label={`Pintu Guild Quest ${topic.number}: ${topic.name}. Status: ${
                        completed ? 'Sudah Ditaklukkan' : 'Terbuka, Siap Diserang'
                      }`}
                      className="w-full text-left flex flex-col justify-between gap-3 cursor-pointer focus-visible:outline-3 focus-visible:outline-dashed focus-visible:outline-[#f5b935]"
                    >
                      {/* Top Door Header: Door Sprite + Parallel Tag + Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-14 h-14 shrink-0 border-2 flex items-center justify-center relative ${
                              completed
                                ? 'bg-[#0a1714] border-[#38d864]'
                                : 'bg-[#291324] border-[#fb923c]'
                            }`}
                          >
                            <DungeonDoorSprite
                              unlocked={unlocked}
                              completed={completed}
                              accentColor="#e83b47"
                              size={36}
                            />
                            <span className="absolute -top-2 -left-2 bg-[#e83b47] border border-[#f4f1ea] px-1.5 py-0.5 font-pixel text-[8px] text-[#f4f1ea]">
                              #{topic.number}
                            </span>
                          </div>

                          <div>
                            <div className="inline-block bg-[#291324] border border-[#fb923c] px-2 py-0.5 font-vt text-sm sm:text-base text-[#fb923c] mb-1">
                              {topic.parallelNote ||
                                'paling efektif paralel dengan Fase 2-4 lewat proyek'}
                            </div>
                            <h3 className="font-pixel text-xs sm:text-sm text-[#f4f1ea] leading-snug">
                              {topic.name}
                            </h3>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className={`px-2.5 py-1 font-pixel text-[8px] border ${
                              completed
                                ? 'bg-[#1d8a3d] text-[#f4f1ea] border-[#38d864]'
                                : 'bg-[#e83b47] text-[#f4f1ea] border-[#fb923c]'
                            }`}
                          >
                            {completed ? '✓ TAKLUK' : 'TERBUKA'}
                          </span>
                          {isPlayerHere && (
                            <span className="font-pixel text-[8px] text-[#38d864] bg-[#0d0a1a] border border-[#38d864] px-1.5 py-0.5">
                              POSISI
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle Info: Scope, Weeks, XP, Relic & Monster */}
                      <div className="space-y-1.5 border-t border-[#3a2030] pt-2.5">
                        <div className="font-vt text-lg sm:text-xl text-[#b3aad1] leading-snug">
                          Cakupan: <span className="text-[#f4f1ea]">{topic.scope}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-vt text-base sm:text-lg text-[#f5b935] tabular-nums">
                          <span>
                            Estimasi: <strong>{topic.weeks.min}-{topic.weeks.max} minggu</strong>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#38d864]">+{roomXP} XP</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#fb923c]">Relik: {relicDisplayName}</span>
                          {bestQuizScore !== undefined && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-[#3ac5eb]">Skor: {bestQuizScore}%</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Plain-text "Catatan bukti" rendered under the quest card */}
                    <div
                      data-testid={`guild-quest-evidence-${topic.number}`}
                      className="mt-3 pt-2.5 border-t-2 border-[#3a2030] bg-[#0d0a1a] px-3 py-2"
                    >
                      <div className="font-pixel text-[8px] text-[#fb923c] mb-0.5">
                        CATATAN BUKTI (TEKS BIASA):
                      </div>
                      {savedEvidenceNote ? (
                        <p className="font-vt text-lg text-[#f4f1ea] break-words">
                          {savedEvidenceNote}
                        </p>
                      ) : (
                        <p className="font-vt text-base text-[#b3aad1] italic">
                          Belum ada catatan bukti ({topicContent?.evidenceHint || 'opsional'}).
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* FLOORS 1-4: Zigzag Room Nodes Path */
          <div className="space-y-4 relative">
            {currentFloor.topics.map((topic, idx) => {
              const unlocked = isRoomUnlocked(
                topic,
                currentFloor.topics,
                completedRooms,
                defeatedBosses
              );
              const completed = completedRooms.includes(topic.id);
              const isPlayerHere = activeNodeId === topic.id;
              const newlyUnlocked = newlyUnlockedIds.includes(topic.id);
              const bestQuizScore = quizBestScores[topic.id];

              const zigzagPattern: ('left' | 'center' | 'right')[] = [
                'left',
                'center',
                'right',
                'center',
              ];
              const zigzagAlign = zigzagPattern[idx % zigzagPattern.length];

              return (
                <React.Fragment key={topic.id}>
                  <RoomNode
                    topic={topic}
                    monsterType={currentFloor.monsterType}
                    unlocked={unlocked}
                    completed={completed}
                    isPlayerHere={isPlayerHere}
                    newlyUnlocked={newlyUnlocked}
                    avatarId={avatarId}
                    reduceMotion={reduceMotion}
                    bestQuizScore={bestQuizScore}
                    zigzagAlign={zigzagAlign}
                    onSelect={handleOpenRoom}
                  />

                  {/* Stepped Stone Path Connector Styled with Floor Accent */}
                  <div className="flex justify-center py-0.5" aria-hidden="true">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-2.5 h-2.5"
                        style={{
                          backgroundColor: completed
                            ? currentFloor.id === 2
                              ? '#1d8a3d'
                              : currentFloor.id === 3
                              ? '#9b5de5'
                              : currentFloor.id === 4
                              ? '#3ac5eb'
                              : currentFloor.themeColor
                            : unlocked
                            ? currentFloor.id === 2
                              ? '#a87312'
                              : currentFloor.id === 3
                              ? '#b3aad1'
                              : currentFloor.id === 4
                              ? '#2dd4bf'
                              : '#f5b935'
                            : '#5c4e99',
                        }}
                      />
                      <div
                        className="w-2.5 h-2.5"
                        style={{
                          backgroundColor: completed
                            ? currentFloor.id === 2
                              ? '#a87312'
                              : currentFloor.id === 3
                              ? '#7e22ce'
                              : currentFloor.id === 4
                              ? '#0891b2'
                              : currentFloor.themeColor
                            : '#5c4e99',
                        }}
                      />
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            {/* Boss Chamber Node at the End of the Floor */}
            <div className="pt-2">
              <div
                className={`w-full p-4 sm:p-5 transition-transform ${
                  floorBossDefeated
                    ? 'pixel-box-green'
                    : floorBossUnlocked
                    ? 'pixel-box-red'
                    : 'pixel-box opacity-80'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-4">
                    <div
                      className={`w-20 h-20 shrink-0 border-2 flex items-center justify-center relative ${
                        floorBossDefeated
                          ? 'bg-[#0a1714] border-[#38d864]'
                          : floorBossUnlocked
                          ? 'bg-[#170914] border-[#e83b47]'
                          : 'bg-[#120d26] border-[#5c4e99]'
                      }`}
                    >
                      {floorBossUnlocked || floorBossDefeated ? (
                        <MonsterSprite
                          type={currentFloor.boss.spriteType}
                          size={68}
                          state={floorBossDefeated ? 'defeated' : 'idle'}
                        />
                      ) : (
                        <PixelLockSprite size={36} />
                      )}
                      <span className="absolute -top-2 -left-2 bg-[#e83b47] border border-[#f4f1ea] px-1.5 py-0.5 font-pixel text-[8px] text-[#f4f1ea]">
                        BOS L{currentFloor.floorNumber}
                      </span>
                    </div>

                    <div>
                      <div className="font-pixel text-xs sm:text-sm text-[#e83b47]">
                        KAMAR BOS:{' '}
                        {(currentFloor.id === 2
                          ? 'Golem Pohon Purba'
                          : currentFloor.id === 3
                          ? 'Hydra Berkepala Banyak'
                          : currentFloor.id === 4
                          ? 'Mecha-Core'
                          : currentFloor.boss.name
                        ).toUpperCase()}
                      </div>
                      <div className="font-vt text-lg sm:text-xl text-[#f5b935]">
                        {currentFloor.boss.title} · Hadiah: +{BOSS_XP} XP,{' '}
                        {currentFloor.boss.badge.name} &amp; Relik{' '}
                        {currentFloor.id === 2
                          ? 'Daun Emas'
                          : currentFloor.id === 3
                          ? 'Inti Neuron'
                          : currentFloor.id === 4
                          ? 'Chip Edge'
                          : currentFloor.boss.relic.name}
                      </div>
                      <p className="font-vt text-lg text-[#b3aad1] mt-1">
                        {floorBossDefeated
                          ? currentFloor.id === 4
                            ? 'Bos lantai ini telah dikalahkan! Guild Hall menunggu: 8 quest paralel.'
                            : 'Bos lantai ini telah berhasil kamu kalahkan! Pintu lantai berikutnya telah terbuka.'
                          : floorBossUnlocked
                          ? 'Semua ruang di lantai ini sudah takluk! Gerbang Kamar Bos kini terbuka.'
                          : `Kalahkan seluruh ${currentFloor.topics.length} ruang di lantai ini terlebih dahulu untuk membuka segel Kamar Bos (${completedOnFloor}/${currentFloor.topics.length} selesai).`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                    {activeNodeId === currentFloor.boss.id && (
                      <div className="flex items-center gap-1.5 bg-[#0d0a1a] border-2 border-[#38d864] px-2 py-1">
                        <AvatarSprite avatarId={avatarId} size={28} />
                        <span className="font-pixel text-[8px] text-[#38d864]">POSISI</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <RelicSprite iconType={currentFloor.boss.relic.iconType} size={32} />
                      <button
                        type="button"
                        disabled={!floorBossUnlocked}
                        onClick={handleOpenBoss}
                        className={`pixel-btn px-4 py-2.5 font-pixel text-[10px] sm:text-xs gap-2 whitespace-nowrap ${
                          floorBossDefeated
                            ? 'bg-[#1d8a3d] text-[#f4f1ea]'
                            : floorBossUnlocked
                            ? 'bg-[#e83b47] text-[#f4f1ea]'
                            : 'bg-[#16112b] text-[#b3aad1]'
                        }`}
                      >
                        <PixelSwordSprite size={16} />
                        <span>
                          {floorBossDefeated
                            ? 'LIHAT TANTANGAN BOS'
                            : floorBossUnlocked
                            ? 'TANTANG BOS!'
                            : 'BOS TERKUNCI'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.section>
    </div>
  );
};
