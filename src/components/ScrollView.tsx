import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Floor1TopicContent,
  SPELL_VISUALS,
  computeLatencyMiniLab,
  computeNeuronMiniLab,
  computeQuantMiniLab,
  computeSoftmaxMiniLab,
  getFloor1TopicContent,
} from '../game/spellbookEngine';
import { FLOORS } from '../data/roadmap.js';
import { useGameStore } from '../store/useGameStore';
import { useSound } from '../hooks/useSound.js';

const FLOATING_RUNES = [
  { text: 'Σx ÷ n', x: '8%', y: '18%', delay: 0 },
  { text: 'y = m·x + c', x: '78%', y: '14%', delay: 0.6 },
  { text: 'P(A|B)', x: '14%', y: '68%', delay: 1.2 },
  { text: 'A·v = λ·v', x: '75%', y: '62%', delay: 0.3 },
  { text: 'θ − η·∇L', x: '45%', y: '82%', delay: 0.9 },
  { text: 'df.isna().sum()', x: '62%', y: '36%', delay: 1.5 },
];

const NeuronMiniLabWidget: React.FC<{ reduceMotion: boolean }> = ({ reduceMotion }) => {
  const [x1, setX1] = useState<number>(2);
  const [x2, setX2] = useState<number>(-1);
  const [w1, setW1] = useState<number>(1.5);
  const [w2, setW2] = useState<number>(2);
  const [b, setB] = useState<number>(-0.5);

  const { z, relu, sigmoid } = computeNeuronMiniLab(x1, x2, w1, w2, b);

  // Normalize bars to 0..100% for visual pixel bar display
  const zPercent = Math.min(100, Math.max(0, ((z + 10) / 20) * 100));
  const reluPercent = Math.min(100, Math.max(0, (relu / 10) * 100));
  const sigmoidPercent = Math.min(100, Math.max(0, sigmoid * 100));

  const controls: {
    id: string;
    label: string;
    value: number;
    onChange: (v: number) => void;
  }[] = [
    { id: 'minilab-neuron-x1', label: 'Input x1', value: x1, onChange: setX1 },
    { id: 'minilab-neuron-x2', label: 'Input x2', value: x2, onChange: setX2 },
    { id: 'minilab-neuron-w1', label: 'Bobot w1', value: w1, onChange: setW1 },
    { id: 'minilab-neuron-w2', label: 'Bobot w2', value: w2, onChange: setW2 },
    { id: 'minilab-neuron-b', label: 'Bias b', value: b, onChange: setB },
  ];

  return (
    <section
      aria-label="Mini-Lab Interaktif Neuron dan Aktivasi"
      data-testid="minilab-neuron"
      className="bg-[#1a102b] border-2 border-[#9b5de5] p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#5c4e99] pb-2">
        <div className="font-pixel text-[10px] text-[#b3aad1]">
          ⚗ MINI-LAB INTERAKTIF: NEURON TUNGGAL &amp; FUNGSI AKTIVASI
        </div>
        <span className="font-vt text-base text-[#f5b935]">
          Eksperimen bebas (Tanpa XP · Tidak menghalangi progres)
        </span>
      </div>

      <p className="font-vt text-lg sm:text-xl text-[#f4f1ea]">
        Geser nilai input (<code>x1, x2</code>), bobot (<code>w1, w2</code>), dan bias (
        <code>b</code>) antara <strong>-3 hingga 3</strong> (langkah 0.5) untuk mengamati perubahan{' '}
        <code>z</code>, <code>ReLU(z)</code>, dan <code>sigmoid(z)</code> secara langsung:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {controls.map((ctrl) => (
          <div
            key={ctrl.id}
            className="bg-[#120d26] border border-[#5c4e99] p-2.5 flex flex-col justify-between"
          >
            <label
              htmlFor={ctrl.id}
              className="font-pixel text-[9px] text-[#f4f1ea] flex items-center justify-between gap-1 mb-1.5"
            >
              <span>{ctrl.label}</span>
              <span className="text-[#f5b935] tabular-nums">{ctrl.value.toFixed(1)}</span>
            </label>
            <input
              id={ctrl.id}
              type="range"
              min={-3}
              max={3}
              step={0.5}
              value={ctrl.value}
              onChange={(e) => ctrl.onChange(parseFloat(e.target.value))}
              className="w-full accent-[#9b5de5] cursor-pointer"
            />
          </div>
        ))}
      </div>

      {/* Live Outputs + Tiny Pixel Bars */}
      <div className="bg-[#0d0a1a] border-2 border-[#5c4e99] p-3 space-y-2.5">
        <div className="font-mono text-xs sm:text-sm text-[#b3aad1]">
          Rumus aktif: z = ({w1})·({x1}) + ({w2})·({x2}) + ({b}) ={' '}
          <strong className="text-[#f5b935]" data-testid="neuron-z-value">
            {z.toFixed(2)}
          </strong>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Output 1: z */}
          <div className="bg-[#16112b] border border-[#5c4e99] p-2.5 space-y-1.5">
            <div className="flex items-center justify-between font-mono text-xs text-[#f4f1ea]">
              <span>z = w1·x1 + w2·x2 + b</span>
              <strong className="text-[#f5b935] tabular-nums">{z.toFixed(2)}</strong>
            </div>
            <div className="w-full h-3 bg-[#0d0a1a] border border-[#5c4e99] p-0.5">
              <div
                className={`h-full bg-[#f5b935] ${reduceMotion ? '' : 'transition-all duration-150'}`}
                style={{ width: `${zPercent}%` }}
              />
            </div>
          </div>

          {/* Output 2: ReLU(z) */}
          <div className="bg-[#16112b] border border-[#5c4e99] p-2.5 space-y-1.5">
            <div className="flex items-center justify-between font-mono text-xs text-[#f4f1ea]">
              <span>ReLU(z) = max(0, z)</span>
              <strong
                className="text-[#38d864] tabular-nums"
                data-testid="neuron-relu-value"
              >
                {relu.toFixed(2)}
              </strong>
            </div>
            <div className="w-full h-3 bg-[#0d0a1a] border border-[#5c4e99] p-0.5">
              <div
                className={`h-full bg-[#38d864] ${reduceMotion ? '' : 'transition-all duration-150'}`}
                style={{ width: `${reluPercent}%` }}
              />
            </div>
          </div>

          {/* Output 3: sigmoid(z) */}
          <div className="bg-[#16112b] border border-[#5c4e99] p-2.5 space-y-1.5">
            <div className="flex items-center justify-between font-mono text-xs text-[#f4f1ea]">
              <span>sigmoid(z)</span>
              <strong
                className="text-[#3ac5eb] tabular-nums"
                data-testid="neuron-sigmoid-value"
              >
                {sigmoid.toFixed(3)}
              </strong>
            </div>
            <div className="w-full h-3 bg-[#0d0a1a] border border-[#5c4e99] p-0.5">
              <div
                className={`h-full bg-[#3ac5eb] ${reduceMotion ? '' : 'transition-all duration-150'}`}
                style={{ width: `${sigmoidPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const SoftmaxMiniLabWidget: React.FC<{ reduceMotion: boolean }> = ({ reduceMotion }) => {
  const [s1, setS1] = useState<number>(2);
  const [s2, setS2] = useState<number>(1);
  const [s3, setS3] = useState<number>(0);

  const { probabilities } = computeSoftmaxMiniLab(s1, s2, s3);

  const scoreControls = [
    {
      id: 'minilab-softmax-s1',
      label: 'Skor Atensi s1',
      score: s1,
      prob: probabilities[0],
      color: '#fcd34d',
      onChange: setS1,
    },
    {
      id: 'minilab-softmax-s2',
      label: 'Skor Atensi s2',
      score: s2,
      prob: probabilities[1],
      color: '#3ac5eb',
      onChange: setS2,
    },
    {
      id: 'minilab-softmax-s3',
      label: 'Skor Atensi s3',
      score: s3,
      prob: probabilities[2],
      color: '#38d864',
      onChange: setS3,
    },
  ];

  return (
    <section
      aria-label="Mini-Lab Interaktif Bobot Softmax Atensi"
      data-testid="minilab-softmax"
      className="bg-[#1a102b] border-2 border-[#fcd34d] p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#5c4e99] pb-2">
        <div className="font-pixel text-[10px] text-[#fcd34d]">
          ⚗ MINI-LAB INTERAKTIF: BOBOT SOFTMAX SELF-ATTENTION
        </div>
        <span className="font-vt text-base text-[#b3aad1]">
          Eksperimen bebas (Tanpa XP · Tidak menghalangi progres)
        </span>
      </div>

      <p className="font-vt text-lg sm:text-xl text-[#f4f1ea]">
        Atur tiga skor atensi (<code>s1, s2, s3</code>) antara <strong>-3 hingga 3</strong>{' '}
        (langkah 0.5) untuk melihat bagaimana <code>softmax(s_i) = e^s_i / Σ e^s_j</code> memusatkan
        bobot perhatian:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {scoreControls.map((item, idx) => {
          const pct = Math.round(item.prob * 100);
          return (
            <div
              key={item.id}
              className="bg-[#120d26] border border-[#5c4e99] p-3 space-y-2"
            >
              <label
                htmlFor={item.id}
                className="font-pixel text-[9px] text-[#f4f1ea] flex items-center justify-between gap-1"
              >
                <span>{item.label}</span>
                <span className="text-[#fcd34d] tabular-nums">{item.score.toFixed(1)}</span>
              </label>
              <input
                id={item.id}
                type="range"
                min={-3}
                max={3}
                step={0.5}
                value={item.score}
                onChange={(e) => item.onChange(parseFloat(e.target.value))}
                className="w-full accent-[#fcd34d] cursor-pointer"
              />
              <div className="pt-1 space-y-1">
                <div className="flex items-center justify-between font-mono text-xs text-[#b3aad1]">
                  <span>Bobot w{idx + 1}:</span>
                  <strong
                    className="text-[#f4f1ea] tabular-nums"
                    data-testid={`softmax-w${idx + 1}-value`}
                  >
                    {item.prob.toFixed(2)} ({pct}%)
                  </strong>
                </div>
                <div className="w-full h-3 bg-[#0d0a1a] border border-[#5c4e99] p-0.5">
                  <div
                    className={`h-full ${reduceMotion ? '' : 'transition-all duration-150'}`}
                    style={{
                      width: `${Math.min(100, Math.max(0, item.prob * 100))}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#0d0a1a] border border-[#38d864] px-3 py-2 flex items-center justify-between font-mono text-xs sm:text-sm text-[#38d864]">
        <span>
          w1 ({probabilities[0].toFixed(2)}) + w2 ({probabilities[1].toFixed(2)}) + w3 (
          {probabilities[2].toFixed(2)})
        </span>
        <strong data-testid="softmax-sum-line">Jumlah bobot = 1</strong>
      </div>
    </section>
  );
};

const QuantMiniLabWidget: React.FC<{ reduceMotion: boolean }> = ({ reduceMotion }) => {
  const [parameterCount, setParameterCount] = useState<number>(50000);
  const [dataType, setDataType] = useState<'float32' | 'int8'>('float32');
  const [flashKB, setFlashKB] = useState<number>(1000);
  const [ramKB, setRamKB] = useState<number>(256);
  const [arenaKB, setArenaKB] = useState<number>(50);

  const {
    bytesPerParameter,
    modelSizeBytes,
    modelSizeKB,
    fitsInFlash,
    fitsInRam,
    flashStatus,
    ramStatus,
  } = computeQuantMiniLab(parameterCount, dataType, flashKB, ramKB, arenaKB);

  const flashPct = flashKB > 0 ? Math.min(100, Math.max(0, (modelSizeKB / flashKB) * 100)) : 100;
  const ramPct = ramKB > 0 ? Math.min(100, Math.max(0, (arenaKB / ramKB) * 100)) : 100;

  return (
    <section
      aria-label="Lab Anggaran Memori"
      data-testid="minilab-quant"
      className="bg-[#081d26] border-2 border-[#3ac5eb] p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#0891b2] pb-2">
        <div className="font-pixel text-[10px] text-[#3ac5eb]">
          ⚗ LAB ANGGARAN MEMORI (KUANTISASI &amp; MIKROKONTROLER)
        </div>
        <span className="font-vt text-base text-[#f5b935]">
          Eksperimen bebas (Tanpa XP · Tidak menghalangi progres)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Parameter Count Slider */}
        <div className="bg-[#0d1524] border border-[#0891b2] p-3 space-y-2">
          <label
            htmlFor="minilab-quant-params"
            className="font-pixel text-[9px] text-[#f4f1ea] flex items-center justify-between gap-1"
          >
            <span>Jumlah Parameter</span>
            <span className="text-[#3ac5eb] tabular-nums">
              {parameterCount.toLocaleString('id-ID')}
            </span>
          </label>
          <input
            id="minilab-quant-params"
            type="range"
            min={1000}
            max={200000}
            step={1000}
            value={parameterCount}
            onChange={(e) => setParameterCount(Number(e.target.value))}
            className="w-full accent-[#3ac5eb] cursor-pointer"
          />
          <div className="font-vt text-sm text-[#94a3b8]">
            Rentang: 1.000 – 200.000 (langkah 1.000)
          </div>
        </div>

        {/* Data Type Toggle (float32 = 4 byte, int8 = 1 byte) */}
        <div className="bg-[#0d1524] border border-[#0891b2] p-3 space-y-2">
          <div className="font-pixel text-[9px] text-[#f4f1ea] flex items-center justify-between">
            <span>Tipe Data Bobot</span>
            <span className="text-[#f5b935]">{bytesPerParameter} byte/param</span>
          </div>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Pilih Tipe Data Bobot">
            <button
              type="button"
              data-testid="quant-dtype-float32"
              aria-pressed={dataType === 'float32'}
              onClick={() => setDataType('float32')}
              className={`pixel-btn py-1.5 px-2 font-pixel text-[9px] ${
                dataType === 'float32'
                  ? 'bg-[#3ac5eb] text-[#0d0a1a]'
                  : 'bg-[#16112b] text-[#b3aad1]'
              }`}
            >
              float32 (4B)
            </button>
            <button
              type="button"
              data-testid="quant-dtype-int8"
              aria-pressed={dataType === 'int8'}
              onClick={() => setDataType('int8')}
              className={`pixel-btn py-1.5 px-2 font-pixel text-[9px] ${
                dataType === 'int8'
                  ? 'bg-[#38d864] text-[#0d0a1a]'
                  : 'bg-[#16112b] text-[#b3aad1]'
              }`}
            >
              int8 (1B)
            </button>
          </div>
          <div className="font-vt text-sm text-[#94a3b8]">
            1 KB = 1.000 byte
          </div>
        </div>

        {/* Tensor Arena Slider (0-200 KB, default 50) */}
        <div className="bg-[#0d1524] border border-[#0891b2] p-3 space-y-2">
          <label
            htmlFor="minilab-quant-arena"
            className="font-pixel text-[9px] text-[#f4f1ea] flex items-center justify-between gap-1"
          >
            <span>Tensor Arena (KB)</span>
            <span className="text-[#2dd4bf] tabular-nums">{arenaKB} KB</span>
          </label>
          <input
            id="minilab-quant-arena"
            type="range"
            min={0}
            max={200}
            step={5}
            value={arenaKB}
            onChange={(e) => setArenaKB(Number(e.target.value))}
            className="w-full accent-[#2dd4bf] cursor-pointer"
          />
          <div className="font-vt text-sm text-[#94a3b8]">
            Aktivasi kerja di RAM (0 – 200 KB)
          </div>
        </div>
      </div>

      {/* Device Flash KB & RAM KB Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-[#0d1524] border border-[#0891b2] p-3 flex items-center justify-between gap-3">
          <label htmlFor="minilab-quant-flash" className="font-pixel text-[9px] text-[#f4f1ea]">
            Kapasitas Flash Perangkat (KB)
          </label>
          <input
            id="minilab-quant-flash"
            type="number"
            min={16}
            max={8000}
            step={16}
            value={flashKB}
            onChange={(e) => setFlashKB(Math.max(0, Number(e.target.value) || 0))}
            className="w-28 bg-[#070b14] border-2 border-[#3ac5eb] px-2.5 py-1 font-mono text-sm text-[#f4f1ea] text-right"
          />
        </div>

        <div className="bg-[#0d1524] border border-[#0891b2] p-3 flex items-center justify-between gap-3">
          <label htmlFor="minilab-quant-ram" className="font-pixel text-[9px] text-[#f4f1ea]">
            Kapasitas RAM Perangkat (KB)
          </label>
          <input
            id="minilab-quant-ram"
            type="number"
            min={8}
            max={4000}
            step={8}
            value={ramKB}
            onChange={(e) => setRamKB(Math.max(0, Number(e.target.value) || 0))}
            className="w-28 bg-[#070b14] border-2 border-[#2dd4bf] px-2.5 py-1 font-mono text-sm text-[#f4f1ea] text-right"
          />
        </div>
      </div>

      {/* Outputs: Model Size, Flash Fit, RAM Fit */}
      <div className="bg-[#070b14] border-2 border-[#0891b2] p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs sm:text-sm text-[#f4f1ea]">
          <span>
            Ukuran model = {parameterCount.toLocaleString('id-ID')} × {bytesPerParameter} byte ={' '}
            {modelSizeBytes.toLocaleString('id-ID')} byte
          </span>
          <strong className="text-[#3ac5eb] text-base" data-testid="quant-model-size-kb">
            {modelSizeKB} KB
          </strong>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Flash status */}
          <div
            className={`p-2.5 border ${
              fitsInFlash ? 'bg-[#0a1714] border-[#38d864]' : 'bg-[#291324] border-[#e83b47]'
            }`}
          >
            <div className="flex items-center justify-between font-pixel text-[9px] mb-1.5">
              <span className="text-[#f4f1ea]">
                FLASH: {modelSizeKB} KB / {flashKB} KB
              </span>
              <strong
                data-testid="quant-flash-status"
                className={fitsInFlash ? 'text-[#38d864]' : 'text-[#e83b47]'}
              >
                {flashStatus}
              </strong>
            </div>
            <div className="w-full h-3 bg-[#0d0a1a] border border-[#5c4e99] p-0.5">
              <div
                className={`h-full ${
                  fitsInFlash ? 'bg-[#38d864]' : 'bg-[#e83b47]'
                } ${reduceMotion ? '' : 'transition-all duration-150'}`}
                style={{ width: `${flashPct}%` }}
              />
            </div>
          </div>

          {/* RAM status */}
          <div
            className={`p-2.5 border ${
              fitsInRam ? 'bg-[#0a1714] border-[#38d864]' : 'bg-[#291324] border-[#e83b47]'
            }`}
          >
            <div className="flex items-center justify-between font-pixel text-[9px] mb-1.5">
              <span className="text-[#f4f1ea]">
                RAM (ARENA): {arenaKB} KB / {ramKB} KB
              </span>
              <strong
                data-testid="quant-ram-status"
                className={fitsInRam ? 'text-[#38d864]' : 'text-[#e83b47]'}
              >
                {ramStatus}
              </strong>
            </div>
            <div className="w-full h-3 bg-[#0d0a1a] border border-[#5c4e99] p-0.5">
              <div
                className={`h-full ${
                  fitsInRam ? 'bg-[#2dd4bf]' : 'bg-[#e83b47]'
                } ${reduceMotion ? '' : 'transition-all duration-150'}`}
                style={{ width: `${ramPct}%` }}
              />
            </div>
          </div>
        </div>

        <p
          data-testid="quant-assumption-note"
          className="font-vt text-base sm:text-lg text-[#b3aad1] border-t border-[#1e293b] pt-2"
        >
          Asumsi: model disimpan di flash, tensor arena di RAM. Angka perangkat hanya contoh, bukan spesifikasi chip tertentu.
        </p>
      </div>
    </section>
  );
};

