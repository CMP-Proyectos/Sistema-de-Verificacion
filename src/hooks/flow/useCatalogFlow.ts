import { useState, useCallback, useMemo, useEffect } from "react";
import { db } from "../../services/db_local";
import { 
  getAllProjects, getAllFronts, getAllLocalities, getAllDetails, getAllActivities, 
  ProjectRecord, FrontRecord, LocalityRecord, DetailRecord, ActivityRecord 
} from "../../services/dataService";

type DetailWithActivity = DetailRecord & { activityName: string };

export function useCatalogFlow(isOnline: boolean) {
  const [syncStatus, setSyncStatus] = useState("");
  
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [fronts, setFronts] = useState<FrontRecord[]>([]);
  const [localities, setLocalities] = useState<LocalityRecord[]>([]);
  const [details, setDetails] = useState<DetailRecord[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedFrontId, setSelectedFrontId] = useState<number | null>(null);
  const [selectedLocalityId, setSelectedLocalityId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<DetailWithActivity | null>(null);
  // Eliminamos selectedActivity si no se usa explícitamente en la UI, o lo mantenemos si lo necesitas
  const [selectedActivity, setSelectedActivity] = useState<ActivityRecord | null>(null);
  
  const [detailSearch, setDetailSearch] = useState("");

  // --- 1. CARGA INICIAL (HÍBRIDA) ---
  // Al iniciar, cargamos lo que haya en local para que la app no arranque vacía
  useEffect(() => {
    const loadInitialData = async () => {
        setProjects(await db.catalog_projects.toArray());
        setActivities(await db.catalog_activities.toArray()); // Carga actividades offline
    };
    loadInitialData();
  }, []);

  // --- 2. SINCRONIZACIÓN (NUBE -> LOCAL) ---
  const performFullSync = async () => {
    if (!isOnline) return;
    setSyncStatus("Sincronizando...");
    try {
        const [p, f, l, d, a] = await Promise.all([ 
            getAllProjects(), 
            getAllFronts(), 
            getAllLocalities(), 
            getAllDetails(), 
            getAllActivities() 
        ]);

        // CORRECCIÓN: Usamos los nombres correctos 'catalog_...'
        await db.transaction('rw', db.catalog_projects, db.catalog_fronts, db.catalog_localities, db.catalog_details, db.catalog_activities, async () => {
            await db.catalog_projects.clear(); await db.catalog_projects.bulkPut(p);
            await db.catalog_fronts.clear(); await db.catalog_fronts.bulkPut(f);
            await db.catalog_localities.clear(); await db.catalog_localities.bulkPut(l);
            await db.catalog_details.clear(); await db.catalog_details.bulkPut(d);
            await db.catalog_activities.clear(); await db.catalog_activities.bulkPut(a);
        });

        // Actualizamos estado visual
        setProjects(p);
        setActivities(a);
        setSyncStatus("");
    } catch (e) { 
        console.error("Sync error", e); 
        setSyncStatus("Error Sync"); 
    }
  };

  // --- 3. CARGA DE DEPENDENCIAS LOCALES ---
  // Estas funciones ahora usan los nombres correctos de las tablas
  const loadProjectsLocal = useCallback(async () => { 
      setProjects(await db.catalog_projects.toArray()); 
  }, []);
  
  const loadFrontsLocal = useCallback(async (pid: number) => { 
      setFronts(await db.catalog_fronts.where("ID_Proyecto").equals(pid).toArray()); 
  }, []);
  
  const loadLocalitiesLocal = useCallback(async (fid: number) => { 
      setLocalities(await db.catalog_localities.where("ID_Frente").equals(fid).toArray()); 
  }, []);
  
  const loadDetailsLocal = useCallback(async (lid: number) => { 
      setDetails(await db.catalog_details.where("ID_Localidad").equals(lid).toArray()); 
  }, []);

  // --- COMPUTED DATA ---
  const activityMap = useMemo(() => new Map((activities||[]).map((a) => [a.ID_Actividad, a])), [activities]);
  
  const derivedDetails = useMemo(() => (details||[]).map((d) => ({ 
    ...d, 
    activityName: activityMap.get(d.ID_Actividad)?.Nombre_Actividad ?? "Cargando..." 
  })), [details, activityMap]);

  const filteredDetails = useMemo(() => { 
      const query = detailSearch.trim().toLowerCase(); 
      
      let result = query 
        ? derivedDetails.filter((d) => `${d.Nombre_Detalle} ${d.activityName}`.toLowerCase().includes(query)) 
        : [...derivedDetails];

      return result.sort((a, b) => a.activityName.localeCompare(b.activityName));

  }, [detailSearch, derivedDetails]);

  const resetSelection = () => {
      setSelectedProjectId(null); setSelectedFrontId(null); setSelectedLocalityId(null); 
      setSelectedDetail(null); setSelectedActivity(null);
  };

  return {
    syncStatus, projects, fronts, localities, activities, derivedDetails, filteredDetails,
    selectedProjectId, setSelectedProjectId,
    selectedFrontId, setSelectedFrontId,
    selectedLocalityId, setSelectedLocalityId,
    selectedDetail, setSelectedDetail,
    selectedActivity, setSelectedActivity,
    detailSearch, setDetailSearch, activityMap,
    performFullSync, loadProjectsLocal, loadFrontsLocal, loadLocalitiesLocal, loadDetailsLocal, resetSelection
  };
}