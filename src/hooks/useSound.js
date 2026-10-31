import { useCallback, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';

/**
 * Simple 8-bit Web Audio API synthesizer for retro game sound effects.
 * OFF by default, never autoplays.
 */
export function useSound() {
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const audioCtxRef = useRef(null);

  const getContext = useCallback(() => {
    if (!soundEnabled) return null;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, [soundEnabled]);

  const playTone = useCallback(
    (freq, durationMs, type = 'square', startDelayMs = 0, gainValue = 0.08) => {
      const ctx = getContext();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        const startTime = ctx.currentTime + startDelayMs / 1000;
        const endTime = startTime + durationMs / 1000;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(gainValue, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, endTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(endTime);
      } catch {
        // Ignore audio errors
      }
    },
    [getContext]
  );

  const playClick = useCallback(() => {
    playTone(520, 45, 'square', 0, 0.06);
  }, [playTone]);

  const playAttack = useCallback(() => {
    playTone(220, 60, 'sawtooth', 0, 0.09);
    playTone(440, 80, 'square', 50, 0.09);
    playTone(660, 90, 'square', 110, 0.08);
  }, [playTone]);

  const playPlayerHit = useCallback(() => {
    playTone(160, 110, 'sawtooth', 0, 0.1);
    playTone(110, 160, 'sawtooth', 90, 0.1);
  }, [playTone]);

  const playDefeat = useCallback(() => {
    playTone(330, 80, 'square', 0, 0.08);
    playTone(440, 80, 'square', 80, 0.08);
    playTone(554, 90, 'square', 160, 0.08);
    playTone(660, 180, 'square', 250, 0.09);
  }, [playTone]);

  const playLevelUp = useCallback(() => {
    const notes = [262, 330, 392, 523, 659, 784];
    notes.forEach((n, idx) => {
      playTone(n, 95, 'square', idx * 75, 0.09);
    });
  }, [playTone]);

  const playBossAppear = useCallback(() => {
    playTone(130, 140, 'sawtooth', 0, 0.09);
    playTone(123, 140, 'sawtooth', 140, 0.09);
    playTone(110, 260, 'sawtooth', 280, 0.1);
  }, [playTone]);

  const playCast = useCallback(() => {
    playTone(392, 60, 'triangle', 0, 0.08);
    playTone(523, 70, 'square', 55, 0.08);
    playTone(784, 110, 'square', 115, 0.09);
  }, [playTone]);

  const playFizzle = useCallback(() => {
    playTone(310, 80, 'sawtooth', 0, 0.09);
    playTone(233, 95, 'sawtooth', 75, 0.09);
    playTone(146, 150, 'sawtooth', 160, 0.1);
  }, [playTone]);

  const playBossSegmentBreak = useCallback(() => {
    playTone(196, 70, 'sawtooth', 0, 0.1);
    playTone(440, 80, 'square', 65, 0.09);
    playTone(587, 90, 'square', 135, 0.09);
    playTone(880, 160, 'square', 210, 0.1);
  }, [playTone]);

  return {
    playClick,
    playAttack,
    playPlayerHit,
    playDefeat,
    playLevelUp,
    playBossAppear,
    playCast,
    playFizzle,
    playBossSegmentBreak,
  };
}
