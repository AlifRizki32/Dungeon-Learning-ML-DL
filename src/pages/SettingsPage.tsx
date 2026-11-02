import React, { useState } from 'react';
import { AVATARS } from '../data/roadmap.js';
import { useGameStore } from '../store/useGameStore';
import { getLocalDateKey } from '../game/campTracker';
import { AvatarSprite } from '../components/PixelSprites';
import { MusicSettingsPanel } from '../components/MusicControls';
import { useSound } from '../hooks/useSound.js';

export const SettingsPage: React.FC = () => {
  const playerName = useGameStore((s) => s.playerName);
  const avatarId = useGameStore((s) => s.avatarId);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const reduceMotion = useGameStore((s) => s.reduceMotion);
  const intervalScale = useGameStore((s) => s.settings?.intervalScale ?? 1);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const toggleReduceMotion = useGameStore((s) => s.toggleReduceMotion);
  const setIntervalScale = useGameStore((s) => s.setIntervalScale);
  const startAdventure = useGameStore((s) => s.startAdventure);
  const exportSaveJSON = useGameStore((s) => s.exportSaveJSON);
  const importSaveJSON = useGameStore((s) => s.importSaveJSON);
  const resetProgress = useGameStore((s) => s.resetProgress);
  const setView = useGameStore((s) => s.setView);

  const { playClick, playLevelUp } = useSound();

  const [nameDraft, setNameDraft] = useState(playerName);
  const [avatarDraft, setAvatarDraft] = useState(avatarId);
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // JSON Export / Import state
  const [jsonText, setJsonText] = useState<string>('');
  const [transferStatus, setTransferStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    startAdventure(nameDraft, avatarDraft);
    setView('settings');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleExportDownload = () => {
    playClick();
    try {
      const serialized = exportSaveJSON();
      setJsonText(serialized);
      const blob = new Blob([serialized], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dungeon-ml-dl-save-${getLocalDateKey()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setTransferStatus({
        type: 'success',
        message: 'File JSON simpanan berhasil diunduh dan ditampilkan di kotak teks di bawah!',
      });
    } catch {
      const serialized = exportSaveJSON();
      setJsonText(serialized);
      setTransferStatus({
        type: 'success',
        message: 'Data JSON berhasil dibuat! Silakan salin dari kotak teks di bawah.',
      });
    }
  };

  const handleCopyJSON = async () => {
    playClick();
    const serialized = exportSaveJSON();
    setJsonText(serialized);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(serialized);
        setTransferStatus({
          type: 'success',
          message: 'Data JSON simpanan berhasil disalin ke Clipboard!',
        });
        return;
      }
    } catch {
      // Fallback: textarea already populated
    }
    setTransferStatus({
      type: 'success',
      message: 'Data JSON telah ditampilkan di kotak teks. Silakan salin secara manual.',
    });
  };

  const handleImportFromText = () => {
    playClick();
    const result = importSaveJSON(jsonText);
    if (result.success) {
      playLevelUp();
      const updatedState = useGameStore.getState();
      setNameDraft(updatedState.playerName);
      setAvatarDraft(updatedState.avatarId);
      setTransferStatus({
        type: 'success',
        message: result.message,
      });
    } else {
      setTransferStatus({
        type: 'error',
        message: result.message,
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      setJsonText(content);
      const result = importSaveJSON(content);
      if (result.success) {
        playLevelUp();
        const updatedState = useGameStore.getState();
        setNameDraft(updatedState.playerName);
        setAvatarDraft(updatedState.avatarId);
        setTransferStatus({
          type: 'success',
          message: `${result.message} (File: ${file.name})`,
        });
      } else {
        setTransferStatus({
          type: 'error',
          message: result.message,
        });
      }
    };
    reader.onerror = () => {
      setTransferStatus({
        type: 'error',
        message: 'Gagal membaca file JSON yang dipilih.',
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 pb-14 space-y-6">
      {/* Section 1: Audio & Accessibility Preferences */}
      <section aria-label="Pengaturan Suara dan Animasi" className="pixel-box p-4 sm:p-6">
        <h1 className="font-pixel text-sm sm:text-base text-[#f5b935] border-b-2 border-[#3a306e] pb-3 mb-4">
          PENGATURAN GAME &amp; AKSESIBILITAS
        </h1>

        <div className="space-y-4">
          {/* Dynamic Background Music & SFX Volume Panel */}
          <MusicSettingsPanel />

          {/* Sound Effects Toggle */}
          <div className="bg-[#120d26] border-2 border-[#5c4e99] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-pixel text-xs text-[#f4f1ea]">
                EFEK SUARA 8-BIT (WEB AUDIO API)
              </div>
              <p className="font-vt text-xl text-[#b3aad1] mt-1">
                Suara sintetis retro untuk tombol, serangan, level up, dan kekalahan monster (Default: OFF).
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={soundEnabled}
              aria-label="Aktifkan atau matikan efek suara 8-bit"
              onClick={toggleSound}
              className={`pixel-btn px-4 py-2 font-pixel text-xs whitespace-nowrap ${
                soundEnabled
                  ? 'bg-[#38d864] text-[#0d0a1a]'
                  : 'bg-[#16112b] text-[#b3aad1]'
              }`}
            >
              {soundEnabled ? 'AKTIF (ON)' : 'MATI (OFF)'}
            </button>
          </div>

          {/* Reduce Motion Toggle */}
          <div className="bg-[#120d26] border-2 border-[#5c4e99] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-pixel text-xs text-[#f4f1ea]">
                KURANGI ANIMASI (REDUCE MOTION)
              </div>
              <p className="font-vt text-xl text-[#b3aad1] mt-1">
                Matikan efek garis CRT scanline, guncangan layar bos, dan partikel menjadi transisi sederhana.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reduceMotion}
              aria-label="Aktifkan atau matikan mode kurangi animasi"
              onClick={() => {
                playClick();
                toggleReduceMotion();
              }}
              className={`pixel-btn px-4 py-2 font-pixel text-xs whitespace-nowrap ${
                reduceMotion
                  ? 'bg-[#f5b935] text-[#0d0a1a]'
                  : 'bg-[#16112b] text-[#b3aad1]'
              }`}
            >
              {reduceMotion ? 'AKTIF (ON)' : 'MATI (OFF)'}
            </button>
          </div>

          {/* Spaced Review Interval Scale (0.5 - 2.0, default 1.0) */}
          <div className="bg-[#120d26] border-2 border-[#5c4e99] p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="settings-interval-scale"
                className="font-pixel text-xs text-[#f4f1ea]"
              >
                SKALA INTERVAL ULASAN HARIAN (0.5x – 2.0x)
              </label>
              <span
                data-testid="settings-interval-scale-value"
                className="font-pixel text-xs text-[#f5b935] bg-[#0d0a1a] px-2.5 py-1 border border-[#f5b935] tabular-nums"
              >
                {intervalScale.toFixed(1)}x
              </span>
            </div>
            <p className="font-vt text-xl text-[#b3aad1]">
              Mengalikan interval hari dasar <code>[1, 3, 7, 14, 30]</code> pada fitur{' '}
              <strong>Ulasan Harian</strong> (0.5x = lebih sering diulas, 2.0x = jeda lebih panjang).
            </p>
            <div className="flex items-center gap-3">
              <input
                id="settings-interval-scale"
                data-testid="settings-interval-scale-slider"
                type="range"
                min={0.5}
                max={2}
                step={0.1}
                value={intervalScale}
                onChange={(e) => setIntervalScale(parseFloat(e.target.value))}
                className="flex-1 accent-[#f5b935] cursor-pointer"
              />
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setIntervalScale(1);
                }}
                className="pixel-btn px-3 py-1 bg-[#16112b] text-[#b3aad1] font-pixel text-[9px]"
              >
                Reset (1.0x)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: JSON Export / Import Save Data Across Devices */}
      <section
        aria-label="Ekspor dan Impor Data Simpanan JSON"
        className="pixel-box-gold p-4 sm:p-6 space-y-4"
      >
        <div>
          <div className="font-pixel text-[10px] text-[#3ac5eb] mb-1">
            CADANGAN &amp; PINDAH PERANGKAT
          </div>
          <h2 className="font-pixel text-sm text-[#f5b935] border-b-2 border-[#3a306e] pb-3">
            EKSPOR &amp; IMPOR SIMPANAN (JSON)
          </h2>
          <p className="font-vt text-xl text-[#b3aad1] mt-2">
            Pindahkan seluruh progres ruangan, bos, relik, skor Jurus Rahasia, dan jurnal sesi{' '}
            <strong>Camp Api Unggun</strong> antar perangkat menggunakan file atau teks JSON.
          </p>
        </div>

        {transferStatus && (
          <div
            role="status"
            aria-live="polite"
            className={`p-3 border-2 font-vt text-xl ${
              transferStatus.type === 'success'
                ? 'bg-[#0a1714] border-[#38d864] text-[#38d864]'
                : 'bg-[#291324] border-[#e83b47] text-[#e83b47]'
            }`}
          >
            {transferStatus.message}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportDownload}
            className="pixel-btn px-4 py-2.5 bg-[#38d864] text-[#0d0a1a] font-pixel text-xs"
          >
            Unduh Simpanan (.JSON)
          </button>

          <button
            type="button"
            onClick={handleCopyJSON}
            className="pixel-btn px-4 py-2.5 bg-[#f5b935] text-[#0d0a1a] font-pixel text-xs"
          >
            Tampilkan &amp; Salin JSON
          </button>

          <label
            htmlFor="json-file-upload"
            className="pixel-btn px-4 py-2.5 bg-[#3ac5eb] text-[#0d0a1a] font-pixel text-xs cursor-pointer"
          >
            Unggah File JSON...
            <input
              id="json-file-upload"
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="sr-only"
            />
          </label>
        </div>

        <div>
          <label
            htmlFor="save-json-textarea"
            className="block font-pixel text-[10px] text-[#f5b935] mb-1.5"
          >
            KOTAK DATA JSON (TEMPEL JSON DI SINI UNTUK IMPOR ATAU SALIN HASIL EKSPOR)
          </label>
          <textarea
            id="save-json-textarea"
            rows={6}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='{"version":1,"state":{"playerName":"Petualang Tensor","xp":450,...}}'
            className="w-full bg-[#0d0a1a] border-2 border-[#5c4e99] focus:border-[#38d864] p-3 font-mono text-xs text-[#f4f1ea] outline-none"
          />
          <div className="mt-2.5 flex justify-end">
            <button
              type="button"
              onClick={handleImportFromText}
              className="pixel-btn px-4 py-2 bg-[#16112b] text-[#38d864] border-[#38d864] font-pixel text-xs"
            >
              Impor dari Teks JSON di Atas
            </button>
          </div>
        </div>
      </section>

      {/* Section 3: Character Profile Edit */}
      <section aria-label="Ubah Profil Petualang" className="pixel-box p-4 sm:p-6">
        <h2 className="font-pixel text-sm text-[#38d864] border-b-2 border-[#3a306e] pb-3 mb-4">
          PROFIL PETUALANG &amp; LAYAR JUDUL
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label
              htmlFor="settings-name-input"
              className="block font-pixel text-xs text-[#f5b935] mb-1.5"
            >
              NAMA KARAKTER
            </label>
            <input
              id="settings-name-input"
              type="text"
              maxLength={28}
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="w-full bg-[#0d0a1a] border-2 border-[#5c4e99] focus:border-[#38d864] px-3 py-2 font-vt text-2xl text-[#f4f1ea] outline-none"
            />
          </div>

          <div>
            <div className="font-pixel text-xs text-[#f5b935] mb-2">PILIH AVATAR</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {AVATARS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  aria-pressed={avatarDraft === av.id}
                  onClick={() => {
                    playClick();
                    setAvatarDraft(av.id);
                  }}
                  className={`p-2.5 flex flex-col items-center ${
                    avatarDraft === av.id ? 'pixel-box-gold' : 'pixel-box'
                  }`}
                >
                  <AvatarSprite avatarId={av.id} size={40} />
                  <span className="font-pixel text-[9px] text-[#f4f1ea] mt-1.5">
                    {av.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                playClick();
                setView('title');
              }}
              className="pixel-btn px-4 py-2 bg-[#16112b] text-[#f4f1ea] font-pixel text-xs"
            >
              Ke Layar Judul
            </button>

            <div className="flex items-center gap-3">
              {savedNotice && (
                <span className="font-vt text-xl text-[#38d864]">
                  ✓ Profil tersimpan!
                </span>
              )}
              <button
                type="submit"
                className="pixel-btn px-4 py-2 bg-[#38d864] text-[#0d0a1a] font-pixel text-xs"
              >
                Simpan Profil
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Section 4: Reset Progress with Confirmation */}
      <section aria-label="Reset Progres Permainan" className="pixel-box-red p-4 sm:p-6">
        <h2 className="font-pixel text-sm text-[#e83b47] mb-2">
          ZONA BAHAYA: RESET PROGRES
        </h2>
        <p className="font-vt text-xl text-[#f4f1ea] mb-4">
          Menghapus seluruh progres ruang topik, bos, XP, level, streak, lencana, relik, dan log
          sesi belajar yang tersimpan di penyimpanan lokal (<code>dungeon-ml-dl:v1</code>).
        </p>

        {!confirmResetOpen ? (
          <button
            type="button"
            onClick={() => {
              playClick();
              setConfirmResetOpen(true);
            }}
            className="pixel-btn px-4 py-2.5 bg-[#e83b47] text-[#f4f1ea] font-pixel text-xs"
          >
            Reset Progres Permainan...
          </button>
        ) : (
          <div
            role="alertdialog"
            aria-label="Konfirmasi Reset Progres"
            className="bg-[#120d26] border-2 border-[#f5b935] p-4 space-y-3"
          >
            <div className="font-pixel text-xs text-[#f5b935]">
              KONFIRMASI: YAKIN INGIN MENGHAPUS SELURUH PROGRES?
            </div>
            <p className="font-vt text-xl text-[#b3aad1]">
              Tindakan ini tidak dapat dibatalkan. Kamu akan kembali ke Layar Judul di Level 1.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  resetProgress();
                  setConfirmResetOpen(false);
                }}
                className="pixel-btn px-4 py-2 bg-[#e83b47] text-[#f4f1ea] font-pixel text-xs"
              >
                Ya, Hapus Semua Progres
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setConfirmResetOpen(false);
                }}
                className="pixel-btn px-4 py-2 bg-[#1f193d] text-[#f4f1ea] font-pixel text-xs"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
