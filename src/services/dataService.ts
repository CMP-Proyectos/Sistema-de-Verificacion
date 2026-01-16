import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://torwsfbxltzibydrlrqc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_3JI-glaa0JqNcYOucy00kw_c75LwHld";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type ProjectRecord = { ID_Proyectos: number; Proyecto_Nombre: string; };
export type FrontRecord = { ID_Frente: number; ID_Proyecto: number; Nombre_Frente: string; };
export type LocalityRecord = { ID_Localidad: number; ID_Frente: number; Nombre_Localidad: string; };
export type DetailRecord = { ID_DetallesActividad: number; ID_Actividad: number; ID_Localidad: number; Latitud: number; Longitud: number; Cantidad: number | null; Nombre_Detalle: string; };
export type ActivityRecord = { ID_Actividad: number; Nombre_Actividad: string; Categoria: string | null; Unidad: string | null; };

// --- LECTURA MAESTRA ---
// 1. Proyectos
export const getAllProjects = async () => { 
    const { data, error } = await supabase.from("Proyectos").select("ID_Proyectos, Proyecto_Nombre").order("Proyecto_Nombre", { ascending: true });
    if(error) throw error;
    return data as ProjectRecord[]; 
};

// 2. Frentes
export const getAllFronts = async () => { 
    const { data, error } = await supabase.from("Frentes").select("ID_Frente, ID_Proyecto, Nombre_Frente").order("Nombre_Frente", { ascending: true });
    if(error) throw error;
    return data as FrontRecord[]; 
};

// 3. Localidades
export const getAllLocalities = async () => { 
    const { data, error } = await supabase.from("Localidades").select("ID_Localidad, ID_Frente, Nombre_Localidad").order("Nombre_Localidad", { ascending: true });
    if(error) throw error;
    return data as LocalityRecord[]; 
};

// 4. Detalles (Nombre corregido: "Detalles Actividad")
export const getAllDetails = async () => { 
    const { data, error } = await supabase
        .from("Detalles Actividad") // <--- OJO: CON ESPACIO
        .select("ID_DetallesActividad, ID_Actividad, ID_Localidad, Latitud, Longitud, Cantidad, Nombre_Detalle")
        .order("Nombre_Detalle", { ascending: true });
        
    if(error) throw error;
    return data as DetailRecord[]; 
};

// 5. Actividades
export const getAllActivities = async () => { 
    const { data, error } = await supabase.from("Actividades").select("ID_Actividad, Nombre_Actividad, Categoria, Unidad");
    if(error) throw error;
    return data as ActivityRecord[]; 
};

// 6. Propiedades (Bloque try-catch seguro por si la tabla no existe aún)
export const getAllActivityProperties = async () => {
  try {
      const { data, error } = await supabase
        .from('Config_Propiedades_Actividad') // Verifica este nombre en tu Supabase
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
      console.warn("⚠️ Error en carga de propiedades (Omitido)");
      return [];
  }
};

// --- ESCRITURA ---
export const uploadEvidence = async (bucket: string, path: string, file: Blob, type: string) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { contentType: type, upsert: true });
  if (error) throw error;
  const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl.publicUrl;
};

// Nombre corregido: "Actividad_Verificada"
export const createCheckedActivity = async (payload: { ID_DetallesActividad?: number; Latitud: number; Longitud: number; }) => {
  const { data, error } = await supabase
    .from("Actividad_Verificada") // <--- OJO: NOMBRE CORRECTO
    .insert(payload)
    .select("ID_Verificada")
    .single();
    
  if (error) throw error;
  return data;
};

// Modificado para devolver el ID insertado
export const createRegistro = async (payload: { 
    Nombre_Archivo: string; URL_Archivo: string; user_id: string; ID_Verificada?: number | null; 
    Comentario: string | null; Ruta_Archivo: string; Bucket: string; 
}) => {
  const { data, error } = await supabase
    .from("Registros")
    .insert(payload)
    .select(); // <--- CRUCIAL: .select() para devolver el objeto creado

  if (error) throw error;
  return { data, error };
};