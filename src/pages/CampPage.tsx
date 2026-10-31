import React, { useEffect, useMemo, useState } from 'react';
import { ALL_TOPICS, FLOORS } from '../data/roadmap.js';
import { useGameStore } from '../store/useGameStore';
import { getDisplayStreak } from '../game/formulas';
import {
  WEEKLY_BONUS_XP,
  calculateProjectedCompletion,
  getCampfireStage,
  getLast8WeeksBuckets,
  getLocalDateKey,
  getWeekStartDateKey,
} from '../game/campTracker';
import { CampfireSprite, PixelTimerSprite } from '../components/PixelSprites';
import { useSound } from '../hooks/useSound.js';

export const CampPage: React.FC = () => {
  const studySessions = useGameStore((s) => s.studySessions);
  const weeklyTargetHours = useGameStore((s) => s.weeklyTargetHours);
  const claimedWeeklyBonusWeeks = useGameStore((s) => s.claimedWeeklyBonusWeeks);
  const completedRooms = useGameStore((s) => s.completedRooms);
  const streak = useGameStore((s) => s.streak);
  const lastActiveDate = useGameStore((s) => s.lastActiveDate);
  const logStudySession = useGameStore((s) => s.logStudySession);
  const deleteStudySession = useGameStore((s) => s.deleteStudySession);
  const setWeeklyTargetHours = useGameStore((s) => s.setWeeklyTargetHours);
  const setView = useGameStore((s) => s.setView);

  const { playClick, playDefeat, playLevelUp } = useSound();

  // Form state ("Catat sesi")
  const [selectedTopicId, setSelectedTopicId] = useState<string>('topic-1');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [sessionDate, setSessionDate] = useState<string>(() => getLocalDateKey());
  const [sessionNote, setSessionNote] = useState<string>('');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Weekly target editor state
  const [targetDraft, setTargetDraft] = useState<string>(String(weeklyTargetHours));
  useEffect(() => {
    setTargetDraft(String(weeklyTargetHours));
  }, [weeklyTargetHours]);

  // Pixel Pomodoro Timer state
  const [pomoMinutesPreset, setPomoMinutesPreset] = useState<number>(25);
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState<number>(25 * 60);
  const [pomoRunning, setPomoRunning] = useState<boolean>(false);
  const [pomoTopicId, setPomoTopicId] = useState<string>('topic-1');

  const completePomodoroSession = (minutesLogged: number, topicId: string) => {
    const result = logStudySession({
      topicId,
      durationMinutes: minutesLogged,
      date: getLocalDateKey(),
      note: `Sesi Pomodoro (${minutesLogged} menit)`,
      source: 'pomodoro',
    });
    if (result.bonusXPAwarded > 0) {
      playLevelUp();
      setFeedbackBanner(
        `Pomodoro selesai (+${minutesLogged} menit)! Target mingguan tercapai — kamu meraih BONUS +${result.bonusXPAwarded} XP!`
      );
    } else {
      playDefeat();
      setFeedbackBanner(
        `Pomodoro selesai! Sesi fokus ${minutesLogged} menit telah otomatis dicatat ke jurnal.`
      );
    }
  };

  useEffect(() => {
    if (!pomoRunning) return undefined;
    const interval = window.setInterval(() => {
      setPomoSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setPomoRunning(false);
          completePomodoroSession(pomoMinutesPreset, pomoTopicId);
          return pomoMinutesPreset * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [pomoRunning, pomoMinutesPreset, pomoTopicId]);

  const activeStreak = getDisplayStreak(streak, lastActiveDate);
  const currentWeekKey = getWeekStartDateKey(new Date());
  const eightWeekBuckets = useMemo(
    () => getLast8WeeksBuckets(studySessions, new Date()),
    [studySessions]
  );
  const thisWeekBucket = eightWeekBuckets[eightWeekBuckets.length - 1];
  const thisWeekHours = thisWeekBucket ? thisWeekBucket.totalHours : 0;
  const campfireInfo = getCampfireStage(thisWeekHours, weeklyTargetHours);
  const bonusClaimedThisWeek = claimedWeeklyBonusWeeks.includes(currentWeekKey);

  const projection = useMemo(
    () =>
      calculateProjectedCompletion(
        completedRooms,
        studySessions,
        weeklyTargetHours,
        new Date()
      ),
    [completedRooms, studySessions, weeklyTargetHours]
  );

  const handleLogManualSession = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    const cleanMinutes = Math.max(1, Math.min(1440, Number(durationMinutes) || 60));
    const result = logStudySession({
      topicId: selectedTopicId,
      durationMinutes: cleanMinutes,
      date: sessionDate || getLocalDateKey(),
      note: sessionNote,
      source: 'manual',
    });
    setSessionNote('');
    if (result.bonusXPAwarded > 0) {
      playLevelUp();
      setFeedbackBanner(
        `Sesi ${cleanMinutes} menit tercatat! Target mingguan tercapai — kamu mendapat BONUS +${result.bonusXPAwarded} XP!`
      );
    } else {
      setFeedbackBanner(`Sesi belajar ${cleanMinutes} menit (${(cleanMinutes / 60).toFixed(1)} jam) berhasil dicatat!`);
    }
  };

  const handleTargetSave = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    const parsed = Number(targetDraft);
    if (!Number.isFinite(parsed) || parsed < 1) {
      setTargetDraft(String(weeklyTargetHours));
      return;
    }
    const res = setWeeklyTargetHours(parsed);
    if (res.bonusXPAwarded > 0) {
      playLevelUp();
      setFeedbackBanner(
        `Target mingguan diperbarui menjadi ${parsed} jam! Target minggu ini terpenuhi (+${res.bonusXPAwarded} XP)!`
      );
    } else {
      setFeedbackBanner(`Target belajar mingguan disimpan: ${Math.min(60, Math.max(1, parsed))} jam/minggu.`);
    }
  };

  const handleSelectPomoPreset = (mins: number) => {
    playClick();
    setPomoRunning(false);
    setPomoMinutesPreset(mins);
    setPomoSecondsLeft(mins * 60);
  };

  const pomoMM = String(Math.floor(pomoSecondsLeft / 60)).padStart(2, '0');
  const pomoSS = String(pomoSecondsLeft % 60).padStart(2, '0');
  const pomoTotalSecs = Math.max(1, pomoMinutesPreset * 60);
  const pomoProgressPct = Math.round(((pomoTotalSecs - pomoSecondsLeft) / pomoTotalSecs) * 100);

  // SVG Chart dimensions & scaling
  const maxChartHours = useMemo(() => {
    const highestBucket = Math.max(...eightWeekBuckets.map((b) => b.totalHours), 0);
    return Math.max(weeklyTargetHours * 1.25, highestBucket * 1.15, 10);
  }, [eightWeekBuckets, weeklyTargetHours]);

  const getTopicName = (id: string) => {
    const found = ALL_TOPICS.find((t) => t.id === id);
    return found ? `#${found.number} ${found.name}` : id;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3 pb-14 space-y-6">
      {/* Top Banner / Feedback Notification */}
      {feedbackBanner && (
        <div
          role="status"
          aria-live="polite"
          className="pixel-box-green p-3.5 flex items-center justify-between gap-3"
        >
          <span className="font-vt text-xl text-[#38d864]">{feedbackBanner}</span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="pixel-btn px-2.5 py-1 bg-[#120d26] text-[#f4f1ea] font-pixel text-[9px]"
          >
            TUTUP
          </button>
        </div>
      )}

      {/* Section 1: Campfire Centerpiece, This Week's Progress, Target Editor & Streak */}
      <section aria-label="Perkemahan Api Unggun dan Progres Mingguan" className="pixel-box-gold p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Growing Pixel Campfire */}
          <div className="flex flex-col sm:flex-row items-center gap-5 bg-[#120d26] border-2 border-[#f5b935] p-4 sm:p-5 shrink-0">
            <div className="w-24 h-24 bg-[#0d0a1a] border-2 border-[#5c4e99] flex items-center justify-center relative shrink-0">
              <CampfireSprite stage={campfireInfo.stage} size={80} />
              <span className="absolute -bottom-2.5 px-2 py-0.5 bg-[#0d0a1a] border border-[#f5b935] font-pixel text-[8px] text-[#f5b935]">
                TAHAP {campfireInfo.stage}/4
              </span>
            </div>
            <div className="text-center sm:text-left max-w-xs">
              <div className="font-pixel text-[10px] text-[#f5b935] mb-1">
                CAMP API UNGGUN · PELACAK BELAJAR
              </div>
              <h1 className="font-pixel text-sm sm:text-base text-[#f4f1ea]">
                {campfireInfo.name}
              </h1>
              <p className="font-vt text-lg sm:text-xl text-[#b3aad1] mt-1 leading-snug">
                {campfireInfo.description}
              </p>
              <div className="mt-2 inline-flex items-center gap-2 bg-[#0d0a1a] border border-[#38d864] px-2.5 py-1 font-vt text-lg text-[#38d864] tabular-nums">
                <span>Streak Harian: {activeStreak} hari</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#f5b935]">
                  Bonus Mingguan: +{WEEKLY_BONUS_XP} XP
                </span>
              </div>
            </div>
          </div>

          {/* Right: Weekly Progress Bar + Editable Weekly Target */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <div className="font-pixel text-xs text-[#38d864]">
                  PROGRES BELAJAR MINGGU INI
                </div>
                <div className="font-vt text-2xl sm:text-3xl text-[#f4f1ea] tabular-nums">
                  <strong className="text-[#f5b935]">{thisWeekHours.toFixed(1)}</strong> /{' '}
                  {weeklyTargetHours} jam ({campfireInfo.percent}%)
                </div>
              </div>

              <div
                className={`px-3 py-1.5 border-2 font-pixel text-[9px] ${
                  bonusClaimedThisWeek
                    ? 'bg-[#0a1714] border-[#38d864] text-[#38d864]'
                    : 'bg-[#120d26] border-[#f5b935] text-[#f5b935]'
                }`}
              >
                {bonusClaimedThisWeek
                  ? `✓ BONUS +${WEEKLY_BONUS_XP} XP MINGGU INI DIRAIH!`
                  : `CAPAI ${weeklyTargetHours} JAM UNTUK +${WEEKLY_BONUS_XP} XP`}
              </div>
            </div>

            {/* Weekly Progress Bar */}
            <div
              className="w-full h-7 bg-[#0d0a1a] border-2 border-[#f4f1ea] p-0.5 relative overflow-hidden"
              role="progressbar"
              aria-valuenow={campfireInfo.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progres jam belajar minggu ini terhadap target mingguan"
            >
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${campfireInfo.percent}%`,
                  background:
                    campfireInfo.percent >= 100
                      ? 'linear-gradient(90deg, #1d8a3d 0%, #38d864 100%)'
                      : 'linear-gradient(90deg, #a87312 0%, #f5b935 100%)',
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center font-pixel text-[10px] text-[#f4f1ea] drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)] tabular-nums">
                {thisWeekHours.toFixed(1)} jam / Target {weeklyTargetHours} jam ({campfireInfo.percent}%)
              </span>
            </div>

            {/* Editable Weekly Target Form */}
            <form
              onSubmit={handleTargetSave}
              className="bg-[#120d26] border-2 border-[#5c4e99] p-3 flex flex-wrap items-center justify-between gap-3"
            >
              <label
                htmlFor="weekly-target-input"
                className="font-vt text-lg sm:text-xl text-[#b3aad1]"
              >
                Target Belajar Mingguan (Default: 9 jam/minggu):
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="weekly-target-input"
                  type="number"
                  min={1}
                  max={60}
                  step={0.5}
                  value={targetDraft}
                  onChange={(e) => setTargetDraft(e.target.value)}
                  className="w-20 bg-[#0d0a1a] border-2 border-[#f5b935] px-2.5 py-1 font-vt text-xl text-[#f4f1ea] text-center tabular-nums"
                />
                <span className="font-vt text-lg text-[#f5b935]">jam</span>
                <button
                  type="submit"
                  className="pixel-btn px-3 py-1.5 bg-[#f5b935] text-[#0d0a1a] font-pixel text-[9px]"
                >
                  Ubah Target
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Section 2: Projected Completion Month & 8-Week Hand-Built SVG Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 cols: Rough Projected Completion Card */}
        <section
          aria-label="Proyeksi Bulan Penyelesaian Roadmap"
          className="lg:col-span-5 pixel-box p-4 sm:p-5 flex flex-col justify-between"
        >
          <div>
            <div className="font-pixel text-[10px] text-[#3ac5eb] mb-1">
              PROYEKSI WAKTU LULUS ROADMAP
            </div>
            <h2 className="font-pixel text-xs sm:text-sm text-[#f5b935] border-b-2 border-[#3a306e] pb-2.5 mb-3">
              ESTIMASI BULAN PENYELESAIAN
            </h2>

            <div className="bg-[#120d26] border-2 border-[#3ac5eb] p-4 mb-3">
              <div className="font-vt text-lg text-[#b3aad1]">
                Perkiraan Selesai Seluruh 28 Topik:
              </div>
              <div
                data-testid="projected-completion-month"
                className="font-pixel text-base sm:text-lg text-[#38d864] mt-1"
              >
                {projection.projectedMonthYear}
              </div>
              <div className="font-vt text-lg text-[#f5b935] mt-1 tabular-nums">
                Sekitar {projection.estimatedWeeksToFinish} minggu lagi (~
                {projection.remainingEstimatedHours} jam tersisa)
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 font-vt text-lg tabular-nums mb-3">
              <div className="bg-[#120d26] border border-[#5c4e99] p-2.5">
                <div className="text-[#b3aad1] text-base">Rata-rata Aktual (8 Mgg)</div>
                <div className="text-[#f4f1ea] text-xl font-bold">
                  {projection.actualAvgHoursPerWeek} jam/mgg
                </div>
              </div>
              <div className="bg-[#120d26] border border-[#5c4e99] p-2.5">
                <div className="text-[#b3aad1] text-base">Sisa Beban Roadmap</div>
                <div className="text-[#f4f1ea] text-xl font-bold">
                  {projection.remainingRoadmapWeeks} minggu
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#16101f] border-2 border-[#f5b935] p-3 font-vt text-base sm:text-lg text-[#f4f1ea] leading-snug">
            <strong className="text-[#f5b935]">Catatan Penting (Estimasi Kasar):</strong> Proyeksi
            bulan selesai di atas hanyalah perkiraan kasar berdasarkan{' '}
            {projection.usingActualAverage
              ? `rata-rata jam belajar aktualmu (${projection.actualAvgHoursPerWeek} jam/minggu)`
              : `target mingguanmu (${weeklyTargetHours} jam/minggu — catat sesi untuk memakai rata-rata aktual)`}{' '}
            dan asumsi beban roadmap (sekitar 8-10 jam/minggu). Kecepatan belajar nyata tiap orang
            sangat bervariasi.
          </div>
        </section>

        {/* Right 7 cols: Hand-built SVG Bar Chart for the last 8 weeks */}
        <section
          aria-label="Grafik Batang Jam Belajar 8 Minggu Terakhir"
          className="lg:col-span-7 pixel-box p-4 sm:p-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#3a306e] pb-2.5 mb-3">
              <div>
                <div className="font-pixel text-[10px] text-[#38d864]">
                  RIWAYAT 8 MINGGU TERAKHIR
                </div>
                <h2 className="font-pixel text-xs sm:text-sm text-[#f4f1ea]">
                  GRAFIK JAM BELAJAR MINGGUAN (SVG)
                </h2>
              </div>
              <div className="flex items-center gap-3 font-vt text-base">
                <span className="inline-flex items-center gap-1.5 text-[#38d864]">
                  <span className="w-3 h-3 bg-[#38d864] inline-block border border-[#f4f1ea]" />
                  Target Tercapai
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#f5b935]">
                  <span className="w-3 h-3 bg-[#f5b935] inline-block border border-[#f4f1ea]" />
                  Sedang Berjalan
                </span>
              </div>
            </div>

            {/* Hand-built SVG Bar Chart */}
            <div className="w-full bg-[#0d0a1a] border-2 border-[#5c4e99] p-2 sm:p-3 overflow-x-auto">
              <svg
                viewBox="0 0 640 230"
                className="w-full h-auto min-w-[300px] pixelated"
                shapeRendering="crispEdges"
                role="img"
                aria-label={`Grafik batang jam belajar selama 8 minggu terakhir dengan garis target ${weeklyTargetHours} jam per minggu`}
              >
                {/* Background grid lines */}
                {[0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = Math.round(175 - ratio * 135);
                  const labelVal = Math.round(maxChartHours * ratio * 10) / 10;
                  return (
                    <g key={idx}>
                      <line
                        x1="44"
                        y1={y}
                        x2="620"
                        y2={y}
                        stroke="#2b2352"
                        strokeWidth="1"
                      />
                      <text
                        x="38"
                        y={y + 4}
                        textAnchor="end"
                        fill="#b3aad1"
                        fontSize="11"
                        fontFamily="monospace"
                      >
                        {labelVal}j
                      </text>
                    </g>
                  );
                })}

                {/* Baseline X axis */}
                <line x1="44" y1="175" x2="620" y2="175" stroke="#5c4e99" strokeWidth="2" />

                {/* Dashed Weekly Target Line */}
                {(() => {
                  const targetY = Math.max(
                    24,
                    Math.min(174, Math.round(175 - (weeklyTargetHours / maxChartHours) * 135))
                  );
                  return (
                    <g>
                      <line
                        x1="44"
                        y1={targetY}
                        x2="620"
                        y2={targetY}
                        stroke="#38d864"
                        strokeWidth="2"
                        strokeDasharray="6 4"
                      />
                      <rect x="520" y={targetY - 16} width="98" height="15" fill="#0d0a1a" />
                      <text
                        x="615"
                        y={targetY - 5}
                        textAnchor="end"
                        fill="#38d864"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        Target: {weeklyTargetHours}j
                      </text>
                    </g>
                  );
                })()}

                {/* 8 Week Bars */}
                {eightWeekBuckets.map((bucket, idx) => {
                  const slotWidth = 70;
                  const barWidth = 42;
                  const x = 54 + idx * slotWidth;
                  const rawBarHeight = Math.round((bucket.totalHours / maxChartHours) * 135);
                  const barHeight =
                    bucket.totalHours > 0 ? Math.max(6, Math.min(145, rawBarHeight)) : 3;
                  const y = 175 - barHeight;
                  const metTarget = bucket.totalHours >= weeklyTargetHours;
                  const barColor =
                    bucket.totalHours <= 0
                      ? '#2b2352'
                      : metTarget
                      ? '#38d864'
                      : '#f5b935';

                  return (
                    <g key={bucket.weekKey}>
                      {/* Bar shadow / border */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={barColor}
                        stroke="#f4f1ea"
                        strokeWidth={bucket.totalHours > 0 ? 1 : 0}
                      />
                      {/* Hours value on top of bar */}
                      <text
                        x={x + barWidth / 2}
                        y={Math.max(14, y - 6)}
                        textAnchor="middle"
                        fill={metTarget ? '#38d864' : '#f4f1ea'}
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {bucket.totalHours}j
                      </text>
                      {/* Week label (M-7 .. Minggu Ini) */}
                      <text
                        x={x + barWidth / 2}
                        y="194"
                        textAnchor="middle"
                        fill={idx === 7 ? '#f5b935' : '#f4f1ea'}
                        fontSize="11"
                        fontWeight={idx === 7 ? 'bold' : 'normal'}
                        fontFamily="monospace"
                      >
                        {bucket.shortLabel}
                      </text>
                      {/* Date range sub-label */}
                      <text
                        x={x + barWidth / 2}
                        y="210"
                        textAnchor="middle"
                        fill="#b3aad1"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {bucket.dateRangeLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-vt text-lg text-[#b3aad1]">
            <span>
              Total Sesi Tercatat: <strong className="text-[#f4f1ea]">{studySessions.length}</strong>{' '}
              sesi
            </span>
            <span>
              Total Jam Sepanjang Waktu:{' '}
              <strong className="text-[#38d864]">
                {(
                  studySessions.reduce((acc, s) => acc + s.durationMinutes, 0) / 60
                ).toFixed(1)}{' '}
                jam
              </strong>
            </span>
          </div>
        </section>
      </div>

      {/* Section 3: "Catat Sesi" Form & Optional Pixel Pomodoro Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: "Catat sesi" Form */}
        <section aria-label="Formulir Catat Sesi Belajar" className="pixel-box p-4 sm:p-6">
          <div className="font-pixel text-[10px] text-[#f5b935] mb-1">
            JURNAL PETUALANG MANUAL
          </div>
          <h2 className="font-pixel text-xs sm:text-sm text-[#38d864] border-b-2 border-[#3a306e] pb-3 mb-4">
            CATAT SESI BELAJAR
          </h2>

          <form onSubmit={handleLogManualSession} className="space-y-4">
            {/* Topic select */}
            <div>
              <label
                htmlFor="camp-topic-select"
                className="block font-pixel text-[10px] text-[#f5b935] mb-1.5"
              >
                PILIH TOPIK ROADMAP
              </label>
              <select
                id="camp-topic-select"
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full bg-[#0d0a1a] border-2 border-[#5c4e99] focus:border-[#38d864] px-3 py-2 font-vt text-xl text-[#f4f1ea] outline-none"
              >
                {FLOORS.map((floor) => (
                  <optgroup key={floor.id} label={`Lantai ${floor.id}: ${floor.name}`}>
                    {floor.topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        #{t.number} {t.name} ({t.weeks.min}-{t.weeks.max} mgg)
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Duration input in minutes + quick presets */}
            <div>
              <label
                htmlFor="camp-duration-input"
                className="block font-pixel text-[10px] text-[#f5b935] mb-1.5"
              >
                DURASI BELAJAR (MENIT) — SETARA {(Number(durationMinutes || 0) / 60).toFixed(1)} JAM
              </label>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {[30, 60, 90, 120, 180].map((presetMins) => (
                  <button
                    key={presetMins}
                    type="button"
                    onClick={() => {
                      playClick();
                      setDurationMinutes(presetMins);
                    }}
                    className={`pixel-btn px-2.5 py-1 font-vt text-lg ${
                      durationMinutes === presetMins
                        ? 'bg-[#f5b935] text-[#0d0a1a] font-bold'
                        : 'bg-[#16112b] text-[#b3aad1]'
                    }`}
                  >
                    {presetMins} mnt ({presetMins / 60}j)
                  </button>
                ))}
              </div>
              <input
                id="camp-duration-input"
                type="number"
                min={1}
                max={1440}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value) || 0))}
                className="w-full bg-[#0d0a1a] border-2 border-[#5c4e99] focus:border-[#38d864] px-3 py-2 font-vt text-2xl text-[#f4f1ea] tabular-nums outline-none"
              />
            </div>

            {/* Date input */}
            <div>
              <label
                htmlFor="camp-date-input"
                className="block font-pixel text-[10px] text-[#f5b935] mb-1.5"
              >
                TANGGAL SESI
              </label>
              <input
                id="camp-date-input"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full bg-[#0d0a1a] border-2 border-[#5c4e99] focus:border-[#38d864] px-3 py-2 font-vt text-xl text-[#f4f1ea] outline-none"
              />
            </div>

            {/* Optional note */}
            <div>
              <label
                htmlFor="camp-note-input"
                className="block font-pixel text-[10px] text-[#b3aad1] mb-1.5"
              >
                CATATAN SINGKAT (OPSIONAL)
              </label>
              <input
                id="camp-note-input"
                type="text"
                maxLength={120}
                placeholder="Contoh: Latihan turunan parsial & regresi linear di notebook..."
                value={sessionNote}
                onChange={(e) => setSessionNote(e.target.value)}
                className="w-full bg-[#0d0a1a] border-2 border-[#5c4e99] focus:border-[#38d864] px-3 py-2 font-vt text-xl text-[#f4f1ea] outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full pixel-btn py-3 bg-[#38d864] text-[#0d0a1a] font-pixel text-xs"
            >
              + Catat Sesi Belajar
            </button>
          </form>
        </section>

        {/* Right: Optional Pixel Pomodoro Timer */}
        <section
          aria-label="Timer Fokus Pixel Pomodoro"
          className="pixel-box p-4 sm:p-6 flex flex-col justify-between"
        >
          <div>
            <div className="font-pixel text-[10px] text-[#3ac5eb] mb-1">
              TIMER FOKUS OTOMATIS (OPSIONAL)
            </div>
            <h2 className="font-pixel text-xs sm:text-sm text-[#f5b935] border-b-2 border-[#3a306e] pb-3 mb-4">
              PIXEL POMODORO TIMER
            </h2>

            <p className="font-vt text-xl text-[#b3aad1] mb-4 leading-snug">
              Nyalakan timer fokus saat belajar. Ketika waktu habis, sesi belajar akan{' '}
              <strong className="text-[#f4f1ea]">otomatis dicatat</strong> ke progres mingguanmu!
            </p>

            {/* Topic for Pomodoro */}
            <div className="mb-4">
              <label
                htmlFor="pomo-topic-select"
                className="block font-pixel text-[10px] text-[#3ac5eb] mb-1.5"
              >
                TOPIK FOKUS POMODORO
              </label>
              <select
                id="pomo-topic-select"
                value={pomoTopicId}
                onChange={(e) => setPomoTopicId(e.target.value)}
                className="w-full bg-[#0d0a1a] border-2 border-[#5c4e99] focus:border-[#3ac5eb] px-3 py-2 font-vt text-xl text-[#f4f1ea] outline-none"
              >
                {FLOORS.map((floor) => (
                  <optgroup key={floor.id} label={`Lantai ${floor.id}: ${floor.name}`}>
                    {floor.topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        #{t.number} {t.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Duration Presets */}
            <div className="mb-4">
              <div className="font-pixel text-[10px] text-[#f5b935] mb-1.5">
                PILIH DURASI POMODORO
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[15, 25, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleSelectPomoPreset(mins)}
                    className={`pixel-btn py-2 font-pixel text-[10px] ${
                      pomoMinutesPreset === mins
                        ? 'bg-[#3ac5eb] text-[#0d0a1a]'
                        : 'bg-[#16112b] text-[#f4f1ea]'
                    }`}
                  >
                    {mins} MNT
                  </button>
                ))}
              </div>
            </div>

            {/* Big Pixel Countdown Display */}
            <div className="bg-[#0d0a1a] border-2 border-[#3ac5eb] p-4 mb-4 flex flex-col items-center">
              <div className="flex items-center gap-3">
                <PixelTimerSprite size={36} />
                <span
                  data-testid="pomodoro-clock"
                  className="font-pixel text-2xl sm:text-3xl text-[#f4f1ea] tracking-wider tabular-nums"
                >
                  {pomoMM}:{pomoSS}
                </span>
              </div>
              <div className="w-full h-3 bg-[#16112b] border border-[#5c4e99] mt-3 overflow-hidden">
                <div
                  className="h-full bg-[#3ac5eb] transition-all duration-300"
                  style={{ width: `${pomoProgressPct}%` }}
                />
              </div>
              <div className="font-vt text-lg text-[#b3aad1] mt-1.5">
                {pomoRunning
                  ? 'Sedang fokus belajar... Jangan tutup tab ini.'
                  : 'Siap memulai sesi fokus Pomodoro.'}
              </div>
            </div>
          </div>

          {/* Pomodoro Action Buttons */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setPomoRunning((r) => !r);
                }}
                className={`pixel-btn py-2.5 font-pixel text-xs ${
                  pomoRunning
                    ? 'bg-[#f5b935] text-[#0d0a1a]'
                    : 'bg-[#38d864] text-[#0d0a1a]'
                }`}
              >
                {pomoRunning ? 'Jeda Timer' : 'Mulai Pomodoro'}
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setPomoRunning(false);
                  setPomoSecondsLeft(pomoMinutesPreset * 60);
                }}
                className="pixel-btn py-2.5 bg-[#16112b] text-[#f4f1ea] font-pixel text-xs"
              >
                Reset
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setPomoRunning(false);
                setPomoSecondsLeft(pomoMinutesPreset * 60);
                completePomodoroSession(pomoMinutesPreset, pomoTopicId);
              }}
              className="w-full pixel-btn py-2 bg-[#291324] text-[#f5b935] font-vt text-lg"
            >
              ✓ Selesaikan &amp; Catat Sesi Pomodoro Sekarang ({pomoMinutesPreset} menit)
            </button>
          </div>
        </section>
      </div>

      {/* Section 4: Recent Logged Study Sessions & Save Backup Shortcut */}
      <section aria-label="Daftar Riwayat Sesi Belajar" className="pixel-box p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#3a306e] pb-3 mb-4">
          <div>
            <h2 className="font-pixel text-xs sm:text-sm text-[#f5b935]">
              LOG RIWAYAT SESI BELAJAR TERBARU
            </h2>
            <p className="font-vt text-lg text-[#b3aad1]">
              Seluruh sesi tersimpan otomatis di perangkat ini dan ikut disertakan saat Ekspor JSON.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              playClick();
              setView('settings');
            }}
            className="pixel-btn px-3 py-1.5 bg-[#16112b] text-[#3ac5eb] font-pixel text-[10px]"
          >
            Ekspor / Impor JSON Simpanan →
          </button>
        </div>

        {studySessions.length === 0 ? (
          <div className="bg-[#120d26] border-2 border-[#5c4e99] p-4 font-vt text-xl text-[#b3aad1]">
            Belum ada sesi belajar yang dicatat. Gunakan formulir <strong>Catat Sesi Belajar</strong>{' '}
            atau <strong>Pixel Pomodoro Timer</strong> di atas untuk menyalakan api unggunmu!
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {studySessions.slice(0, 15).map((ses) => (
              <div
                key={ses.id}
                className="bg-[#120d26] border-2 border-[#5c4e99] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-pixel text-[8px] px-1.5 py-0.5 border ${
                        ses.source === 'pomodoro'
                          ? 'bg-[#0d1b2a] border-[#3ac5eb] text-[#3ac5eb]'
                          : 'bg-[#0a1714] border-[#38d864] text-[#38d864]'
                      }`}
                    >
                      {ses.source === 'pomodoro' ? 'POMODORO' : 'MANUAL'}
                    </span>
                    <span className="font-pixel text-xs text-[#f4f1ea]">
                      {getTopicName(ses.topicId)}
                    </span>
                  </div>
                  <div className="font-vt text-lg text-[#b3aad1] mt-0.5">
                    Tanggal: <strong className="text-[#f4f1ea]">{ses.date}</strong> · Durasi:{' '}
                    <strong className="text-[#f5b935]">
                      {ses.durationMinutes} menit ({(ses.durationMinutes / 60).toFixed(1)} jam)
                    </strong>
                    {ses.note ? ` · "${ses.note}"` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    deleteStudySession(ses.id);
                  }}
                  aria-label={`Hapus sesi belajar ${getTopicName(ses.topicId)} tanggal ${ses.date}`}
                  className="pixel-btn px-2.5 py-1 bg-[#291324] text-[#e83b47] font-pixel text-[9px] self-start sm:self-center shrink-0"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
