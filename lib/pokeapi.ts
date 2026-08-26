export interface PokemonSpriteOptions {
  id: number;
  name: string;
  types: string[];
  height: number;
  weight: number;
  sprites: {
    frontDefault: string | null;
    backDefault: string | null;
    frontShiny: string | null;
    backShiny: string | null;
    gen1RedBlue: string | null;
    gen2Crystal: string | null;
    gen3Emerald: string | null;
    gen5BlackWhite: string | null;
    showdown: string | null;
    officialArtwork: string | null;
  };
}

export type DoomFilterType = 'none' | 'hellfire' | 'gengar_void' | 'radioactive_slime' | 'doom_1993' | 'gameboy_retro';

export const DOOM_FILTERS: { id: DoomFilterType; name: string; desc: string; previewColor: string }[] = [
  { id: 'none', name: 'Original', desc: 'Colores originales de PokéAPI', previewColor: '#3b82f6' },
  { id: 'hellfire', name: 'Hellfire DOOM', desc: 'Sangre, carbón y lava ardiente', previewColor: '#ef4444' },
  { id: 'gengar_void', name: 'Gengar Specter', desc: 'Púrpura siniestro y ojos carmesí', previewColor: '#a855f7' },
  { id: 'radioactive_slime', name: 'Toxic Slime', desc: 'Residuos nucleares y ácido tóxico', previewColor: '#22c55e' },
  { id: 'doom_1993', name: 'DOOM 1993 VGA', desc: 'Paleta retro con contraste sucio industrial', previewColor: '#f59e0b' },
  { id: 'gameboy_retro', name: 'Game Boy DMG', desc: '4 tonos verdosos retro clásicos', previewColor: '#84cc16' },
];

