import React from 'react';
import { FLOORS, TOWER_FLOOR } from '../data/roadmap.js';
import { useGameStore } from '../store/useGameStore';
import { isFloorUnlocked } from '../game/formulas';
import { MonsterSprite, PixelLockSprite, PixelSwordSprite } from '../components/PixelSprites';
import { useSound } from '../hooks/useSound.js';

export const TowerPage: React.FC = () => {
  const defeatedBosses = useGameStore((s) => s.defeatedBosses);
  const completedTowerQuests = useGameStore((s) => s.completedTowerQuests);
  const toggleTowerQuest = useGameStore((s) => s.toggleTowerQuest);
  const selectFloor = useGameStore((s) => s.selectFloor);
  const { playDefeat, playClick } = useSound();

  const towerUnlocked = isFloorUnlocked(6, defeatedBosses);

  const handleCompleteQuest = (questId: string) => {
    if (!towerUnlocked) return;
    playDefeat();
    toggleTowerQuest(questId);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3 pb-14 space-y-6">
      {/* Tower Header & Guardian */}
      <section aria-label="Menara Master Lantai 6" className="pixel-box p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#3a306e] pb-4 mb-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-20 h-20 bg-[#120d26] border-2 border-[#9b5de5] flex items-center justify-center shrink-0">
              {towerUnlocked ? (
                <MonsterSprite type="guardian" size={68} />
              ) : (
                <PixelLockSprite size={40} />
              )}
            </div>
            <div>
              <div className="font-pixel text-[10px] text-[#f5b935]">
                ENDGAME · ROAD TO MASTER (7 QUEST × 150 XP)
              </div>
              <h1 className="font-pixel text-base sm:text-xl text-[#f4f1ea] mt-1">
                {TOWER_FLOOR.title}
              </h1>
              <p className="font-vt text-xl text-[#b3aad1] mt-1">
                {TOWER_FLOOR.subtitle}
              </p>
            </div>
          </div>

          <div className="bg-[#120d26] border-2 border-[#f5b935] px-4 py-2.5 shrink-0 self-start md:self-center">
            <div className="font-pixel text-[10px] text-[#38d864] tabular-nums">
              QUEST MASTER: {completedTowerQuests.length}/{TOWER_FLOOR.quests.length}
            </div>
            <div className="font-vt text-lg text-[#f5b935]">
              Status: {towerUnlocked ? 'TERBUKA ✓' : `Terkunci (${defeatedBosses.length}/5 Bos)`}
            </div>
          </div>
        </div>

        {/* Unverified Links Disclaimer Note */}
        <div className="bg-[#16101f] border-2 border-[#f5b935] p-3.5 mb-4">
          <div className="font-pixel text-[10px] text-[#f5b935] mb-1">
            CATATAN PENCARIAN SUMBER BELAJAR
          </div>
          <p className="font-vt text-lg sm:text-xl text-[#f4f1ea]">
            {TOWER_FLOOR.unverifiedLinksNote}
          </p>
        </div>

        {/* Lock Seal Status if 5 Bosses are not yet defeated */}
        {!towerUnlocked && (
          <div className="pixel-box-red p-4 mb-2">
            <div className="font-pixel text-xs text-[#f5b935] mb-2">
              SEGEL MENARA MASTER MASIH AKTIF ({defeatedBosses.length}/5 BOS DIKALAHKAN)
            </div>
            <p className="font-vt text-xl text-[#f4f1ea] mb-3">
              Kalahkan kelima Bos Lantai (Lantai 1 hingga Lantai 5) untuk membuka kunci penyelesaian Quest di Menara Master:
            </p>
            <div className="flex flex-wrap gap-2">
              {FLOORS.map((floor) => {
                const done = defeatedBosses.includes(floor.boss.id);
                return (
                  <button
                    key={floor.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      selectFloor(floor.id);
                    }}
                    className={`pixel-btn px-3 py-1.5 font-vt text-lg ${
                      done
                        ? 'bg-[#1d8a3d] text-[#f4f1ea]'
                        : 'bg-[#16112b] text-[#f5b935]'
                    }`}
                  >
                    L{floor.floorNumber} {floor.boss.name}: {done ? '✓ Takluk' : 'Ke Lantai →'}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 7 Road to Master Quests List */}
      <section aria-label="Daftar 7 Quest Road to Master" className="space-y-4">
        {TOWER_FLOOR.quests.map((quest) => {
          const isCompleted = completedTowerQuests.includes(quest.id);
          return (
            <div
              key={quest.id}
              className={`p-4 sm:p-5 ${
                isCompleted
                  ? 'pixel-box-green'
                  : towerUnlocked
                  ? 'pixel-box-gold'
                  : 'pixel-box opacity-80'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="bg-[#0d0a1a] border border-[#f5b935] px-2 py-0.5 font-pixel text-[9px] text-[#f5b935]">
                      QUEST MASTER #{quest.number}
                    </span>
                    <span className="font-pixel text-xs sm:text-sm text-[#f4f1ea]">
                      {quest.title}
                    </span>
                    <span className="font-vt text-lg text-[#38d864] tabular-nums">
                      +{quest.xp} XP
                    </span>
                  </div>

                  <p className="font-vt text-xl text-[#f4f1ea] mt-1 leading-snug">
                    {quest.description}
                  </p>

                  {/* Named Books, Courses, Channels & Papers */}
                  <div className="mt-3 bg-[#120d26] border border-[#5c4e99] p-3">
                    <div className="font-pixel text-[9px] text-[#3ac5eb] mb-1.5">
                      REFERENSI BUKU / KURSUS / PAPER / TARGET:
                    </div>
                    <ul className="space-y-1 font-vt text-lg text-[#b3aad1] list-disc list-inside">
                      {quest.references.map((refItem, i) => (
                        <li key={i} className="text-[#f4f1ea]">
                          {refItem}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="shrink-0 self-start md:self-center">
                  <button
                    type="button"
                    disabled={!towerUnlocked || isCompleted}
                    onClick={() => handleCompleteQuest(quest.id)}
                    className={`pixel-btn px-4 py-2.5 font-pixel text-[10px] sm:text-xs gap-2 whitespace-nowrap ${
                      isCompleted
                        ? 'bg-[#1d8a3d] text-[#f4f1ea]'
                        : towerUnlocked
                        ? 'bg-[#38d864] text-[#0d0a1a]'
                        : 'bg-[#16112b] text-[#b3aad1]'
                    }`}
                  >
                    <PixelSwordSprite size={15} />
                    <span>
                      {isCompleted
                        ? '✓ QUEST SELESAI'
                        : towerUnlocked
                        ? 'TANDAI SELESAI (+150 XP)'
                        : 'TERKUNCI (KALAHKAN 5 BOS)'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
