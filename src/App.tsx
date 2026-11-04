import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/useGameStore';
import { XPBar } from './components/XPBar';
import { DungeonMap } from './components/DungeonMap';
import { BattleModal } from './components/BattleModal';
import { BossModal } from './components/BossModal';
import { LevelUpModal } from './components/LevelUpModal';
import { StandaloneScrollModal } from './components/ScrollView';
import { Inventory } from './components/Inventory';
import { TitleScreen } from './pages/TitleScreen';
import { GrimoirePage } from './pages/GrimoirePage';
import { CampPage } from './pages/CampPage';
import { DashboardPage } from './pages/DashboardPage';
import { TowerPage } from './pages/TowerPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReviewPage } from './pages/ReviewPage';
import { useBackgroundMusic } from './hooks/useBackgroundMusic';

const LazyAIChatbot = React.lazy(() =>
  import('./components/AIChatbot/AIChatbot').then((m) => ({ default: m.AIChatbot }))
);
const LazyDungeon3D = React.lazy(() =>
  import('./components/Dungeon3D/Dungeon3D').then((m) => ({ default: m.Dungeon3D }))
);

export default function App() {
  const currentView = useGameStore((s) => s.currentView);
  const reduceMotion = useGameStore((s) => s.reduceMotion);
  const continueAdventure = useGameStore((s) => s.continueAdventure);

  // Sync dynamic RPG chiptune background music with game state
  useBackgroundMusic();

  const [osReducedMotion, setOsReducedMotion] = useState(false);
  const [is3DDungeonOpen, setIs3DDungeonOpen] = useState(false);

  useEffect(() => {
    try {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      setOsReducedMotion(mql.matches);
      const handler = (e: MediaQueryListEvent) => setOsReducedMotion(e.matches);
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    } catch {
      return undefined;
    }
  }, []);

  // Support ?autostart=1 to jump directly into the dungeon map
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1' && currentView === 'title') {
        continueAdventure();
      }
    } catch {
      // Ignore URL parsing issues
    }
  }, []);

  // Sync game state to document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = currentView === 'title' ? 'title' : 'playing';
  }, [currentView]);

  const effectiveReduceMotion = reduceMotion || osReducedMotion;

  return (
    <div
      className={`min-h-screen dungeon-wall-bg text-[#f4f1ea] relative ${
        effectiveReduceMotion ? 'reduce-motion' : ''
      }`}
    >
      {/* Subtle CRT Scanlines & Vignette Overlay */}
      <div className="crt-overlay" aria-hidden="true" />

      {currentView === 'title' ? (
        <TitleScreen />
      ) : (
        <div className="min-h-screen flex flex-col">
          <XPBar onOpen3DDungeon={() => setIs3DDungeonOpen(true)} />

          <AnimatePresence mode="wait">
            <motion.main
              key={currentView}
              initial={
                effectiveReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, clipPath: 'inset(12% 12% 12% 12%)' }
              }
              animate={
                effectiveReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }
              }
              exit={
                effectiveReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, clipPath: 'inset(8% 8% 8% 8%)' }
              }
              transition={{ duration: effectiveReduceMotion ? 0.12 : 0.25 }}
              className="flex-1 pt-2"
            >
              {currentView === 'dungeon' && <DungeonMap />}
              {currentView === 'grimoire' && <GrimoirePage />}
              {currentView === 'review' && <ReviewPage />}
              {currentView === 'camp' && <CampPage />}
              {currentView === 'dashboard' && <DashboardPage />}
              {currentView === 'inventory' && <Inventory />}
              {currentView === 'tower' && <TowerPage />}
              {currentView === 'settings' && <SettingsPage />}
            </motion.main>
          </AnimatePresence>

          {/* Modals */}
          <BattleModal />
          <BossModal />
          <LevelUpModal />
          <StandaloneScrollModal />
          {is3DDungeonOpen && (
            <React.Suspense fallback={null}>
              <LazyDungeon3D
                isOpen={is3DDungeonOpen}
                onClose={() => setIs3DDungeonOpen(false)}
              />
            </React.Suspense>
          )}
        </div>
      )}

      {/* Floating AI Dungeon Mentor Assistant */}
      <React.Suspense fallback={null}>
        <LazyAIChatbot />
      </React.Suspense>
    </div>
  );
}
