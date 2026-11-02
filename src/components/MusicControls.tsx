import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { musicManager } from '../audio/musicManager';
import { MUSIC_THEME_LIST } from '../audio/musicTracks';
import { useMusicSnapshot } from '../hooks/useBackgroundMusic';
import { useSound } from '../hooks/useSound.js';

/**
 * Pixel-art 8-bit musical note SVG icon matching the existing RPG aesthetic.
 */
export const PixelMusicNoteIcon: React.FC<{
  size?: number;
  active?: boolean;
}> = ({ size = 14, active = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className="shrink-0"
  >
    {/* Note stem and beam */}
    <rect
      x="6"
      y="2"
      width="8"
      height="2"
      fill={active ? '#f5b935' : '#7b6fa6'}
    />
    <rect
      x="6"
      y="4"
      width="2"
      height="8"
      fill={active ? '#f4f1ea' : '#7b6fa6'}
    />
    <rect
      x="12"
      y="4"
      width="2"
      height="7"
      fill={active ? '#f4f1ea' : '#7b6fa6'}
    />
    {/* Left note head */}
    <rect
      x="3"
      y="10"
      width="5"
      height="4"
      fill={active ? '#38d864' : '#5c4e99'}
    />
    {/* Right note head */}
    <rect
      x="9"
      y="9"
      width="5"
      height="4"
      fill={active ? '#3ac5eb' : '#5c4e99'}
    />
  </svg>
);

export interface MusicHudIndicatorProps {
  compact?: boolean;
}

/**
 * Subtle pixel-art HUD music indicator & quick mute/unmute button.
 * Shows current music state (ON/OFF) and active dynamic RPG theme name.
 */
export const MusicHudIndicator: React.FC<MusicHudIndicatorProps> = ({
  compact = false,
}) => {
  const musicEnabled = useGameStore((s) => s.musicEnabled ?? true);
  const toggleMusic = useGameStore((s) => s.toggleMusic);
  const snapshot = useMusicSnapshot();
  const { playClick } = useSound();

  const handleToggle = () => {
    musicManager.notifyUserInteraction();
    playClick();
    toggleMusic();
  };

  return (
    <div
      className="inline-flex items-center gap-1.5"
      data-testid="music-hud-container"
      data-music-theme={snapshot.currentThemeId}
      data-music-enabled={String(musicEnabled)}
      data-music-playing={String(snapshot.isPlaying)}
    >
      <button
        type="button"
        data-testid="music-hud-toggle"
        onClick={handleToggle}
        aria-label={
          musicEnabled
            ? `Matikan Musik Latar (${snapshot.currentTrack.titleId})`
            : 'Nyalakan Musik Latar Chiptune'
        }
        title={`Musik Latar: ${snapshot.currentTrack.titleId} — ${snapshot.currentTrack.subtitleId}`}
        className={`pixel-btn px-2.5 py-1.5 font-vt text-base sm:text-lg whitespace-nowrap gap-1.5 ${
          musicEnabled
            ? 'bg-[#21163e] text-[#f5b935] border-[#f5b935]'
            : 'bg-[#16112b] text-[#b3aad1]'
        }`}
      >
        <PixelMusicNoteIcon size={14} active={musicEnabled} />
        <span>{musicEnabled ? 'Musik: ON' : 'Musik: OFF'}</span>
        {!compact && musicEnabled && (
          <span
            data-testid="music-hud-theme-label"
            className="sr-only"
          >
            {snapshot.currentTrack.titleId}
          </span>
        )}
      </button>
    </div>
  );
};

/**
 * Full Music & SFX volume/toggle controls for SettingsPage.tsx.
 */
export const MusicSettingsPanel: React.FC = () => {
  const musicEnabled = useGameStore((s) => s.musicEnabled ?? true);
  const musicVolume = useGameStore((s) => s.musicVolume ?? 0.35);
  const sfxVolume = useGameStore((s) => s.sfxVolume ?? 0.75);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const toggleMusic = useGameStore((s) => s.toggleMusic);
  const setMusicVolume = useGameStore((s) => s.setMusicVolume);
  const setSfxVolume = useGameStore((s) => s.setSfxVolume);

  const snapshot = useMusicSnapshot();
  const { playClick } = useSound();

  const musicVolumePercent = Math.round(musicVolume * 100);
  const sfxVolumePercent = Math.round(sfxVolume * 100);

  return (
    <div className="space-y-4">
      {/* Dynamic Background Music Toggle & Theme Status */}
      <div
        className="bg-[#120d26] border-2 border-[#5c4e99] p-4 space-y-3"
        data-testid="settings-music-section"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <PixelMusicNoteIcon size={15} active={musicEnabled} />
              <span className="font-pixel text-xs text-[#f4f1ea]">
                MUSIK LATAR CHIPTUNE DINAMIS (BGM)
              </span>
              <span
                data-testid="settings-active-theme-badge"
                className="font-pixel text-[9px] px-2 py-0.5 bg-[#0d0a1a] border border-[#3ac5eb] text-[#3ac5eb]"
              >
                ♪ {snapshot.currentTrack.titleId}
              </span>
            </div>
            <p className="font-vt text-xl text-[#b3aad1] mt-1">
              Soundtrack RPG chiptune orisinal yang berganti otomatis mengikuti Layar Judul,
              Eksplorasi Dungeon (L1–L4), Aula Guild (L5), Pertarungan Boss, dan Menara Master (L6).
            </p>
          </div>
          <button
            type="button"
            role="switch"
            data-testid="settings-music-toggle"
            aria-checked={musicEnabled}
            aria-label="Aktifkan atau matikan musik latar chiptune"
            onClick={() => {
              musicManager.notifyUserInteraction();
              playClick();
              toggleMusic();
            }}
            className={`pixel-btn px-4 py-2 font-pixel text-xs whitespace-nowrap ${
              musicEnabled
                ? 'bg-[#38d864] text-[#0d0a1a]'
                : 'bg-[#16112b] text-[#b3aad1]'
            }`}
          >
            {musicEnabled ? 'AKTIF (ON)' : 'MATI (OFF)'}
          </button>
        </div>

        {/* Music Volume Slider */}
        <div className="pt-2 border-t border-[#2b2352] space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="settings-music-volume"
              className="font-pixel text-[10px] text-[#f5b935]"
            >
              VOLUME MUSIK LATAR (0% – 100%)
            </label>
            <span
              data-testid="settings-music-volume-value"
              className="font-pixel text-xs text-[#f5b935] bg-[#0d0a1a] px-2.5 py-0.5 border border-[#f5b935] tabular-nums"
            >
              {musicVolumePercent}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="settings-music-volume"
              data-testid="settings-music-volume-slider"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={musicVolume}
              onChange={(e) => {
                musicManager.notifyUserInteraction();
                setMusicVolume(parseFloat(e.target.value));
              }}
              className="flex-1 accent-[#f5b935] cursor-pointer"
            />
            <button
              type="button"
              onClick={() => {
                musicManager.notifyUserInteraction();
                playClick();
                setMusicVolume(0.35);
              }}
              className="pixel-btn px-3 py-1 bg-[#16112b] text-[#b3aad1] font-pixel text-[9px]"
            >
              Default (35%)
            </button>
          </div>
        </div>

        {/* Active & Available Dynamic Themes List */}
        <div className="pt-2 border-t border-[#2b2352]">
          <div className="font-pixel text-[9px] text-[#b3aad1] mb-2">
            DAFTAR 5 TEMA MUSIK DINAMIS (OTOMATIS MENGIKUTI LOKASI &amp; BOSS):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {MUSIC_THEME_LIST.map((track) => {
              const isCurrent = snapshot.currentThemeId === track.id;
              return (
                <div
                  key={track.id}
                  data-testid={`music-theme-card-${track.id}`}
                  className={`p-2 border text-left ${
                    isCurrent
                      ? 'bg-[#1c1438] border-[#f5b935] text-[#f4f1ea]'
                      : 'bg-[#0d0a1a] border-[#3a306e] text-[#b3aad1]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-pixel text-[9px] text-[#f5b935] truncate">
                      {isCurrent ? '▶ ' : '♪ '}
                      {track.titleId}
                    </span>
                    <span className="font-vt text-sm text-[#3ac5eb] tabular-nums shrink-0">
                      {track.bpm} BPM
                    </span>
                  </div>
                  <div className="font-vt text-base text-[#b3aad1] leading-tight mt-0.5">
                    {track.subtitleId}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Independent SFX Volume Slider */}
      <div
        className="bg-[#120d26] border-2 border-[#5c4e99] p-4 space-y-2"
        data-testid="settings-sfx-volume-section"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="settings-sfx-volume"
            className="font-pixel text-xs text-[#f4f1ea]"
          >
            VOLUME EFEK SUARA 8-BIT / SFX (0% – 100%)
          </label>
          <span
            data-testid="settings-sfx-volume-value"
            className="font-pixel text-xs text-[#38d864] bg-[#0d0a1a] px-2.5 py-0.5 border border-[#38d864] tabular-nums"
          >
            {sfxVolumePercent}% {soundEnabled ? '(SFX ON)' : '(SFX OFF)'}
          </span>
        </div>
        <p className="font-vt text-xl text-[#b3aad1]">
          Mengatur keras-lembutnya efek suara tombol, serangan, rapalan mantra, dan level up secara
          terpisah dari volume musik latar.
        </p>
        <div className="flex items-center gap-3">
          <input
            id="settings-sfx-volume"
            data-testid="settings-sfx-volume-slider"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={sfxVolume}
            onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
            className="flex-1 accent-[#38d864] cursor-pointer"
          />
          <button
            type="button"
            onClick={() => {
              playClick();
              setSfxVolume(0.75);
            }}
            className="pixel-btn px-3 py-1 bg-[#16112b] text-[#b3aad1] font-pixel text-[9px]"
          >
            Default (75%)
          </button>
        </div>
      </div>
    </div>
  );
};
