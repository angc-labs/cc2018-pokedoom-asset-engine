// Arte de relleno 100% procedural (formas genéricas) para que la vista previa
// del framebuffer tenga algo que mostrar antes de que el usuario dibuje sus
// propios sprites, texturas y HUD.

export function placeholderWallCanvas(size: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#3a3f46';
  ctx.fillRect(0, 0, size, size);
  const brickH = size / 4;
  const brickW = size / 2;
  ctx.strokeStyle = '#1c1f23';
  ctx.lineWidth = Math.max(1, size / 64);
  for (let row = 0; row < 4; row++) {
    const offset = row % 2 === 0 ? 0 : brickW / 2;
    ctx.beginPath();
    ctx.moveTo(0, row * brickH);
    ctx.lineTo(size, row * brickH);
    ctx.stroke();
    for (let x = -brickW; x < size + brickW; x += brickW) {
      ctx.beginPath();
      ctx.moveTo(x + offset, row * brickH);
      ctx.lineTo(x + offset, (row + 1) * brickH);
      ctx.stroke();
    }
  }
  // ruido sutil para romper la planitud
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    img.data[i] = clamp(img.data[i] + n);
    img.data[i + 1] = clamp(img.data[i + 1] + n);
    img.data[i + 2] = clamp(img.data[i + 2] + n);
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

export function placeholderSpriteCanvas(size: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const baseY = size * 0.98;
  const bodyR = size * 0.34;
  const bodyCy = baseY - bodyR;

  ctx.fillStyle = '#3fae7a';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy, bodyR, bodyR * 1.05, 0, 0, Math.PI * 2);
  ctx.fill();

  // orejas/cuernos genéricos
  ctx.fillStyle = '#2f8f63';
  ctx.beginPath();
  ctx.moveTo(cx - bodyR * 0.6, bodyCy - bodyR * 0.7);
  ctx.lineTo(cx - bodyR * 0.9, bodyCy - bodyR * 1.5);
  ctx.lineTo(cx - bodyR * 0.2, bodyCy - bodyR * 0.9);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + bodyR * 0.6, bodyCy - bodyR * 0.7);
  ctx.lineTo(cx + bodyR * 0.9, bodyCy - bodyR * 1.5);
  ctx.lineTo(cx + bodyR * 0.2, bodyCy - bodyR * 0.9);
  ctx.fill();

  // ojos
  ctx.fillStyle = '#101215';
  ctx.beginPath();
  ctx.ellipse(cx - bodyR * 0.32, bodyCy - bodyR * 0.1, bodyR * 0.11, bodyR * 0.14, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + bodyR * 0.32, bodyCy - bodyR * 0.1, bodyR * 0.11, bodyR * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  // patas
  ctx.fillStyle = '#2f8f63';
  ctx.fillRect(cx - bodyR * 0.55, baseY - bodyR * 0.25, bodyR * 0.4, bodyR * 0.3);
  ctx.fillRect(cx + bodyR * 0.15, baseY - bodyR * 0.25, bodyR * 0.4, bodyR * 0.3);

  return c;
}

export function placeholderHudCanvas(size: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size * 0.58;
  const r = size * 0.34;

  ctx.fillStyle = '#c7cdd2';
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#e7eaed';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI);
  ctx.fill();
  ctx.strokeStyle = '#101215';
  ctx.lineWidth = size * 0.02;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.stroke();
  ctx.fillStyle = '#101215';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2a71b';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

function clamp(n: number) {
  return Math.max(0, Math.min(255, n));
}
