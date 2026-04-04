import { supabase } from "./supabaseClient";
import { db } from "./db_local";
import type { UserRecord } from "../features/reportFlow/types";

export { supabase };

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
  Nombre_Detalle: string;
};

export type ActivityRecord = {
  ID_Actividad: number;
  Nombre_Actividad: string;
  Grupo: string | null;
  Item: string | null;
  Categoria: string | null;
};

type ProjectAssignmentRecord = {
  id_proyecto: number;
};

const IN_FILTER_CHUNK_SIZE = 200;

const fetchCatalog = async <T>(
  table: string,
  columns: string,
  orderBy: string,
  queryBuilder?: (query: any) => any
) => {
  let allData: T[] = [];
  let from = 0;
  const step = 1000;
  let moreData = true;

  while (moreData) {
    let query = supabase.from(table).select(columns).order(orderBy, { ascending: true });

    if (queryBuilder) {
      query = queryBuilder(query);
    }

    const { data, error } = await query.range(from, from + step - 1);

    if (error) throw error;

    if (data && data.length > 0) {
      allData = [...allData, ...(data as T[])];
      from += step;
      moreData = data.length === step;
    } else {
      moreData = false;
    }
  }

  console.log(`Descarga completa de ${table}: ${allData.length} registros.`);
  return allData;
};

const uniqueNumbers = (values: number[]) => Array.from(new Set(values.filter((value) => Number.isFinite(value))));

const chunkArray = <T>(values: T[], size: number) => {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
};

const fetchCatalogByIds = async <T>(
  table: string,
  columns: string,
  orderBy: string,
  column: string,
  ids: number[]
) => {
  const uniqueIds = uniqueNumbers(ids);
  if (uniqueIds.length === 0) return [] as T[];

  const chunks = chunkArray(uniqueIds, IN_FILTER_CHUNK_SIZE);
  const rows = await Promise.all(
    chunks.map((chunk) =>
      fetchCatalog<T>(table, columns, orderBy, (query) => query.in(column, chunk))
    )
  );

  return rows.flat();
};

export const getAssignedProjectIds = async (userId?: string) => {
  const resolvedUserId = userId ?? (await supabase.auth.getUser()).data.user?.id;
  if (!resolvedUserId) return [];

  const { data, error } = await supabase
    .from("Usuarios_Proyectos")
    .select("id_proyecto")
    .eq("user_id", resolvedUserId);

  if (error) throw error;

  return uniqueNumbers(((data || []) as ProjectAssignmentRecord[]).map((row) => row.id_proyecto));
};

export const getProjectsByIds = (projectIds: number[]) =>
  fetchCatalogByIds<ProjectRecord>(
    "Proyectos",
    "ID_Proyectos, Proyecto_Nombre",
    "Proyecto_Nombre",
    "ID_Proyectos",
    projectIds
  );

export const getAllowedProjects = async (userId?: string) => {
  const assignedProjectIds = await getAssignedProjectIds(userId);
  const projects = await getProjectsByIds(assignedProjectIds);
  return { assignedProjectIds, projects };
};

export const getFrontsByProjectIds = (projectIds: number[]) => {
  return fetchCatalogByIds<FrontRecord>(
    "Frentes",
    "ID_Frente, ID_Proyecto, Nombre_Frente",
    "Nombre_Frente",
    "ID_Proyecto",
    projectIds
  );
};

export const getLocalitiesByFrontIds = (frontIds: number[]) => {
  return fetchCatalogByIds<LocalityRecord>(
    "Localidades",
    "ID_Localidad, ID_Frente, Nombre_Localidad",
    "Nombre_Localidad",
    "ID_Frente",
    frontIds
  );
};

export const getDetailsByLocalityIds = (localityIds: number[]) => {
  return fetchCatalogByIds<DetailRecord>(
    "Detalles Actividad",
    "ID_DetallesActividad, ID_Actividad, ID_Localidad, Latitud, Longitud, Nombre_Detalle",
    "Nombre_Detalle",
    "ID_Localidad",
    localityIds
  );
};

export const getActivitiesByIds = (activityIds: number[]) => {
  return fetchCatalogByIds<ActivityRecord>(
    "Actividades",
    "ID_Actividad, Nombre_Actividad, Grupo, Item, Categoria",
    "Nombre_Actividad",
    "ID_Actividad",
    activityIds
  );
};

export const clearCatalogCache = async () => {
  await db.catalog_projects.clear();
  await db.catalog_fronts.clear();
  await db.catalog_localities.clear();
  await db.catalog_details.clear();
  await db.catalog_activities.clear();
  await db.history_cache.clear();
  await db.activity_properties_cache.clear();
};

