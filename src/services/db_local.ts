import Dexie, { Table } from 'dexie';
// Asegúrate de importar las interfaces correctas desde tu dataService
import { ProjectRecord, FrontRecord, LocalityRecord, DetailRecord, ActivityRecord } from './dataService';

// Interfaz para el caché de historial (la usaremos luego para "Evidencia Previa")
export interface CachedRecord {
  id_registro: number;
  id_detalle: number;
  fecha_subida: string;
  url_archivo: string;
  comentario: string;
}

class MyDatabase extends Dexie {
  // 1. Definimos las propiedades de la clase para que TypeScript las reconozca
  pendingUploads!: Table<any>; 
  catalog_projects!: Table<ProjectRecord>;
  catalog_fronts!: Table<FrontRecord>;
  catalog_localities!: Table<LocalityRecord>;
  catalog_details!: Table<DetailRecord>;
  catalog_activities!: Table<ActivityRecord>; // <--- Esta faltaba y es clave
  history_cache!: Table<CachedRecord>;

  constructor() {
    super('ReportFlowDB');
    
    // 2. Definimos el esquema (Nombres de tablas y sus índices)
    // NOTA: Si cambias esto, a veces es necesario borrar la BD en el navegador para que se regenere
    this.version(2).stores({ // Subí la versión a 2 para forzar la actualización
      pendingUploads: '++id, timestamp, meta.userId',
      
      // Catálogos (Nombres deben coincidir con las propiedades de arriba)
      catalog_projects: 'ID_Proyectos, Proyecto_Nombre',
      catalog_fronts: 'ID_Frente, ID_Proyecto',
      catalog_localities: 'ID_Localidad, ID_Frente',
      catalog_details: 'ID_DetallesActividad, ID_Localidad',
      catalog_activities: 'ID_Actividad',
      
      // Caché
      history_cache: 'id_registro, id_detalle, fecha_subida'
    });
  }
}

export const db = new MyDatabase();