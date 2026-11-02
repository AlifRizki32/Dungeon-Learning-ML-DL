import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import {
  musicManager,
  MusicManagerSnapshot,
} from '../audio/musicManager';
import { resolveMusicThemeForState } from '../audio/musicTracks';

/**
 * Top-level hook that synchronizes Zustand game state (currentView, activeFloorId,
 * selectedBossFloorId, musicEnabled, musicVolume) with the BackgroundMusicManager.
 */
export function useBackgroundMusic(): MusicManagerSnapshot {
  const currentView = useGameStore((s) => s.currentView);
  const activeFloorId = useGameStore((s) => s.activeFloorId);
  const selectedBossFloorId = useGameStore((s) => s.selectedBossFloorId);
  const musicEnabled = useGameStore((s) => s.musicEnabled ?? true);
  const musicVolume = useGameStore((s) => s.musicVolume ?? 0.35);

  const [snapshot, setSnapshot] = useState<MusicManagerSnapshot>(() =>
    musicManager.getSnapshot()
  );

  useEffect(() => {
    return musicManager.subscribe(setSnapshot);
  }, []);

  useEffect(() => {
    const themeId = resolveMusicThemeForState({
      currentView,
      activeFloorId,
      selectedBossFloorId,
    });

    musicManager.syncState({
      themeId,
      musicEnabled,
      musicVolume,
    });
  }, [currentView, activeFloorId, selectedBossFloorId, musicEnabled, musicVolume]);

  return snapshot;
}

/**
 * Lightweight hook for UI components to observe the current music theme & state.
 */
export function useMusicSnapshot(): MusicManagerSnapshot {
  const [snapshot, setSnapshot] = useState<MusicManagerSnapshot>(() =>
    musicManager.getSnapshot()
  );

  useEffect(() => {
    return musicManager.subscribe(setSnapshot);
  }, []);

  return snapshot;
}
