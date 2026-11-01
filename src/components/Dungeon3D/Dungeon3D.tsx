import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { resolveLearningContext } from '../AIChatbot/chatService';
import {
  DUNGEON_3D_ZONE_LIST,
  DUNGEON_3D_ZONES,
  Dungeon3DZoneId,
  isWebGLAvailable,
} from './sceneConfig';
import {
  createDungeonSceneManager,
  DungeonSceneController,
} from './SceneManager';

export interface Dungeon3DProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Dungeon3D: React.FC<Dungeon3DProps> = ({ isOpen, onClose }) => {
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<DungeonSceneController | null>(null);

  const activeFloorId = useGameStore((s) => s.activeFloorId);
  const activeNodeByFloor = useGameStore((s) => s.activeNodeByFloor);
  const selectedTopicId = useGameStore((s) => s.selectedTopicId);
  const scrollOnlyTopicId = useGameStore((s) => s.scrollOnlyTopicId);
  const selectedBossFloorId = useGameStore((s) => s.selectedBossFloorId);
  const currentView = useGameStore((s) => s.currentView);
  const completedRooms = useGameStore((s) => s.completedRooms);
  const defeatedBosses = useGameStore((s) => s.defeatedBosses);
  const specialization = useGameStore((s) => s.specialization);
  const xp = useGameStore((s) => s.xp);
  const reduceMotion = useGameStore((s) => s.reduceMotion);

  const [selectedZoneId, setSelectedZoneId] = useState<Dungeon3DZoneId>('overview');
  const [hoveredZoneId, setHoveredZoneId] = useState<Dungeon3DZoneId | null>(null);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [autoRotate, setAutoRotate] = useState(!reduceMotion);
  const [webglSupported, setWebglSupported] = useState(true);

  const learningContext = useMemo(
    () =>
      resolveLearningContext({
        currentView,
        activeFloorId,
        activeNodeByFloor,
        selectedTopicId,
        scrollOnlyTopicId,
        selectedBossFloorId,
        completedRooms,
        defeatedBosses,
        specialization,
        xp,
      }),
    [
      currentView,
      activeFloorId,
      activeNodeByFloor,
      selectedTopicId,
      scrollOnlyTopicId,
      selectedBossFloorId,
      completedRooms,
      defeatedBosses,
      specialization,
      xp,
    ]
  );

  // Pick a relevant initial 3D zone based on the player's current floor
  const defaultZoneForFloor = useMemo<Dungeon3DZoneId>(() => {
    if (activeFloorId === 2) return 'clusters';
    if (activeFloorId === 3) return 'neural';
    if (activeFloorId === 4) return 'deeplearning';
    return 'overview';
  }, [activeFloorId]);

