export type AssetKind = 'sprite' | 'wall' | 'hud';

export type AssetSize = 32 | 56 | 64 | 128 | 256;

export interface RasterAsset {
  id: string;
  kind: AssetKind;
  name: string; // sin extensión, se usa como assets/<name>.rgba|.png
  size: number; // ancho == alto (siempre cuadrado)
  /** PNG dataURL, sirve como fuente de verdad de los píxeles */
  dataUrl: string;
  updatedAt: number;
}

export interface MapAsset {
  id: string;
  kind: 'map';
  name: string;
  cols: number;
  rows: number;
  cells: string[][]; // cada celda: ' ', '#','*','@','+','-','|'
  updatedAt: number;
}

export type AnyAsset = RasterAsset | MapAsset;

export const SPRITE_SIZES: AssetSize[] = [56, 64, 128];
export const WALL_SIZES: AssetSize[] = [32, 64, 128];
export const HUD_SIZES: AssetSize[] = [128, 256];

export const MAP_LEGEND: { symbol: string; label: string; color: string }[] = [
  { symbol: '+', label: 'Esquina de pared', color: '#f2a71b' },
  { symbol: '-', label: 'Pared horizontal', color: '#8a939b' },
  { symbol: '|', label: 'Pared vertical', color: '#8a939b' },
  { symbol: '*', label: 'Spawn del jugador', color: '#2ee6a6' },
  { symbol: '#', label: 'Spawn Pokémon salvaje', color: '#c1272d' },
  { symbol: '@', label: 'Portal de salida', color: '#b24bf3' },
  { symbol: ' ', label: 'Suelo / pasillo', color: 'transparent' },
];
