'use client';

import { isPowerOfTwo } from '@/lib/pixel-utils';

interface Props {
  dataUrl: string | null;
  size: number;
}

export default function WallTilePreview({ dataUrl, size }: Props) {
  const pot = isPowerOfTwo(size);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wide text-inkdim">Repetición 3×3</span>
        <span
          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
            pot ? 'border-grid/50 text-grid' : 'border-blood/60 text-blood'
          }`}
        >
          {pot ? `2^N OK (${size})` : `${size} no es potencia de 2`}
        </span>
      </div>
      <div
        className="w-full aspect-square rounded border border-line pixel-render"
        style={{
          backgroundImage: dataUrl ? `url(${dataUrl})` : undefined,
          backgroundRepeat: 'repeat',
          backgroundSize: `${100 / 3}% ${100 / 3}%`,
          backgroundColor: '#3a3f46',
        }}
      />
    </div>
  );
}
