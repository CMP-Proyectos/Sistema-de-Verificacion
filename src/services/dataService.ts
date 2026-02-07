// Importamos la instancia compartida y la DB local
import { supabase } from "./supabaseClient";
import { db } from "./db_local"; 

// ¡IMPORTANTE! Re-exportamos la instancia para que otros archivos puedan usarla
export { supabase };

// Types
export type ProjectRecord = {
  ID_Proyectos: number;
  Proyecto_Nombre: string;
};

export type FrontRecord = {
  ID_Frente: number;
  ID_Proyecto: number;
  Nombre_Frente: string;
};

export type LocalityRecord = {
  ID_Localidad: number;
  ID_Frente: number;
  Nombre_Localidad: string;
};

export type DetailRecord = {
  ID_DetallesActividad: number;
  ID_Actividad: number;
  ID_Localidad: number;
  Latitud: number;
  Longitud: number;
  Cantidad: number | null;
  Nombre_Detalle: string;
};

export type ActivityRecord = {
  ID_Actividad: number;
  Nombre_Actividad: string;
  Categoria: string | null;
};

type ActivityPropertyRow = {
  ID_Actividad: number;
  ID_Propiedad: number;
  Propiedades?: { Propiedad?: string } | null;
};

export type ActivityPropertyDef = {
  ID_Actividad: number;
  ID_Propiedad: number;
  Nombre_Propiedad: string;
};

// Helpers
const fetchCatalog = async <T>(table: string, columns: string, orderBy: string) => {
    let allData: T[] = [];
    let from = 0;
    const step = 1000;
    let moreData = true;

    while (moreData) {
        const { data, error } = await supabase
            .from(table)
            .select(columns)
            .order(orderBy, { ascending: true })
            .range(from, from + step - 1);

        if (error) throw error;

        if (data && data.length > 0) {
            allData = [...allData, ...data as T[]];
            from += step;
            if (data.length < step) {
                moreData = false;
            }
        } else {
            moreData = false;
        }
    }
    
    console.log(`Descarga completa de ${table}: ${allData.length} registros.`);
    return allData;
};

// ==========================================
// SECCIÓN READ (Catálogos)
// ==========================================
export const getAllProjects = () =>
  fetchCatalog<ProjectRecord>("Proyectos", "ID_Proyectos, Proyecto_Nombre", "Proyecto_Nombre");

export const getAllFronts = () =>
  fetchCatalog<FrontRecord>("Frentes", "ID_Frente, ID_Proyecto, Nombre_Frente", "Nombre_Frente");

export const getAllLocalities = () =>
  fetchCatalog<LocalityRecord>("Localidades", "ID_Localidad, ID_Frente, Nombre_Localidad", "Nombre_Localidad");

export const getAllDetails = () =>
  fetchCatalog<DetailRecord>(
    "Detalles Actividad", // Verifica si en tu Supabase se llama "DetallesActividad" o con espacio
    "ID_DetallesActividad, ID_Actividad, ID_Localidad, Latitud, Longitud, Cantidad, Nombre_Detalle",
    "Nombre_Detalle"
  );

export const getAllActivities = () =>
  fetchCatalog<ActivityRecord>("Actividades", "ID_Actividad, Nombre_Actividad, Categoria", "Nombre_Actividad");

export const getAllActivityProperties = async (): Promise<ActivityPropertyDef[]> => {
  const { data, error } = await supabase
    .from("Config_Propiedades_Actividad")
    .select("ID_Actividad, ID_Propiedad, Propiedades (Propiedad)");

  if (error || !data) return [];

  return (data as ActivityPropertyRow[]).map((item) => ({
    ID_Actividad: item.ID_Actividad,
    ID_Propiedad: item.ID_Propiedad,
    Nombre_Propiedad: item.Propiedades?.Propiedad || "Propiedad",
  }));
};

// ==========================================
// SECCIÓN WRITE (Escritura)
// ==========================================
export const uploadEvidence = async (bucket: string, path: string, file: Blob, type: string) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: type,
    upsert: true,
  });
  if (error) throw error;

  const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl.publicUrl;
};

