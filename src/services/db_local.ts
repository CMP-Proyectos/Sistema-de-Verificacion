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
  // Nuevas tablas para el caché de navegación
  projects!: Table<any>;
  fronts!: Table<any>;
  localities!: Table<any>;
  details!: Table<any>;

  constructor() {
    super('CenepaOfflineDB');
    // Actualizamos la versión a 2 para agregar las nuevas tablas
    this.version(2).stores({
      pendingUploads: '++id, timestamp',
      projects: 'ID_Proyectos',           // Llave primaria
      fronts: 'ID_Frente, ID_Proyectos',  // ID_Proyectos es índice para buscar
      localities: 'ID_Localidad, ID_Frente',
      details: 'ID_DetallesActividad, ID_Localidad'
    });
  }
}

export const db = new OfflineDatabase();