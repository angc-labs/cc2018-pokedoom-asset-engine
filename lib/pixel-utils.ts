export function createCanvas(size: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return c;
}

export function canvasFromDataUrl(dataUrl: string, size: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = createCanvas(size);
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      resolve(c);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/** Rellena por inundación (flood fill) en coordenadas de grilla, respeta alpha. */
export function floodFill(
  ctx: CanvasRenderingContext2D,
  size: number,
  x: number,
  y: number,
  fillColor: [number, number, number, number]
) {
  const img = ctx.getImageData(0, 0, size, size);
  const data = img.data;
  const idx = (x: number, y: number) => (y * size + x) * 4;
  const start = idx(x, y);
  const target: [number, number, number, number] = [
    data[start],
    data[start + 1],
    data[start + 2],
    data[start + 3],
  ];
  const same = (i: number) =>
    data[i] === target[0] &&
    data[i + 1] === target[1] &&
    data[i + 2] === target[2] &&
    data[i + 3] === target[3];
  const sameAsFill =
    target[0] === fillColor[0] &&
    target[1] === fillColor[1] &&
    target[2] === fillColor[2] &&
    target[3] === fillColor[3];
  if (sameAsFill) return;

  const stack: [number, number][] = [[x, y]];
  const visited = new Uint8Array(size * size);
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    if (cx < 0 || cy < 0 || cx >= size || cy >= size) continue;
    const vIdx = cy * size + cx;
    if (visited[vIdx]) continue;
    const i = idx(cx, cy);
    if (!same(i)) continue;
    visited[vIdx] = 1;
    data[i] = fillColor[0];
    data[i + 1] = fillColor[1];
    data[i + 2] = fillColor[2];
    data[i + 3] = fillColor[3];
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  ctx.putImageData(img, 0, 0);
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('No se pudo generar el PNG'));
    }, 'image/png');
  });
}

/**
 * Exporta bytes RGBA planos (sin cabecera, sin compresión): exactamente
 * width*height*4 bytes, fila por fila, tal como los lee asset_loader.zig
 * cuando encuentra un archivo `.rgba` junto al `.png`.
 */
export function canvasToRawRgba(canvas: HTMLCanvasElement): ArrayBuffer {
  const ctx = canvas.getContext('2d')!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return img.data.buffer.slice(0) as ArrayBuffer;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadText(text: string, filename: string) {
  downloadBlob(new Blob([text], { type: 'text/plain' }), filename);
}

/** Aplana un color hex (#rrggbb) + alpha (0-255) a tupla RGBA. */
export function hexToRgba(hex: string, alpha: number): [number, number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b, alpha];
}

export function rgbaToHex(r: number, g: number, b: number): string {
  const h = (n: number) => n.toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}
