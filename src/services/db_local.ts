import Dexie, { type Table } from 'dexie';

export interface PendingRecord {
  id?: number;
  timestamp: number;
  evidenceBlob: Blob; 
  fileType: string;
  meta: any;
}

class OfflineDatabase extends Dexie {
  pendingUploads!: Table<PendingRecord>; 
  projects!: Table<any>;
  fronts!: Table<any>;
  localities!: Table<any>;
  details!: Table<any>;

  constructor() {
    super('CenepaOfflineDB');
    this.version(2).stores({
      pendingUploads: '++id, timestamp', 
      projects: 'ID_Proyecto',
      fronts: 'ID_Frente, ID_Proyecto',
      localities: 'ID_Localidad, ID_Frente',
      details: 'ID_DetallesActividad, ID_Localidad'
    });
  }
}

// Protección contra Server Side Rendering
export const db = typeof window !== "undefined" ? new OfflineDatabase() : {} as any;