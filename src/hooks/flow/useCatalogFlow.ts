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
  const [selectedActivity, setSelectedActivity] = useState<ActivityRecord | null>(null);
  
  // --- BUSCADORES ---
  const [detailSearch, setDetailSearch] = useState("");
  const [localitySearch, setLocalitySearch] = useState("");

  // --- 1. CARGA INICIAL ---
  useEffect(() => {
    const loadInitialData = async () => {
        setProjects(await db.catalog_projects.toArray());
        setActivities(await db.catalog_activities.toArray()); 
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

        await db.transaction('rw', db.catalog_projects, db.catalog_fronts, db.catalog_localities, db.catalog_details, db.catalog_activities, async () => {
            await db.catalog_projects.clear(); await db.catalog_projects.bulkPut(p);
            await db.catalog_fronts.clear(); await db.catalog_fronts.bulkPut(f);
            await db.catalog_localities.clear(); await db.catalog_localities.bulkPut(l);
            await db.catalog_details.clear(); await db.catalog_details.bulkPut(d);
            await db.catalog_activities.clear(); await db.catalog_activities.bulkPut(a);
        });

        setProjects(p);
        setActivities(a);
        setSyncStatus("");
    } catch (e) { 
        console.error("Sync error", e); 
        setSyncStatus("Error Sync"); 
    }
  };

  // --- 3. CARGA DE DEPENDENCIAS LOCALES ---
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

  // --- COMPUTED DATA (FILTROS) ---
  const activityMap = useMemo(() => new Map((activities||[]).map((a) => [a.ID_Actividad, a])), [activities]);
  
  // 2. NUEVO: Lógica de filtrado para Localidades
  const filteredLocalities = useMemo(() => {
    const query = localitySearch.trim().toLowerCase();
    if (!query) return localities;
    
    return localities.filter(l => 
        l.Nombre_Localidad.toLowerCase().includes(query)
    );
  }, [localities, localitySearch]);

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
      // 3. NUEVO: Limpiamos ambos buscadores al resetear
      setDetailSearch("");
      setLocalitySearch("");
  };

  return {
    syncStatus, projects, fronts, localities, activities, derivedDetails, filteredDetails,
    // Exportamos lo nuevo
    filteredLocalities, localitySearch, setLocalitySearch,
    
    selectedProjectId, setSelectedProjectId,
    selectedFrontId, setSelectedFrontId,
    selectedLocalityId, setSelectedLocalityId,
    selectedDetail, setSelectedDetail,
    selectedActivity, setSelectedActivity,
    detailSearch, setDetailSearch, activityMap,
    performFullSync, loadProjectsLocal, loadFrontsLocal, loadLocalitiesLocal, loadDetailsLocal, resetSelection
  };
}