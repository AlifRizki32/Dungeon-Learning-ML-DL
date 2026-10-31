import React from 'react';
import {
  ALL_BADGES,
  ALL_RELICS,
  ALL_TOPICS,
  FLOORS,
  ROADMAP_ASSUMPTIONS,
  TOWER_FLOOR,
} from '../data/roadmap.js';
import { useGameStore } from '../store/useGameStore';
import {
  calculateWeeksConquered,
  getDisplayStreak,
  getLevelProgress,
  isFloorUnlocked,
} from '../game/formulas';
import { getWeakestTopics } from '../game/quizEngine';
import { AvatarSprite, BadgeSprite, RelicSprite } from '../components/PixelSprites';
import { useSound } from '../hooks/useSound.js';

export const DashboardPage: React.FC = () => {
  const playerName = useGameStore((s) => s.playerName);
  const avatarId = useGameStore((s) => s.avatarId);
  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streak);
  const lastActiveDate = useGameStore((s) => s.lastActiveDate);
  const completedRooms = useGameStore((s) => s.completedRooms);
  const defeatedBosses = useGameStore((s) => s.defeatedBosses);
  const completedTowerQuests = useGameStore((s) => s.completedTowerQuests);
  const quizBestScores = useGameStore((s) => s.quizBestScores);
  const badges = useGameStore((s) => s.badges);
  const relics = useGameStore((s) => s.relics);
  const selectFloor = useGameStore((s) => s.selectFloor);
  const openRoomBattle = useGameStore((s) => s.openRoomBattle);
  const setView = useGameStore((s) => s.setView);
  const { playClick } = useSound();

  const levelInfo = getLevelProgress(xp);
  const activeStreak = getDisplayStreak(streak, lastActiveDate);
  const weeksStats = calculateWeeksConquered(completedRooms);
  const weakestTopics = getWeakestTopics(quizBestScores, 6);

  return (
    <div className="w-full max-w-6xl mx-auto px-3 pb-14 space-y-6">
      {/* Section 1: Hero Summary & Key Metrics */}
      <section aria-label="Ringkasan Karakter dan Progres" className="pixel-box p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#3a306e] pb-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-[#120d26] border-2 border-[#f5b935] flex items-center justify-center shrink-0">
              <AvatarSprite avatarId={avatarId} size={64} />
            </div>
            <div>
              <div className="font-pixel text-sm sm:text-base text-[#f4f1ea]">
                {playerName}
              </div>
              <div className="font-vt text-2xl text-[#38d864]">
                Level {levelInfo.level} · Gelar: {levelInfo.title}
              </div>
              <div className="font-vt text-lg text-[#b3aad1] tabular-nums">
                Total EXP: {xp} XP · Target Lv.{levelInfo.level + 1}: {levelInfo.nextLevelXP} XP
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-[#120d26] border-2 border-[#5c4e99] px-3 py-2 text-center">
              <div className="font-pixel text-[9px] text-[#b3aad1]">STREAK HARI</div>
              <div className="font-pixel text-sm text-[#f5b935] mt-1 tabular-nums">
                {activeStreak}
              </div>
            </div>
            <div className="bg-[#120d26] border-2 border-[#5c4e99] px-3 py-2 text-center">
              <div className="font-pixel text-[9px] text-[#b3aad1]">RUANG TOPIK</div>
              <div className="font-pixel text-sm text-[#38d864] mt-1 tabular-nums">
                {completedRooms.length}/{ALL_TOPICS.length}
              </div>
            </div>
            <div className="bg-[#120d26] border-2 border-[#5c4e99] px-3 py-2 text-center">
              <div className="font-pixel text-[9px] text-[#b3aad1]">BOS LANTAI</div>
              <div className="font-pixel text-sm text-[#e83b47] mt-1 tabular-nums">
                {defeatedBosses.length}/5
              </div>
            </div>
            <div className="bg-[#120d26] border-2 border-[#5c4e99] px-3 py-2 text-center">
              <div className="font-pixel text-[9px] text-[#b3aad1]">RELIK PIXEL</div>
              <div className="font-pixel text-sm text-[#3ac5eb] mt-1 tabular-nums">
                {relics.length}/{ALL_RELICS.length}
              </div>
            </div>
          </div>
        </div>

        {/* Weeks Conquered vs Total Estimated Weeks */}
        <div className="pixel-box-gold p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <h2 className="font-pixel text-xs sm:text-sm text-[#f5b935]">
                MINGGU DITAKLUKKAN VS TOTAL ESTIMASI MINGGU
              </h2>
              <p className="font-vt text-lg text-[#b3aad1]">
                Akumulasi beban minggu dari topik yang sudah kamu taklukkan.
              </p>
            </div>
            <div className="font-pixel text-xs text-[#38d864] tabular-nums">
              {weeksStats.conqueredMin}-{weeksStats.conqueredMax} / {weeksStats.rawTotalMin}-{weeksStats.rawTotalMax} minggu ({weeksStats.percentConquered}%)
            </div>
          </div>

          <div
            className="w-full h-5 bg-[#0d0a1a] border-2 border-[#f5b935] p-0.5 mb-2"
            role="progressbar"
            aria-valuenow={weeksStats.percentConquered}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Persentase minggu kurikulum yang telah ditaklukkan"
          >
            <div
              className="h-full bg-[#38d864] transition-all duration-300"
              style={{ width: `${weeksStats.percentConquered}%` }}
            />
          </div>

          <div className="font-vt text-lg text-[#f4f1ea] tabular-nums">
            Setara progres efektif (setelah overlap paralel):{' '}
            <strong className="text-[#38d864]">
              ~{weeksStats.effectiveConqueredMin}-{weeksStats.effectiveConqueredMax} minggu
            </strong>{' '}
            dari total efektif <strong className="text-[#f5b935]">66-88 minggu</strong>.
          </div>
        </div>
      </section>

      {/* Section 2: "Kelemahan" — Lowest-Scoring Topics from Jurus Rahasia Quiz Engine */}
      <section
        aria-label="Analisis Kelemahan dan Rekor Kuis Jurus Rahasia"
        className="pixel-box-red p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#e83b47] pb-3 mb-4">
          <div>
            <h2 className="font-pixel text-sm text-[#f5b935]">
              KELEMAHAN &amp; EVALUASI JURUS RAHASIA
            </h2>
            <p className="font-vt text-xl text-[#f4f1ea]">
              Menyoroti topik dengan skor kuis terendah agar kamu tahu konsep mana yang perlu diperkuat.
            </p>
          </div>
          <span className="font-pixel text-[10px] text-[#3ac5eb] tabular-nums">
            Topik Diuji: {Object.keys(quizBestScores).length}
          </span>
        </div>

        {weakestTopics.length === 0 ? (
          <div className="bg-[#120d26] border-2 border-[#5c4e99] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="font-vt text-xl text-[#b3aad1]">
              Belum ada rekor kuis Jurus Rahasia yang tercatat. Masuk ke Ruang Lantai 1 dan tantang monster untuk menguji pemahaman konsepmu!
            </p>
            <button
              type="button"
              onClick={() => {
                playClick();
                selectFloor(1);
              }}
              className="pixel-btn px-3.5 py-2 bg-[#38d864] text-[#0d0a1a] font-pixel text-[10px] whitespace-nowrap shrink-0"
            >
              MULAI DI LANTAI 1 →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {weakestTopics.map((item, idx) => {
              const isWeak = item.bestScorePercent < 80;
              const isLowest = idx === 0 && item.bestScorePercent < 100;
              return (
                <div
                  key={item.topicId}
                  className={`p-3.5 border-2 flex flex-col justify-between gap-3 ${
                    isWeak
                      ? 'bg-[#291324] border-[#e83b47]'
                      : item.bestScorePercent < 100
                      ? 'bg-[#16101f] border-[#f5b935]'
                      : 'bg-[#132924] border-[#38d864]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-pixel text-[9px] text-[#f5b935]">
                        LANTAI {item.floorId} · TOPIK #{item.number}
                      </span>
                      <span
                        className={`font-pixel text-[9px] px-1.5 py-0.5 border tabular-nums ${
                          isWeak
                            ? 'bg-[#0d0a1a] text-[#e83b47] border-[#e83b47]'
                            : item.bestScorePercent < 100
                            ? 'bg-[#0d0a1a] text-[#f5b935] border-[#f5b935]'
                            : 'bg-[#0d0a1a] text-[#38d864] border-[#38d864]'
                        }`}
                      >
                        Skor Terbaik: {item.bestScorePercent}%
                      </span>
                    </div>

                    <div className="font-pixel text-xs text-[#f4f1ea] leading-snug">
                      {item.name}
                    </div>

                    <div className="font-vt text-lg text-[#b3aad1] mt-1">
                      {isWeak
                        ? '⚠ Prioritas Kelemahan Utama: Skor masih di bawah 80%. Latih kembali konsep ini!'
                        : isLowest
                        ? '⚡ Area Peningkatan: Topik dengan skor terendah dari seluruh percobaanmu.'
                        : item.bestScorePercent < 100
                        ? 'Cukup kuat (80%), tantang ulang untuk meraih 100% sempurna!'
                        : '✓ Penguasaan Sempurna (100% Kritikal)!'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      selectFloor(item.floorId);
                      openRoomBattle(item.topicId);
                    }}
                    className="pixel-btn w-full py-1.5 bg-[#1f193d] text-[#f4f1ea] font-pixel text-[9px]"
                  >
                    LATIH ULANG TOPIK #{item.number} →
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 3: Per-Phase Progress */}
      <section aria-label="Progres Per Fase dan Lantai" className="pixel-box p-4 sm:p-6">
        <h2 className="font-pixel text-sm text-[#f5b935] mb-4">
          PROGRES PER FASE (LANTAI 1 - 6)
        </h2>

        <div className="space-y-3.5">
          {FLOORS.map((floor) => {
            const doneCount = floor.topics.filter((t) => completedRooms.includes(t.id)).length;
            const totalCount = floor.topics.length;
            const pct = Math.round((doneCount / totalCount) * 100);
            const bossDone = defeatedBosses.includes(floor.boss.id);
            const floorUnlocked = isFloorUnlocked(floor.id, defeatedBosses);

            return (
              <div
                key={floor.id}
                className="bg-[#120d26] border-2 border-[#5c4e99] p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="font-pixel text-xs text-[#f4f1ea]">
                      {floor.phaseTitle}
                    </span>
                    <span className="font-vt text-lg text-[#f5b935] tabular-nums">
                      Estimasi: {floor.weeks.min}-{floor.weeks.max} minggu · {doneCount}/{totalCount} ruang ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-3.5 bg-[#0d0a1a] border border-[#5c4e99] p-0.5">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: floor.themeColor,
                      }}
                    />
                  </div>
                  <div className="font-vt text-base text-[#b3aad1] mt-1">
                    Bos Lantai ({floor.boss.name}):{' '}
                    <span className={bossDone ? 'text-[#38d864]' : 'text-[#e83b47]'}>
                      {bossDone ? 'Sudah Dikalahkan ✓' : 'Belum Dikalahkan'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!floorUnlocked}
                  onClick={() => {
                    if (!floorUnlocked) return;
                    playClick();
                    selectFloor(floor.id);
                  }}
                  className="pixel-btn px-3 py-1.5 bg-[#1f193d] text-[#f4f1ea] font-pixel text-[10px] self-start md:self-center whitespace-nowrap"
                >
                  {floorUnlocked ? `BUKA LANTAI ${floor.floorNumber}` : 'TERKUNCI'}
                </button>
              </div>
            );
          })}

          {/* Floor 6: Menara Master Progress */}
          <div className="bg-[#120d26] border-2 border-[#9b5de5] p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="font-pixel text-xs text-[#f4f1ea]">
                  {TOWER_FLOOR.title} (Road to Master)
                </span>
                <span className="font-vt text-lg text-[#38d864] tabular-nums">
                  {completedTowerQuests.length}/{TOWER_FLOOR.quests.length} Quest Selesai
                </span>
              </div>
              <div className="w-full h-3.5 bg-[#0d0a1a] border border-[#9b5de5] p-0.5">
                <div
                  className="h-full bg-[#9b5de5] transition-all duration-300"
                  style={{
                    width: `${Math.round(
                      (completedTowerQuests.length / TOWER_FLOOR.quests.length) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                playClick();
                selectFloor(6);
              }}
              className="pixel-btn px-3 py-1.5 bg-[#9b5de5] text-[#0d0a1a] font-pixel text-[10px] self-start md:self-center whitespace-nowrap"
            >
              KE MENARA
            </button>
          </div>
        </div>
      </section>

      {/* Section 4: Total Time Table (79-104 -> 75-100 -> 66-88 weeks) */}
      <section aria-label="Tabel Perhitungan Total Waktu Belajar" className="pixel-box p-4 sm:p-6">
        <h2 className="font-pixel text-sm text-[#3ac5eb] mb-2">
          TABEL RINGKASAN TOTAL WAKTU BELAJAR (66-88 MINGGU SETELAH OVERLAP)
        </h2>
        <p className="font-vt text-xl text-[#b3aad1] mb-4">
          {ROADMAP_ASSUMPTIONS.disclaimer}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-vt text-lg sm:text-xl text-left">
            <thead>
              <tr className="bg-[#120d26] border-b-2 border-[#5c4e99] text-[#f5b935] font-pixel text-[10px]">
                <th className="p-3">TAHAP PERHITUNGAN</th>
                <th className="p-3">RENTANG MINGGU</th>
                <th className="p-3">KETERANGAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3a306e] tabular-nums">
              <tr className="bg-[#16112b]">
                <td className="p-3 text-[#f4f1ea] font-bold">
                  1. Total Sebelum Paralel (Fase 1 - Fase 5 Berurutan)
                </td>
                <td className="p-3 text-[#f5b935] font-bold">79 - 104 minggu</td>
                <td className="p-3 text-[#b3aad1]">
                  Penjumlahan mentah Fase 1 (17-23), Fase 2 (13-16), Fase 3 (18-22), Fase 4 (13-18), dan Fase 5 (18-25).
                </td>
              </tr>
              <tr className="bg-[#120d26]">
                <td className="p-3 text-[#f4f1ea] font-bold">
                  2. Setelah Python (No. 6) Berjalan Paralel
                </td>
                <td className="p-3 text-[#3ac5eb] font-bold">75 - 100 minggu</td>
                <td className="p-3 text-[#b3aad1]">
                  Topik 6 (Python untuk data, 3-4 minggu) dipelajari paralel bersama Topik 2-3 di Fase 1.
                </td>
              </tr>
              <tr className="bg-[#132924]">
                <td className="p-3 text-[#38d864] font-bold">
                  3. Total Efektif Setelah Fase 5 Paralel Lewat Proyek
                </td>
                <td className="p-3 text-[#38d864] font-bold">
                  66 - 88 minggu (15-20 bulan @ 8-10 jam/minggu)
                </td>
                <td className="p-3 text-[#f4f1ea]">
                  Fase 5 paling efektif dikerjakan paralel bersama Fase 2-4 melalui proyek nyata. Pada 20 jam/minggu durasinya kira-kira separuhnya.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 5: Quick Badges & Relics Preview */}
      <section aria-label="Koleksi Lencana dan Relik Singkat" className="pixel-box p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="font-pixel text-xs sm:text-sm text-[#f5b935]">
            LENCANA &amp; RELIK YANG TELAH DIRAIH
          </h2>
          <button
            type="button"
            onClick={() => {
              playClick();
              setView('inventory');
            }}
            className="pixel-btn px-3 py-1.5 bg-[#1f193d] text-[#3ac5eb] font-vt text-lg"
          >
            Lihat Inventori Lengkap →
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          {ALL_BADGES.map((b) => {
            const owned = badges.includes(b.id);
            return (
              <div
                key={b.id}
                className={`flex items-center gap-2 px-3 py-2 border-2 ${
                  owned
                    ? 'bg-[#120d26] border-[#f5b935] text-[#f4f1ea]'
                    : 'bg-[#120d26] border-[#3a306e] text-[#b3aad1] opacity-50'
                }`}
              >
                <BadgeSprite badgeId={b.id} size={24} />
                <span className="font-vt text-lg">{b.name}</span>
              </div>
            );
          })}
          {ALL_RELICS.filter((r) => relics.includes(r.id)).map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-2 px-3 py-2 border-2 bg-[#132924] border-[#38d864] text-[#f4f1ea]"
            >
              <RelicSprite iconType={r.iconType} size={24} />
              <span className="font-vt text-lg">{r.name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
