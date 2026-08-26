'use client';

import { useEffect, useState } from 'react';
import PixelEditor from '@/components/PixelEditor';
import WallTilePreview from '@/components/WallTilePreview';
import MapEditor from '@/components/MapEditor';
import Library from '@/components/Library';
import FramebufferPreview from '@/components/FramebufferPreview';
import PokeApiModal from '@/components/PokeApiModal';
import CollectionsManager from '@/components/CollectionsManager';
import UserNav from '@/components/UserNav';
import AuthModal from '@/components/AuthModal';
import LandingHero from '@/components/LandingHero';
import { loadLibrary, saveLibrary, uid } from '@/lib/storage';
import { useSession } from '@/lib/auth-client';
import { AnyAsset, MapAsset, RasterAsset, SPRITE_SIZES, WALL_SIZES, HUD_SIZES } from '@/lib/types';
import { emptyGrid, withBorder } from '@/lib/map-utils';
import { Sparkles, Folder, Flame, Layers, Box, Cpu, Download, Home, Plus, LogIn } from 'lucide-react';

type Tab = 'home' | 'sprite' | 'wall' | 'hud' | 'map' | 'collections' | 'library';

interface Draft {
  editingId: string | null;
  name: string;
  size: number;
  dataUrl: string | null;
  collectionId: string | null;
}

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'sprite', label: 'Sprites', icon: Sparkles },
  { id: 'wall', label: 'Paredes', icon: Layers },
  { id: 'hud', label: 'HUD', icon: Box },
  { id: 'map', label: 'Mapas', icon: Cpu },
  { id: 'collections', label: 'Colecciones', icon: Folder },
  { id: 'library', label: 'Biblioteca', icon: Download },
];

function newMap(): MapAsset {
  return {
    id: '',
    kind: 'map',
    name: 'level1',
    cols: 16,
    rows: 10,
    cells: withBorder(emptyGrid(16, 10)),
    updatedAt: Date.now(),
  };
}