const LatencyMiniLabWidget: React.FC<{ reduceMotion: boolean }> = ({ reduceMotion }) => {
  const [akuisisi, setAkuisisi] = useState<number>(20);
  const [prapemrosesan, setPrapemrosesan] = useState<number>(5);
  const [inferensi, setInferensi] = useState<number>(35);
  const [pengiriman, setPengiriman] = useState<number>(40);
  const [limit, setLimit] = useState<number>(120);

  const { totalMs, withinBudget, statusText } = computeLatencyMiniLab(
    akuisisi,
    prapemrosesan,
    inferensi,
    pengiriman,
    limit
  );

  const stageSliders = [
    {
      id: 'minilab-latency-akuisisi',
      label: 'Akuisisi (ms)',
      value: akuisisi,
      onChange: setAkuisisi,
      color: '#3ac5eb',
    },
    {
      id: 'minilab-latency-prapemrosesan',
      label: 'Pra-pemrosesan (ms)',
      value: prapemrosesan,
      onChange: setPrapemrosesan,
      color: '#2dd4bf',
    },
    {
      id: 'minilab-latency-inferensi',
      label: 'Inferensi (ms)',
      value: inferensi,
      onChange: setInferensi,
      color: '#f5b935',
    },
    {
      id: 'minilab-latency-pengiriman',
      label: 'Pengiriman (ms)',
      value: pengiriman,
      onChange: setPengiriman,
      color: '#fb923c',
    },
  ];

  const barRatio = limit > 0 ? Math.min(100, Math.max(0, (totalMs / limit) * 100)) : 100;

  return (
    <section
      aria-label="Lab Anggaran Latensi"
      data-testid="minilab-latency"
      className="bg-[#081d26] border-2 border-[#fb923c] p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#0891b2] pb-2">
        <div className="font-pixel text-[10px] text-[#fb923c]">
          ⏱ LAB ANGGARAN LATENSI (PIPA END-TO-END)
        </div>
        <span className="font-vt text-base text-[#b3aad1]">
          Eksperimen bebas (Tanpa XP · Tidak menghalangi progres)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stageSliders.map((s) => (
          <div
            key={s.id}
            className="bg-[#0d1524] border border-[#0891b2] p-2.5 flex flex-col justify-between"
          >
            <label
              htmlFor={s.id}
              className="font-pixel text-[9px] text-[#f4f1ea] flex items-center justify-between gap-1 mb-1.5"
            >
              <span>{s.label}</span>
              <span style={{ color: s.color }} className="tabular-nums">
                {s.value} ms
              </span>
            </label>
            <input
              id={s.id}
              type="range"
              min={0}
              max={200}
              step={5}
              value={s.value}
              onChange={(e) => s.onChange(Number(e.target.value))}
              className="w-full accent-[#3ac5eb] cursor-pointer"
            />
          </div>
        ))}
      </div>

      {/* Limit Slider (0-500, step 10) */}
      <div className="bg-[#0d1524] border border-[#f5b935] p-3 space-y-1.5">
        <label
          htmlFor="minilab-latency-limit"
          className="font-pixel text-[9px] text-[#f4f1ea] flex items-center justify-between"
        >
          <span>Batas Waktu / Limit (ms)</span>
          <span className="text-[#f5b935] tabular-nums">{limit} ms</span>
        </label>
        <input
          id="minilab-latency-limit"
          type="range"
          min={0}
          max={500}
          step={10}
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="w-full accent-[#f5b935] cursor-pointer"
        />
      </div>

      {/* Total & Budget Output */}
      <div
        className={`p-3 border-2 space-y-2 ${
          withinBudget ? 'bg-[#0a1714] border-[#38d864]' : 'bg-[#291324] border-[#e83b47]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs sm:text-sm text-[#f4f1ea]">
          <span>
            Total = {akuisisi} + {prapemrosesan} + {inferensi} + {pengiriman} ={' '}
            <strong data-testid="latency-total-ms" className="text-[#3ac5eb]">
              {totalMs} ms
            </strong>{' '}
            (Batas: {limit} ms)
          </span>
          <strong
            data-testid="latency-status-text"
            className={`font-pixel text-[10px] px-2 py-1 border ${
              withinBudget
                ? 'bg-[#0d0a1a] border-[#38d864] text-[#38d864]'
                : 'bg-[#0d0a1a] border-[#e83b47] text-[#e83b47]'
            }`}
          >
            {statusText}
          </strong>
        </div>

        <div className="w-full h-3 bg-[#0d0a1a] border border-[#5c4e99] p-0.5">
          <div
            className={`h-full ${
              withinBudget ? 'bg-[#38d864]' : 'bg-[#e83b47]'
            } ${reduceMotion ? '' : 'transition-all duration-150'}`}
            style={{ width: `${barRatio}%` }}
          />
        </div>
      </div>
    </section>
  );
};

interface ScrollPanelProps {
  topicContent: Floor1TopicContent;
  topicTitle: string;
  reduceMotion: boolean;
  mode: 'battle-entry' | 'standalone';
  onReadyToFight?: () => void;
  onClose: () => void;
}

export const ScrollPanel: React.FC<ScrollPanelProps> = ({
  topicContent,
  topicTitle,
  reduceMotion,
  mode,
  onReadyToFight,
  onClose,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const { playClick } = useSound();

  const spellTheme = SPELL_VISUALS[topicContent.spell.id] || SPELL_VISUALS.s1;

  const checkScrollReachedEnd = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + 20) {
      setHasScrolledToEnd(true);
      return;
    }
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setHasScrolledToEnd(true);
    }
  }, []);

  useEffect(() => {
    setHasScrolledToEnd(false);
    const timer = window.setTimeout(() => {
      checkScrollReachedEnd();
    }, 60);
    window.addEventListener('resize', checkScrollReachedEnd);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', checkScrollReachedEnd);
    };
  }, [topicContent.topicId, checkScrollReachedEnd]);

  return (
    <div className="relative flex flex-col max-h-[85vh] overflow-hidden">
      {/* Floating formula-rune particles in background (disabled by reduceMotion) */}
      {!reduceMotion && (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden opacity-20 select-none"
          aria-hidden="true"
        >
          {FLOATING_RUNES.map((rune, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0.2, y: 0 }}
              animate={{ opacity: [0.15, 0.45, 0.15], y: [-6, 6, -6] }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                delay: rune.delay,
                ease: 'easeInOut',
              }}
              style={{ left: rune.x, top: rune.y, color: spellTheme.color }}
              className="absolute font-mono text-xs sm:text-sm font-bold"
            >
              {rune.text}
            </motion.div>
          ))}
        </div>
      )}

      {/* Top Header */}
      <div
        className="p-4 sm:p-5 border-b-4 bg-[#120d26] flex items-center justify-between gap-3 relative z-10 shrink-0"
        style={{ borderColor: spellTheme.color }}
      >
        <div>
          <div
            className="font-pixel text-[10px] mb-1"
            style={{ color: spellTheme.color }}
          >
            GULUNGAN MANTRA KUNO · TOPIK #{topicContent.topicId}
          </div>
          <h2 className="font-pixel text-sm sm:text-base text-[#f4f1ea]">
            {topicTitle} — {topicContent.spell.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            playClick();
            onClose();
          }}
          aria-label="Tutup Gulungan"
          className="pixel-btn px-3 py-1.5 bg-[#1f193d] text-[#f4f1ea] font-pixel text-xs shrink-0"
        >
          ✕ TUTUP
        </button>
      </div>

      {/* Scrollable Body */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollReachedEnd}
        tabIndex={0}
        aria-label={`Isi Gulungan ${topicContent.spell.name}`}
        className="p-4 sm:p-6 overflow-y-auto space-y-5 relative z-10 flex-1 focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-[#f5b935]"
      >
        {/* Topic Paragraphs */}
        <section aria-label="Penjelasan Materi" className="space-y-3">
          <div className="font-pixel text-[10px] text-[#f5b935]">
            AJARAN DASAR GULUNGAN
          </div>
          {topicContent.scroll.paragraphs.map((para, idx) => (
            <p
              key={idx}
              className="font-vt text-xl sm:text-2xl text-[#f4f1ea] leading-relaxed bg-[#120d26]/90 border-l-4 pl-3.5 py-2"
              style={{ borderColor: spellTheme.color }}
            >
              {para}
            </p>
          ))}
        </section>

        {/* Spell Formulas on a Pixel-Bordered "Rune Plate" (monospace, plain text, no math libraries) */}
        <section
          aria-label={`Pelat Rune Rumus ${topicContent.spell.name}`}
          className="p-4 border-4 bg-[#0d0a1a] shadow-[inset_0_0_0_2px_#2b2352]"
          style={{ borderColor: spellTheme.color }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#3a306e] pb-2 mb-3">
            <span
              className="font-pixel text-xs"
              style={{ color: spellTheme.color }}
            >
              ★ PELAT RUNE MANTRA: {topicContent.spell.name}
            </span>
            <span className="font-pixel text-[9px] text-[#b3aad1] bg-[#16112b] px-2 py-0.5 border border-[#5c4e99]">
              ID MANTRA: {topicContent.spell.id.toUpperCase()}
            </span>
          </div>
          <ul className="space-y-2">
            {topicContent.spell.formulas.map((formula, idx) => (
              <li
                key={idx}
                className="font-mono text-sm sm:text-base text-[#f4f1ea] bg-[#16112b] border border-[#5c4e99] px-3 py-2 tracking-wide"
              >
                {formula}
              </li>
            ))}
          </ul>
        </section>

        {/* Worked Example */}
        <section
          aria-label="Contoh Perhitungan"
          className="bg-[#0a1714] border-2 border-[#38d864] p-4"
        >
          <div className="font-pixel text-[10px] text-[#38d864] mb-1.5">
            CONTOH PERHITUNGAN NYATA
          </div>
          <p className="font-vt text-xl sm:text-2xl text-[#f4f1ea] leading-snug">
            {topicContent.scroll.workedExample}
          </p>
        </section>

        {/* Mini-Labs (Pure React, rendered below the worked example for Topics 12, 16, 19, 20) */}
        {topicContent.miniLab === 'neuron' && (
          <NeuronMiniLabWidget reduceMotion={reduceMotion} />
        )}
        {topicContent.miniLab === 'softmax' && (
          <SoftmaxMiniLabWidget reduceMotion={reduceMotion} />
        )}
        {topicContent.miniLab === 'quant' && (
          <QuantMiniLabWidget reduceMotion={reduceMotion} />
        )}
        {topicContent.miniLab === 'latency' && (
          <LatencyMiniLabWidget reduceMotion={reduceMotion} />
        )}

        {/* "Jebakan Monster" (commonMistake) Callout */}
        <section
          aria-label="Jebakan Monster"
          className="bg-[#291324] border-2 border-[#e83b47] p-4"
        >
          <div className="font-pixel text-[10px] text-[#e83b47] mb-1.5">
            ⚠ JEBAKAN MONSTER (KESALAHAN UMUM)
          </div>
          <p className="font-vt text-xl sm:text-2xl text-[#f4f1ea] leading-snug">
            {topicContent.scroll.commonMistake}
          </p>
        </section>

        {/* References List */}
        <section
          aria-label="Daftar Referensi Belajar"
          className="bg-[#120d26] border-2 border-[#5c4e99] p-4 space-y-2.5"
        >
          <div className="font-pixel text-[10px] text-[#3ac5eb]">
            REFERENSI &amp; KITAB RUJUKAN
          </div>
          <ul className="space-y-2">
            {topicContent.references.map((ref, idx) => (
              <li key={idx} className="font-vt text-xl text-[#f4f1ea] flex items-start gap-2">
                <span className="text-[#f5b935]" aria-hidden="true">
                  ▸
                </span>
                {ref.url ? (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3ac5eb] underline hover:text-[#f5b935] break-words"
                  >
                    {ref.label} ↗
                  </a>
                ) : (
                  <span className="text-[#f4f1ea]">{ref.label}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="font-vt text-lg text-[#b3aad1] pt-1 border-t border-[#3a306e]">
            Tautan bisa berubah; jika mati, cari judulnya langsung.
          </p>
        </section>
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-[#120d26] border-t-2 border-[#3a306e] flex flex-wrap items-center justify-between gap-3 relative z-10 shrink-0">
        {mode === 'battle-entry' ? (
          <>
            <div className="font-vt text-lg text-[#b3aad1]">
              {hasScrolledToEnd
                ? '✓ Gulungan telah dibaca sampai akhir. Kamu siap menghadapi monster!'
                : '↓ Gulir gulungan ini sampai akhir untuk mengaktifkan tombol bertarung.'}
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                disabled={!hasScrolledToEnd}
                onClick={() => {
                  playClick();
                  onReadyToFight?.();
                }}
                className="pixel-btn px-5 py-2.5 bg-[#38d864] text-[#0d0a1a] font-pixel text-xs"
              >
                Aku siap bertarung →
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="font-vt text-lg text-[#38d864]">
              Mantra ini tersimpan di Grimoire milikmu.
            </span>
            <button
              type="button"
              onClick={() => {
                playClick();
                onClose();
              }}
              className="pixel-btn px-4 py-2 bg-[#f5b935] text-[#0d0a1a] font-pixel text-xs"
            >
              Kembali ke Grimoire
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Standalone modal wrapper when opening a Scroll from the Grimoire ("Buka gulungan").
 */
export const StandaloneScrollModal: React.FC = () => {
  const scrollOnlyTopicId = useGameStore((s) => s.scrollOnlyTopicId);
  const reduceMotion = useGameStore((s) => s.reduceMotion);
  const closeScrollViewer = useGameStore((s) => s.closeScrollViewer);

  useEffect(() => {
    if (!scrollOnlyTopicId) return undefined;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeScrollViewer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollOnlyTopicId, closeScrollViewer]);

  if (!scrollOnlyTopicId) return null;

  const topicContent = getFloor1TopicContent(scrollOnlyTopicId);
  const roadmapTopic = FLOORS.flatMap((f) => f.topics).find(
    (t) => t.id === scrollOnlyTopicId
  );

  if (!topicContent) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85"
        role="dialog"
        aria-modal="true"
        aria-label={`Gulungan ${topicContent.spell.name}`}
      >
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
          className="w-full max-w-3xl pixel-box bg-[#16112b] overflow-hidden"
        >
          <ScrollPanel
            topicContent={topicContent}
            topicTitle={roadmapTopic?.name || `Topik ${topicContent.topicId}`}
            reduceMotion={reduceMotion}
            mode="standalone"
            onClose={closeScrollViewer}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
