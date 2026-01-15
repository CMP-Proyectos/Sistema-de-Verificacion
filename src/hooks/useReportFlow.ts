import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../services/supabaseClient";
import { db, PendingRecord } from "../services/db_local";
import {
  getProjects,
  getFronts,
  getLocalities,
  getDetails,
  getActivities,
  uploadEvidence,
  createCheckedActivity,
  createRegistro,
  ProjectRecord,
  FrontRecord,
  LocalityRecord,
  DetailRecord,
  ActivityRecord,
  RegistroPayload
} from "../services/dataService";

// Tipos auxiliares para el flujo
export type Step =
  | "auth" | "project" | "front" | "locality" | "detail"
  | "activity" | "map" | "form" | "profile" | "user_records" | "files";

type DetailWithActivity = DetailRecord & { activityName: string };

export function useReportFlow() {
  // --- Estados de Control ---
  const [step, setStep] = useState<Step>("auth");
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [isLoading, setIsLoading] = useState(false);
  
  // --- Estados de Autenticación ---
  const [sessionUser, setSessionUser] = useState<{ email: string; id: string } | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  // --- Estados de Datos (Listas) ---
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [fronts, setFronts] = useState<FrontRecord[]>([]);
  const [localities, setLocalities] = useState<LocalityRecord[]>([]);
  const [details, setDetails] = useState<DetailRecord[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);

  // --- Estados de Selección ---
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedFrontId, setSelectedFrontId] = useState<number | null>(null);
  const [selectedLocalityId, setSelectedLocalityId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<DetailWithActivity | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityRecord | null>(null);

  // --- Estados del Formulario Final ---
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [note, setNote] = useState("");

  // --- 1. Listener de Conexión y Sincronización ---
  useEffect(() => {
    const handleStatusChange = () => {
      const status = navigator.onLine;
      setIsOnline(status);
      if (status) syncPendingUploads(); // Si vuelve internet, intenta subir pendientes
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    // Chequeo inicial de sesión
    checkSession();

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  // --- 2. Funciones "Core" de Caché (Offline-First) ---
  
  /**
   * Patrón Genérico: Intenta bajar de internet -> Guarda en Dexie.
   * Si falla o no hay internet -> Lee de Dexie.
   */
  const loadWithCache = async <T>(
    remoteFetcher: () => Promise<T[]>,
    localTable: any, // Tabla de Dexie
    queryFn?: (table: any) => Promise<T[]> // Función opcional para filtrar en Dexie
  ): Promise<T[]> => {
    setIsLoading(true);
    try {
      if (navigator.onLine) {
        // ONLINE: Bajar, limpiar tabla local específica y guardar nuevos
        const data = await remoteFetcher();
        // Nota: En producción real, usa transacciones para no borrar todo si no es necesario,
        // pero para mantener simpleza limpiamos y llenamos.
        try {
          // Limpiamos solo si vamos a rellenar con datos frescos relacionados
          // (Para optimizar, podrías hacer un 'put' masivo sin clear, pero 'clear' asegura que no queden huerfanos)
           /* OJO: Si limpiamos 'fronts' al cargar un proyecto, borramos frentes de OTROS proyectos.
              Para este ejemplo simple, asumiremos que si hay internet traemos lo fresco.
              Si estás offline, usas lo que hay. */
           if (localTable === db.projects) await localTable.clear(); 
           // Para tablas dependientes (fronts, etc) es mejor usar bulkPut para actualizar/insertar
           await localTable.bulkPut(data);
        } catch (e) {
          console.warn("Error escribiendo caché Dexie:", e);
        }
        return data;
      } else {
        throw new Error("Offline");
      }
    } catch (error) {
      // OFFLINE O ERROR: Leer de Dexie
      console.log("Modo Offline: Leyendo de Dexie...");
      if (queryFn) {
        return await queryFn(localTable);
      }
      return await localTable.toArray();
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. Carga de Datos Específicos ---

  const loadProjects = useCallback(async () => {
    const data = await loadWithCache(
      getProjects,
      db.projects
    );
    setProjects(data);
  }, []);

  const loadFronts = useCallback(async (projectId: number) => {
    const data = await loadWithCache(
      () => getFronts(projectId),
      db.fronts,
      (table) => table.where("ID_Proyecto").equals(projectId).toArray()
    );
    setFronts(data);
  }, []);

  const loadLocalities = useCallback(async (frontId: number) => {
    const data = await loadWithCache(
      () => getLocalities(frontId),
      db.localities,
      (table) => table.where("ID_Frente").equals(frontId).toArray()
    );
    setLocalities(data);
  }, []);

  const loadDetails = useCallback(async (localityId: number) => {
    // 1. Obtener detalles (Sectores)
    const detailsData = await loadWithCache(
      () => getDetails(localityId),
      db.details,
      (table) => table.where("ID_Localidad").equals(localityId).toArray()
    );
    setDetails(detailsData);

    // 2. Obtener Actividades relacionadas (Esto es un poco más complejo offline)
    //    Si estamos online, las bajamos por IDs. Si estamos offline, esperamos que ya estén cacheadas?
    //    Para simplificar: Si estamos online, bajamos actividades y las guardamos en una tabla 'activities' (que podrías agregar a db_local si quieres persistencia total)
    //    Por ahora, lo dejaremos en memoria o petición directa si hay red.
    if (detailsData.length > 0) {
      const activityIds = Array.from(new Set(detailsData.map((d) => d.ID_Actividad)));
      // Nota: Si quieres full offline de actividades, necesitarías tabla 'activities' en Dexie.
      // Asumiremos online para actividades por ahora o caché básico de navegador.
      if (navigator.onLine) {
        const acts = await getActivities(activityIds);
        setActivities(acts);
      }
    }
  }, []);

  // --- 4. Gestión de Sesión ---
  const checkSession = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      setSessionUser({ email: data.session.user.email!, id: data.session.user.id });
      loadProjects();
      setStep("project");
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword.trim(),
      });
      if (error) throw error;
      if (data.user) {
        setSessionUser({ email: data.user.email!, id: data.user.id });
        await loadProjects();
        setStep("project");
      }
    } catch (e: any) {
      alert(e.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setStep("auth");
    // Limpiamos estados
    setProjects([]);
    setSelectedProjectId(null);
  };

  // --- 5. Lógica de Selección y Navegación ---

  const selectProject = (id: number) => {
    setSelectedProjectId(id);
    loadFronts(id);
    setStep("front");
  };

  const selectFront = (id: number) => {
    setSelectedFrontId(id);
    loadLocalities(id);
    setStep("locality");
  };

  const selectLocality = (id: number) => {
    setSelectedLocalityId(id);
    loadDetails(id);
    setStep("detail");
  };

  const selectDetail = (detail: DetailRecord) => {
    // Mapear nombre actividad
    const actName = activities.find(a => a.ID_Actividad === detail.ID_Actividad)?.Nombre_Actividad || "Cargando...";
    setSelectedDetail({ ...detail, activityName: actName });
    const act = activities.find(a => a.ID_Actividad === detail.ID_Actividad) || null;
    setSelectedActivity(act);
    setStep("activity");
  };

  const goBack = () => {
    switch (step) {
      case "project": return; // No sale al login con back, usa logout
      case "front": setStep("project"); break;
      case "locality": setStep("front"); break;
      case "detail": setStep("locality"); break;
      case "activity": setStep("detail"); break;
      case "map": setStep("activity"); break;
      case "form": setStep("map"); break;
      default: setStep("project");
    }
  };

  // --- 6. Guardado (Híbrido: Online / PendingUploads) ---

  const sanitizeName = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, "_");

  const saveReport = async () => {
    if (!evidenceFile || !sessionUser || !selectedDetail || !selectedActivity) return alert("Faltan datos");

    setIsLoading(true);
    const timestamp = Date.now();
    const fileName = `evidencia-${timestamp}.jpg`;
    
    // Construir metadatos
    const projectObj = projects.find(p => p.ID_Proyectos === selectedProjectId);
    const frontObj = fronts.find(f => f.ID_Frente === selectedFrontId);
    const localityObj = localities.find(l => l.ID_Localidad === selectedLocalityId);
    
    const bucketName = sanitizeName(projectObj?.Proyecto_Nombre || "default");
    const folderPath = `${sanitizeName(frontObj?.Nombre_Frente || "")}/${sanitizeName(localityObj?.Nombre_Localidad || "")}/${sanitizeName(selectedDetail.Nombre_Detalle)}/${sanitizeName(selectedActivity.Nombre_Actividad)}`;
    const fullPath = `${folderPath}/${fileName}`;

    try {
      if (navigator.onLine) {
        // --- MODO ONLINE ---
        // 1. Subir Foto
        const publicUrl = await uploadEvidence(bucketName, fullPath, evidenceFile, "image/jpeg");
        
        // 2. Registrar Actividad Verificada
        const verifiedData = await createCheckedActivity({
          ID_DetallesActividad: selectedDetail.ID_DetallesActividad,
          Latitud: gpsLocation?.latitude || selectedDetail.Latitud,
          Longitud: gpsLocation?.longitude || selectedDetail.Longitud,
        });

        // 3. Crear Registro Final
        await createRegistro({
          Nombre_Archivo: fileName,
          URL_Archivo: publicUrl,
          user_id: sessionUser.id,
          ID_Verificada: verifiedData.ID_Verificada,
          Comentario: note,
          Ruta_Archivo: fullPath,
          Bucket: bucketName
        });

        alert("¡Registro guardado y sincronizado!");
      } else {
        // --- MODO OFFLINE ---
        // Guardamos todo lo necesario para replicar el proceso arriba cuando vuelva internet
        const pendingData: PendingRecord = {
          timestamp,
          evidenceBlob: evidenceFile, // Dexie soporta Blobs/Files
          fileType: "image/jpeg",
          meta: {
            bucketName,
            fullPath,
            fileName,
            userId: sessionUser.id,
            detailId: selectedDetail.ID_DetallesActividad,
            lat: gpsLocation?.latitude || selectedDetail.Latitud,
            lng: gpsLocation?.longitude || selectedDetail.Longitud,
            comment: note
          }
        };

        await db.pendingUploads.add(pendingData);
        alert("Sin internet. Guardado en dispositivo. Se subirá cuando recuperes conexión.");
      }

      // Reset y volver al mapa o lista
      setEvidenceFile(null);
      setEvidencePreview(null);
      setNote("");
      setStep("map");

    } catch (error) {
      console.error(error);
      alert("Error al guardar. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 7. Sincronización en Segundo Plano ---
  const syncPendingUploads = async () => {
    const pendingCount = await db.pendingUploads.count();
    if (pendingCount === 0) return;

    console.log(`Intentando sincronizar ${pendingCount} registros...`);
    const records = await db.pendingUploads.toArray();

    for (const record of records) {
      try {
        const { meta, evidenceBlob } = record;
        
        // 1. Subir Foto
        const publicUrl = await uploadEvidence(meta.bucketName, meta.fullPath, evidenceBlob, "image/jpeg");
        
        // 2. Registrar (Replicar lógica)
        const verifiedData = await createCheckedActivity({
          ID_DetallesActividad: meta.detailId,
          Latitud: meta.lat,
          Longitud: meta.lng,
        });

        await createRegistro({
          Nombre_Archivo: meta.fileName,
          URL_Archivo: publicUrl,
          user_id: meta.userId,
          ID_Verificada: verifiedData.ID_Verificada,
          Comentario: meta.comment,
          Ruta_Archivo: meta.fullPath,
          Bucket: meta.bucketName
        });

        // 3. Si tiene éxito, borrar de Dexie
        if (record.id) await db.pendingUploads.delete(record.id);

      } catch (e) {
        console.error("Error sincronizando registro ID:", record.id, e);
        // No borramos si falla, para reintentar luego
      }
    }
    console.log("Sincronización finalizada.");
  };

  // --- Helpers UI ---
  const handleCaptureFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEvidenceFile(file);
      setEvidencePreview(URL.createObjectURL(file));
    }
  };

  const activityMap = useMemo(() => new Map(activities.map((a) => [a.ID_Actividad, a])), [activities]);
  
  const derivedDetails = useMemo(() => details.map((d) => ({
    ...d,
    activityName: activityMap.get(d.ID_Actividad)?.Nombre_Actividad ?? "Cargando...",
  })), [details, activityMap]);

  return {
    // State
    step, setStep,
    isOnline, isLoading,
    sessionUser, authEmail, setAuthEmail, authPassword, setAuthPassword,
    
    // Data
    projects, fronts, localities, derivedDetails, activities,
    
    // Selections
    selectedProjectId, selectedFrontId, selectedLocalityId, selectedDetail, selectedActivity,
    
    // Form inputs
    gpsLocation, setGpsLocation,
    evidencePreview, note, setNote,
    
    // Actions
    handleLogin, handleLogout,
    selectProject, selectFront, selectLocality, selectDetail,
    saveReport, goBack, handleCaptureFile
  };
}