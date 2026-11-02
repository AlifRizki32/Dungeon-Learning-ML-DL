import React, { useMemo } from 'react';
import {
  BarsVisual,
  CodeBlockVisual,
  DotGridVisual,
  LessonVisual,
  LinePlotVisual,
  MatrixGridVisual,
  formatBarValue,
} from '../game/lessonEngine';

interface LessonVisualRendererProps {
  visual?: LessonVisual;
  activeHighlights: string[];
  reduceMotion: boolean;
}

const GROUP_PALETTE = [
  {
    bg: '#3ac5eb',
    border: '#f4f1ea',
    text: '#0d0a1a',
    symbol: '■',
    patternName: 'Kotak Penuh',
  },
  {
    bg: '#2b2352',
    border: '#b3aad1',
    text: '#f4f1ea',
    symbol: '·',
    patternName: 'Titik Dasar',
  },
  {
    bg: '#f5b935',
    border: '#f4f1ea',
    text: '#0d0a1a',
    symbol: '★',
    patternName: 'Bintang Emas',
  },
  {
    bg: '#e83b47',
    border: '#f4f1ea',
    text: '#f4f1ea',
    symbol: '▲',
    patternName: 'Segitiga Merah',
  },
  {
    bg: '#38d864',
    border: '#f4f1ea',
    text: '#0d0a1a',
    symbol: '◆',
    patternName: 'Wajik Hijau',
  },
];