export default function Page() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const [tab, setTab] = useState<Tab>('home');
  const [assets, setAssets] = useState<AnyAsset[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  // Modals
  const [isPokeApiOpen, setIsPokeApiOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Drafts
  const [spriteDraft, setSpriteDraft] = useState<Draft>({ editingId: null, name: 'gengar', size: 64, dataUrl: null, collectionId: null });
  const [wallDraft, setWallDraft] = useState<Draft>({ editingId: null, name: 'muro-piedra', size: 64, dataUrl: null, collectionId: null });
  const [hudDraft, setHudDraft] = useState<Draft>({ editingId: null, name: 'poke-ball', size: 128, dataUrl: null, collectionId: null });
  const [mapDraft, setMapDraft] = useState<MapAsset>(newMap());
  const [mapCollectionId, setMapCollectionId] = useState<string | null>(null);
  const [mapEditingId, setMapEditingId] = useState<string | null>(null);

  // 1. Load user assets and collections once authenticated
  useEffect(() => {
    if (isLoggedIn) {
      // Fetch user collections
      fetch('/api/collections')
        .then((res) => res.json())
        .then((data) => {
          if (data.collections) {
            setCollections(data.collections.map((c: any) => ({ id: c.id, name: c.name })));
          }
        })
        .catch(() => {});

      // Fetch user assets
      fetch('/api/assets')
        .then((res) => res.json())
        .then((data) => {
          if (data.assets && data.assets.length > 0) {
            const formatted: AnyAsset[] = data.assets.map((rec: any) => {
              if (rec.kind === 'map') {
                const mapInfo = rec.mapData ? (typeof rec.mapData === 'string' ? JSON.parse(rec.mapData) : rec.mapData) : null;
                return {
                  id: rec.id,
                  kind: 'map',
                  name: rec.name,
                  cols: mapInfo?.cols || 16,
                  rows: mapInfo?.rows || 10,
                  cells: mapInfo?.cells || withBorder(emptyGrid(16, 10)),
                  updatedAt: new Date(rec.updatedAt).getTime(),
                  collectionId: rec.collectionId,
                  syncedToCloud: true,
                } as any;
              }
              return {
                id: rec.id,
                kind: rec.kind,
                name: rec.name,
                size: rec.size || 64,
                dataUrl: rec.dataUrl || '',
                updatedAt: new Date(rec.updatedAt).getTime(),
                collectionId: rec.collectionId,
                syncedToCloud: true,
              } as any;
            });
            setAssets(formatted);
          }
        })
        .catch(() => {});
    } else {
      setAssets([]);
      setCollections([]);
      setTab('home');
    }
    setHydrated(true);
  }, [isLoggedIn]);

  function handleTabChange(nextTab: Tab) {
    if (!isLoggedIn && nextTab !== 'home') {
      setIsAuthModalOpen(true);
      return;
    }
    setTab(nextTab);
  }

  // Save Raster Draft (Sprite, Wall, HUD)
  async function saveDraft(kind: 'sprite' | 'wall' | 'hud', draft: Draft, setDraft: (d: Draft) => void) {
    if (!draft.dataUrl || !isLoggedIn) return;
    const name = draft.name.trim() || kind;
    const id = draft.editingId || uid();
    const targetColId = draft.collectionId || activeCollectionId || null;

    const asset: RasterAsset = {
      id,
      kind,
      name,
      size: draft.size,
      dataUrl: draft.dataUrl,
      updatedAt: Date.now(),
      collectionId: targetColId,
    } as any;

    if (draft.editingId) {
      setAssets((prev) => prev.map((a) => (a.id === draft.editingId ? asset : a)));
      setDraft({ ...draft, name, collectionId: targetColId });
    } else {
      setAssets((prev) => [asset, ...prev]);
      setDraft({ ...draft, editingId: id, name, collectionId: targetColId });
    }

    try {
      await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          kind,
          name,
          size: draft.size,
          dataUrl: draft.dataUrl,
          collectionId: targetColId,
        }),
      });
    } catch (err) {
      console.error('Error saving asset:', err);
    }
  }

  // Save Map Draft
  async function saveMap() {
    if (!isLoggedIn) return;
    const name = mapDraft.name.trim() || 'level';
    const id = mapEditingId || uid();
    const targetColId = mapCollectionId || activeCollectionId || null;

    const asset: MapAsset = {
      ...mapDraft,
      id,
      name,
      updatedAt: Date.now(),
      collectionId: targetColId,
    } as any;

    if (mapEditingId) {
      setAssets((prev) => prev.map((a) => (a.id === mapEditingId ? asset : a)));
    } else {
      setAssets((prev) => [asset, ...prev]);
      setMapEditingId(id);
    }

    try {
      await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          kind: 'map',
          name,
          mapData: { cols: mapDraft.cols, rows: mapDraft.rows, cells: mapDraft.cells },
          collectionId: targetColId,
        }),
      });
    } catch (err) {
      console.error('Error saving map:', err);
    }
  }

  function handleEditAsset(asset: AnyAsset) {
    const colId = (asset as any).collectionId || null;
    if (asset.kind === 'map') {
      setMapDraft(asset);
      setMapEditingId(asset.id);
      setMapCollectionId(colId);
      setTab('map');
      return;
    }
    const raster = asset as RasterAsset;
    const draft: Draft = {
      editingId: raster.id,
      name: raster.name,
      size: raster.size,
      dataUrl: raster.dataUrl,
      collectionId: colId,
    };
    if (raster.kind === 'sprite') setSpriteDraft(draft);
    if (raster.kind === 'wall') setWallDraft(draft);
    if (raster.kind === 'hud') setHudDraft(draft);
    setTab(raster.kind);
  }

  async function handleDelete(id: string) {
    setAssets((prev) => prev.filter((a) => a.id !== id));

    if (isLoggedIn) {
      try {
        await fetch(`/api/assets?id=${id}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Error deleting asset from cloud:', e);
      }
    }

    [spriteDraft, wallDraft, hudDraft].forEach((d) => {
      if (d.editingId === id) {
        if (d === spriteDraft) setSpriteDraft({ ...d, editingId: null });
        if (d === wallDraft) setWallDraft({ ...d, editingId: null });
        if (d === hudDraft) setHudDraft({ ...d, editingId: null });
      }
    });
    if (mapEditingId === id) setMapEditingId(null);
  }

  function handleRename(id: string, name: string) {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)));
  }

  async function handleAssignToCollection(assetId: string, colId: string | null) {
    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? ({ ...a, collectionId: colId } as any) : a))
    );
    const target = assets.find((a) => a.id === assetId);
    if (target && isLoggedIn) {
      try {
        await fetch('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: target.id,
            kind: target.kind,
            name: target.name,
            size: (target as any).size,
            dataUrl: (target as any).dataUrl,
            mapData: target.kind === 'map' ? { cols: target.cols, rows: target.rows, cells: target.cells } : undefined,
            collectionId: colId,
          }),
        });
      } catch (e) {
        console.error('Error updating asset collection:', e);
      }
    }
  }

  function handleImportPokemonSprite(dataUrl: string, name: string) {
    setSpriteDraft({
      editingId: null,
      name,
      size: spriteDraft.size,
      dataUrl,
      collectionId: activeCollectionId || null,
    });
    setTab('sprite');
  }

  return (
    <main className="min-h-[100dvh] lg:h-[100dvh] overflow-x-hidden lg:overflow-hidden bg-void text-ink flex flex-col">
      {/* Top Header - Clean without logo image */}
      <header className="shrink-0 border-b border-line bg-panel/90 backdrop-blur-xl sticky top-0 z-20 shadow-panel">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTab('home')}
              className="flex items-center gap-2 rounded-lg text-left group focus-visible:outline-none"
            >
              <span className="w-7 h-7 rounded border border-line bg-panel2 grid place-items-center font-mono font-bold text-fire text-xs shadow-panel group-hover:border-fire transition-colors">
                P·D
              </span>
              <span className="font-mono text-xs font-black tracking-widest text-ink group-hover:text-fire transition-colors whitespace-nowrap">
                POKÉDOOM
              </span>
            </button>
          </div>

          {/* Render tabs only when user is logged in */}
          {isLoggedIn ? (
            <nav className="flex gap-1 overflow-x-auto py-0.5 max-w-full">
              {TABS.map((t) => {
                const Icon = t.icon;
                const isActive = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleTabChange(t.id)}
                    className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-lava text-white font-bold shadow-md glow-lava-orange'
                        : 'text-inkdim hover:text-ink hover:bg-panel2'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-inkdim'}`} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </nav>
          ) : (
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-inkdim">
              <span>Suite de Assets Raycast 3D estilo DOOM</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {isLoggedIn && (
              <button
                onClick={() => setIsPokeApiOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gengar/40 bg-gengarDark/30 hover:bg-gengarDark/60 text-gengarGlow font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>PokéAPI</span>
              </button>
            )}

            <UserNav onOpenCollections={() => handleTabChange('collections')} />
          </div>
        </div>
      </header>

      {/* Main View: Show Home if not logged in or if on home tab */}
      {!isLoggedIn || tab === 'home' ? (
        <div className="flex-1 overflow-y-auto">
          <LandingHero
            onEnterStudio={(tabName) => handleTabChange((tabName as Tab) || 'sprite')}
            onOpenPokeApi={() => (isLoggedIn ? setIsPokeApiOpen(true) : setIsAuthModalOpen(true))}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            isLoggedIn={isLoggedIn}
          />
        </div>
      ) : (
        <div className="w-full flex-1 min-h-0 max-w-[1700px] mx-auto px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:overflow-hidden">
          {/* Main Editing Section */}
          <section className="min-w-0 min-h-0 lg:overflow-y-auto lg:pr-1 flex flex-col gap-4">
            {tab === 'sprite' && (
              <EditorPanel
                title="Sprite 3D (Billboard Pokémon)"
                hint="56×56, 64×64 o 128×128 · Fondo transparente · Pies pegados a la línea de suelo"
                draft={spriteDraft}
                setDraft={setSpriteDraft}
                sizes={SPRITE_SIZES}
                kind="sprite"
                collections={collections}
                onSave={() => saveDraft('sprite', spriteDraft, setSpriteDraft)}
                onOpenPokeApi={() => setIsPokeApiOpen(true)}
              />
            )}

            {tab === 'wall' && (
              <div className="flex flex-col gap-4">
                <EditorPanel
                  title="Textura de Pared (Tileable)"
                  hint="32, 64 o 128 px · Potencia de 2 · Sin transparencia · Se repite en mosaico continuo"
                  draft={wallDraft}
                  setDraft={setWallDraft}
                  sizes={WALL_SIZES}
                  kind="wall"
                  collections={collections}
                  onSave={() => saveDraft('wall', wallDraft, setWallDraft)}
                />
                <div className="max-w-xs">
                  <WallTilePreview dataUrl={wallDraft.dataUrl} size={wallDraft.size} />
                </div>
              </div>
            )}

            {tab === 'hud' && (
              <EditorPanel
                title="HUD (Pokéball / Arma en Mano)"
                hint="128×128 o 256×256 · PNG transparente o RGBA · Renderizado abajo-centro"
                draft={hudDraft}
                setDraft={setHudDraft}
                sizes={HUD_SIZES}
                kind="hud"
                collections={collections}
                onSave={() => saveDraft('hud', hudDraft, setHudDraft)}
              />
            )}

            {tab === 'map' && (
              <div className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-4 shadow-panel">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-gengarGlow" />
                      Mapa de Nivel (ASCII Raycast)
                    </h2>
                    <p className="text-[11px] font-mono text-inkdim mt-0.5">
                      Exportable directamente como archivo .txt para src/maps/ en Zig
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <input
                      value={mapDraft.name}
                      onChange={(e) => setMapDraft({ ...mapDraft, name: e.target.value })}
                      className="bg-panel2 border border-line rounded px-2.5 py-1.5 text-xs font-mono text-ink flex-1 min-w-32 sm:w-36 focus:border-fire"
                      placeholder="nombre-mapa"
                    />

                    {/* Collection dropdown selector for Map */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-inkdim">📁</span>
                      <select
                        value={mapCollectionId || ''}
                        onChange={(e) => setMapCollectionId(e.target.value ? e.target.value : null)}
                        className="bg-panel2 border border-line rounded px-2 py-1.5 text-xs font-mono text-ink focus:border-fire"
                      >
                        <option value="">Sin Colección (General)</option>
                        {collections.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={saveMap}
                      className="px-3.5 py-1.5 rounded-lg bg-lava text-white font-mono text-xs uppercase tracking-wider font-bold hover:brightness-110 shadow-md"
                    >
                      {mapEditingId ? 'Actualizar' : 'Guardar Mapa'}
                    </button>
                  </div>
                </div>
                <MapEditor map={mapDraft} onChange={setMapDraft} />
              </div>
            )}

            {tab === 'collections' && (
              <div className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-5 shadow-panel">
                <CollectionsManager
                  localAssets={assets}
                  activeCollectionId={activeCollectionId}
                  onSelectCollection={setActiveCollectionId}
                  onAssignAssetToCollection={handleAssignToCollection}
                  onEditAsset={handleEditAsset}
                />
              </div>
            )}

            {tab === 'library' && (
              <div className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-5 shadow-panel">
                <div>
                  <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                    <Download className="w-4 h-4 text-grid" />
                    Biblioteca de Assets
                  </h2>
                  <p className="text-[11px] font-mono text-inkdim mt-0.5">
                    {assets.length} asset{assets.length === 1 ? '' : 's'} guardados en tu cuenta
                  </p>
                </div>
                <Library
                  assets={assets}
                  onDelete={handleDelete}
                  onEdit={handleEditAsset}
                  onRename={handleRename}
                  collections={collections}
                  activeCollectionId={activeCollectionId}
                  onSelectCollection={setActiveCollectionId}
                  onAssignToCollection={handleAssignToCollection}
                  isLoggedIn={isLoggedIn}
                />
              </div>
            )}
          </section>

          {/* Right Sidebar: Raycasting Live Preview */}
          <aside className="min-h-0 lg:overflow-y-auto lg:pr-1 flex flex-col gap-4 pb-5 lg:pb-0">
            <div className="rounded-xl border border-line bg-panel p-4 shadow-panel flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-2">
                  <Flame className="w-4 h-4 text-blood animate-pulse" />
                  Raycast Engine en Vivo
                </h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-panel2 border border-line text-volt">
                  Zig Sampler
                </span>
              </div>

              <FramebufferPreview
                wallDataUrl={wallDraft.dataUrl ?? undefined}
                spriteDataUrl={spriteDraft.dataUrl ?? undefined}
                hudDataUrl={hudDraft.dataUrl ?? undefined}
                wallSize={wallDraft.size}
                spriteSize={spriteDraft.size}
                hudSize={hudDraft.size}
              />

              <p className="text-[10px] font-mono text-inkdim leading-relaxed">
                Muestreo de pared vertical, billboard de Pokémon con perspectiva y HUD fijo en la parte inferior.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-panel p-4 shadow-panel flex flex-col gap-2.5">
              <h3 className="font-mono text-[11px] uppercase tracking-widest text-ink font-bold">
                Formatos Soportados por el Motor
              </h3>
              <ul className="text-[11px] font-mono text-inkdim space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-fire" />
                  <span><strong className="text-ink">.rgba</strong> — Bytes planos 32-bit (width × height × 4)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-volt" />
                  <span><strong className="text-ink">.png</strong> — Imágenes estándar con canal alfa</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gengarGlow" />
                  <span><strong className="text-ink">.txt</strong> — Matrices de mapas ASCII para raycasting</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-grid" />
                  <span><strong className="text-ink">.zip</strong> — Paquete empaquetado para <code className="text-ink">assets/</code></span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      )}

      {/* Modales Globales */}
      <PokeApiModal
        isOpen={isPokeApiOpen}
        onClose={() => setIsPokeApiOpen(false)}
        targetSize={spriteDraft.size}
        onImportSprite={handleImportPokemonSprite}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </main>
  );
}

function EditorPanel({
  title,
  hint,
  draft,
  setDraft,
  sizes,
  kind,
  collections = [],
  onSave,
  onOpenPokeApi,
}: {
  title: string;
  hint: string;
  draft: Draft;
  setDraft: (d: Draft) => void;
  sizes: number[];
  kind: 'sprite' | 'wall' | 'hud';
  collections?: { id: string; name: string }[];
  onSave: () => void;
  onOpenPokeApi?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-4 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink">{title}</h2>
          <p className="text-[11px] font-mono text-inkdim mt-0.5">{hint}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="bg-panel2 border border-line rounded px-2.5 py-1.5 text-xs font-mono text-ink flex-1 min-w-28 sm:w-32 focus:border-fire"
            placeholder="nombre-del-asset"
          />

          {/* Collection dropdown in the editor panel */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-inkdim">📁</span>
            <select
              value={draft.collectionId || ''}
              onChange={(e) => setDraft({ ...draft, collectionId: e.target.value ? e.target.value : null })}
              className="bg-panel2 border border-line rounded px-2 py-1.5 text-xs font-mono text-ink focus:border-fire"
            >
              <option value="">Sin Colección (General)</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onSave}
            disabled={!draft.dataUrl}
            className="px-3.5 py-1.5 rounded-lg bg-lava text-white font-mono text-xs uppercase tracking-wider font-bold hover:brightness-110 disabled:opacity-40 shadow-md"
          >
            {draft.editingId ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
      <PixelEditor
        kind={kind}
        size={draft.size}
        allowedSizes={sizes}
        onSizeChange={(size) => setDraft({ ...draft, size })}
        dataUrl={draft.dataUrl}
        onChange={(dataUrl) => setDraft({ ...draft, dataUrl })}
        onOpenPokeApi={onOpenPokeApi}
      />
    </div>
  );
}