export const createCheckedActivity = async (payload: {
  ID_DetallesActividad: number;
  Latitud: number;
  Longitud: number;
  Cantidad: number;
}) => {
  const { data: checked, error: insertError } = await supabase
    .from("Actividad_Verificada")
    .insert([payload])
    .select("ID_Verificada")
    .single();

  if (insertError) throw insertError;
  const { data: validacion } = await supabase
    .rpc('check_metrado_status', { p_detalle_id: payload.ID_DetallesActividad });

  return {
    ...checked,
    excedido: validacion?.excedido || false,
    acumulado: validacion?.total || 0
  };
};

export const createRegistro = async (payload: {
  Nombre_Archivo: string;
  URL_Archivo: string;
  user_id: string;
  ID_Verificada?: number | null;
  Comentario: string | null;
  Ruta_Archivo: string;
  Bucket: string;
}) => {
  const { data, error } = await supabase.from("Registros").insert(payload).select();
  if (error) throw error;
  return { data, error };
};

// ==========================================
// NUEVO: SECCIÓN HISTORIAL HÍBRIDO (Online/Offline)
// ==========================================

// 1. FUNCIÓN DE SINCRONIZACIÓN (Llama a esto cuando haya internet) 
export const syncHistoryToLocal = async () => {
  try {
    // Descargamos los últimos 500 registros globales
    const { data, error } = await supabase
      .from('Registros')
      .select(`
        ID_Registros,
        Fecha_Subida,
        URL_Archivo,
        Comentario,
        Actividad_Verificada!inner ( ID_DetallesActividad )
      `)
      .order('Fecha_Subida', { ascending: false })
      .limit(500);

    if (error) throw error;

    if (data && data.length > 0) {
      // Transformamos al formato plano de Dexie
      const recordsToCache = data.map(r => ({
        id_registro: r.ID_Registros,
        // Validación de seguridad por si la relación es null
        id_detalle: r.Actividad_Verificada ? r.Actividad_Verificada.ID_DetallesActividad : 0, 
        fecha_subida: r.Fecha_Subida,
        url_archivo: r.URL_Archivo,
        comentario: r.Comentario || ''
      })).filter(r => r.id_detalle !== 0); // Filtramos errores

      // Guardamos en Dexie (Sobrescribe si ya existe por ID)
      await db.history_cache.bulkPut(recordsToCache);
      console.log(`[SYNC] ${recordsToCache.length} registros históricos cacheados.`);
    }
  } catch (err) {
    console.error("⚠️ Error sincronizando historial:", err);
  }
};

// 2. FUNCIÓN DE LECTURA (Devuelve un ARRAY [] de registros)
export const fetchHistoryForDetail = async (detailId: number) => {
    // A. Estrategia ONLINE (Supabase)
    try {
        if (navigator.onLine) {
            console.log("Buscando historial online para:", detailId);
            const { data, error } = await supabase
              .from('Registros')
              .select(`
                *,
                Actividad_Verificada!inner (
                  ID_DetallesActividad
                )
              `)
              .eq('Actividad_Verificada.ID_DetallesActividad', detailId)
              .order('Fecha_Subida', { ascending: false }); // SIN LÍMITE (Trae todos)
          
            if (!error && data) {
                return data; // Devuelve el array completo
            }
        }
    } catch (e) {
        console.warn("Fallo red buscando historial, intentando local...");
    }

    // B. Estrategia OFFLINE (Dexie)
    try {
        const localRecords = await db.history_cache
            .where('id_detalle')
            .equals(detailId)
            .reverse() // Ordenamos del más reciente al más antiguo
            .toArray(); // .toArray() devuelve LISTA, no solo uno

        if (localRecords.length > 0) {
            console.log("⚡ Historial completo recuperado de Dexie");
            // Mapeamos para que la estructura sea idéntica a la de Supabase
            return localRecords.map(rec => ({
                ID_Registros: rec.id_registro,
                Fecha_Subida: rec.fecha_subida,
                URL_Archivo: rec.url_archivo,
                Comentario: rec.comentario,
                Actividad_Verificada: { ID_DetallesActividad: rec.id_detalle }
            }));
        }
    } catch (err) {
        console.error("Error buscando en caché local:", err);
    }

    return []; // Si no hay nada, devuelve array vacío para no romper .map()
};