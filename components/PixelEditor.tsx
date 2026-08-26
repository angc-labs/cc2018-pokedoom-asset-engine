'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AssetKind } from '@/lib/types';
import { floodFill, hexToRgba } from '@/lib/pixel-utils';

type Tool = 'pencil' | 'eraser' | 'bucket' | 'eyedropper';

interface Props {
  kind: AssetKind;
  size: number;
  allowedSizes: number[];
  onSizeChange: (n: number) => void;
  dataUrl: string | null;
  onChange: (dataUrl: string) => void;
  onOpenPokeApi?: () => void;
}

const PALETTE = [
  '#07080c', '#ffffff', '#e11d48', '#ea580c', '#f59e0b',
  '#fbbf24', '#a855f7', '#d946ef', '#06b6d4', '#10b981',
  '#84cc16', '#3b82f6', '#475569', '#1e293b',
];

function bresenham(x0: number, y0: number, x1: number, y1: number) {
  const pts: [number, number][] = [];
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0, y = y0;
  for (;;) {
    pts.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
  return pts;
}

export default function PixelEditor({ kind, size, allowedSizes, onSizeChange, dataUrl, onChange, onOpenPokeApi }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<[number, number] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState('#eae04a');
  const [alpha, setAlpha] = useState(255);
  const [mirrorX, setMirrorX] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(size <= 64 ? 8 : 4);

  const isWall = kind === 'wall';

  const getCtx = useCallback(() => canvasRef.current?.getContext('2d') ?? null, []);

  // (re)inicializa el canvas cuando cambia el tamaño o llega un dataUrl externo
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    if (dataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, size, size);
        if (isWall) {
          ctx.fillStyle = '#808080';
          ctx.fillRect(0, 0, size, size);
        }
        ctx.drawImage(img, 0, 0, size, size);
      };
      img.src = dataUrl;
    } else {
      ctx.clearRect(0, 0, size, size);
      if (isWall) {
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, size, size);
      }
    }
    setZoom(size <= 64 ? 8 : size <= 128 ? 5 : 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  const pushChange = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL('image/png'));
  }, [onChange]);

  function setPixel(x: number, y: number) {
    const ctx = getCtx();
    if (!ctx || x < 0 || y < 0 || x >= size || y >= size) return;
    const img = ctx.getImageData(x, y, 1, 1);
    if (tool === 'eyedropper') {
      const [r, g, b, a] = img.data;
      setColor(`#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`);
      setAlpha(isWall ? 255 : a);
      setTool('pencil');
      return;
    }
    if (tool === 'eraser') {
      if (isWall) {
        img.data.set([128, 128, 128, 255]);
      } else {
        img.data.set([0, 0, 0, 0]);
      }
    } else if (tool === 'pencil') {
      const [r, g, b, a] = hexToRgba(color, isWall ? 255 : alpha);
      img.data.set([r, g, b, a]);
    }
    ctx.putImageData(img, x, y);
    if (mirrorX) {
      const mx = size - 1 - x;
      const img2 = ctx.getImageData(mx, y, 1, 1);
      img2.data.set(img.data);
      ctx.putImageData(img2, mx, y);
    }
  }

  function cellFromEvent(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * size);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * size);
    return [x, y] as [number, number];
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const [x, y] = cellFromEvent(e);
    if (tool === 'bucket') {
      const ctx = getCtx();
      if (ctx) {
        const fill = tool === 'bucket' && !isWall
          ? hexToRgba(color, alpha)
          : hexToRgba(color, 255);
        floodFill(ctx, size, x, y, fill);
        pushChange();
      }
      return;
    }
    drawingRef.current = true;
    lastPointRef.current = [x, y];
    setPixel(x, y);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const [x, y] = cellFromEvent(e);
    const last = lastPointRef.current;
    if (last) {
      for (const [px, py] of bresenham(last[0], last[1], x, y)) setPixel(px, py);
    } else {
      setPixel(x, y);
    }
    lastPointRef.current = [x, y];
  }

  function handlePointerUp() {
    if (drawingRef.current) {
      drawingRef.current = false;
      lastPointRef.current = null;
      pushChange();
    }
  }

  function handleClear() {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    if (isWall) {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, size, size);
    }
    pushChange();
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const ctx = getCtx();
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        pushChange();
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  const displayPx = size * zoom;
  const stagePx = Math.min(displayPx, 560);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded border border-line overflow-hidden">
          {(['pencil', 'eraser', 'bucket', 'eyedropper'] as Tool[]).map((t) => (
            <button
              key={t}
              onClick={() => setTool(t)}
              className={`px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wide border-r border-line last:border-r-0 transition-colors ${
                tool === t ? 'bg-amber text-void' : 'bg-panel2 text-inkdim hover:text-ink'
              }`}
            >
              {t === 'pencil' ? 'Lápiz' : t === 'eraser' ? 'Borrar' : t === 'bucket' ? 'Balde' : 'Gotero'}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-1.5 text-[11px] font-mono text-inkdim">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent border border-line" />
        </label>

        <div className="flex flex-wrap gap-1">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-5 h-5 rounded-sm border border-line/80"
              style={{ background: c }}
              aria-label={c}
            />
          ))}
        </div>

        {!isWall && (
          <label className="flex items-center gap-1.5 text-[11px] font-mono text-inkdim">
            α
            <input type="range" min={0} max={255} value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} className="w-20 accent-amber" />
          </label>
        )}

        <label className="flex items-center gap-1.5 text-[11px] font-mono text-inkdim">
          <input type="checkbox" checked={mirrorX} onChange={(e) => setMirrorX(e.target.checked)} className="accent-amber" />
          Espejo-X
        </label>
        <label className="flex items-center gap-1.5 text-[11px] font-mono text-inkdim">
          <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="accent-amber" />
          Grilla
        </label>

        <div className="flex items-center gap-1 ml-auto">
          <span className="text-[11px] font-mono text-inkdim">zoom</span>
          <button onClick={() => setZoom((z) => Math.max(2, z - 2))} className="w-6 h-6 rounded border border-line text-inkdim hover:text-ink">−</button>
          <span className="text-[11px] font-mono w-6 text-center">{zoom}x</span>
          <button onClick={() => setZoom((z) => Math.min(20, z + 2))} className="w-6 h-6 rounded border border-line text-inkdim hover:text-ink">+</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono text-inkdim">tamaño</span>
        {allowedSizes.map((s) => (
          <button
            key={s}
            onClick={() => onSizeChange(s)}
            className={`px-2 py-1 rounded text-[11px] font-mono border ${
              size === s ? 'border-amber text-amber bg-amber/10' : 'border-line text-inkdim hover:text-ink'
            }`}
          >
            {s}×{s}
          </button>
        ))}
        <div className="w-px h-4 bg-line mx-1" />
        <button onClick={handleClear} className="px-2 py-1 rounded text-[11px] font-mono border border-line text-inkdim hover:text-blood hover:border-blood/60">
          Limpiar
        </button>
        {kind === 'sprite' && onOpenPokeApi && (
          <button
            onClick={onOpenPokeApi}
            className="px-2.5 py-1 rounded text-[11px] font-mono border border-gengar/50 bg-gengarDark/30 text-gengarGlow hover:border-gengarGlow hover:bg-gengarDark/50 font-bold flex items-center gap-1 shadow-sm"
          >
            PokéAPI ✨
          </button>
        )}
        <button onClick={() => fileInputRef.current?.click()} className="px-2 py-1 rounded text-[11px] font-mono border border-line text-inkdim hover:text-ink">
          Importar imagen…
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImport} />
      </div>

      <div
        className="relative inline-block self-start rounded border border-line checker-bg max-w-full"
        style={{ width: `min(${stagePx}px, 100%)`, aspectRatio: '1 / 1' }}
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          style={{ width: '100%', height: '100%' }}
          className="pixel-render block cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
        {showGrid && zoom >= 4 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: `calc(100% / ${size}) calc(100% / ${size})`,
            }}
          />
        )}
        {kind === 'sprite' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-volt/50" />
            <div className="absolute left-0 right-0 bottom-0 border-t-2 border-dashed border-grid/70" />
          </div>
        )}
        {kind === 'hud' && (
          <div className="absolute inset-0 pointer-events-none border-b-4 border-dashed border-amber/40" />
        )}
      </div>
      {kind === 'sprite' && (
        <p className="text-[11px] font-mono text-inkdim">
          línea verde = suelo (los pies del Pokémon van pegados aquí) · línea amarilla = centro horizontal
        </p>
      )}
      {kind === 'wall' && (
        <p className="text-[11px] font-mono text-inkdim">
          sin canal alfa — recuerda que el diseño debe repetirse sin costuras (tileable)
        </p>
      )}
    </div>
  );
}
