import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { AvatarSprite } from './PixelSprites';
import { useSound } from '../hooks/useSound.js';

const CONFETTI_PIXELS = [
  { x: -110, y: -90, color: '#f5b935' },
  { x: 110, y: -85, color: '#38d864' },
  { x: -130, y: 10, color: '#3ac5eb' },
  { x: 125, y: 15, color: '#e83b47' },
  { x: -75, y: -120, color: '#9b5de5' },
  { x: 80, y: -115, color: '#f5b935' },
  { x: -95, y: 85, color: '#38d864' },
  { x: 95, y: 90, color: '#3ac5eb' },
  { x: 0, y: -130, color: '#f4f1ea' },
  { x: -45, y: 105, color: '#f5b935' },
  { x: 50, y: 105, color: '#e83b47' },
  { x: 0, y: 120, color: '#38d864' },
];

export const LevelUpModal: React.FC = () => {
  const levelUpModal = useGameStore((s) => s.levelUpModal);
  const avatarId = useGameStore((s) => s.avatarId);
  const playerName = useGameStore((s) => s.playerName);
  const reduceMotion = useGameStore((s) => s.reduceMotion);
  const dismissLevelUpModal = useGameStore((s) => s.dismissLevelUpModal);
  const { playLevelUp, playClick } = useSound();

  useEffect(() => {
    if (levelUpModal?.isOpen) {
      playLevelUp();
    }
  }, [levelUpModal?.isOpen, playLevelUp]);

  if (!levelUpModal || !levelUpModal.isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85"
        role="dialog"
        aria-modal="true"
        aria-labelledby="levelup-modal-title"
      >
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.3 }}
          className="w-full max-w-md pixel-box-gold p-6 text-center relative overflow-visible"
        >
          {/* Pixel Confetti Burst */}
          {!reduceMotion && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {CONFETTI_PIXELS.map((c, idx) => (
                <motion.div
                  key={idx}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: c.x,
                    y: c.y,
                    opacity: [1, 1, 0],
                    scale: [1, 1.3, 0.6],
                    rotate: 90,
                  }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  style={{ backgroundColor: c.color }}
                  className="w-3.5 h-3.5 absolute"
                />
              ))}
            </div>
          )}

          <div className="font-pixel text-xs text-[#38d864] mb-2">
            ★ SELAMAT PETUALANG! ★
          </div>

          <h2
            id="levelup-modal-title"
            className="font-pixel text-xl sm:text-2xl text-[#f5b935] mb-4"
          >
            LEVEL UP!
          </h2>

          <div className="w-20 h-20 mx-auto bg-[#120d26] border-2 border-[#f5b935] flex items-center justify-center mb-4">
            <AvatarSprite avatarId={avatarId} size={64} />
          </div>

          <div className="font-pixel text-sm text-[#f4f1ea] mb-2">{playerName}</div>

          <div className="bg-[#120d26] border-2 border-[#38d864] p-3 mb-4">
            <div className="font-pixel text-xs text-[#b3aad1] tabular-nums">
              Lv.{levelUpModal.oldLevel} →{' '}
              <span className="text-[#38d864] text-sm">Lv.{levelUpModal.newLevel}</span>
            </div>
            <div className="font-vt text-2xl text-[#f5b935] mt-1">
              Gelar Baru: {levelUpModal.newTitle}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playClick();
              dismissLevelUpModal();
            }}
            className="pixel-btn w-full py-3 bg-[#38d864] text-[#0d0a1a] font-pixel text-xs"
          >
            LANJUTKAN PETUALANGAN
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
