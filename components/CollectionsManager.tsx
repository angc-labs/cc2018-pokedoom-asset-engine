'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { AnyAsset, RasterAsset, MapAsset } from '@/lib/types';
import { buildAssetsZip, ExportFormat } from '@/lib/export-zip';
import { canvasFromDataUrl, canvasToPngBlob, canvasToRawRgba, downloadBlob, downloadText } from '@/lib/pixel-utils';
import { mapToText } from '@/lib/map-utils';
import { Plus, Folder, Trash2, Download, Cloud, Lock, Sparkles, AlertCircle, Edit3, Check, Loader2, ArrowLeft, Layers, Eye, FolderOpen, UserCheck } from 'lucide-react';
import AuthModal from './AuthModal';

export interface CollectionItem {
  id: string;
  name: string;
  description: string | null;
  tags: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  assets?: any[];
}

interface Props {
  localAssets: AnyAsset[];
  activeCollectionId: string | null;
  onSelectCollection: (colId: string | null) => void;
  onAssignAssetToCollection: (assetId: string, colId: string | null) => void;
  onEditAsset?: (asset: AnyAsset) => void;
}

const KIND_LABEL: Record<string, string> = {
  sprite: 'Sprite',
  wall: 'Pared',
  hud: 'HUD',
  map: 'Mapa',
};

const KIND_COLOR: Record<string, string> = {
  sprite: 'text-volt border-volt/40 bg-volt/10',
  wall: 'text-amber border-amber/40 bg-amber/10',
  hud: 'text-portal border-portal/40 bg-portal/10',
  map: 'text-grid border-grid/40 bg-grid/10',
};

