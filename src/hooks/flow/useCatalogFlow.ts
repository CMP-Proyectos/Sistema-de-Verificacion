import { useState, useCallback, useMemo, useEffect } from "react";
import { db } from "../../services/db_local";
import {
  getAllProjects,
  getAllFronts,
  getAllLocalities,
  getAllDetails,
  getAllActivities,
  ProjectRecord,
  FrontRecord,
  LocalityRecord,
  DetailRecord,
  ActivityRecord,
} from "../../services/dataService";

export type DetailWithActivity = DetailRecord & {
  activityName: string;
  activityGroup: string | null;
  activityItem: string | null;
};

const normalizeText = (value: string) => value.trim().toLowerCase();

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
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityRecord | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<DetailWithActivity | null>(null);

  const [localitySearch, setLocalitySearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [detailSearch, setDetailSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadInitialData = async () => {
      setProjects(await db.catalog_projects.toArray());
      setActivities(await db.catalog_activities.toArray());
    };
    loadInitialData();
  }, []);

  const performFullSync = async () => {
    if (!isOnline) return;
    setSyncStatus("Sincronizando...");
    try {
      console.log("[SYNC] Descargando catálogos remotos");
      const [p, f, l, d, a] = await Promise.all([
        getAllProjects(),
        getAllFronts(),
        getAllLocalities(),
        getAllDetails(),
        getAllActivities(),
      ]);
      console.log("[SYNC] Descarga completada", {
        projects: p.length,
        fronts: f.length,
        localities: l.length,
        details: d.length,
        activities: a.length,
      });

      console.log("[SYNC] Persistiendo proyectos, frentes y localidades");
      await db.transaction("rw", db.catalog_projects, db.catalog_fronts, db.catalog_localities, async () => {
        await db.catalog_projects.clear();
        await db.catalog_projects.bulkPut(p);
        await db.catalog_fronts.clear();
        await db.catalog_fronts.bulkPut(f);
        await db.catalog_localities.clear();
        await db.catalog_localities.bulkPut(l);
      });
      console.log("[SYNC] Persistencia base completada");

      console.log("[SYNC] Persistiendo detalles y actividades");
      await db.transaction("rw", db.catalog_details, db.catalog_activities, async () => {
        await db.catalog_details.clear();
        await db.catalog_details.bulkPut(d);
        await db.catalog_activities.clear();
        await db.catalog_activities.bulkPut(a);
      });
      console.log("[SYNC] Persistencia secundaria completada");

      setProjects(p);
      setActivities(a);
      setSyncStatus("");
    } catch (e) {
      console.error("Sync error", e);
      setSyncStatus("Error Sync");
      throw e;
    }
  };

  const loadProjectsLocal = useCallback(async () => {
    console.log("[SYNC] Leyendo proyectos y actividades locales");
    const [projectsLocal, activitiesLocal] = await Promise.all([
      db.catalog_projects.toArray(),
      db.catalog_activities.toArray(),
    ]);
    console.log("[SYNC] Lectura local completada", {
      projects: projectsLocal.length,
      activities: activitiesLocal.length,
    });
    setProjects(projectsLocal);
    setActivities(activitiesLocal);
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

  const activityMap = useMemo(
    () => new Map(activities.map((activity) => [activity.ID_Actividad, activity])),
    [activities]
  );

  const filteredLocalities = useMemo(() => {
    const query = normalizeText(localitySearch);
    if (!query) return localities;
    return localities.filter((locality) => locality.Nombre_Localidad.toLowerCase().includes(query));
  }, [localities, localitySearch]);

  const detailsForLocality = useMemo(() => details || [], [details]);

  const activityIdsInLocality = useMemo(
    () => Array.from(new Set(detailsForLocality.map((detail) => detail.ID_Actividad))),
    [detailsForLocality]
  );

  const activitiesForLocality = useMemo(
    () => activities.filter((activity) => activityIdsInLocality.includes(activity.ID_Actividad)),
    [activities, activityIdsInLocality]
  );

  const items = useMemo(
    () =>
      Array.from(
        new Set(
          activitiesForLocality
            .map((activity) => activity.Item?.trim())
            .filter((item): item is string => Boolean(item))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [activitiesForLocality]
  );

  const filteredItems = useMemo(() => {
    const query = normalizeText(itemSearch);
    if (!query) return items;
    return items.filter((item) => item.toLowerCase().includes(query));
  }, [items, itemSearch]);

  const activitiesForItem = useMemo(() => {
    if (!selectedItem) return [];
    return activitiesForLocality.filter((activity) => activity.Item === selectedItem);
  }, [activitiesForLocality, selectedItem]);

  const groups = useMemo(
    () =>
      Array.from(
        new Set(
          activitiesForItem
            .map((activity) => activity.Grupo?.trim())
            .filter((group): group is string => Boolean(group))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [activitiesForItem]
  );

  const filteredGroups = useMemo(() => {
    const query = normalizeText(groupSearch);
    if (!query) return groups;
    return groups.filter((group) => group.toLowerCase().includes(query));
  }, [groups, groupSearch]);

  const filteredActivities = useMemo(() => {
    if (!selectedItem || !selectedGroup) return [];
    return activitiesForLocality
      .filter((activity) => activity.Item === selectedItem && activity.Grupo === selectedGroup)
      .sort((a, b) => a.Nombre_Actividad.localeCompare(b.Nombre_Actividad));
  }, [activitiesForLocality, selectedItem, selectedGroup]);

  const groupActivityPreviewMap = useMemo(() => {
    const previews: Record<string, ActivityRecord[]> = {};
    for (const group of groups) {
      previews[group] = activitiesForItem
        .filter((activity) => activity.Grupo === group)
        .sort((a, b) => a.Nombre_Actividad.localeCompare(b.Nombre_Actividad));
    }
    return previews;
  }, [activitiesForItem, groups]);

  const derivedDetails = useMemo(
    () =>
      detailsForLocality
        .filter((detail) => !selectedActivity || detail.ID_Actividad === selectedActivity.ID_Actividad)
        .map((detail) => {
          const activity = activityMap.get(detail.ID_Actividad);
          return {
            ...detail,
            activityName: activity?.Nombre_Actividad ?? "Sin actividad",
            activityGroup: activity?.Grupo ?? null,
            activityItem: activity?.Item ?? null,
          };
        }),
    [activityMap, detailsForLocality, selectedActivity]
  );

  const filteredDetails = useMemo(() => {
    const query = normalizeText(detailSearch);
    const base = query
      ? derivedDetails.filter((detail) =>
          `${detail.Nombre_Detalle} ${detail.activityName} ${detail.activityGroup ?? ""}`.toLowerCase().includes(query)
        )
      : [...derivedDetails];
    return base.sort((a, b) => a.Nombre_Detalle.localeCompare(b.Nombre_Detalle));
  }, [derivedDetails, detailSearch]);

  const selectItem = useCallback((item: string) => {
    setSelectedItem(item);
    setSelectedGroup(null);
    setSelectedActivity(null);
    setSelectedDetail(null);
    setGroupSearch("");
    setDetailSearch("");
    setExpandedGroups({});
  }, []);

  const selectGroup = useCallback((group: string) => {
    setSelectedGroup(group);
    setSelectedActivity(null);
    setSelectedDetail(null);
    setDetailSearch("");
  }, []);

  const selectActivity = useCallback((activity: ActivityRecord) => {
    setSelectedActivity(activity);
    setSelectedDetail(null);
    setDetailSearch("");
  }, []);

  const selectDetail = useCallback((detail: DetailWithActivity) => {
    setSelectedDetail(detail);
  }, []);

  const toggleGroupExpanded = useCallback((group: string) => {
    setExpandedGroups((current) => ({
      ...current,
      [group]: !current[group],
    }));
  }, []);

  const resetSelection = () => {
    setSelectedProjectId(null);
    setSelectedFrontId(null);
    setSelectedLocalityId(null);
    setSelectedItem(null);
    setSelectedGroup(null);
    setSelectedActivity(null);
    setSelectedDetail(null);
    setLocalitySearch("");
    setItemSearch("");
    setGroupSearch("");
    setDetailSearch("");
    setExpandedGroups({});
  };

  return {
    syncStatus,
    projects,
    fronts,
    localities,
    activities,
    filteredLocalities,
    items,
    filteredItems,
    groups,
    filteredGroups,
    filteredActivities,
    filteredDetails,
    selectedProjectId,
    setSelectedProjectId,
    selectedFrontId,
    setSelectedFrontId,
    selectedLocalityId,
    setSelectedLocalityId,
    selectedItem,
    setSelectedItem,
    selectedGroup,
    setSelectedGroup,
    selectedActivity,
    setSelectedActivity,
    selectedDetail,
    setSelectedDetail,
    localitySearch,
    setLocalitySearch,
    itemSearch,
    setItemSearch,
    groupSearch,
    setGroupSearch,
    detailSearch,
    setDetailSearch,
    expandedGroups,
    groupActivityPreviewMap,
    activityMap,
    selectItem,
    selectGroup,
    selectActivity,
    selectDetail,
    toggleGroupExpanded,
    performFullSync,
    loadProjectsLocal,
    loadFrontsLocal,
    loadLocalitiesLocal,
    loadDetailsLocal,
    resetSelection,
  };
}
