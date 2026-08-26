'use client';

import { useEffect, useRef } from 'react';
import { placeholderHudCanvas, placeholderSpriteCanvas, placeholderWallCanvas } from '@/lib/placeholders';

interface Props {
  wallDataUrl?: string;
  spriteDataUrl?: string;
  hudDataUrl?: string;
  wallSize: number;
  spriteSize: number;
  hudSize: number;
}

const BUF_W = 200;
const BUF_H = 120;
const FOV_SCALE = 0.72; // ~66 grados
const PROJ_K = 70; // constante de proyección (altura de pared a distancia 1)
const MAX_DIST = 14;

export default function FramebufferPreview({
  wallDataUrl,
  spriteDataUrl,
  hudDataUrl,
  wallSize,
  spriteSize,
  hudSize,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wallImgRef = useRef<HTMLCanvasElement | null>(null);
  const spriteImgRef = useRef<HTMLCanvasElement | HTMLImageElement | null>(null);
  const hudImgRef = useRef<HTMLCanvasElement | HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);
  const colRef = useRef(0);

  // cargar textura de pared (placeholder si no hay una todavía)
  useEffect(() => {
    if (!wallDataUrl) {
      wallImgRef.current = placeholderWallCanvas(wallSize || 64);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = wallSize;
      c.height = wallSize;
      c.getContext('2d')!.drawImage(img, 0, 0, wallSize, wallSize);
      wallImgRef.current = c;
    };
    img.src = wallDataUrl;
  }, [wallDataUrl, wallSize]);

  useEffect(() => {
    if (!spriteDataUrl) {
      spriteImgRef.current = placeholderSpriteCanvas(spriteSize || 64);
      return;
    }
    const img = new Image();
    img.onload = () => {
      spriteImgRef.current = img;
    };
    img.src = spriteDataUrl;
  }, [spriteDataUrl, spriteSize]);

  useEffect(() => {
    if (!hudDataUrl) {
      hudImgRef.current = placeholderHudCanvas(hudSize || 128);
      return;
    }
    const img = new Image();
    img.onload = () => {
      hudImgRef.current = img;
    };
    img.src = hudDataUrl;
  }, [hudDataUrl, hudSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let playerZ = 0;
    let lastT = performance.now();

    function render(now: number) {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      if (!reduceMotion) playerZ += dt * 1.4;

      // techo / suelo
      const ceilGrad = ctx.createLinearGradient(0, 0, 0, BUF_H / 2);
      ceilGrad.addColorStop(0, '#0a0b0d');
      ceilGrad.addColorStop(1, '#1b1f24');
      ctx.fillStyle = ceilGrad;
      ctx.fillRect(0, 0, BUF_W, BUF_H / 2);

      const floorGrad = ctx.createLinearGradient(0, BUF_H / 2, 0, BUF_H);
      floorGrad.addColorStop(0, '#242017');
      floorGrad.addColorStop(1, '#0c0a07');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, BUF_H / 2, BUF_W, BUF_H / 2);

      const wall = wallImgRef.current;
      const wSize = wall?.width ?? 64;
      const tileWorld = 1.6;
      const distances: number[] = new Array(BUF_W).fill(Infinity);

      if (wall) {
        for (let i = 0; i < BUF_W; i++) {
          const camX = (2 * (i / BUF_W) - 1) * FOV_SCALE;
          const dx = camX;
          const dz = 1;
          let t = Infinity;
          let side = 0;
          if (dx > 0.0001) {
            t = 1 / dx;
            side = 1;
          } else if (dx < -0.0001) {
            t = -1 / dx;
            side = -1;
          }
          if (t > MAX_DIST) continue;
          distances[i] = t;

          const wallHeight = (BUF_H / t) * (PROJ_K / BUF_H) * BUF_H * 0.01 * (PROJ_K / 10);
          const h = Math.min(BUF_H * 3, (PROJ_K * 4) / t);
          const drawStart = BUF_H / 2 - h / 2;

          const hitZ = playerZ + t * dz;
          const frac = ((hitZ / tileWorld) % 1 + 1) % 1;
          const texX = Math.min(wSize - 1, Math.floor(frac * wSize));

          ctx.drawImage(wall, texX, 0, 1, wSize, i, drawStart, 1, h);

          const fog = Math.max(0, Math.min(0.82, t / MAX_DIST));
          const sideShade = side === -1 ? 0.12 : 0;
          ctx.fillStyle = `rgba(6,7,8,${Math.min(0.88, fog + sideShade)})`;
          ctx.fillRect(i, drawStart, 1, h);
          void wallHeight;
        }
      }

      // billboard de la criatura al centro, a distancia fija
      const sprite = spriteImgRef.current;
      if (sprite) {
        const D = 3.1;
        const h = (PROJ_K * 4) / D;
        const w = h; // sprites cuadrados
        const bottomY = BUF_H / 2 + ((PROJ_K * 4) / D) * 0.5;
        const topY = bottomY - h;
        const x = BUF_W / 2 - w / 2;
        ctx.drawImage(sprite as CanvasImageSource, x, topY, w, h);
        const fog = Math.max(0, Math.min(0.55, D / MAX_DIST));
        ctx.fillStyle = `rgba(6,7,8,${fog})`;
        ctx.fillRect(x, topY, w, h);
      }

      // HUD fijo abajo al centro
      const hud = hudImgRef.current;
      if (hud) {
        const hw = BUF_W * 0.34;
        const hh = hw;
        const bob = reduceMotion ? 0 : Math.sin(now / 260) * 1.1;
        ctx.drawImage(hud as CanvasImageSource, BUF_W / 2 - hw / 2, BUF_H - hh * 0.62 + bob, hw, hh);
      }

      colRef.current = Math.floor((now / 30) % BUF_W);
      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [wallDataUrl, spriteDataUrl, hudDataUrl]);

  return (
    <div className="relative overflow-hidden rounded-md border border-line bg-black scanlines">
      <canvas
        ref={canvasRef}
        width={BUF_W}
        height={BUF_H}
        className="w-full h-auto pixel-render block"
      />
      <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[9px] font-mono tracking-widest text-amber/90">
        <span className="w-1.5 h-1.5 rounded-full bg-blood blink-dot" />
        FRAMEBUFFER · {BUF_W}×{BUF_H}
      </div>
    </div>
  );
}