export const clearAllLocalData = async () => {
  await db.pendingUploads.clear();
  await db.catalog_projects.clear();
  await db.catalog_fronts.clear();
  await db.catalog_localities.clear();
  await db.catalog_details.clear();
  await db.catalog_activities.clear();
  await db.history_cache.clear();
  await db.activity_properties_cache.clear();
};

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
  Cantidad?: number;
}) => {
  const { data: checked, error: insertError } = await supabase
    .from("Actividad_Verificada")
    .insert([{ ...payload, Cantidad: payload.Cantidad ?? 0 }])
    .select("ID_Verificada")
    .single();

  if (insertError) throw insertError;
  const { data: validacion } = await supabase.rpc("check_metrado_status", { p_detalle_id: payload.ID_DetallesActividad });

  return {
    ...checked,
    excedido: validacion?.excedido || false,
    acumulado: validacion?.total || 0,
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

export type RegistroImagenPayload = {
  ID_Registro: number;
  Orden: number;
  Nombre_Archivo: string;
  URL_Archivo: string;
  Ruta_Archivo: string;
  Bucket: string;
  Es_Principal: boolean;
};

export const createRegistroImagenes = async (payload: RegistroImagenPayload[]) => {
  const { data, error } = await supabase.from("Registro_Imagenes").insert(payload).select();
  if (error) throw error;
  return { data, error };
};

type RegistroRow = {
  ID_Registros: number;
  Fecha_Subida: string;
  URL_Archivo: string | null;
  Comentario: string | null;
  Ruta_Archivo: string | null;
  Bucket: string | null;
  ID_Verificada: number | null;
};

type CheckedActivityRow = {
  ID_Verificada: number;
  ID_DetallesActividad: number | null;
  Latitud: number | null;
  Longitud: number | null;
  Cantidad: number | null;
};

export const fetchUserRecords = async (userId: string): Promise<UserRecord[]> => {
  if (!userId) return [];

  const { data: registros, error: registrosError } = await supabase
    .from("Registros")
    .select("ID_Registros, Fecha_Subida, URL_Archivo, Comentario, Ruta_Archivo, Bucket, ID_Verificada")
    .eq("user_id", userId)
    .order("Fecha_Subida", { ascending: false });

  if (registrosError) throw registrosError;

  const registroRows = (registros || []) as RegistroRow[];
  if (registroRows.length === 0) return [];

  const verificadaIds = registroRows
    .map((record) => record.ID_Verificada)
    .filter((value): value is number => typeof value === "number");

  const checkedById = new Map<number, CheckedActivityRow>();
  if (verificadaIds.length > 0) {
    const { data: checkedRows, error: checkedError } = await supabase
      .from("Actividad_Verificada")
      .select("ID_Verificada, ID_DetallesActividad, Latitud, Longitud, Cantidad")
      .in("ID_Verificada", verificadaIds);

    if (checkedError) throw checkedError;

    for (const row of (checkedRows || []) as CheckedActivityRow[]) {
      checkedById.set(row.ID_Verificada, row);
    }
  }

  const recordIds = registroRows.map((record) => record.ID_Registros);
  const imageCountByRecordId = new Map<number, number>();
  if (recordIds.length > 0) {
    const { data: imageRows, error: imageError } = await supabase
      .from("Registro_Imagenes")
      .select("ID_Registro")
      .in("ID_Registro", recordIds);

    if (imageError) throw imageError;

    for (const row of imageRows || []) {
      const recordId = row.ID_Registro as number | null | undefined;
      if (!recordId) continue;
      imageCountByRecordId.set(recordId, (imageCountByRecordId.get(recordId) || 0) + 1);
    }
  }

  const [details, localities, fronts, projects, activities] = await Promise.all([
    db.catalog_details.toArray(),
    db.catalog_localities.toArray(),
    db.catalog_fronts.toArray(),
    db.catalog_projects.toArray(),
    db.catalog_activities.toArray(),
  ]);

  const detailById = new Map(details.map((detail) => [detail.ID_DetallesActividad, detail]));
  const localityById = new Map(localities.map((locality) => [locality.ID_Localidad, locality]));
  const frontById = new Map(fronts.map((front) => [front.ID_Frente, front]));
  const projectById = new Map(projects.map((project) => [project.ID_Proyectos, project]));
  const activityById = new Map(activities.map((activity) => [activity.ID_Actividad, activity]));

  const mappedRecords = registroRows.map((record) => {
    const checked = record.ID_Verificada ? checkedById.get(record.ID_Verificada) : undefined;
    const detail = checked?.ID_DetallesActividad ? detailById.get(checked.ID_DetallesActividad) : undefined;
    const locality = detail ? localityById.get(detail.ID_Localidad) : undefined;
    const front = locality ? frontById.get(locality.ID_Frente) : undefined;
    const project = front ? projectById.get(front.ID_Proyecto) : undefined;
    const activity = detail ? activityById.get(detail.ID_Actividad) : undefined;

    return {
      id_registro: record.ID_Registros,
      id_verificada: record.ID_Verificada,
      fecha_subida: record.Fecha_Subida,
      url_foto: record.URL_Archivo,
      nombre_actividad: activity?.Nombre_Actividad || "Actividad sin catalogo",
      nombre_localidad: locality?.Nombre_Localidad || "",
      nombre_detalle: detail?.Nombre_Detalle || "",
      nombre_grupo: activity?.Grupo || null,
      nombre_item: activity?.Item || null,
      comentario: record.Comentario,
      ruta_archivo: record.Ruta_Archivo,
      bucket: record.Bucket,
      latitud: checked?.Latitud ?? detail?.Latitud ?? null,
      longitud: checked?.Longitud ?? detail?.Longitud ?? null,
      nombre_proyecto: project?.Proyecto_Nombre,
      nombre_frente: front?.Nombre_Frente,
      total_imagenes: imageCountByRecordId.get(record.ID_Registros) || (record.URL_Archivo ? 1 : 0),
      cantidad: checked?.Cantidad ?? 0,
    };
  });

  console.info("[records] fetchUserRecords", {
    userId,
    registrosCount: registroRows.length,
    mappedCount: mappedRecords.length,
  });

  return mappedRecords;
};

export const getActivityProperties = async () => [];

export const syncHistoryToLocal = async (userId: string) => {
  try {
    if (!userId) return;

    const allowedDetailIds = new Set((await db.catalog_details.toArray()).map((detail) => detail.ID_DetallesActividad));
    await db.history_cache.clear();

    const { data, error } = await supabase
      .from("Registros")
      .select(`
        ID_Registros,
        Fecha_Subida,
        URL_Archivo,
        Comentario,
        user_id,
        Actividad_Verificada!inner ( ID_DetallesActividad )
      `)
      .eq("user_id", userId)
      .order("Fecha_Subida", { ascending: false })
      .limit(500);

    if (error) throw error;

    if (data && data.length > 0) {
      const recordsToCache = data
        .map((record: any) => ({
          id_registro: record.ID_Registros,
          id_detalle: record.Actividad_Verificada ? record.Actividad_Verificada.ID_DetallesActividad : 0,
          fecha_subida: record.Fecha_Subida,
          url_archivo: record.URL_Archivo,
          comentario: record.Comentario || "",
          cantidad: record.Cantidad || 0,
        }))
        .filter((record) => record.id_detalle !== 0 && allowedDetailIds.has(record.id_detalle));

      if (recordsToCache.length > 0) {
        await db.history_cache.bulkPut(recordsToCache);
      }
      console.log(`[SYNC] ${recordsToCache.length} registros historicos cacheados.`);
    }
  } catch (err) {
    console.error("Error sincronizando historial:", err);
  }
};

export const fetchHistoryForDetail = async (detailId: number) => {
  try {
    if (navigator.onLine) {
      console.log("Buscando historial online para:", detailId);
      const { data, error } = await supabase
        .from("Registros")
        .select(`
          *,
          Actividad_Verificada!inner (
            ID_DetallesActividad
          )
        `)
        .eq("Actividad_Verificada.ID_DetallesActividad", detailId)
        .order("Fecha_Subida", { ascending: false });

      if (!error && data) {
        return data;
      }
    }
  } catch (e) {
    console.warn("Fallo red buscando historial, intentando local...");
  }

  try {
    const localRecords = await db.history_cache.where("id_detalle").equals(detailId).reverse().toArray();

    if (localRecords.length > 0) {
      console.log("Historial completo recuperado de Dexie");
      return localRecords.map((record) => ({
        ID_Registros: record.id_registro,
        Fecha_Subida: record.fecha_subida,
        URL_Archivo: record.url_archivo,
        Comentario: record.comentario,
        Actividad_Verificada: { ID_DetallesActividad: record.id_detalle },
      }));
    }
  } catch (err) {
    console.error("Error buscando en cache local:", err);
  }

  return [];
};