const DotGridRenderer: React.FC<{
  visual: DotGridVisual;
  activeHighlights: string[];
  reduceMotion: boolean;
}> = ({ visual, activeHighlights, reduceMotion }) => {
  const total = Math.max(1, Number(visual.total) || 1);
  const columns = Math.max(1, Number(visual.columns) || 4);
  const groups = Array.isArray(visual.groups) ? visual.groups : [];

  const validGroupIds = useMemo(() => new Set(groups.map((g) => g.id)), [groups]);
  const activeGroupIds = useMemo(
    () => new Set(activeHighlights.filter((h) => validGroupIds.has(h))),
    [activeHighlights, validGroupIds]
  );
  const hasAnyActive = activeGroupIds.size > 0;

  // Map each group to its visual style
  const groupStyleMap = useMemo(() => {
    const map = new Map<string, (typeof GROUP_PALETTE)[number] & { index: number }>();
    groups.forEach((g, idx) => {
      const style = GROUP_PALETTE[idx % GROUP_PALETTE.length];
      map.set(g.id, { ...style, index: idx });
    });
    return map;
  }, [groups]);

  // Build cell descriptors: { baseGroupId, subsetGroupId }
  const cells = useMemo(() => {
    const baseGroups = groups.filter((g) => !g.subsetOf);
    const subsetByParent = new Map<string, { id: string; remaining: number }[]>();

    for (const g of groups) {
      if (g.subsetOf) {
        const list = subsetByParent.get(g.subsetOf) || [];
        list.push({ id: g.id, remaining: Math.max(0, Number(g.count) || 0) });
        subsetByParent.set(g.subsetOf, list);
      }
    }

    const result: { baseGroupId: string; subsetGroupId: string | null }[] = [];
    for (const bg of baseGroups) {
      const count = Math.max(0, Number(bg.count) || 0);
      const subs = subsetByParent.get(bg.id) || [];
      for (let i = 0; i < count; i++) {
        let assignedSub: string | null = null;
        for (const sub of subs) {
          if (sub.remaining > 0) {
            assignedSub = sub.id;
            sub.remaining--;
            break;
          }
        }
        result.push({
          baseGroupId: bg.id,
          subsetGroupId: assignedSub,
        });
      }
    }

    // Pad or trim to exact total
    while (result.length < total) {
      result.push({
        baseGroupId: baseGroups[0]?.id || 'default',
        subsetGroupId: null,
      });
    }
    return result.slice(0, total);
  }, [groups, total]);

  const isDense = total >= 250 || columns >= 20;
  const isMedium = !isDense && (total > 36 || columns >= 8);

  return (
    <div
      data-testid="lesson-visual-dotGrid"
      className="bg-[#0d0a1a] border-2 border-[#5c4e99] p-3 sm:p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2b2352] pb-2">
        <span className="font-pixel text-[9px] text-[#3ac5eb]">
          VISUAL PETAK PIKSEL ({total.toLocaleString('id-ID')} KOTAK · {columns} KOLOM)
        </span>
        {hasAnyActive && (
          <span className="font-pixel text-[8px] px-2 py-0.5 bg-[#16112b] border border-[#f5b935] text-[#f5b935]">
            SOROTAN AKTIF
          </span>
        )}
      </div>

      {/* Grid container */}
      <div className="overflow-x-auto py-1">
        <div
          role="img"
          aria-label={`Petak berisi ${total} kotak dalam ${columns} kolom`}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gap: isDense ? '1px' : isMedium ? '3px' : '6px',
            maxWidth: isDense ? '100%' : `${Math.min(520, columns * 44)}px`,
          }}
          className="mx-auto bg-[#070510] p-1.5 border border-[#2b2352]"
        >
          {cells.map((cell, idx) => {
            const baseStyle =
              groupStyleMap.get(cell.baseGroupId) || GROUP_PALETTE[0];
            const subStyle = cell.subsetGroupId
              ? groupStyleMap.get(cell.subsetGroupId)
              : null;

            const isHighlighted =
              activeGroupIds.has(cell.baseGroupId) ||
              (cell.subsetGroupId ? activeGroupIds.has(cell.subsetGroupId) : false);

            const dimmed = hasAnyActive && !isHighlighted;
            const effectiveStyle = subStyle || baseStyle;

            return (
              <div
                key={idx}
                data-base-group={cell.baseGroupId}
                data-subset-group={cell.subsetGroupId || undefined}
                data-highlighted={isHighlighted ? 'true' : 'false'}
                style={{
                  backgroundColor: effectiveStyle.bg,
                  borderColor: isHighlighted ? '#f5b935' : effectiveStyle.border,
                  color: effectiveStyle.text,
                  transition: reduceMotion ? 'none' : 'opacity 120ms steps(2, end)',
                }}
                className={`aspect-square flex items-center justify-center select-none ${
                  isDense
                    ? 'min-w-[4px] min-h-[4px]'
                    : isMedium
                    ? 'min-w-[16px] min-h-[16px] border text-[9px] font-mono font-bold'
                    : 'min-w-[26px] min-h-[26px] border-2 text-xs font-mono font-bold'
                } ${dimmed ? 'opacity-25' : 'opacity-100'} ${
                  isHighlighted && !isDense
                    ? 'ring-2 ring-[#f5b935] z-10'
                    : ''
                }`}
              >
                {!isDense && (
                  <span aria-hidden="true">{effectiveStyle.symbol}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Accessible Legend with non-color symbol/pattern + count */}
      <div
        aria-label="Legenda Kelompok Petak"
        className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#2b2352]"
      >
        {groups.map((g) => {
          const st = groupStyleMap.get(g.id) || GROUP_PALETTE[0];
          const isHighlighted = activeGroupIds.has(g.id);
          const dimmed = hasAnyActive && !isHighlighted;
          const parentGroup = g.subsetOf
            ? groups.find((p) => p.id === g.subsetOf)
            : null;

          return (
            <div
              key={g.id}
              data-testid={`dotgrid-legend-${g.id}`}
              data-highlighted={isHighlighted ? 'true' : 'false'}
              className={`flex items-center justify-between gap-2 px-2.5 py-1.5 border ${
                isHighlighted
                  ? 'bg-[#1f193d] border-[#f5b935] text-[#f4f1ea]'
                  : 'bg-[#120d26] border-[#3a306e] text-[#f4f1ea]'
              } ${dimmed ? 'opacity-45' : 'opacity-100'}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  aria-hidden="true"
                  style={{
                    backgroundColor: st.bg,
                    color: st.text,
                    borderColor: st.border,
                  }}
                  className="w-5 h-5 border flex items-center justify-center font-mono text-xs font-bold shrink-0"
                >
                  {st.symbol}
                </span>
                <div className="truncate font-vt text-base sm:text-lg">
                  <span>{g.label}</span>
                  {parentGroup && (
                    <span className="text-xs text-[#b3aad1] ml-1">
                      (bagian dari {parentGroup.label})
                    </span>
                  )}
                </div>
              </div>
              <span className="font-pixel text-[9px] text-[#f5b935] shrink-0 tabular-nums">
                {g.count.toLocaleString('id-ID')}
                {isHighlighted ? ' ★' : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BarsRenderer: React.FC<{
  visual: BarsVisual;
  activeHighlights: string[];
  reduceMotion: boolean;
}> = ({ visual, activeHighlights, reduceMotion }) => {
  const items = Array.isArray(visual.items) ? visual.items : [];
  const validIds = useMemo(() => new Set(items.map((it) => it.id)), [items]);
  const activeSet = useMemo(
    () => new Set(activeHighlights.filter((h) => validIds.has(h))),
    [activeHighlights, validIds]
  );
  const hasAnyActive = activeSet.size > 0;

  const maxVal = useMemo(() => {
    if (items.length === 0) return 1;
    const largest = Math.max(...items.map((it) => Math.abs(Number(it.value) || 0)));
    return largest > 0 ? largest : 1;
  }, [items]);

  return (
    <div
      data-testid="lesson-visual-bars"
      className="bg-[#0d0a1a] border-2 border-[#5c4e99] p-3 sm:p-4 space-y-2.5"
    >
      <div className="font-pixel text-[9px] text-[#38d864] border-b border-[#2b2352] pb-1.5">
        DIAGRAM BATANG PIKSEL
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => {
          const isHighlighted = activeSet.has(item.id);
          const dimmed = hasAnyActive && !isHighlighted;
          const numVal = Number(item.value) || 0;
          const absVal = Math.abs(numVal);
          const isZero = absVal === 0;
          const pct = isZero
            ? 0
            : Math.min(100, Math.max(2, (absVal / maxVal) * 100));
          const barColor = isHighlighted
            ? '#f5b935'
            : idx % 2 === 0
            ? '#38d864'
            : '#3ac5eb';

          return (
            <div
              key={item.id}
              data-testid={`bars-item-${item.id}`}
              data-highlighted={isHighlighted ? 'true' : 'false'}
              style={{
                transition: reduceMotion ? 'none' : 'opacity 120ms steps(2, end)',
              }}
              className={`p-2 border ${
                isHighlighted
                  ? 'bg-[#1f193d] border-[#f5b935]'
                  : 'bg-[#120d26] border-[#3a306e]'
              } ${dimmed ? 'opacity-40' : 'opacity-100'}`}
            >
              <div className="flex items-center justify-between gap-2 font-vt text-lg mb-1">
                <span className="text-[#f4f1ea] flex items-center gap-1.5">
                  <span className="font-mono text-xs text-[#f5b935]">
                    {isHighlighted ? '★' : '▪'}
                  </span>
                  <span>{item.label}</span>
                </span>
                <strong
                  data-testid={`bars-value-${item.id}`}
                  className="font-mono text-sm text-[#f5b935] tabular-nums"
                >
                  {formatBarValue(numVal)}
                </strong>
              </div>
              <div
                data-testid={`bars-track-${item.id}`}
                data-empty={isZero ? 'true' : 'false'}
                className="w-full h-3.5 bg-[#070510] border border-[#5c4e99] p-0.5"
              >
                <div
                  data-testid={`bars-fill-${item.id}`}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: barColor,
                    transition: reduceMotion ? 'none' : 'width 150ms steps(4, end)',
                  }}
                  className="h-full"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LinePlotRenderer: React.FC<{
  visual: LinePlotVisual;
  activeHighlights: string[];
  reduceMotion: boolean;
}> = ({ visual, activeHighlights }) => {
  const points = Array.isArray(visual.points) ? visual.points : [];
  const lineDef = visual.line;

  const highlightLine = Boolean(lineDef) && activeHighlights.includes('line');
  const highlightedXValues = useMemo(() => {
    const set = new Set<number>();
    for (const token of activeHighlights) {
      const m = /^x(-?\d+(?:\.\d+)?)$/.exec(token);
      if (m) {
        const val = Number(m[1]);
        if (points.some((p) => Number(p[0]) === val)) {
          set.add(val);
        }
      }
    }
    return set;
  }, [activeHighlights, points]);

  const hasAnyActive = highlightLine || highlightedXValues.size > 0;

  const bounds = useMemo(() => {
    if (points.length === 0) {
      return { minX: 0, maxX: 5, minY: 0, maxY: 10 };
    }
    const xs = points.map((p) => Number(p[0]) || 0);
    const ys = points.map((p) => Number(p[1]) || 0);
    if (lineDef) {
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      ys.push(lineDef.m * minX + lineDef.c, lineDef.m * maxX + lineDef.c);
    }
    const minX = Math.min(0, ...xs);
    const maxX = Math.max(1, ...xs);
    const minY = Math.min(0, ...ys);
    const maxY = Math.max(1, ...ys);
    return { minX, maxX, minY, maxY };
  }, [points, lineDef]);

  const width = 320;
  const height = 200;
  const padLeft = 38;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const toSvgX = (x: number) =>
    padLeft + ((x - bounds.minX) / Math.max(1e-6, bounds.maxX - bounds.minX)) * plotW;
  const toSvgY = (y: number) =>
    padTop +
    plotH -
    ((y - bounds.minY) / Math.max(1e-6, bounds.maxY - bounds.minY)) * plotH;

  const polylineStr = points
    .map(([x, y]) => `${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`)
    .join(' ');

  return (
    <div
      data-testid="lesson-visual-linePlot"
      className="bg-[#0d0a1a] border-2 border-[#5c4e99] p-3 sm:p-4 space-y-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2b2352] pb-1.5">
        <span className="font-pixel text-[9px] text-[#3ac5eb]">
          BIDANG KOORDINAT PIKSEL (X-Y)
        </span>
        {lineDef && (
          <span
            data-testid="lineplot-line-badge"
            data-highlighted={highlightLine ? 'true' : 'false'}
            className={`font-mono text-xs px-2 py-0.5 border ${
              highlightLine
                ? 'bg-[#1f193d] border-[#f5b935] text-[#f5b935] font-bold'
                : 'bg-[#120d26] border-[#3a306e] text-[#38d864]'
            }`}
          >
            Garis: y = {lineDef.m}·x + {lineDef.c}
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[380px] mx-auto block bg-[#070510] border border-[#2b2352]"
        role="img"
        aria-label="Grafik koordinat titik dan garis"
      >
        {/* Axes */}
        <line
          x1={padLeft}
          y1={padTop}
          x2={padLeft}
          y2={padTop + plotH}
          stroke="#5c4e99"
          strokeWidth="2"
        />
        <line
          x1={padLeft}
          y1={padTop + plotH}
          x2={padLeft + plotW}
          y2={padTop + plotH}
          stroke="#5c4e99"
          strokeWidth="2"
        />

        {/* Optional y = m*x + c line */}
        {lineDef && (
          <line
            data-testid="lineplot-formula-line"
            data-highlighted={highlightLine ? 'true' : 'false'}
            x1={toSvgX(bounds.minX)}
            y1={toSvgY(lineDef.m * bounds.minX + lineDef.c)}
            x2={toSvgX(bounds.maxX)}
            y2={toSvgY(lineDef.m * bounds.maxX + lineDef.c)}
            stroke={highlightLine ? '#f5b935' : '#38d864'}
            strokeWidth={highlightLine ? '3.5' : '2'}
            strokeDasharray={highlightLine ? undefined : '4 2'}
            opacity={hasAnyActive && !highlightLine ? 0.45 : 1}
          />
        )}

        {/* Connected segments */}
        {points.length > 1 && (
          <polyline
            data-testid="lineplot-segments"
            fill="none"
            stroke={highlightLine ? '#f5b935' : '#3ac5eb'}
            strokeWidth={highlightLine ? '3' : '2'}
            points={polylineStr}
            opacity={hasAnyActive && !highlightLine ? 0.5 : 0.9}
          />
        )}

        {/* Points */}
        {points.map(([x, y], idx) => {
          const cx = toSvgX(x);
          const cy = toSvgY(y);
          const isPtActive = highlightedXValues.has(x);
          const dimmed = hasAnyActive && !isPtActive && !highlightLine;

          return (
            <g
              key={idx}
              data-testid={`lineplot-point-x${x}`}
              data-highlighted={isPtActive ? 'true' : 'false'}
              opacity={dimmed ? 0.35 : 1}
            >
              <rect
                x={cx - (isPtActive ? 6 : 4)}
                y={cy - (isPtActive ? 6 : 4)}
                width={isPtActive ? 12 : 8}
                height={isPtActive ? 12 : 8}
                fill={isPtActive ? '#f5b935' : '#38d864'}
                stroke="#f4f1ea"
                strokeWidth={isPtActive ? '2' : '1'}
              />
              <text
                x={cx}
                y={padTop + plotH + 16}
                textAnchor="middle"
                fill="#b3aad1"
                fontSize="10"
                fontFamily="monospace"
              >
                {x}
              </text>
              {(isPtActive || idx === 0 || idx === points.length - 1) && (
                <text
                  x={cx}
                  y={Math.max(12, cy - 9)}
                  textAnchor="middle"
                  fill={isPtActive ? '#f5b935' : '#f4f1ea'}
                  fontSize="10"
                  fontWeight={isPtActive ? 'bold' : 'normal'}
                  fontFamily="monospace"
                >
                  ({formatBarValue(x)},{formatBarValue(y)})
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const MatrixGridRenderer: React.FC<{
  visual: MatrixGridVisual;
  activeHighlights: string[];
  reduceMotion: boolean;
}> = ({ visual, activeHighlights }) => {
  const matrices = Array.isArray(visual.matrices) ? visual.matrices : [];

  // Parse highlight tokens like "A:r1", "B:c2", "C:r2c1"
  const parsedTokens = useMemo(() => {
    const list: { matId: string; row?: number; col?: number }[] = [];
    for (const tok of activeHighlights) {
      const m = /^([^:]+):(?:r(\d+))?(?:c(\d+))?$/.exec(tok);
      if (m && (m[2] || m[3])) {
        list.push({
          matId: m[1],
          row: m[2] ? Number(m[2]) : undefined,
          col: m[3] ? Number(m[3]) : undefined,
        });
      }
    }
    return list;
  }, [activeHighlights]);

  const hasAnyActive = parsedTokens.length > 0;

  const isCellHighlighted = (matId: string, r1: number, c1: number): boolean => {
    return parsedTokens.some((t) => {
      if (t.matId !== matId) return false;
      if (t.row !== undefined && t.col !== undefined) {
        return t.row === r1 && t.col === c1;
      }
      if (t.row !== undefined) return t.row === r1;
      if (t.col !== undefined) return t.col === c1;
      return false;
    });
  };

  return (
    <div
      data-testid="lesson-visual-matrixGrid"
      className="bg-[#0d0a1a] border-2 border-[#5c4e99] p-3 sm:p-4 space-y-2.5"
    >
      <div className="font-pixel text-[9px] text-[#f5b935] border-b border-[#2b2352] pb-1.5">
        MATRIKS &amp; VEKTOR PIKSEL
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 py-1">
        {matrices.map((mat) => {
          const rows = Array.isArray(mat.rows) ? mat.rows : [];
          const colsCount = rows[0]?.length || 1;
          const rowLabels = Array.isArray(mat.rowLabels) ? mat.rowLabels : [];
          const colLabels = Array.isArray(mat.colLabels) ? mat.colLabels : [];
          const hasRowLabels = rowLabels.length > 0;
          const hasColLabels = colLabels.length > 0;

          const matHasHighlight = rows.some((r, rIdx) =>
            r.some((_, cIdx) => isCellHighlighted(mat.id, rIdx + 1, cIdx + 1))
          );

          const isRowHighlighted = (r1: number) =>
            rows[r1 - 1]?.some((_, cIdx) => isCellHighlighted(mat.id, r1, cIdx + 1)) ?? false;

          const isColHighlighted = (c1: number) =>
            rows.some((_, rIdx) => isCellHighlighted(mat.id, rIdx + 1, c1));

          return (
            <div
              key={mat.id}
              data-testid={`matrix-${mat.id}`}
              className={`bg-[#120d26] border-2 p-2.5 overflow-x-auto ${
                matHasHighlight ? 'border-[#f5b935]' : 'border-[#3a306e]'
              } ${hasAnyActive && !matHasHighlight ? 'opacity-50' : 'opacity-100'}`}
            >
              <div className="font-pixel text-[10px] text-[#3ac5eb] text-center mb-2">
                Matriks {mat.id} ({rows.length}×{colsCount})
              </div>

              {!hasRowLabels && !hasColLabels ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${colsCount}, minmax(36px, auto))`,
                    gap: '6px',
                  }}
                  className="border-l-2 border-r-2 border-[#f4f1ea] px-2 py-1"
                >
                  {rows.map((row, rIdx) =>
                    row.map((val, cIdx) => {
                      const r1 = rIdx + 1;
                      const c1 = cIdx + 1;
                      const active = isCellHighlighted(mat.id, r1, c1);
                      return (
                        <div
                          key={`${r1}-${c1}`}
                          data-testid={`matrix-cell-${mat.id}-r${r1}c${c1}`}
                          data-highlighted={active ? 'true' : 'false'}
                          className={`px-2.5 py-1.5 text-center font-mono text-sm font-bold border ${
                            active
                              ? 'bg-[#f5b935] text-[#0d0a1a] border-[#f4f1ea] ring-2 ring-[#38d864]'
                              : 'bg-[#070510] text-[#f4f1ea] border-[#5c4e99]'
                          }`}
                        >
                          {val}
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `${hasRowLabels ? 'minmax(64px, auto) ' : ''}repeat(${colsCount}, minmax(44px, auto))`,
                    gap: '6px',
                    alignItems: 'center',
                  }}
                  className="px-1 py-1"
                >
                  {/* Column headers row */}
                  {hasColLabels && (
                    <>
                      {hasRowLabels && <div aria-hidden="true" />}
                      {Array.from({ length: colsCount }).map((_, cIdx) => {
                        const c1 = cIdx + 1;
                        const colLabel = colLabels[cIdx] ?? '';
                        const colActive = isColHighlighted(c1);
                        return (
                          <div
                            key={`col-label-${c1}`}
                            data-testid={`matrix-col-label-${mat.id}-c${c1}`}
                            data-highlighted={colActive ? 'true' : 'false'}
                            className={`px-2 py-1 text-center font-mono text-xs border ${
                              colActive
                                ? 'bg-[#1f193d] text-[#f5b935] border-[#f5b935] font-bold'
                                : 'bg-[#0d0a1a] text-[#3ac5eb] border-[#3a306e]'
                            }`}
                          >
                            {colLabel}
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* Matrix rows with optional left row label */}
                  {rows.map((row, rIdx) => {
                    const r1 = rIdx + 1;
                    const rowLabel = rowLabels[rIdx] ?? '';
                    const rowActive = isRowHighlighted(r1);
                    return (
                      <React.Fragment key={`row-${r1}`}>
                        {hasRowLabels && (
                          <div
                            data-testid={`matrix-row-label-${mat.id}-r${r1}`}
                            data-highlighted={rowActive ? 'true' : 'false'}
                            className={`px-2.5 py-1.5 text-right font-mono text-xs border ${
                              rowActive
                                ? 'bg-[#1f193d] text-[#f5b935] border-[#f5b935] font-bold'
                                : 'bg-[#0d0a1a] text-[#b3aad1] border-[#3a306e]'
                            }`}
                          >
                            {rowLabel}
                          </div>
                        )}
                        {row.map((val, cIdx) => {
                          const c1 = cIdx + 1;
                          const active = isCellHighlighted(mat.id, r1, c1);
                          const isFirstCol = cIdx === 0;
                          const isLastCol = cIdx === colsCount - 1;
                          return (
                            <div
                              key={`${r1}-${c1}`}
                              data-testid={`matrix-cell-${mat.id}-r${r1}c${c1}`}
                              data-highlighted={active ? 'true' : 'false'}
                              className={`px-2.5 py-1.5 text-center font-mono text-sm font-bold border ${
                                isFirstCol ? 'border-l-2 border-l-[#f4f1ea]' : ''
                              } ${isLastCol ? 'border-r-2 border-r-[#f4f1ea]' : ''} ${
                                active
                                  ? 'bg-[#f5b935] text-[#0d0a1a] border-[#f4f1ea] ring-2 ring-[#38d864]'
                                  : 'bg-[#070510] text-[#f4f1ea] border-[#5c4e99]'
                              }`}
                            >
                              {val}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CodeBlockRenderer: React.FC<{
  visual: CodeBlockVisual;
  activeHighlights: string[];
  reduceMotion: boolean;
}> = ({ visual, activeHighlights }) => {
  const lines = Array.isArray(visual.lines) ? visual.lines : [];

  const activeLineNumbers = useMemo(() => {
    const set = new Set<number>();
    for (const tok of activeHighlights) {
      const m = /^l(\d+)$/.exec(tok);
      if (m) {
        const lineNum = Number(m[1]);
        if (lineNum >= 1 && lineNum <= lines.length) {
          set.add(lineNum);
        }
      }
    }
    return set;
  }, [activeHighlights, lines.length]);

  const hasAnyActive = activeLineNumbers.size > 0;

  return (
    <div
      data-testid="lesson-visual-codeBlock"
      className="bg-[#070510] border-2 border-[#5c4e99] p-3 sm:p-4 space-y-2"
    >
      <div className="font-pixel text-[9px] text-[#38d864] border-b border-[#2b2352] pb-1.5">
        KODE PYTHON (TEKS MURNI · BARIS BERNOMOR)
      </div>
      <div className="overflow-x-auto">
        <pre className="font-mono text-xs sm:text-sm space-y-1">
          {lines.map((lineText, idx) => {
            const lineNum = idx + 1;
            const isHighlighted = activeLineNumbers.has(lineNum);
            const dimmed = hasAnyActive && !isHighlighted;

            return (
              <div
                key={lineNum}
                data-testid={`codeblock-line-l${lineNum}`}
                data-highlighted={isHighlighted ? 'true' : 'false'}
                className={`flex items-start gap-2.5 px-2 py-1 border-l-4 ${
                  isHighlighted
                    ? 'bg-[#1f193d] border-[#f5b935] text-[#f4f1ea] font-bold'
                    : 'bg-transparent border-transparent text-[#d9d2f0]'
                } ${dimmed ? 'opacity-40' : 'opacity-100'}`}
              >
                <span className="w-6 text-right text-[#f5b935] select-none shrink-0 tabular-nums">
                  {isHighlighted ? `▶${lineNum}` : lineNum}
                </span>
                <code
                  data-empty-line={lineText === '' ? 'true' : 'false'}
                  className="whitespace-pre min-h-[1.25rem] block"
                >
                  {lineText.length > 0 ? lineText : '\u00A0'}
                </code>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
};

export const LessonVisualRenderer: React.FC<LessonVisualRendererProps> = ({
  visual,
  activeHighlights,
  reduceMotion,
}) => {
  if (!visual || typeof visual !== 'object') return null;

  switch (visual.type) {
    case 'dotGrid':
      return (
        <DotGridRenderer
          visual={visual as DotGridVisual}
          activeHighlights={activeHighlights}
          reduceMotion={reduceMotion}
        />
      );
    case 'bars':
      return (
        <BarsRenderer
          visual={visual as BarsVisual}
          activeHighlights={activeHighlights}
          reduceMotion={reduceMotion}
        />
      );
    case 'linePlot':
      return (
        <LinePlotRenderer
          visual={visual as LinePlotVisual}
          activeHighlights={activeHighlights}
          reduceMotion={reduceMotion}
        />
      );
    case 'matrixGrid':
      return (
        <MatrixGridRenderer
          visual={visual as MatrixGridVisual}
          activeHighlights={activeHighlights}
          reduceMotion={reduceMotion}
        />
      );
    case 'codeBlock':
      return (
        <CodeBlockRenderer
          visual={visual as CodeBlockVisual}
          activeHighlights={activeHighlights}
          reduceMotion={reduceMotion}
        />
      );
    default:
      // Unknown visual types must be ignored safely
      return null;
  }
};
