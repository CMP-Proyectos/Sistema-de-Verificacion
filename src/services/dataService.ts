import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://torwsfbxltzibydrlrqc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_3JI-glaa0JqNcYOucy00kw_c75LwHld";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- tipos ---
export type ProjectRecord = { ID_Proyectos: number; Proyecto_Nombre: string; };
export type FrontRecord = { ID_Frente: number; ID_Proyecto: number; Nombre_Frente: string; };
export type LocalityRecord = { ID_Localidad: number; ID_Frente: number; Nombre_Localidad: string; };
export type DetailRecord = { ID_DetallesActividad: number; ID_Actividad: number; ID_Localidad: number; Latitud: number; Longitud: number; Cantidad: number | null; Nombre_Detalle: string; };
export type ActivityRecord = { ID_Actividad: number; Nombre_Actividad: string; Categoria: string | null; Unidad: string | null; };

// --- fetch ---
const fetchCatalog = async <T>(table: string, columns: string, orderBy: string) => {
    const { data, error } = await supabase
        .from(table)
        .select(columns)
        .order(orderBy, { ascending: true });
    
    if (error) throw error;
    return data as T[];
};

// --- lectura ---
export const getAllProjects = () => fetchCatalog<ProjectRecord>("Proyectos", "ID_Proyectos, Proyecto_Nombre", "Proyecto_Nombre");
export const getAllFronts = () => fetchCatalog<FrontRecord>("Frentes", "ID_Frente, ID_Proyecto, Nombre_Frente", "Nombre_Frente");
export const getAllLocalities = () => fetchCatalog<LocalityRecord>("Localidades", "ID_Localidad, ID_Frente, Nombre_Localidad", "Nombre_Localidad");
export const getAllDetails = () => fetchCatalog<DetailRecord>("Detalles Actividad", "ID_DetallesActividad, ID_Actividad, ID_Localidad, Latitud, Longitud, Cantidad, Nombre_Detalle", "Nombre_Detalle");
export const getAllActivities = () => fetchCatalog<ActivityRecord>("Actividades", "ID_Actividad, Nombre_Actividad, Categoria, Unidad", "Nombre_Actividad");

// propiedades
export const getAllActivityProperties = async () => {
  try {
      const { data, error } = await supabase
        .from('Config_Propiedades_Actividad')
        .select(`ID_Actividad, ID_Propiedad, Propiedades (Propiedad)`);

      if (error) {
          console.warn("⚠️ Tabla Config_Propiedades_Actividad no encontrada o error:", error.message);
          return [];
      }
      return data.map((item: any) => ({
          ID_Actividad: item.ID_Actividad,
          ID_Propiedad: item.ID_Propiedad,
          Nombre_Propiedad: item.Propiedades?.Propiedad || "Propiedad"
      }));
  } catch (e) {
      console.warn("⚠️ Error en carga de propiedades (Omitido por seguridad)");
      return [];
  }
};

// --- escritura ---
export const uploadEvidence = async (bucket: string, path: string, file: Blob, type: string) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { contentType: type, upsert: true });
  if (error) throw error;
  const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl.publicUrl;
};

// --- verifcación ---
export const createCheckedActivity = async (payload: { ID_DetallesActividad?: number; Latitud: number; Longitud: number; }) => {
  const { data, error } = await supabase.from("Actividad_Verificada").insert(payload).select("ID_Verificada").single();
  if (error) throw error;
  return data;
};
// --- crear reg ---
export const createRegistro = async (payload: { 
    Nombre_Archivo: string; URL_Archivo: string; user_id: string; ID_Verificada?: number | null; 
    Comentario: string | null; Ruta_Archivo: string; Bucket: string; 
}) => {
  const { data, error } = await supabase.from("Registros").insert(payload).select();
  if (error) throw error;
  return { data, error };
};