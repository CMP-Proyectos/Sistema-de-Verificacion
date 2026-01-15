import { supabase } from "./supabaseClient";

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
  Unidad: string | null;
};

export type CheckedActivities = {
  ID_DetallesActividad?: number;
  Latitud: number;
  Longitud: number;
};

export type RegistroPayload = {
  Nombre_Archivo: string;
  URL_Archivo: string;
  user_id: string;
  ID_Verificada?: number | null;
  Comentario: string | null;
  Ruta_Archivo: string;
  Bucket: string;
};
//Conseguir lista de proyectos de la base de datos
export async function getProjects() {
  const { data, error } = await supabase
    .from("Proyectos")
    .select("ID_Proyectos, Proyecto_Nombre")
    .order("Proyecto_Nombre", { ascending: true });

  if (error) {
    throw error;
  }

  return data as ProjectRecord[];
}
//Conseguir lista de frentes de un proyecto específico
export async function getFronts(projectId: number) {
  const { data, error } = await supabase
    .from("Frentes")
    .select("ID_Frente, ID_Proyecto, Nombre_Frente")
    .eq("ID_Proyecto", projectId)
    .order("Nombre_Frente", { ascending: true });

  if (error) {
    throw error;
  }

  return data as FrontRecord[];
}
//Conseguir lista de localidades de un frente específico
export async function getLocalities(frontId: number) {
  const { data, error } = await supabase
    .from("Localidades")
    .select("ID_Localidad, ID_Frente, Nombre_Localidad")
    .eq("ID_Frente", frontId)
    .order("Nombre_Localidad", { ascending: true });

  if (error) {
    throw error;
  }

  return data as LocalityRecord[];
}
//Conseguir lista de detalles de actividades de una localidad específica
export async function getDetails(localityId: number) {
  const { data, error } = await supabase
    .from("Detalles Actividad")
    .select(
      "ID_DetallesActividad, ID_Actividad, ID_Localidad, Latitud, Longitud, Cantidad, Nombre_Detalle"
    )
    .eq("ID_Localidad", localityId)
    .order("Nombre_Detalle", { ascending: true });

  if (error) {
    throw error;
  }

  return data as DetailRecord[];
}
//Conseguir lista de todas las actividades registradas en la base de datos
export async function getActivities(activityIds: number[]) {
  if (activityIds.length === 0) {
    return [] as ActivityRecord[];
  }

  const { data, error } = await supabase
    .from("Actividades")
    .select("ID_Actividad, Nombre_Actividad, Categoria, Unidad")
    .in("ID_Actividad", activityIds);

  if (error) {
    throw error;
  }

  return data as ActivityRecord[];
}

export const createCheckedActivity = async (payload: CheckedActivities) => {
  const { data, error } = await supabase
    .from("Actividad_Verificada")
    .insert(payload)
    .select("ID_Verificada") 
    .single();

  if (error) throw error;
  return data; 
};

export async function uploadEvidence(
  bucket: string,
  filePath: string,
  file: Blob,
  contentType: string
) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { contentType, upsert: true });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function createRegistro(payload: RegistroPayload) {
  const { error } = await supabase.from("Registros").insert(payload);

  if (error) {
    throw error;
  }
}