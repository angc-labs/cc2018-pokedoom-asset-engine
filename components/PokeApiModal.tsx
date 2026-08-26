'use client';

import { useState, useEffect, useTransition } from 'react';
import { DOOM_FILTERS, DoomFilterType, fetchPokemon, PokemonSpriteOptions, processPokemonSprite } from '@/lib/pokeapi';
import { Search, Flame, Skull, Sparkles, X, Wand2, Check, ArrowRight, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetSize: number;
  onImportSprite: (dataUrl: string, pokemonName: string) => void;
}

const POPULAR_DOOM_POKEMON = [
  { id: 94, name: 'Gengar' },
  { id: 93, name: 'Haunter' },
  { id: 92, name: 'Gastly' },
  { id: 229, name: 'Houndoom' },
  { id: 6, name: 'Charizard' },
  { id: 150, name: 'Mewtwo' },
  { id: 491, name: 'Darkrai' },
  { id: 384, name: 'Rayquaza' },
  { id: 248, name: 'Tyranitar' },
  { id: 25, name: 'Pikachu' },
  { id: 130, name: 'Gyarados' },
  { id: 143, name: 'Snorlax' },
];

export default function PokeApiModal({ isOpen, onClose, targetSize, onImportSprite }: Props) {
  const [searchTerm, setSearchTerm] = useState('gengar');
  const [loading, setLoading] = useState(false);
  const [pokemon, setPokemon] = useState<PokemonSpriteOptions | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('frontDefault');
  const [selectedFilter, setSelectedFilter] = useState<DoomFilterType>('none');
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isProcessing, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen && !pokemon) {
      loadPokemon('gengar');
    }
  }, [isOpen]);

  async function loadPokemon(query: string | number) {
    if (!query) return;
    setLoading(true);
    try {
      const data = await fetchPokemon(query);
      if (data) {
        setPokemon(data);
        // choose best available default sprite
        const spriteKey = data.sprites.frontDefault
          ? 'frontDefault'
          : data.sprites.gen5BlackWhite
          ? 'gen5BlackWhite'
          : 'officialArtwork';
        setSelectedVariant(spriteKey);
        updatePreview(data.sprites[spriteKey as keyof typeof data.sprites] || '', selectedFilter);
      }
    } finally {
      setLoading(false);
    }
  }

  function updatePreview(sourceUrl: string, filter: DoomFilterType) {
    if (!sourceUrl) {
      setPreviewDataUrl(null);
      return;
    }
    startTransition(async () => {
      try {
        const processed = await processPokemonSprite(sourceUrl, targetSize, filter);
        setPreviewDataUrl(processed);
      } catch (err) {
        console.error('Error generating preview:', err);
      }
    });
  }

  function handleVariantChange(variantKey: string) {
    if (!pokemon) return;
    setSelectedVariant(variantKey);
    const url = pokemon.sprites[variantKey as keyof typeof pokemon.sprites];
    if (url) updatePreview(url, selectedFilter);
  }

  function handleFilterChange(filter: DoomFilterType) {
    setSelectedFilter(filter);
    if (!pokemon) return;
    const url = pokemon.sprites[selectedVariant as keyof typeof pokemon.sprites];
    if (url) updatePreview(url, filter);
  }

  function handleImport() {
    if (!previewDataUrl || !pokemon) return;
    const suffix = selectedFilter !== 'none' ? `-${selectedFilter}` : '';
    const formattedName = `${pokemon.name}${suffix}`;
    onImportSprite(previewDataUrl, formattedName);
    onClose();
  }

  if (!isOpen) return null;

  const currentSpriteUrl = pokemon ? pokemon.sprites[selectedVariant as keyof typeof pokemon.sprites] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-line bg-panel shadow-2xl overflow-hidden">
        {/* Header modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-panel2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blood to-gengar flex items-center justify-center shadow-lg">
              <Skull className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-mono text-sm uppercase tracking-wider text-ink font-bold flex items-center gap-2">
                PokéAPI Sprite Explorer & Doomifier
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-lava/20 text-fire border border-lava/30">
                  {targetSize}×{targetSize} px
                </span>
              </h2>
              <p className="text-[11px] font-mono text-inkdim">
                Busca cualquier Pokémon, aplica filtros y transfiérelo al editor de sprites
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-inkdim hover:text-ink hover:bg-panel3 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Búsqueda y Selección */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Buscador */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadPokemon(searchTerm);
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-inkdim" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nombre o ID (ej: gengar, 94, pikachu, mewtwo)..."
                  className="w-full bg-panel2 border border-line rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-ink placeholder:text-inkdim/60 focus:outline-none focus:border-fire transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-lava hover:bg-lava/90 text-white font-mono text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
              </button>
            </form>

            {/* Sugerencias Rápidas Doom */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-inkdim mb-1.5 block">
                Favoritos Siniestros & DOOM:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_DOOM_POKEMON.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSearchTerm(p.name);
                      loadPokemon(p.name);
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-all ${
                      pokemon?.name === p.name.toLowerCase()
                        ? 'border-fire bg-fire/15 text-fire font-bold'
                        : 'border-line bg-panel2 text-inkdim hover:text-ink hover:border-lineHighlight'
                    }`}
                  >
                    #{p.id} {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Info del Pokémon actual */}
            {pokemon && (
              <div className="rounded-xl border border-line bg-panel2 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-fire font-bold">#{String(pokemon.id).padStart(3, '0')}</span>
                    <h3 className="font-mono text-base font-bold text-ink uppercase tracking-wider">
                      {pokemon.name}
                    </h3>
                  </div>
                  <div className="flex gap-1.5">
                    {pokemon.types.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-panel3 border border-line text-ink"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Variantes de Sprites Disponibles */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-inkdim mb-2 block">
                    Variante del Sprite:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'frontDefault', label: 'Frontal' },
                      { key: 'frontShiny', label: 'Shiny ✨' },
                      { key: 'backDefault', label: 'Espalda' },
                      { key: 'backShiny', label: 'Espalda Shiny' },
                      { key: 'gen1RedBlue', label: 'Gen 1 (R/B)' },
                      { key: 'gen2Crystal', label: 'Gen 2 (GBC)' },
                      { key: 'gen5BlackWhite', label: 'Gen 5 (B/W)' },
                      { key: 'showdown', label: 'Showdown' },
                    ]
                      .filter((v) => !!pokemon.sprites[v.key as keyof typeof pokemon.sprites])
                      .map((v) => {
                        const url = pokemon.sprites[v.key as keyof typeof pokemon.sprites];
                        return (
                          <button
                            key={v.key}
                            onClick={() => handleVariantChange(v.key)}
                            className={`p-2 rounded-lg border flex flex-col items-center gap-1 text-center transition-all ${
                              selectedVariant === v.key
                                ? 'border-fire bg-fire/10 text-fire'
                                : 'border-line bg-panel3/50 text-inkdim hover:text-ink hover:border-lineHighlight'
                            }`}
                          >
                            <div className="w-10 h-10 checker-bg rounded flex items-center justify-center overflow-hidden">
                              {url ? (
                                <img src={url} alt={v.label} className="w-full h-full object-contain pixel-render" />
                              ) : null}
                            </div>
                            <span className="text-[10px] font-mono truncate w-full">{v.label}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Filtros Doomify */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-inkdim mb-2 flex items-center gap-1.5">
                    <Flame className="w-3 h-3 text-blood" />
                    Filtros Doomify / Paleta Temática:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DOOM_FILTERS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => handleFilterChange(f.id)}
                        className={`p-2 rounded-lg border text-left flex items-start gap-2 transition-all ${
                          selectedFilter === f.id
                            ? 'border-gengarGlow bg-gengarDark/30 text-ink'
                            : 'border-line bg-panel3/40 text-inkdim hover:text-ink'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full mt-0.5 shrink-0 shadow-sm"
                          style={{ backgroundColor: f.previewColor }}
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] font-mono font-bold leading-tight truncate">{f.name}</p>
                          <p className="text-[9px] font-mono text-inkdim/80 truncate">{f.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Vista Previa y Acción de Importar */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="rounded-xl border border-line bg-panel2 p-5 flex flex-col items-center justify-between flex-1">
              <div className="w-full text-center">
                <span className="text-[11px] font-mono uppercase tracking-widest text-inkdim">
                  Vista Previa en Resolución del Motor
                </span>
                <p className="text-[10px] font-mono text-inkdim/70 mt-0.5">
                  Reescalado pixel-art limpio y pies anclados al suelo 3D
                </p>
              </div>

              <div className="relative my-4">
                <div
                  className="w-56 h-56 rounded-xl checker-bg border-2 border-lineHighlight relative overflow-hidden shadow-2xl flex items-center justify-center"
                >
                  {isProcessing ? (
                    <div className="flex flex-col items-center gap-2 text-fire">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-[10px] font-mono">Renderizando pixel art…</span>
                    </div>
                  ) : previewDataUrl ? (
                    <img
                      src={previewDataUrl}
                      alt="Preview"
                      className="w-full h-full object-contain pixel-render"
                    />
                  ) : (
                    <div className="text-center p-4 text-inkdim font-mono text-xs">
                      Selecciona un Pokémon para previsualizar
                    </div>
                  )}

                  {/* Guías de anclaje */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-volt/40" />
                    <div className="absolute left-0 right-0 bottom-0 border-t-2 border-dashed border-grid/60" />
                  </div>
                </div>

                <div className="mt-2 text-center text-[10px] font-mono text-inkdim">
                  Línea verde: Suelo raycast · Línea cian: Centro
                </div>
              </div>

              <div className="w-full flex flex-col gap-2">
                <button
                  onClick={handleImport}
                  disabled={!previewDataUrl || isProcessing}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blood via-lava to-fire text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg glow-lava-orange disabled:opacity-40"
                >
                  <Wand2 className="w-4 h-4" />
                  Importar al Editor ({targetSize}×{targetSize})
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2 text-inkdim hover:text-ink font-mono text-xs uppercase tracking-wider"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
