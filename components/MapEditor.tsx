'use client';

import { useRef, useState } from 'react';
import { MapAsset, MAP_LEGEND } from '@/lib/types';
import { emptyGrid, resizeGrid, withBorder, MAP_SYMBOLS } from '@/lib/map-utils';

interface Props {
  map: MapAsset;
  onChange: (map: MapAsset) => void;
}

const CELL_PX = 22;

export default function MapEditor({ map, onChange }: Props) {
  const [symbol, setSymbol] = useState<(typeof MAP_SYMBOLS)[number]>('|');
  const paintingRef = useRef(false);

  function paint(x: number, y: number) {
    if (y < 0 || y >= map.rows || x < 0 || x >= map.cols) return;
    if (map.cells[y][x] === symbol) return;
    const cells = map.cells.map((r) => [...r]);
    cells[y][x] = symbol;
    onChange({ ...map, cells, updatedAt: Date.now() });
  }

  function handleResize(cols: number, rows: number) {
    onChange({ ...map, cols, rows, cells: resizeGrid(map.cells, cols, rows), updatedAt: Date.now() });
  }

  function handleBorder() {
    onChange({ ...map, cells: withBorder(map.cells), updatedAt: Date.now() });
  }

  function handleClear() {
    onChange({ ...map, cells: emptyGrid(map.cols, map.rows), updatedAt: Date.now() });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {MAP_LEGEND.map((l) => (
          <button
            key={l.symbol}
            onClick={() => setSymbol(l.symbol as (typeof MAP_SYMBOLS)[number])}
            className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-mono ${
              symbol === l.symbol ? 'border-amber bg-amber/10 text-amber' : 'border-line text-inkdim hover:text-ink'
            }`}
            title={l.label}
          >
            <span
              className="w-3 h-3 rounded-sm border border-line/60 flex items-center justify-center text-[9px]"
              style={{ background: l.color === 'transparent' ? 'transparent' : l.color + '33', color: l.color === 'transparent' ? '#7c868d' : l.color }}
            >
              {l.symbol === ' ' ? '·' : l.symbol}
            </span>
            {l.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-inkdim">
        <label className="flex items-center gap-1.5">
          cols
          <input
            type="number"
            min={4}
            max={64}
            value={map.cols}
            onChange={(e) => handleResize(Number(e.target.value) || map.cols, map.rows)}
            className="w-14 bg-panel2 border border-line rounded px-1 py-0.5 text-ink"
          />
        </label>
        <label className="flex items-center gap-1.5">
          filas
          <input
            type="number"
            min={4}
            max={64}
            value={map.rows}
            onChange={(e) => handleResize(map.cols, Number(e.target.value) || map.rows)}
            className="w-14 bg-panel2 border border-line rounded px-1 py-0.5 text-ink"
          />
        </label>
        <button onClick={handleBorder} className="px-2 py-1 rounded border border-line hover:text-ink">
          Autoborde
        </button>
        <button onClick={handleClear} className="px-2 py-1 rounded border border-line hover:text-blood hover:border-blood/60">
          Limpiar
        </button>
      </div>

      <div className="max-w-full max-h-[56dvh] overflow-auto rounded border border-line bg-void p-1">
        <div
          className="inline-grid border border-line rounded overflow-hidden select-none self-start bg-void"
          style={{ gridTemplateColumns: `repeat(${map.cols}, ${CELL_PX}px)` }}
          onPointerUp={() => (paintingRef.current = false)}
          onPointerLeave={() => (paintingRef.current = false)}
        >
          {map.cells.map((row, y) =>
            row.map((cell, x) => {
              const legend = MAP_LEGEND.find((l) => l.symbol === cell);
              return (
                <div
                  key={`${x}-${y}`}
                  onPointerDown={() => {
                    paintingRef.current = true;
                    paint(x, y);
                  }}
                  onPointerEnter={() => paintingRef.current && paint(x, y)}
                  className="flex items-center justify-center border-[0.5px] border-line/50 font-mono text-[11px] cursor-pointer"
                  style={{
                    width: CELL_PX,
                    height: CELL_PX,
                    color: legend?.color === 'transparent' ? '#3a3f46' : legend?.color,
                    background: cell === ' ' ? 'transparent' : (legend?.color ?? '#fff') + '1f',
                  }}
                >
                  {cell === ' ' ? '' : cell}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
