import JSZip from 'jszip';
import { AnyAsset, RasterAsset } from './types';
import { canvasFromDataUrl, canvasToPngBlob, canvasToRawRgba } from './pixel-utils';
import { mapToText } from './map-utils';

export type ExportFormat = 'png' | 'rgba' | 'both';

export async function buildAssetsZip(
  assets: AnyAsset[],
  format: ExportFormat
): Promise<Blob> {
  const zip = new JSZip();
  const assetsFolder = zip.folder('assets')!;
  const mapsFolder = zip.folder('src/maps')!;

  for (const asset of assets) {
    if (asset.kind === 'map') {
      mapsFolder.file(`${asset.name}.txt`, mapToText(asset));
      continue;
    }
    const raster = asset as RasterAsset;
    const canvas = await canvasFromDataUrl(raster.dataUrl, raster.size);

    if (format === 'png' || format === 'both') {
      const blob = await canvasToPngBlob(canvas);
      assetsFolder.file(`${raster.name}.png`, blob);
    }
    if (format === 'rgba' || format === 'both') {
      const bytes = canvasToRawRgba(canvas);
      assetsFolder.file(`${raster.name}.rgba`, bytes);
    }
  }

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}
