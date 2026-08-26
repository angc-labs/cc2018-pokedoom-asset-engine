import Dexie, { type EntityTable } from 'dexie';
import { AnyAsset } from './types';

export interface LocalAssetRecord {
  id: string;
  kind: 'sprite' | 'wall' | 'hud' | 'map';
  name: string;
  size?: number;
  dataUrl?: string;
  mapData?: any;
  metadata?: any;
  collectionId?: string | null;
  updatedAt: number;
  syncedToCloud?: boolean;
}

export interface DraftRecord {
  key: string;
  data: any;
  updatedAt: number;
}

export interface PokeCacheRecord {
  id: number;
  name: string;
  sprites: {
    front_default?: string | null;
    back_default?: string | null;
    front_shiny?: string | null;
    back_shiny?: string | null;
    gen1?: string | null;
    gen5?: string | null;
    showdown?: string | null;
  };
  types: string[];
  updatedAt: number;
}

class PokeDoomDatabase extends Dexie {
  localAssets!: EntityTable<LocalAssetRecord, 'id'>;
  drafts!: EntityTable<DraftRecord, 'key'>;
  pokeCache!: EntityTable<PokeCacheRecord, 'id'>;

  constructor() {
    super('PokeDoomDB');
    this.version(1).stores({
      localAssets: 'id, kind, name, collectionId, updatedAt, syncedToCloud',
      drafts: 'key, updatedAt',
      pokeCache: 'id, name, updatedAt',
    });
  }
}

export const db = new PokeDoomDatabase();