  useEffect(() => {
    if (!isOpen) return;

    const supported = isWebGLAvailable();
    setWebglSupported(supported);
    setSelectedZoneId(defaultZoneForFloor);
    setAutoRotate(!reduceMotion);

    if (!supported || !canvasContainerRef.current) return;

    const controller = createDungeonSceneManager({
      container: canvasContainerRef.current,
      initialZone: defaultZoneForFloor,
      reduceMotion,
      onSelectZone: (zoneId) => {
        setSelectedZoneId(zoneId);
      },
      onHoverZone: (zoneId) => {
        setHoveredZoneId(zoneId);
      },
    });

    controllerRef.current = controller;

    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, [isOpen, defaultZoneForFloor]);

  useEffect(() => {
    controllerRef.current?.setReduceMotion(reduceMotion);
  }, [reduceMotion]);

  // Keyboard shortcuts: Escape to close, H to collapse/expand dock
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'h' || e.key === 'H') {
        setIsDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeZone = DUNGEON_3D_ZONES[selectedZoneId] || DUNGEON_3D_ZONES.overview;
  const hoveredZone = hoveredZoneId ? DUNGEON_3D_ZONES[hoveredZoneId] : null;

  const handleSelectZone = (zoneId: Dungeon3DZoneId) => {
    setSelectedZoneId(zoneId);
    controllerRef.current?.focusZone(zoneId);
  };

  const handleResetCamera = () => {
    setSelectedZoneId('overview');
    controllerRef.current?.resetCamera();
  };

  const handleToggleAutoRotate = () => {
    const next = !autoRotate;
    setAutoRotate(next);
    controllerRef.current?.setAutoRotate(next);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Portal Dimensi 3D Dungeon Belajar ML & DL"
      data-testid="dungeon-3d-modal"
      className="fixed inset-0 z-50 bg-[#0d0a1a] overflow-hidden select-none no-print"
    >
      {/* Dedicated Three.js Canvas Mount Container (100% viewport) */}
      {webglSupported ? (
        <div
          ref={canvasContainerRef}
          data-testid="dungeon-3d-canvas-container"
          className="w-full h-full"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="pixel-box-gold max-w-lg p-6 bg-[#16112b] text-center space-y-4">
            <h2 className="font-pixel text-sm text-[#f5b935]">
              MODE 3D TIDAK TERSEDIA DI PERANGKAT INI
            </h2>
            <p className="font-vt text-xl text-[#f4f1ea]">
              Peramban atau kartu grafis Anda belum mengaktifkan akselerasi WebGL.
              Seluruh progres petualangan 2D Dungeon Belajar ML &amp; DL Anda tetap
              aman dan dapat dimainkan sepenuhnya.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="pixel-btn px-4 py-2 bg-[#38d864] text-[#0d0a1a] font-pixel text-xs"
            >
              KEMBALI KE PETA DUNGEON 2D
            </button>
          </div>
        </div>
      )}

      {/* Top HUD Bar (Solid dark pixel-art bar, no backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 p-2.5 sm:p-3.5 flex flex-wrap items-start justify-between gap-2">
        {/* Left: Title & Active Zone Card */}
        <div className="pointer-events-auto max-w-md bg-[#120d26] border-2 border-[#f5b935] p-2.5 sm:p-3 shadow-[4px_4px_0_#05030a]">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-pixel text-[9px] sm:text-[10px] text-[#f5b935] tracking-wider">
              ✦ {activeZone.badge}
            </span>
            <span className="font-vt text-sm sm:text-base text-[#38d864] bg-[#0d0a1a] px-2 py-0.5 border border-[#3a306e]">
              Lantai {learningContext.floorNumber}: {learningContext.topicName || learningContext.floorTitle}
            </span>
          </div>
          <h2
            data-testid="dungeon-3d-zone-title"
            className="font-pixel text-[11px] sm:text-xs text-[#f4f1ea] leading-snug"
          >
            {activeZone.title}
          </h2>
          <p className="font-vt text-base sm:text-lg text-[#3ac5eb] leading-tight mt-0.5">
            {activeZone.subtitle}
          </p>
          <p className="font-vt text-sm sm:text-base text-[#d9d2f0] leading-snug mt-1.5">
            {activeZone.description}
          </p>
          <div className="mt-1.5 pt-1.5 border-t border-[#2b2352] font-vt text-sm text-[#f5b935]">
            {activeZone.educationalNote}
          </div>
        </div>

        {/* Right: Hover Indicator & Close Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          {hoveredZone && hoveredZone.id !== selectedZoneId && (
            <div className="hidden sm:block bg-[#120d26] border-2 border-[#3ac5eb] px-3 py-1.5 font-vt text-base text-[#f4f1ea]">
              Klik Monumen: <span className="text-[#38d864] font-bold">{hoveredZone.title}</span>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            data-testid="close-dungeon-3d-btn"
            className="pixel-btn px-3 py-2 bg-[#e83b47] text-[#f4f1ea] font-pixel text-[10px] sm:text-xs"
            title="Tutup Portal Dimensi 3D (Esc)"
          >
            ✕ TUTUP 3D
          </button>
        </div>
      </div>

      {/* Bottom Collapsible Camera & Zone Control Dock */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-2.5 sm:p-3.5 flex flex-col items-center">
        <div className="pointer-events-auto w-full max-w-4xl bg-[#120d26] border-2 border-[#5c4e99] shadow-[4px_4px_0_#05030a]">
          {/* Dock Header Bar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#16112b] border-b border-[#2b2352]">
            <span className="font-pixel text-[9px] text-[#b3aad1]">
              NAVIGASI MONUMEN 3D · DRAG: PUTAR · SCROLL: ZOOM · KLIK OBJEK: FOKUS
            </span>
            <button
              type="button"
              onClick={() => setIsDockCollapsed((prev) => !prev)}
              data-testid="toggle-3d-dock-btn"
              className="font-vt text-base text-[#f5b935] hover:text-[#38d864] px-2 py-0.5 border border-[#3a306e] bg-[#0d0a1a]"
            >
              {isDockCollapsed ? '▴ Tampilkan Kontrol (H)' : '▾ Sembunyikan Kontrol (H)'}
            </button>
          </div>

          {/* Dock Controls Body */}
          {!isDockCollapsed && (
            <div className="p-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {DUNGEON_3D_ZONE_LIST.map((zone) => {
                  const isActive = selectedZoneId === zone.id;
                  const shortLabels: Record<Dungeon3DZoneId, string> = {
                    overview: '1. Pulau & Portal',
                    portal: '2. Portal Inti',
                    neural: '3. Jaringan Saraf (NN)',
                    clusters: '4. Klaster Data (ML)',
                    deeplearning: '5. Lapisan DL',
                  };
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      data-testid={`zone-btn-${zone.id}`}
                      onClick={() => handleSelectZone(zone.id)}
                      className={`pixel-btn px-2.5 py-1 font-vt text-base sm:text-lg ${
                        isActive
                          ? 'bg-[#38d864] text-[#0d0a1a] font-bold border-[#f4f1ea]'
                          : 'bg-[#1f193d] text-[#f4f1ea] hover:bg-[#2b2352]'
                      }`}
                    >
                      {shortLabels[zone.id]}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleAutoRotate}
                  data-testid="toggle-autorotate-btn"
                  className={`pixel-btn px-2.5 py-1 font-vt text-base ${
                    autoRotate && !reduceMotion
                      ? 'bg-[#1d8a3d] text-[#f4f1ea]'
                      : 'bg-[#16112b] text-[#b3aad1]'
                  }`}
                >
                  {autoRotate && !reduceMotion ? 'Putar Otomatis: ON' : 'Putar Otomatis: OFF'}
                </button>
                <button
                  type="button"
                  onClick={handleResetCamera}
                  data-testid="reset-3d-camera-btn"
                  className="pixel-btn px-2.5 py-1 bg-[#291324] text-[#f5b935] font-vt text-base"
                >
                  Reset Kamera
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
