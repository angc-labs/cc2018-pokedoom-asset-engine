import { MapAsset } from './types';

export function emptyGrid(cols: number, rows: number): string[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ' '));
}

/** Dibuja un borde de '+' en las esquinas y '-'/'|' en los lados. */
export function withBorder(cells: string[][]): string[][] {
  const rows = cells.length;
  const cols = cells[0]?.length ?? 0;
  const next = cells.map((r) => [...r]);
  for (let x = 0; x < cols; x++) {
    if (next[0][x] === ' ') next[0][x] = '-';
    if (next[rows - 1][x] === ' ') next[rows - 1][x] = '-';
  }
  for (let y = 0; y < rows; y++) {
    if (next[y][0] === ' ') next[y][0] = '|';
    if (next[y][cols - 1] === ' ') next[y][cols - 1] = '|';
  }
  next[0][0] = '+';
  next[0][cols - 1] = '+';
  next[rows - 1][0] = '+';
  next[rows - 1][cols - 1] = '+';
  return next;
}

export function mapToText(map: MapAsset): string {
  return map.cells.map((row) => row.join('')).join('\n');
}

export function textToMap(text: string, name: string): MapAsset {
  const lines = text.replace(/\r/g, '').split('\n');
  const cols = Math.max(1, ...lines.map((l) => l.length));
  const rows = lines.length;
  const cells = lines.map((l) => {
    const row = l.padEnd(cols, ' ').split('');
    return row;
  });
  return {
    id: '',
    kind: 'map',
    name,
    cols,
    rows,
    cells,
    updatedAt: Date.now(),
  };
}

export function resizeGrid(cells: string[][], cols: number, rows: number): string[][] {
  const next = emptyGrid(cols, rows);
  for (let y = 0; y < Math.min(rows, cells.length); y++) {
    for (let x = 0; x < Math.min(cols, cells[y].length); x++) {
      next[y][x] = cells[y][x];
    }
  }
  return next;
}

export const MAP_SYMBOLS = [' ', '#', '*', '@', '+', '-', '|'] as const;
