import { useState, useCallback, useMemo } from "react";
import { db } from "../../services/db_local";
import { getAllProjects, getAllFronts, getAllLocalities, getAllDetails, getAllActivities, ProjectRecord, FrontRecord, LocalityRecord, DetailRecord, ActivityRecord } from "../../services/dataService";

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
  
  const [detailSearch, setDetailSearch] = useState("");

  const performFullSync = async () => {
    if (!isOnline) return;
    setSyncStatus("Sincronizando...");
    try {
        const [p, f, l, d, a] = await Promise.all([ getAllProjects(), getAllFronts(), getAllLocalities(), getAllDetails(), getAllActivities() ]);
        await db.transaction('rw', db.projects, db.fronts, db.localities, db.details, async () => {
            await db.projects.bulkPut(p); await db.fronts.bulkPut(f); await db.localities.bulkPut(l); await db.details.bulkPut(d);
        });
        setActivities(a);
        setSyncStatus("");
    } catch (e) { console.error("Sync error", e); setSyncStatus("Error Sync"); }
  };

  const loadProjectsLocal = useCallback(async () => { setProjects(await db.projects.toArray()); }, []);
  const loadFrontsLocal = useCallback(async (pid: number) => { setFronts(await db.fronts.where("ID_Proyecto").equals(pid).toArray()); }, []);
  const loadLocalitiesLocal = useCallback(async (fid: number) => { setLocalities(await db.localities.where("ID_Frente").equals(fid).toArray()); }, []);
  const loadDetailsLocal = useCallback(async (lid: number) => { setDetails(await db.details.where("ID_Localidad").equals(lid).toArray()); }, []);

  // Computed Data
  const activityMap = useMemo(() => new Map((activities||[]).map((a) => [a.ID_Actividad, a])), [activities]);
  
  const derivedDetails = useMemo(() => (details||[]).map((d) => ({ 
    ...d, 
    activityName: activityMap.get(d.ID_Actividad)?.Nombre_Actividad ?? "Cargando..." 
  })), [details, activityMap]);

  // CORRECCIÓN: Filtrado y ordenamiento por tipo de armado (activityName)
  const filteredDetails = useMemo(() => { 
      const query = detailSearch.trim().toLowerCase(); 
      
      // 1. Filtrar los datos según la búsqueda
      let result = query 
        ? derivedDetails.filter((d) => `${d.Nombre_Detalle} ${d.activityName}`.toLowerCase().includes(query)) 
        : [...derivedDetails];

      // 2. Aplicar Sort por 'activityName' para agrupar postes iguales (EX-01, EX-02 quedarán juntos si son el mismo armado)
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