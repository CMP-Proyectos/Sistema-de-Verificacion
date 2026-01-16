import Dexie, { Table } from 'dexie';
import { ProjectRecord, FrontRecord, LocalityRecord, DetailRecord, ActivityRecord } from './dataService';

// definición local de las propiedades
export interface ActivityPropertyDef {
  id?: number; 
  ID_Actividad: number;
  ID_Propiedad: number;
  Nombre_Propiedad: string;
}

// tipos para registros pendientes de subida:
export interface PendingRecord {
  id?: number;
  timestamp: number;
  evidenceBlob: Blob;
  fileType: string;
  meta: {
    bucketName: string;
    fullPath: string;
    fileName: string;
    userId: string;
    detailId: number;
    lat: number;
    lng: number;
    comment: string;
    properties?: { id_propiedad: number; valor: string }[];
  };
}

class OfflineDatabase extends Dexie {
  projects!: Table<ProjectRecord>;
  fronts!: Table<FrontRecord>;
  localities!: Table<LocalityRecord>;
  details!: Table<DetailRecord>;
  activities!: Table<ActivityRecord>;
  pendingUploads!: Table<PendingRecord>;
  activityProperties!: Table<ActivityPropertyDef>;

  constructor() {
    super('AppObraDB');
    // estructura final
    this.version(6).stores({
      projects: 'ID_Proyectos',
      fronts: 'ID_Frente, ID_Proyecto',
      localities: 'ID_Localidad, ID_Frente',
      details: 'ID_DetallesActividad, ID_Localidad', 
      activities: 'ID_Actividad',
      pendingUploads: '++id',
      activityProperties: '++id, ID_Actividad'
    });
  }
}

export const db = new OfflineDatabase();