export default function CollectionsManager({
  localAssets,
  activeCollectionId,
  onSelectCollection,
  onAssignAssetToCollection,
  onEditAsset,
}: Props) {
  const { data: session } = useSession();
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [isZipping, setIsZipping] = useState(false);

  // Selected collection for detailed view
  const [viewingCollectionId, setViewingCollectionId] = useState<string | null>(null);

  const isLoggedIn = !!session?.user;

  useEffect(() => {
    if (isLoggedIn) {
      loadCollections();
    } else {
      setCollections([]);
    }
  }, [isLoggedIn]);

  async function loadCollections() {
    setLoading(true);
    try {
      const res = await fetch('/api/collections');
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections || []);
      }
    } catch (err) {
      console.error('Error fetching collections:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!newColName.trim()) return;

    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newColName.trim(),
          description: newColDesc.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCollections((prev) => [data.collection, ...prev]);
        setNewColName('');
        setNewColDesc('');
        setIsCreating(false);
        // Open the newly created collection
        setViewingCollectionId(data.collection.id);
      }
    } catch (err) {
      console.error('Error creating collection:', err);
    }
  }

  async function handleDeleteCollection(id: string) {
    if (!confirm('¿Seguro que deseas eliminar esta colección?')) return;
    try {
      const res = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCollections((prev) => prev.filter((c) => c.id !== id));
        if (viewingCollectionId === id) setViewingCollectionId(null);
        if (activeCollectionId === id) onSelectCollection(null);
      }
    } catch (err) {
      console.error('Error deleting collection:', err);
    }
  }

  async function handleExportCollectionZip(collection: CollectionItem) {
    const colAssets = localAssets.filter((a) => (a as any).collectionId === collection.id);
    if (colAssets.length === 0) {
      alert('Esta colección no tiene assets para exportar.');
      return;
    }

    setIsZipping(true);
    try {
      const blob = await buildAssetsZip(colAssets, 'both');
      const safeName = collection.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      downloadBlob(blob, `pokedoom-${safeName}.zip`);
    } finally {
      setIsZipping(false);
    }
  }

  async function exportRaster(asset: RasterAsset, fmt: 'png' | 'rgba') {
    const canvas = await canvasFromDataUrl(asset.dataUrl, asset.size);
    if (fmt === 'png') {
      downloadBlob(await canvasToPngBlob(canvas), `${asset.name}.png`);
    } else {
      const bytes = canvasToRawRgba(canvas);
      downloadBlob(new Blob([bytes], { type: 'application/octet-stream' }), `${asset.name}.rgba`);
    }
  }

  function exportMap(asset: MapAsset) {
    downloadText(mapToText(asset), `${asset.name}.txt`);
  }

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border border-line bg-panel2 p-8 text-center flex flex-col items-center gap-4 max-w-xl mx-auto shadow-panel">
        <div className="w-14 h-14 rounded-2xl bg-panel3 border border-gengar/40 flex items-center justify-center text-gengarGlow shadow-lg">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h3 className="font-mono text-base font-bold text-ink uppercase tracking-wider">
            Colecciones de Usuario
          </h3>
          <p className="font-mono text-xs text-inkdim mt-2 leading-relaxed">
            Inicia sesión con tu cuenta de Google para crear y gestionar colecciones de assets.
          </p>
        </div>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-lava to-blood text-white font-mono text-xs uppercase tracking-wider font-bold hover:brightness-110 active:scale-95 transition-all shadow-md glow-lava-orange"
        >
          Iniciar Sesión con Google
        </button>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    );
  }

  // DETAILED VIEW FOR A SPECIFIC COLLECTION
  if (viewingCollectionId) {
    const currentCollection = collections.find((c) => c.id === viewingCollectionId);
    const collectionAssets = localAssets.filter((a) => (a as any).collectionId === viewingCollectionId);
    const unassignedAssets = localAssets.filter((a) => (a as any).collectionId !== viewingCollectionId);

    if (!currentCollection) {
      setViewingCollectionId(null);
      return null;
    }

    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-200">
        {/* Header of the viewing collection */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-line bg-panel2 shadow-panel">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewingCollectionId(null)}
              className="p-2 rounded-lg border border-line bg-panel3 hover:bg-panel hover:border-fire text-ink transition-colors flex items-center gap-1.5 text-xs font-mono"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Colecciones</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-fire" />
                <h3 className="font-mono text-sm font-bold text-ink uppercase tracking-wider">
                  {currentCollection.name}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-panel3 border border-line text-fire font-bold">
                  {collectionAssets.length} asset{collectionAssets.length === 1 ? '' : 's'}
                </span>
              </div>
              {currentCollection.description && (
                <p className="text-[11px] font-mono text-inkdim mt-0.5">{currentCollection.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportCollectionZip(currentCollection)}
              disabled={isZipping || collectionAssets.length === 0}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blood to-lava text-white font-mono text-xs uppercase tracking-wider font-bold hover:brightness-110 disabled:opacity-40 flex items-center gap-1.5 shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              {isZipping ? 'Empaquetando…' : 'Exportar Colección (.zip)'}
            </button>

            <button
              onClick={() => handleDeleteCollection(currentCollection.id)}
              className="p-2 rounded-lg border border-blood/40 text-blood hover:bg-blood/10 transition-colors"
              title="Eliminar colección"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Assets inside this collection */}
        <div className="flex flex-col gap-3">
          <h4 className="font-mono text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-2">
            <span>Assets en esta Colección:</span>
          </h4>

          {collectionAssets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line p-8 text-center text-inkdim font-mono text-xs flex flex-col items-center gap-2">
              <FolderOpen className="w-8 h-8 text-inkdim/50" />
              <p>Esta colección todavía no tiene assets asignados.</p>
              <p className="text-inkdim/70 text-[11px]">
                Puedes asignarle assets existentes abajo, o seleccionarla en el editor al guardar un nuevo sprite, pared o mapa.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {collectionAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="rounded-xl border border-line bg-panel2 p-3 flex flex-col gap-2 hover:border-fire transition-all shadow-panel"
                >
                  <div className="aspect-square rounded-lg checker-bg border border-line flex items-center justify-center overflow-hidden relative">
                    {asset.kind === 'map' ? (
                      <div className="text-inkdim font-mono text-[8px] leading-tight p-1 whitespace-pre select-none">
                        {asset.cells.slice(0, 10).map((r) => r.slice(0, 16).join('')).join('\n')}
                      </div>
                    ) : (
                      <img
                        src={asset.dataUrl}
                        alt={asset.name}
                        className="w-full h-full object-contain pixel-render"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${KIND_COLOR[asset.kind]}`}>
                      {KIND_LABEL[asset.kind]}
                    </span>
                    <span className="text-[10px] font-mono text-inkdim">
                      {asset.kind === 'map' ? `${asset.cols}×${asset.rows}` : `${(asset as RasterAsset).size}px`}
                    </span>
                  </div>

                  <p className="font-mono text-xs font-bold text-ink truncate">{asset.name}</p>

                  <div className="flex flex-wrap items-center gap-1 mt-auto pt-1">
                    {onEditAsset && (
                      <button
                        onClick={() => onEditAsset(asset)}
                        className="px-2 py-1 rounded bg-panel3 border border-line text-[10px] font-mono text-inkdim hover:text-fire"
                      >
                        Editar
                      </button>
                    )}

                    {asset.kind === 'map' ? (
                      <button
                        onClick={() => exportMap(asset)}
                        className="px-2 py-1 rounded bg-panel3 border border-line text-[10px] font-mono text-inkdim hover:text-ink"
                      >
                        .txt
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => exportRaster(asset as RasterAsset, 'png')}
                          className="px-2 py-1 rounded bg-panel3 border border-line text-[10px] font-mono text-inkdim hover:text-ink"
                        >
                          .png
                        </button>
                        <button
                          onClick={() => exportRaster(asset as RasterAsset, 'rgba')}
                          className="px-2 py-1 rounded bg-panel3 border border-line text-[10px] font-mono text-inkdim hover:text-ink"
                        >
                          .rgba
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => onAssignAssetToCollection(asset.id, null)}
                      className="px-2 py-1 rounded bg-panel3 border border-blood/40 text-[10px] font-mono text-blood hover:bg-blood/10 ml-auto"
                      title="Quitar de esta colección"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section to quickly add unassigned assets */}
        {unassignedAssets.length > 0 && (
          <div className="flex flex-col gap-3 pt-4 border-t border-line">
            <h4 className="font-mono text-xs font-bold text-inkdim uppercase tracking-wider">
              Agregar Otros Assets a &quot;{currentCollection.name}&quot;:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {unassignedAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="rounded-lg border border-line bg-panel2 p-2 flex flex-col gap-1.5 hover:border-lineHighlight"
                >
                  <div className="aspect-square rounded checker-bg flex items-center justify-center overflow-hidden">
                    {asset.kind === 'map' ? (
                      <div className="text-[7px] font-mono text-inkdim p-0.5">Mapa</div>
                    ) : (
                      <img src={asset.dataUrl} alt={asset.name} className="w-full h-full object-contain pixel-render" />
                    )}
                  </div>
                  <p className="font-mono text-[10px] text-ink truncate">{asset.name}</p>
                  <button
                    onClick={() => onAssignAssetToCollection(asset.id, currentCollection.id)}
                    className="w-full py-1 bg-panel3 hover:bg-fire hover:text-void border border-line rounded text-[9px] font-mono uppercase tracking-wider font-bold transition-colors"
                  >
                    + Agregar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // MAIN COLLECTIONS LIST VIEW
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-mono text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
            <Folder className="w-4 h-4 text-fire" />
            Colecciones de Usuario
          </h3>
          <p className="text-[11px] font-mono text-inkdim mt-0.5">
            Organiza paquetes completos para tu motor de juego en Zig. Haz clic en una colección para ver su contenido.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-3.5 py-1.5 rounded-lg bg-lava hover:bg-lava/90 text-white font-mono text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Colección
        </button>
      </div>

      {isCreating && (
        <form
          onSubmit={handleCreateCollection}
          className="p-4 rounded-xl border border-lineHighlight bg-panel2 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150"
        >
          <h4 className="font-mono text-xs font-bold text-ink uppercase tracking-wider">
            Crear Nueva Colección
          </h4>
          <input
            type="text"
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            placeholder="Nombre de la colección (ej: Kanto Doom E1M1, Lavender Boss Pack)..."
            className="bg-panel3 border border-line rounded-lg px-3 py-2 text-xs font-mono text-ink placeholder:text-inkdim/60 focus:outline-none focus:border-fire"
            autoFocus
          />
          <input
            type="text"
            value={newColDesc}
            onChange={(e) => setNewColDesc(e.target.value)}
            placeholder="Descripción opcional..."
            className="bg-panel3 border border-line rounded-lg px-3 py-2 text-xs font-mono text-ink placeholder:text-inkdim/60 focus:outline-none focus:border-fire"
          />
          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 rounded-lg border border-line text-inkdim hover:text-ink text-xs font-mono"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!newColName.trim()}
              className="px-4 py-1.5 rounded-lg bg-fire text-void font-mono text-xs uppercase tracking-wider font-bold hover:brightness-110 disabled:opacity-40"
            >
              Crear Colección
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-8 text-inkdim font-mono text-xs gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-fire" />
          <span>Cargando colecciones desde Turso DB…</span>
        </div>
      ) : collections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-8 text-center text-inkdim font-mono text-xs">
          Aún no has creado colecciones. Pulsa &quot;Nueva Colección&quot; para organizar tus sprites, texturas y mapas.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => {
            const count = localAssets.filter((a) => (a as any).collectionId === col.id).length;

            return (
              <div
                key={col.id}
                onClick={() => setViewingCollectionId(col.id)}
                className="rounded-xl border border-line bg-panel2 p-4 flex flex-col justify-between gap-4 hover:border-fire hover:bg-panel3 transition-all cursor-pointer shadow-panel group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Folder className="w-5 h-5 text-fire group-hover:scale-110 transition-transform" />
                      <h4 className="font-mono text-sm font-bold text-ink uppercase tracking-wider truncate group-hover:text-fire transition-colors">
                        {col.name}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-panel3 border border-line text-inkdim">
                      {count} asset{count === 1 ? '' : 's'}
                    </span>
                  </div>
                  {col.description ? (
                    <p className="text-xs font-mono text-inkdim mt-2 line-clamp-2">
                      {col.description}
                    </p>
                  ) : (
                    <p className="text-[11px] font-mono text-inkdim/60 mt-2 italic">Sin descripción</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-line/60">
                  <span className="text-[11px] font-mono text-fire font-bold flex items-center gap-1">
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Explorar ({count})</span>
                  </span>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleExportCollectionZip(col)}
                      disabled={isZipping || count === 0}
                      title="Exportar ZIP de esta colección"
                      className="p-1.5 rounded bg-panel3 border border-line text-inkdim hover:text-ink disabled:opacity-40"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteCollection(col.id)}
                      title="Eliminar colección"
                      className="p-1.5 rounded bg-panel3 border border-blood/30 text-blood hover:bg-blood/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
