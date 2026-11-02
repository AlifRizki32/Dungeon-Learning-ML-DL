import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AVATARS, ROADMAP_ASSUMPTIONS } from '../data/roadmap.js';
import { useGameStore } from '../store/useGameStore';
import { AvatarSprite, PixelSwordSprite, TitleCrestLogo } from '../components/PixelSprites';
import { MusicHudIndicator } from '../components/MusicControls';
import { musicManager } from '../audio/musicManager';
import { useSound } from '../hooks/useSound.js';
import { getLevelProgress } from '../game/formulas';

export const TitleScreen: React.FC = () => {
  const hasStarted = useGameStore((s) => s.hasStarted);
  const storedName = useGameStore((s) => s.playerName);
  const storedAvatar = useGameStore((s) => s.avatarId);
  const xp = useGameStore((s) => s.xp);
  const completedRooms = useGameStore((s) => s.completedRooms);
  const defeatedBosses = useGameStore((s) => s.defeatedBosses);
  const reduceMotion = useGameStore((s) => s.reduceMotion);

  const startAdventure = useGameStore((s) => s.startAdventure);
  const continueAdventure = useGameStore((s) => s.continueAdventure);
  const { playClick, playLevelUp } = useSound();

  const [nameInput, setNameInput] = useState(storedName || 'Petualang Tensor');
  const [selectedAvatar, setSelectedAvatar] = useState(storedAvatar || AVATARS[0].id);

  const levelInfo = getLevelProgress(xp);
  const hasSavedProgress =
    hasStarted || completedRooms.length > 0 || defeatedBosses.length > 0 || xp > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    musicManager.notifyUserInteraction();
    playLevelUp();
    startAdventure(nameInput, selectedAvatar);
  };

  const handleContinue = () => {
    musicManager.notifyUserInteraction();
    playClick();
    continueAdventure();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-3 py-4">
      <motion.main
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.1 : 0.35 }}
        className="w-full max-w-3xl pixel-box p-4 sm:p-6"
      >
        {/* Pixel Crest Logo & Game Title Lockup */}
        <div className="text-center border-b-2 border-[#3a306e] pb-4 mb-4 relative">
          <div className="flex justify-end mb-1">
            <MusicHudIndicator />
          </div>
          <div className="flex justify-center mb-2">
            <TitleCrestLogo className="w-24 h-16 sm:w-32 sm:h-20" />
          </div>
          <div className="font-pixel text-[10px] sm:text-xs text-[#38d864] tracking-wider mb-1.5">
            PETUALANGAN RPG KURIKULUM 28 TOPIK · 5 FASE + MENARA MASTER
          </div>
          <h1 className="font-pixel text-lg sm:text-2xl md:text-3xl text-[#f5b935] leading-snug">
            DUNGEON BELAJAR ML &amp; DL
          </h1>
          <p className="font-vt text-xl sm:text-2xl text-[#f4f1ea] mt-1.5 max-w-2xl mx-auto">
            Taklukkan matematika, machine learning klasik, deep learning, Edge AI / IoT, dan
            kompetensi dunia nyata melalui kejujuran evaluasi diri!
          </p>
        </div>

        {/* Saved Progress Banner (if existing save found) */}
        {hasSavedProgress && (
          <div className="pixel-box-green p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#0d0a1a] border-2 border-[#38d864] flex items-center justify-center shrink-0">
                <AvatarSprite avatarId={storedAvatar} size={38} />
              </div>
              <div>
                <div className="font-pixel text-xs text-[#38d864]">
                  DATA PETUALANGAN DITEMUKAN
                </div>
                <div className="font-vt text-xl text-[#f4f1ea] tabular-nums">
                  {storedName} · Lv.{levelInfo.level} ({levelInfo.title}) · {completedRooms.length}/28 Ruang · {defeatedBosses.length}/5 Bos
                </div>
              </div>
            </div>
            <button
              type="button"
              data-start="true"
              onClick={handleContinue}
              className="pixel-btn px-5 py-2.5 bg-[#38d864] text-[#0d0a1a] font-pixel text-xs whitespace-nowrap"
            >
              Lanjutkan
            </button>
          </div>
        )}

        {/* Character Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="character-name-input"
              className="block font-pixel text-xs text-[#f5b935] mb-2"
            >
              1. NAMA KARAKTER PETUALANG
            </label>
            <input
              id="character-name-input"
              type="text"
              maxLength={28}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Masukkan nama petualangmu..."
              className="w-full bg-[#0d0a1a] border-2 border-[#5c4e99] focus:border-[#38d864] px-3.5 py-2.5 font-vt text-2xl text-[#f4f1ea] outline-none"
            />
          </div>

          <div>
            <div className="font-pixel text-xs text-[#f5b935] mb-2.5">
              2. PILIH AVATAR KELAS PIXEL (4 PILIHAN)
            </div>
            <div
              role="radiogroup"
              aria-label="Pilih Avatar Karakter"
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {AVATARS.map((av) => {
                const isSelected = selectedAvatar === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      playClick();
                      setSelectedAvatar(av.id);
                    }}
                    className={`p-3 text-center transition-transform flex flex-col items-center ${
                      isSelected ? 'pixel-box-gold' : 'pixel-box hover:bg-[#2b2352]'
                    }`}
                  >
                    <div className="w-16 h-16 bg-[#0d0a1a] border-2 border-[#5c4e99] flex items-center justify-center mb-2">
                      <AvatarSprite avatarId={av.id} size={52} />
                    </div>
                    <div className="font-pixel text-[10px] text-[#f4f1ea] leading-snug">
                      {av.name}
                    </div>
                    <div className="font-vt text-base text-[#b3aad1] mt-1 leading-tight">
                      {av.role}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Start Button */}
          <div className="pt-2">
            <button
              type="submit"
              data-start={!hasSavedProgress ? 'true' : undefined}
              className="pixel-btn w-full py-3.5 bg-[#f5b935] text-[#0d0a1a] font-pixel text-xs sm:text-sm gap-2.5"
            >
              <PixelSwordSprite size={18} />
              <span>
                {hasSavedProgress ? 'Simpan Karakter & Mulai Petualangan' : 'Mulai Petualangan'}
              </span>
            </button>
          </div>
        </form>

        {/* Roadmap Time Assumptions Note */}
        <div className="mt-6 pt-4 border-t-2 border-[#3a306e] bg-[#120d26] p-3.5 border border-[#5c4e99]">
          <div className="font-pixel text-[10px] text-[#3ac5eb] mb-1">
            CATATAN ASUMSI WAKTU PETA JALAN
          </div>
          <p className="font-vt text-lg sm:text-xl text-[#b3aad1] leading-snug">
            • Total waktu efektif sekitar <strong className="text-[#f4f1ea]">66-88 minggu</strong> (
            <strong className="text-[#38d864]">15-20 bulan pada ritme 8-10 jam/minggu</strong>) setelah
            Python (Topik 6) dan Fase 5 dikerjakan paralel lewat proyek di Fase 2-4.
            <br />• Pada ritme <strong className="text-[#f5b935]">20 jam/minggu</strong>, durasi
            tempuh menjadi kira-kira separuhnya. Semua angka waktu di dalam game ini adalah{' '}
            <strong className="text-[#f4f1ea]">perkiraan kasar</strong>.
          </p>
        </div>
      </motion.main>
    </div>
  );
};
