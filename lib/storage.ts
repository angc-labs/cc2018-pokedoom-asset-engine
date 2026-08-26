import { AnyAsset } from './types';

const KEY = 'pokedoom-engine:library:v1';

export function loadLibrary(): AnyAsset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AnyAsset[];
  } catch {
    return [];
  }
}

export function saveLibrary(assets: AnyAsset[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(assets));
  } catch {
    // el storage puede llenarse con muchos sprites grandes; fallamos en silencio
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
