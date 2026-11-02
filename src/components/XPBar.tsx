import React, { useEffect, useMemo, useState } from 'react';
import { useGameStore, ScreenView } from '../store/useGameStore';
import { getDisplayStreak, getLevelProgress, isFloorUnlocked } from '../game/formulas';
import { getLocalDateKey } from '../game/campTracker';
import { getDueReviewItems } from '../game/lessonEngine';
import { AvatarSprite, PixelLockSprite } from './PixelSprites';
import { MusicHudIndicator } from './MusicControls';
import { useSound } from '../hooks/useSound.js';
import { ALL_TOPICS } from '../data/roadmap.js';

export interface XPBarProps {
  onOpen3DDungeon?: () => void;
}

export const XPBar: React.FC<XPBarProps> = ({ onOpen3DDungeon }) => {
  const playerName = useGameStore((s) => s.playerName);
  const avatarId = useGameStore((s) => s.avatarId);
  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streak);
  const lastActiveDate = useGameStore((s) => s.lastActiveDate);
  const completedRooms = useGameStore((s) => s.completedRooms);
  const spellsUnlocked = useGameStore((s) => s.spellsUnlocked);
  const defeatedBosses = useGameStore((s) => s.defeatedBosses);
  const reviewQueue = useGameStore((s) => s.reviewQueue);
  const currentView = useGameStore((s) => s.currentView);
  const activeFloorId = useGameStore((s) => s.activeFloorId);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const setView = useGameStore((s) => s.setView);
  const selectFloor = useGameStore((s) => s.selectFloor);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const { playClick } = useSound();

  // Animated XP tick-up counter
  const [displayedXP, setDisplayedXP] = useState(xp);
  useEffect(() => {
    if (displayedXP === xp) return;
    const diff = xp - displayedXP;
    const step = Math.max(1, Math.ceil(Math.abs(diff) / 12));
    const timer = setTimeout(() => {
      if (diff > 0) {
        setDisplayedXP((prev) => Math.min(xp, prev + step));
      } else {
        setDisplayedXP(xp);
      }
    }, 25);
    return () => clearTimeout(timer);
  }, [xp, displayedXP]);

  const levelInfo = getLevelProgress(xp);
  const activeStreak = getDisplayStreak(streak, lastActiveDate);
  const towerUnlocked = isFloorUnlocked(6, defeatedBosses);

  const dueReviewCount = useMemo(
    () => getDueReviewItems(reviewQueue, getLocalDateKey(), 10).totalDueCount,
    [reviewQueue]
  );

  const handleNav = (view: ScreenView) => {
    playClick();
    setView(view);
  };

  const navItems: { id: ScreenView; label: string; badge?: string }[] = [
    {
      id: 'dungeon',
      label: 'Peta Dungeon',
      badge: `L${activeFloorId <= 5 ? activeFloorId : 1}`,
    },
    {
      id: 'grimoire',
      label: 'Grimoire & Dojo',
      badge: `${spellsUnlocked.length}/28`,
    },
    {
      id: 'review',
      label: 'Ulasan Harian',
      badge: `${dueReviewCount}`,
    },
    {
      id: 'camp',
      label: 'Camp Api Unggun',
    },
    {
      id: 'tower',
      label: 'Menara Master',
      badge: towerUnlocked ? 'TERBUKA' : 'L6',
    },
    {
      id: 'dashboard',
      label: 'Karakter & Statistik',
      badge: `${completedRooms.length}/${ALL_TOPICS.length}`,
    },
    {
      id: 'inventory',
      label: 'Inventori Relik',
    },
    {
      id: 'settings',
      label: 'Pengaturan',
    },
  ];

  return (
    <div
      role="region"
      aria-label="Status Petualang dan Navigasi Dungeon"
      className="w-full max-w-6xl mx-auto px-3 pt-3 pb-2"
    >
      <div className="pixel-box p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Left: Character Avatar, Name, Title & Level */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 bg-[#120d26] border-2 border-[#f5b935] flex items-center justify-center shrink-0">
              <AvatarSprite avatarId={avatarId} size={44} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-pixel text-xs sm:text-sm text-[#f4f1ea] truncate">
                  {playerName}
                </span>
                <span className="font-pixel text-[10px] text-[#f5b935] bg-[#120d26] px-2 py-0.5 border border-[#f5b935] whitespace-nowrap">
                  Lv.{levelInfo.level}
                </span>
              </div>
              <div className="font-vt text-lg sm:text-xl text-[#38d864] flex flex-wrap items-center gap-x-2">
                <span>Gelar: {levelInfo.title}</span>
                <span aria-hidden="true" className="text-[#5c4e99]">
                  ·
                </span>
                <span className="text-[#f5b935] tabular-nums">
                  Streak: {activeStreak} hari
                </span>
              </div>
            </div>
          </div>

          {/* Center: Shimmering XP Bar */}
          <div className="flex-1 max-w-md w-full">
            <div className="flex items-center justify-between font-vt text-base sm:text-lg mb-1">
              <span className="text-[#b3aad1]">EXP PETUALANG</span>
              <span className="text-[#38d864] tabular-nums font-bold">
                {displayedXP} XP (Lv.{levelInfo.level + 1}: {levelInfo.nextLevelXP} XP)
              </span>
            </div>
            <div
              className="w-full h-5 bg-[#0d0a1a] border-2 border-[#5c4e99] p-0.5 relative overflow-hidden"
              role="progressbar"
              aria-valuenow={levelInfo.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progres XP menuju level berikutnya"
            >
              <div
                className="h-full xp-bar-fill transition-all duration-300"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center font-pixel text-[9px] text-[#f4f1ea] drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] tabular-nums">
                {levelInfo.xpInCurrentLevel} / {levelInfo.xpNeededForNextLevel} XP ({levelInfo.progressPercent}%)
              </span>
            </div>
          </div>

          {/* Right: Quick Sound Toggle + Guild Hall Shortcut + Portal 3D */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
            {onOpen3DDungeon && (
              <button
                type="button"
                data-testid="open-dungeon-3d-btn"
                onClick={() => {
                  playClick();
                  onOpen3DDungeon();
                }}
                className="pixel-btn px-2.5 py-1.5 bg-[#12263a] text-[#3ac5eb] border-[#3ac5eb] font-vt text-base sm:text-lg whitespace-nowrap"
                title="Buka Portal Dimensi 3D Interaktif (Three.js)"
              >
                ✦ Portal Dimensi 3D
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                playClick();
                selectFloor(5);
              }}
              className="pixel-btn px-2.5 py-1.5 bg-[#291324] text-[#f5b935] font-vt text-base sm:text-lg whitespace-nowrap"
              title="Buka Lantai 5: Aula Guild (Paralel Fase 2-4)"
            >
              Aula Guild (F5)
            </button>
            <MusicHudIndicator />
            <button
              type="button"
              onClick={() => {
                toggleSound();
              }}
              aria-label={soundEnabled ? 'Matikan Efek Suara 8-Bit' : 'Nyalakan Efek Suara 8-Bit'}
              className={`pixel-btn px-2.5 py-1.5 font-vt text-base sm:text-lg whitespace-nowrap ${
                soundEnabled
                  ? 'bg-[#1d8a3d] text-[#f4f1ea]'
                  : 'bg-[#16112b] text-[#b3aad1]'
              }`}
            >
              {soundEnabled ? 'Suara: ON' : 'Suara: OFF'}
            </button>
          </div>
        </div>

        {/* Navigation Strip */}
        <nav
          aria-label="Menu Utama Game"
          className="mt-3 pt-2.5 border-t-2 border-[#3a306e] flex flex-wrap items-center gap-2"
        >
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            const isTowerItem = item.id === 'tower';
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handleNav(item.id)}
                className={`pixel-btn px-3 py-1.5 font-vt text-lg sm:text-xl whitespace-nowrap gap-1.5 ${
                  isActive
                    ? 'bg-[#38d864] text-[#0d0a1a] font-bold border-[#f4f1ea]'
                    : 'bg-[#16112b] text-[#f4f1ea] hover:bg-[#2b2352]'
                }`}
              >
                {isTowerItem && !towerUnlocked && <PixelLockSprite size={14} />}
                <span>{item.label.trim()}</span>
                {item.badge && (
                  <span
                    className={`font-pixel text-[9px] px-1.5 py-0.5 ${
                      isActive
                        ? 'bg-[#0d0a1a] text-[#38d864]'
                        : 'bg-[#0d0a1a] text-[#f5b935]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