export async function fetchPokemon(query: string | number): Promise<PokemonSpriteOptions | null> {
  const cleanQuery = String(query).trim().toLowerCase();
  if (!cleanQuery) return null;

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${cleanQuery}`);
    if (!res.ok) return null;
    const data = await res.json();

    const sprites = data.sprites || {};
    const versions = sprites.versions || {};

    return {
      id: data.id,
      name: data.name,
      types: (data.types || []).map((t: any) => t.type.name),
      height: data.height,
      weight: data.weight,
      sprites: {
        frontDefault: sprites.front_default || null,
        backDefault: sprites.back_default || null,
        frontShiny: sprites.front_shiny || null,
        backShiny: sprites.back_shiny || null,
        gen1RedBlue: versions['generation-i']?.['red-blue']?.front_transparent || versions['generation-i']?.['red-blue']?.front_default || null,
        gen2Crystal: versions['generation-ii']?.['crystal']?.front_transparent || versions['generation-ii']?.['crystal']?.front_default || null,
        gen3Emerald: versions['generation-iii']?.['emerald']?.front_default || null,
        gen5BlackWhite: versions['generation-v']?.['black-white']?.animated?.front_default || versions['generation-v']?.['black-white']?.front_default || null,
        showdown: sprites.other?.showdown?.front_default || null,
        officialArtwork: sprites.other?.['official-artwork']?.front_default || null,
      },
    };
  } catch (err) {
    console.error('Error fetching Pokemon from PokéAPI:', err);
    return null;
  }
}

export async function fetchPokemonList(limit: number = 151, offset: number = 0): Promise<{ name: string; id: number }[]> {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results.map((r: any, idx: number) => ({
      name: r.name,
      id: offset + idx + 1,
    }));
  } catch (err) {
    console.error('Error fetching Pokemon list:', err);
    return [];
  }
}

/**
 * Procesa un sprite de Pokémon:
 * 1. Lo carga y detecta el bounding box del contenido no transparente
 * 2. Lo escala en modo pixel-art (sin suavizado) a targetSize × targetSize
 * 3. Alinea los pies con la base inferior (crucial para el billboard raycast)
 * 4. Aplica el filtro Doomify seleccionado
 */
export async function processPokemonSprite(
  imageUrl: string,
  targetSize: number = 64,
  filter: DoomFilterType = 'none'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 1. Canvas temporal para leer los píxeles originales
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = img.width;
      srcCanvas.height = img.height;
      const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true })!;
      srcCtx.drawImage(img, 0, 0);

      const srcData = srcCtx.getImageData(0, 0, img.width, img.height);
      const bounds = getNonTransparentBounds(srcData);

      // 2. Canvas destino
      const destCanvas = document.createElement('canvas');
      destCanvas.width = targetSize;
      destCanvas.height = targetSize;
      const destCtx = destCanvas.getContext('2d', { willReadFrequently: true })!;
      destCtx.imageSmoothingEnabled = false;

      // Calcular escala conservando aspecto
      const contentW = bounds.maxX - bounds.minX + 1;
      const contentH = bounds.maxY - bounds.minY + 1;

      // Ajustamos para que ocupe hasta el 88% del alto disponible
      const maxAvailableH = targetSize * 0.88;
      const maxAvailableW = targetSize * 0.88;
      const scale = Math.min(maxAvailableW / contentW, maxAvailableH / contentH, targetSize / Math.max(contentW, contentH));

      const drawW = Math.max(1, Math.round(contentW * scale));
      const drawH = Math.max(1, Math.round(contentH * scale));

      // Centrado horizontal, pegado al fondo (offset de 1-2px arriba del borde)
      const drawX = Math.round((targetSize - drawW) / 2);
      const drawY = Math.max(0, targetSize - drawH - Math.max(1, Math.round(targetSize * 0.03)));

      destCtx.drawImage(
        srcCanvas,
        bounds.minX, bounds.minY, contentW, contentH,
        drawX, drawY, drawW, drawH
      );

      // 3. Aplicar filtro si no es 'none'
      if (filter !== 'none') {
        const destImgData = destCtx.getImageData(0, 0, targetSize, targetSize);
        applyDoomColorFilter(destImgData, filter);
        destCtx.putImageData(destImgData, 0, 0);
      }

      resolve(destCanvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}

function getNonTransparentBounds(imgData: ImageData) {
  const { width, height, data } = imgData;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 15) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!found) {
    return { minX: 0, minY: 0, maxX: width - 1, maxY: height - 1 };
  }
  return { minX, minY, maxX, maxY };
}

function applyDoomColorFilter(imgData: ImageData, filter: DoomFilterType) {
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 15) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

    switch (filter) {
      case 'hellfire': {
        // Mapeo: negro/carbón -> rojo sangre -> naranja lava -> amarillo fuego
        if (brightness < 0.25) {
          data[i] = 20 + brightness * 80;
          data[i + 1] = 6;
          data[i + 2] = 6;
        } else if (brightness < 0.6) {
          const t = (brightness - 0.25) / 0.35;
          data[i] = 180 + t * 50;
          data[i + 1] = 20 + t * 60;
          data[i + 2] = 10;
        } else if (brightness < 0.85) {
          const t = (brightness - 0.6) / 0.25;
          data[i] = 230 + t * 25;
          data[i + 1] = 90 + t * 110;
          data[i + 2] = 15;
        } else {
          data[i] = 255;
          data[i + 1] = 240;
          data[i + 2] = 120;
        }
        break;
      }

      case 'gengar_void': {
        // Mapeo: vacío sombra -> violeta oscuro -> púrpura neón -> magenta brillante / ojos
        if (brightness < 0.25) {
          data[i] = 24;
          data[i + 1] = 10;
          data[i + 2] = 36;
        } else if (brightness < 0.6) {
          const t = (brightness - 0.25) / 0.35;
          data[i] = 90 + t * 60;
          data[i + 1] = 30 + t * 20;
          data[i + 2] = 130 + t * 60;
        } else if (brightness < 0.85) {
          const t = (brightness - 0.6) / 0.25;
          data[i] = 170 + t * 60;
          data[i + 1] = 50 + t * 40;
          data[i + 2] = 210 + t * 45;
        } else {
          data[i] = 255;
          data[i + 1] = 200;
          data[i + 2] = 255;
        }
        break;
      }

      case 'radioactive_slime': {
        // Mapeo: lodo negro -> verde radiactivo -> amarillo ácido
        if (brightness < 0.25) {
          data[i] = 10;
          data[i + 1] = 24;
          data[i + 2] = 12;
        } else if (brightness < 0.65) {
          const t = (brightness - 0.25) / 0.4;
          data[i] = 20 + t * 40;
          data[i + 1] = 140 + t * 100;
          data[i + 2] = 20 + t * 20;
        } else {
          const t = (brightness - 0.65) / 0.35;
          data[i] = 180 + t * 60;
          data[i + 1] = 255;
          data[i + 2] = 40 + t * 80;
        }
        break;
      }

      case 'doom_1993': {
        // Cuantización de paleta VGA estilo Doom 1993
        const step = Math.floor(brightness * 6);
        const palette = [
          [20, 20, 24],
          [64, 42, 36],
          [120, 52, 40],
          [160, 80, 50],
          [190, 130, 70],
          [225, 185, 120],
          [250, 240, 200],
        ];
        const color = palette[Math.min(step, palette.length - 1)];
        data[i] = color[0];
        data[i + 1] = color[1];
        data[i + 2] = color[2];
        break;
      }

      case 'gameboy_retro': {
        // 4 tonos clásicos Game Boy DMG
        if (brightness < 0.25) {
          data[i] = 15; data[i + 1] = 56; data[i + 2] = 15;
        } else if (brightness < 0.5) {
          data[i] = 48; data[i + 1] = 98; data[i + 2] = 48;
        } else if (brightness < 0.75) {
          data[i] = 139; data[i + 1] = 172; data[i + 2] = 15;
        } else {
          data[i] = 155; data[i + 1] = 188; data[i + 2] = 15;
        }
        break;
      }

      default:
        break;
    }
  }
}
