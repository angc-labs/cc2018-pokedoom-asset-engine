'use client';

import { useState } from 'react';
import { AnyAsset, RasterAsset, MapAsset } from '@/lib/types';
import { canvasFromDataUrl, canvasToPngBlob, canvasToRawRgba, downloadBlob, downloadText } from '@/lib/pixel-utils';
import { mapToText } from '@/lib/map-utils';
import { buildAssetsZip, ExportFormat } from '@/lib/export-zip';
import { Download, Trash2, Edit3, Cloud, Filter, Sparkles, Folder } from 'lucide-react';

interface Props {
  assets: AnyAsset[];
  onDelete: (id: string) => void;
  onEdit: (asset: AnyAsset) => void;
  onRename: (id: string, name: string) => void;
  collections?: { id: string; name: string }[];
  activeCollectionId?: string | null;
  onSelectCollection?: (colId: string | null) => void;
  onAssignToCollection?: (assetId: string, colId: string | null) => void;
  isLoggedIn?: boolean;
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

export default function Library({
  assets,
  onDelete,
  onEdit,
  onRename,
  collections = [],
  activeCollectionId = null,
  onSelectCollection,
  onAssignToCollection,
  isLoggedIn = false,
}: Props) {
  const [zipping, setZipping] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('both');
  const [filterKind, setFilterKind] = useState<string>('all');

  const filteredAssets = assets.filter((a) => {
    if (filterKind !== 'all' && a.kind !== filterKind) return false;
    if (activeCollectionId && (a as any).collectionId !== activeCollectionId) return false;
    return true;
  });

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

  async function exportAll() {
    if (filteredAssets.length === 0) return;
    setZipping(true);
    try {
      const blob = await buildAssetsZip(filteredAssets, format);
      downloadBlob(blob, 'pokedoom-assets.zip');
    } finally {
      setZipping(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros y Opciones de Exportación */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-panel2 p-3.5 shadow-panel">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tipo filter */}
          <div className="flex rounded-lg border border-line overflow-hidden bg-panel3">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'sprite', label: 'Sprites' },
              { id: 'wall', label: 'Paredes' },
              { id: 'hud', label: 'HUD' },
              { id: 'map', label: 'Mapas' },
            ].map((k) => (
              <button
                key={k.id}
                onClick={() => setFilterKind(k.id)}
                className={`px-2.5 py-1 text-[11px] font-mono border-r border-line last:border-r-0 transition-colors ${
                  filterKind === k.id ? 'bg-lava text-white font-bold' : 'text-inkdim hover:text-ink'
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>

          {/* Colección filter si hay colecciones */}
          {collections.length > 0 && onSelectCollection && (
            <select
              value={activeCollectionId || ''}
              onChange={(e) => onSelectCollection(e.target.value ? e.target.value : null)}
              className="bg-panel3 border border-line rounded-lg px-2.5 py-1 text-[11px] font-mono text-ink focus:outline-none focus:border-fire"
            >
              <option value="">Todas las Colecciones</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  📁 {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <div className="flex rounded-lg border border-line overflow-hidden bg-panel3">
            {(['png', 'rgba', 'both'] as ExportFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-2.5 py-1 text-[11px] font-mono border-r border-line last:border-r-0 transition-colors ${
                  format === f ? 'bg-fire text-void font-bold' : 'text-inkdim hover:text-ink'
                }`}
              >
                {f === 'both' ? 'PNG+RGBA' : f.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={exportAll}
            disabled={zipping || filteredAssets.length === 0}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blood to-lava text-white font-mono text-xs uppercase tracking-wider font-bold hover:brightness-110 disabled:opacity-40 flex items-center gap-1.5 shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            {zipping ? 'Empaquetando…' : `Exportar ZIP (${filteredAssets.length})`}
          </button>
        </div>
      </div>

      {filteredAssets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-8 text-center text-inkdim font-mono text-xs">
          {assets.length === 0
            ? 'Todavía no hay assets guardados. Crea o importa un sprite desde PokéAPI, dibuja una pared o mapa y guárdalo.'
            : 'No hay assets que coincidan con los filtros seleccionados.'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="rounded-xl border border-line bg-panel2 p-3 flex flex-col gap-2 hover:border-lineHighlight transition-all shadow-panel"
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

                {(asset as any).syncedToCloud && (
                  <div className="absolute top-1 right-1 p-1 rounded bg-panel3/90 border border-grid/50 text-grid" title="Sincronizado en Turso DB">
                    <Cloud className="w-3 h-3" />
                  </div>
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

              <input
                value={asset.name}
                onChange={(e) => onRename(asset.id, e.target.value)}
                className="bg-panel3 border border-line rounded px-2 py-1 text-xs font-mono text-ink focus:outline-none focus:border-fire"
              />

              {/* Colección dropdown si el usuario tiene colecciones */}
              {collections.length > 0 && onAssignToCollection && isLoggedIn && (
                <select
                  value={(asset as any).collectionId || ''}
                  onChange={(e) => onAssignToCollection(asset.id, e.target.value ? e.target.value : null)}
                  className="bg-panel3 border border-line rounded px-1.5 py-0.5 text-[10px] font-mono text-inkdim focus:outline-none focus:border-fire"
                >
                  <option value="">Sin Colección</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex flex-wrap items-center gap-1 mt-auto pt-1">
                <button
                  onClick={() => onEdit(asset)}
                  className="px-2 py-1 rounded bg-panel3 border border-line text-[10px] font-mono text-inkdim hover:text-ink"
                >
                  Editar
                </button>

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
                  onClick={() => onDelete(asset.id)}
                  className="p-1 rounded bg-panel3 border border-blood/30 text-[10px] font-mono text-blood hover:bg-blood/10 ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
