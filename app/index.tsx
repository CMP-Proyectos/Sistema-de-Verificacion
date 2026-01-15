import type React from "react";
import proj4 from 'proj4';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ActivityRecord,
  DetailRecord,
  FrontRecord,
  LocalityRecord,
  ProjectRecord,
  createCheckedActivity,
  createRegistro,
  getActivities,
  getDetails,
  getFronts,
  getLocalities,
  getProjects,
  uploadEvidence,
} from "../services/dataService";
import { supabase } from "../services/supabaseClient";


interface UserRecord {
  id_registro: number;
  fecha_subida: string;
  url_foto: string | null;
  nombre_actividad: string;
  nombre_localidad: string;
  nombre_detalle: string;
  comentario: string | null;
  ruta_archivo: string | null;
  bucket: string | null;
  latitud: number | null;
  longitud: number | null;
}
interface ActivitiesTypes{
  Tipo_Actividad:string;
  ID_Propiedad:number;
  Propiedad:string;
}

type Step =
  | "auth"
  | "project"
  | "front"
  | "locality"
  | "detail"
  | "activity"
  | "map"
  | "form"
  | "profile"
  | "user_records"
  | "files";

type GpsLocation = {
  latitude: number;
  longitude: number;
};

type DetailWithActivity = DetailRecord & {
  activityName: string;
};

const LOGO_SRC = "https://i.imgur.com/Ej1MRpv.png";

//////////////////////
// main component
////////////////////

export default function IndexPage() {
  //Establecer auth como primer "paso" dentro de la pagina
  const [step, setStep] = useState<Step>("auth");
  //Estados para la autenticación de usuario
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  //Estados para los campos de email, contraseña y guardar la información del usuario en sesión
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionUser, setSessionUser] = useState<{ email: string; id: string } | null>(
    null
  );
  //------------------
  const [profileEmail, setProfileEmail] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileName, setProfileName] = useState("");
  //------------------
  const [profileCreatedAt, setProfileCreatedAt] = useState("");
  const [profileLastSignInAt, setProfileLastSignInAt] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // estados de datos
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [fronts, setFronts] = useState<FrontRecord[]>([]);
  const [localities, setLocalities] = useState<LocalityRecord[]>([]);
  const [details, setDetails] = useState<DetailRecord[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);

  // estados de selección
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedFrontId, setSelectedFrontId] = useState<number | null>(null);
  const [selectedLocalityId, setSelectedLocalityId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<DetailWithActivity | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityRecord | null>(null);
  const [detailSearch, setDetailSearch] = useState("");

  // estados de evidencia
  const [gpsLocation, setGpsLocation] = useState<GpsLocation | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [locationMode, setLocationMode] = useState<"auto" | "manual" | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  //------------------
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  
  // estados de coordenadas manuales y UTM
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [utmZone, setUtmZone] = useState("19");
  const [utmEast, setUtmEast] = useState("");
  const [utmNorth, setUtmNorth] = useState("");

  // estados de historial y edición
  const [userRecords, setUserRecords] = useState<UserRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [editEvidenceFile, setEditEvidenceFile] = useState<File | null>(null);
  const [editComment, setEditComment] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState("");

  const WGS84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
  const utmZones: Record<string, string> = {
    "17": "+proj=utm +zone=17 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs",
    "18": "+proj=utm +zone=18 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs",
    "19": "+proj=utm +zone=19 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs",
  };

  const [availableProperties, setAvailableProperties] = useState<ActivitiesTypes[]>([]);
  const [selectedPropId, setSelectedPropId] = useState<number | "">("");
  const [detailText, setDetailText] = useState("");

  //////////////////////////////////
  // 3. funciones
  //////////////////////////////////

  const getPreviousStep = (current: Step) => {
    switch (current) {
      case "project": return "auth";
      case "front": return "project";
      case "locality": return "front";
      case "detail": return "locality";
      case "activity": return "detail";
      case "map": return "activity";
      case "form": return "map";
      case "profile": return "project";
      case "user_records": return "profile"; // Regresa al perfil
      case "files": return "profile";        // Regresa al perfil
      default: return "auth";
    }
  };

  const isFormValid = useMemo(() => 
    email.trim().length > 0 && password.trim().length > 0 && (authMode === "signup" ? email.trim().length > 0 : true), 
    [authMode, email, password]
  );

  const activityMap = useMemo(() => new Map(activities.map((a) => [a.ID_Actividad, a])), [activities]);

  const mappedDetails = useMemo(() => details.map((d) => ({
    ...d,
    activityName: activityMap.get(d.ID_Actividad)?.Nombre_Actividad ?? "Sin actividad",
  })), [details, activityMap]);

  const filteredDetails = useMemo(() => {
    const query = detailSearch.trim().toLowerCase();
    if (!query) return mappedDetails;
    return mappedDetails.filter((d) => `${d.Nombre_Detalle} ${d.activityName}`.toLowerCase().includes(query));
  }, [detailSearch, mappedDetails]);

  const selectedActivities = useMemo(() => {
    if (!selectedDetail) return [];
    const activity = activityMap.get(selectedDetail.ID_Actividad);
    return activity ? [activity] : [];
  }, [activityMap, selectedDetail]);

  // Funciones de Carga de Datos
  const loadProjects = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch { window.alert("No se pudieron cargar proyectos."); }
    finally { setIsLoadingData(false); }
  }, []);

  const loadProfile = useCallback(async () => {
    setIsProfileLoading(true);
    setProfileMessage(null);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        window.alert("No pudimos cargar el perfil.");
        return;
      }
      setProfileEmail(data.user.email ?? "");
      setProfileName((data.user.user_metadata?.full_name as string | undefined) ?? "");
      setProfileLastName((data.user.user_metadata?.last_name as string | undefined) ?? "");
      setProfileCreatedAt(data.user.created_at ?? "");
      setProfileLastSignInAt(data.user.last_sign_in_at ?? "");
    } catch { window.alert("No pudimos cargar el perfil."); }
    finally { setIsProfileLoading(false); }
  }, []);

  const loadFronts = useCallback(async (projectId: number) => {
    setIsLoadingData(true);
    try {
      const data = await getFronts(projectId);
      setFronts(data);
    } catch { window.alert("No se pudieron cargar frentes."); }
    finally { setIsLoadingData(false); }
  }, []);

  const loadLocalities = useCallback(async (frontId: number) => {
    setIsLoadingData(true);
    try {
      const data = await getLocalities(frontId);
      setLocalities(data);
    } catch { window.alert("No se pudieron cargar localidades."); }
    finally { setIsLoadingData(false); }
  }, []);

  const loadDetails = useCallback(async (localityId: number) => {
    setIsLoadingData(true);
    try {
      const data = await getDetails(localityId);
      setDetails(data);
      const activityIds = Array.from(new Set(data.map((d) => d.ID_Actividad)));
      const activitiesData = await getActivities(activityIds);
      setActivities(activitiesData);
    } catch { window.alert("No se pudieron cargar sectores."); }
    finally { setIsLoadingData(false); }
  }, []);

  // Funciones de autenticación
  const handleSubmit = async () => {
    if (!isFormValid) { window.alert("Completa email y contraseña."); return; }
    setIsAuthLoading(true);
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: password.trim() });
        if (error) { window.alert(error.message || "No se pudo crear la cuenta."); return; }
        if (!data.user) { window.alert("Revisa tu correo para confirmar la cuenta."); return; }
        setSessionUser({ email: data.user.email ?? "usuario", id: data.user.id });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: password.trim() });
        if (error || !data.user) { window.alert("Usuario o contraseña incorrectos."); return; }
        setSessionUser({ email: data.user.email ?? "usuario", id: data.user.id });
      }
      await loadProjects();
      await loadProfile();
      setStep("project");
    } catch { window.alert("No se pudo iniciar sesión."); }
    finally { setIsAuthLoading(false); }
  };

  const handleReset = async () => {
    setStep("auth"); setAuthMode("login"); setEmail(""); setPassword(""); setSessionUser(null);
    setProjects([]); setFronts([]); setLocalities([]); setDetails([]); setActivities([]);
    setGpsLocation(null); setEvidenceFile(null); setEvidencePreview(null); setNote("");
    await supabase.auth.signOut();
  };

  // Funciones de Selección
  const handleGoHome = async () => {
    if (step === "project") return;
    setSelectedProjectId(null); setSelectedFrontId(null); setSelectedLocalityId(null); setSelectedDetail(null); setSelectedActivity(null);
    setStep("project");
  };

  const handleSelectProject = async (id: number) => { setSelectedProjectId(id); await loadFronts(id); setStep("front"); };
  const handleSelectFront = async (id: number) => { setSelectedFrontId(id); await loadLocalities(id); setStep("locality"); };
  const handleSelectLocality = async (id: number) => { setSelectedLocalityId(id); await loadDetails(id); setStep("detail"); };
  const handleSelectDetail = (detail: DetailWithActivity) => { setSelectedDetail(detail); setSelectedActivity(activityMap.get(detail.ID_Actividad) ?? null); setStep("activity"); };
  
  const handleOpenForm = (detail: DetailWithActivity) => {
    setSelectedDetail(detail);
    setSelectedActivity(activityMap.get(detail.ID_Actividad) ?? null);
    setEvidenceFile(null); setEvidencePreview(null);
    setStep("form");
  };

  const handleConfirmActivity = () => {
    if (!selectedDetail) { window.alert("Selecciona un sector."); return; }
    setStep("map");
  };

  // Funciones de Cámara/Archivo
  const handleCapturePhoto = () => { fileInputRef.current?.click(); };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setEvidenceFile(file);
    if (file) setEvidencePreview(URL.createObjectURL(file));
    else setEvidencePreview(null);
  };

  const handleEditCapturePhoto = () => { editFileInputRef.current?.click(); };
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (file) { setEditEvidenceFile(file); setPreviewUrl(URL.createObjectURL(file)); }
    else { setEditEvidenceFile(null); setPreviewUrl(""); }
  };

  // Funciones GPS
  const handleCaptureGps = () => {
    if (locationMode === "manual" || !navigator.geolocation) return;
    setIsFetchingGps(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGpsLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude });
        setManualLat(""); setManualLng(""); setLocationMode("auto"); setIsFetchingGps(false);
      },
      () => { window.alert("No pudimos obtener coordenadas."); setIsFetchingGps(false); }
    );
  };

  const handleManualUpdate = (latInput: number | string, lngInput: number | string) => {
    const lat = typeof latInput === 'number' ? latInput : parseFloat(manualLat);
    const lng = typeof lngInput === 'number' ? lngInput : parseFloat(manualLng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) { window.alert("Coordenadas inválidas."); return; }
    setGpsLocation({ latitude: lat, longitude: lng });
    setLocationMode("manual");
  };

  const handleUpdateFromUtm = () => {
    if (!utmEast || !utmNorth) { window.alert("Faltan coordenadas UTM."); return; }
    try {
      const sourceProj = utmZones[utmZone];
      const [lng, lat] = proj4(sourceProj, WGS84, [Number(utmEast), Number(utmNorth)]);
      setManualLat(lat.toFixed(6)); setManualLng(lng.toFixed(6));
      handleManualUpdate(lat, lng);
    } catch { window.alert("Error al convertir UTM."); }
  };

  const handleClearLocation = () => { setGpsLocation(null); setManualLat(""); setManualLng(""); setLocationMode(null); };

  // Funciones de Guardado
  const buildRegistroUrl = (publicUrl: string) => {
    if (!note.trim() && !gpsLocation) return publicUrl;
    const url = new URL(publicUrl);
    if (note.trim()) url.searchParams.set("comentario", note.trim());
    if (gpsLocation) {
      url.searchParams.set("lat", gpsLocation.latitude.toString());
      url.searchParams.set("lng", gpsLocation.longitude.toString());
    }
    return url.toString();
  };

  const sanitizeName = (t: string | null | undefined) => t ? t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, "_") : "indefinido";
  const formatBucketName = (t: string | null | undefined) => t ? t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, "_") : "sin_nombre";

  const getStorageInfo = () => {
    const p = projects.find(pr => pr.ID_Proyectos === selectedProjectId);
    const f = fronts.find(fr => fr.ID_Frente === selectedFrontId);
    const l = localities.find(lo => lo.ID_Localidad === selectedLocalityId);
    return {
      bucket: p?.Proyecto_Nombre,
      path: `${sanitizeName(f?.Nombre_Frente)}/${sanitizeName(l?.Nombre_Localidad)}/${sanitizeName(selectedDetail?.Nombre_Detalle)}/${sanitizeName(selectedActivity?.Nombre_Actividad)}`,
    };
  };

  const handleSave = async () => {
    if (!selectedDetail || !sessionUser) { window.alert("Selecciona una actividad."); return; }
    if (!evidenceFile) { window.alert("Selecciona una foto."); return; }
    try {
      setIsLoadingData(true);
      const fileName = `evidencia-${Date.now()}.jpg`;
      const sInfo = getStorageInfo();
      const bucket = formatBucketName(sInfo.bucket);
      const filePath = `${sInfo.path}/${fileName}`;
      const url = await uploadEvidence(bucket, filePath, evidenceFile, evidenceFile.type || "image/jpeg");
      const regUrl = buildRegistroUrl(url);
      
      const nuevaAct = await createCheckedActivity({
        ID_DetallesActividad: selectedDetail.ID_DetallesActividad,
        Latitud: gpsLocation ? gpsLocation.latitude : selectedDetail.Latitud,
        Longitud: gpsLocation ? gpsLocation.longitude : selectedDetail.Longitud,
      });

      await createRegistro({
        Nombre_Archivo: fileName, URL_Archivo: regUrl, user_id: sessionUser.id,
        ID_Verificada: nuevaAct.ID_Verificada, Comentario: note.trim() || null,
        Ruta_Archivo: filePath, Bucket: bucket,
      });
      window.alert("Evidencia guardada.");
      setStep("map");
    } catch { window.alert("Error guardando evidencia."); }
    finally { setIsLoadingData(false); }
  };

  // Funciones de Perfil
  const handleProfileSave = async () => {
    if (!sessionUser) return;
    setIsProfileSaving(true);
    setProfileMessage(null);
    try {
      const { error: dbError } = await supabase.from('Detalle_Perfil')
        .update({ Nombre: profileName.trim(), Apellido: profileLastName.trim() })
        .eq('id', sessionUser.id);
      if (dbError) throw dbError;
      
      if (profileEmail.trim() !== sessionUser.email) {
        const { error: authError } = await supabase.auth.updateUser({ email: profileEmail.trim() });
        if (authError) throw authError;
      }
      setProfileMessage("Perfil actualizado.");
      await loadProfile();
    } catch { setProfileMessage("Error actualizando perfil."); }
    finally { setIsProfileSaving(false); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("¿Seguro que deseas eliminar tu cuenta?")) return;
    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.rpc("delete_user");
      if (error) throw error;
      await handleReset();
    } catch { setProfileMessage("Error eliminando cuenta."); }
    finally { setIsDeletingAccount(false); }
  };

  // Funciones de Historial y CSV
  const loadUserRecords = async () => {
    if (!sessionUser) return;
    setIsLoadingRecords(true);
    try {
      const { data } = await supabase.rpc('obtener_historial_usuario', { usuario_uid: sessionUser.id });
      setUserRecords(data || []);
      if (data?.length) setSelectedRecordId(data[0].id_registro);
    } catch { console.error("Error historial"); }
    finally { setIsLoadingRecords(false); }
  };

  const handleDownloadCSV = () => {
    if (!userRecords || userRecords.length === 0) {
      alert("No hay registros para descargar.");
      return;
    }
    const headers = [
      "ID Registro", "Fecha", "Actividad", "Localidad", "Detalle", "Comentario", "Latitud", "Longitud"
    ];
    const rows = userRecords.map(rec => {
      return [
        rec.id_registro,
        `"${rec.fecha_subida || ''}"`,
        `"${rec.nombre_actividad || ''}"`,
        `"${rec.nombre_localidad || ''}"`,
        `"${rec.nombre_detalle || ''}"`,
        `"${(rec.comentario || '').replace(/"/g, '""')}"`,
        rec.latitud,
        rec.longitud
      ].join(";");
    });
    const csvContent = [headers.join(";"), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mis_registros_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetEditModalState = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(""); setEditEvidenceFile(null); setEditComment("");
  };

  const openPhotoModal = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const rec = userRecords.find(r => r.id_registro === selectedRecordId);
    setEditComment(rec?.comentario ?? ""); setEditEvidenceFile(null); setPreviewUrl(rec?.url_foto ?? "");
    setIsPhotoModalOpen(true);
  };

  const closePhotoModal = () => { resetEditModalState(); setIsPhotoModalOpen(false); };

  const handleDelete = async (item: UserRecord) => {
    if (!window.confirm("¿Eliminar evidencia permanentemente?")) return;
    try {
      setIsLoadingData(true);
      if (item.bucket && item.ruta_archivo) await supabase.storage.from(item.bucket).remove([item.ruta_archivo]);
      const { error } = await supabase.rpc('eliminar_evidencia_completa', { p_id_registro: item.id_registro });
      if (error) throw error;
      window.alert("Eliminado.");
      await loadUserRecords();
    } catch { window.alert("Error al eliminar."); }
    finally { setIsLoadingData(false); }
  };

  const handleUpdate = async (item: UserRecord) => {
    if (!editEvidenceFile && editComment === item.comentario) { window.alert("Sin cambios."); return; }
    try {
      setIsLoadingData(true);
      let finalUrl = item.url_foto, finalRuta = item.ruta_archivo, finalNombre = null;
      if (editEvidenceFile) {
        const fileName = `evidencia-${Date.now()}.jpg`;
        const { data: pubData } = await supabase.storage.from(item.bucket!).upload(`${item.ruta_archivo?.split('/').slice(0, -1).join('/') || ''}/${fileName}`, editEvidenceFile);
        if (pubData) {
           const { data: urlData } = supabase.storage.from(item.bucket!).getPublicUrl(pubData.path);
           finalUrl = urlData.publicUrl; finalRuta = pubData.path; finalNombre = fileName;
        }
      }
      await supabase.from('Registros').update({ 
        Comentario: editComment, 
        ...(editEvidenceFile && { URL_Archivo: finalUrl, Ruta_Archivo: finalRuta, Nombre_Archivo: finalNombre }) 
      }).eq('ID_Registros', item.id_registro);
      
      if (editEvidenceFile && item.ruta_archivo) await supabase.storage.from(item.bucket!).remove([item.ruta_archivo]);
      window.alert("Actualizado.");
      resetEditModalState(); setIsPhotoModalOpen(false); await loadUserRecords();
    } catch { window.alert("Error actualizando."); }
    finally { setIsLoadingData(false); }
  };

  const handleRowClick = async (rec: UserRecord) => {
    setSelectedRecordId(rec.id_registro);
    
    setAvailableProperties([]);

    try {
      const { data, error } = await supabase
        .rpc('obtener_propiedades_por_actividad', { 
          nombre_input: rec.nombre_actividad 
        });
      if (error) throw error;
      if (data) {
        const mappedData: ActivitiesTypes[] = data.map((item: any) => ({
          Tipo_Actividad: item.nombre_tipo,
          ID_Propiedad: item.id_propiedad,
          Propiedad: item.nombre_propiedad
        }));
        
        setAvailableProperties(mappedData);
      }

    } catch (error) {
      console.error("Error cargando propiedades:", error);
    } finally {
      
    }
  };

  const handleSaveProperty = async () => {
    if (!selectedRecordId || !selectedPropId || !detailText.trim()) {
      alert("Faltan datos por completar.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('Detalle_Propiedad')
        .insert([
          {
            ID_Registro: selectedRecordId,
            ID_Propiedad: Number(selectedPropId),
            Detalle_Propiedad: detailText
          }
        ]);

      if (error) throw error;

      alert("Propiedad guardada exitosamente");
      setDetailText("");
      setSelectedPropId("");

    } catch (error) {
      console.error("Error guardando propiedad:", error);
      alert("Hubo un error al guardar. Verifica la consola.");
    }
  };

  const mapCoords = useMemo(() => gpsLocation || (selectedDetail ? { lat: selectedDetail.Latitud, lng: selectedDetail.Longitud } : null), [gpsLocation, selectedDetail]);
  const mapEmbedUrl = useMemo(() => {
    if (!mapCoords) return null;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${mapCoords.lng - 0.01}%2C${mapCoords.lat - 0.01}%2C${mapCoords.lng + 0.01}%2C${mapCoords.lat + 0.01}&layer=mapnik&marker=${mapCoords.lat}%2C${mapCoords.lng}`;
  }, [mapCoords]);

  // Effects
  useEffect(() => { 
      if ((step === "profile" || step === "user_records" || step === "files") && sessionUser) { 
          loadProfile(); 
          if (step !== "profile") loadUserRecords();
      }
  }, [step, sessionUser]);

  const recordToUpdate = userRecords.find(record => record.id_registro === selectedRecordId);
  const hasChanges = !!recordToUpdate && (editEvidenceFile !== null || editComment.trim() !== (recordToUpdate.comentario ?? ""));

  ////////////////////////////////
  // 4. render 
  //////////////////////////////////

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h1 style={styles.title}>Reporte de obras</h1>
            {step !== "auth" && (
                <div style={{display: 'flex', gap: '8px'}}>
                    <button onClick={handleGoHome} style={styles.headerButtonOutline}>Inicio</button>
                    <button onClick={() => setStep("profile")} style={styles.profileButton}>Perfil</button>
                </div>
            )}
        </div>
        {step !== "auth" && sessionUser?.email && <p style={styles.userEmail}>Sesión: {sessionUser.email}</p>}
        {step !== "auth" && (
          <div style={styles.breadcrumbs}>
            <span style={selectedProjectId ? styles.breadcrumbActive : styles.breadcrumbMuted}>{selectedProjectId ? projects.find(p => p.ID_Proyectos === selectedProjectId)?.Proyecto_Nombre : "Proyecto"}</span>
            <span style={styles.breadcrumbSeparator}>›</span>
            <span style={selectedFrontId ? styles.breadcrumbActive : styles.breadcrumbMuted}>{selectedFrontId ? fronts.find(f => f.ID_Frente === selectedFrontId)?.Nombre_Frente : "Frente"}</span>
            <span style={styles.breadcrumbSeparator}>›</span>
            <span style={selectedLocalityId ? styles.breadcrumbActive : styles.breadcrumbMuted}>{selectedLocalityId ? localities.find(l => l.ID_Localidad === selectedLocalityId)?.Nombre_Localidad : "Localidad"}</span>
            <span style={styles.breadcrumbSeparator}>›</span>
            <span style={selectedDetail ? styles.breadcrumbActive : styles.breadcrumbMuted}>{selectedDetail?.Nombre_Detalle ?? "Sector"}</span>
            <span style={styles.breadcrumbSeparator}>›</span>
            <span style={selectedActivity ? styles.breadcrumbActive : styles.breadcrumbMuted}>{selectedActivity?.Nombre_Actividad ?? "Actividad"}</span>
          </div>
        )}
        {step !== "auth" && (
          <div style={styles.headerActions}>
            <button onClick={() => setStep(getPreviousStep(step))} style={styles.headerButton}>Atrás</button>
            <button onClick={handleReset} style={styles.headerButtonOutline}>Cerrar sesión</button>
          </div>
        )}
      </div>

      {step === "auth" && (
        <div style={styles.card}>
          <div style={styles.logoRow}><img src={LOGO_SRC} alt="Logo" style={styles.logo} /><span style={styles.logoText}>Consorcio Cenepa Asociados</span></div>
          <h2 style={styles.sectionTitle}>{authMode === "login" ? "Inicia sesión" : "Crear cuenta"}</h2>
          <label style={styles.label}>Email</label>
          <input placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
          <label style={styles.label}>Contraseña</label>
          <input placeholder="Ingresa tu contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />
          <button onClick={handleSubmit} style={isFormValid ? styles.primaryButton : styles.primaryButtonDisabled} disabled={!isFormValid}>{isAuthLoading ? "Cargando..." : (authMode === "login" ? "Ingresar" : "Crear cuenta")}</button>
          <button onClick={() => setAuthMode(m => m === "login" ? "signup" : "login")} style={styles.secondaryButton}>{authMode === "login" ? "Crear cuenta" : "Ya tengo cuenta"}</button>
        </div>
      )}

      {step === "project" && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Selecciona un proyecto</h2>
          <div style={styles.optionGrid}>{projects.map(p => <button key={p.ID_Proyectos} onClick={() => handleSelectProject(p.ID_Proyectos)} style={styles.optionButton}>{p.Proyecto_Nombre}</button>)}</div>
        </div>
      )}

      {step === "front" && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Selecciona un frente</h2>
          <div style={styles.optionGrid}>{fronts.map(f => <button key={f.ID_Frente} onClick={() => handleSelectFront(f.ID_Frente)} style={styles.optionButton}>{f.Nombre_Frente}</button>)}</div>
          <button onClick={() => setStep("project")} style={styles.secondaryButton}>Cambiar proyecto</button>
        </div>
      )}

      {step === "locality" && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Selecciona una localidad</h2>
          <div style={styles.optionGrid}>{localities.map(l => <button key={l.ID_Localidad} onClick={() => handleSelectLocality(l.ID_Localidad)} style={styles.optionButton}>{l.Nombre_Localidad}</button>)}</div>
          <button onClick={() => setStep("front")} style={styles.secondaryButton}>Cambiar frente</button>
        </div>
      )}

      {step === "detail" && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Selecciona un sector</h2>
          <div style={styles.searchBlock}>
            <input placeholder="Buscar..." value={detailSearch} onChange={(e) => setDetailSearch(e.target.value)} style={styles.searchInput} />
            <div style={styles.searchResults}>
              {filteredDetails.length === 0 ? <div style={styles.emptyText}>Sin resultados.</div> : filteredDetails.map(d => (
                <button key={d.ID_DetallesActividad} onClick={() => handleSelectDetail(d)} style={styles.searchOption}>
                  <span style={styles.searchOptionTitle}>{d.Nombre_Detalle}</span><span style={styles.searchOptionMeta}>{d.activityName}</span>
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setStep("locality")} style={styles.secondaryButton}>Cambiar localidad</button>
        </div>
      )}

      {step === "activity" && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Selecciona la actividad</h2>
          <div style={styles.optionGrid}>{selectedActivities.map(a => <button key={a.ID_Actividad} onClick={() => setSelectedActivity(a)} style={styles.optionButton}>{a.Nombre_Actividad}</button>)}</div>
          <button onClick={handleConfirmActivity} style={styles.primaryButton}>Continuar</button>
          <button onClick={() => setStep("detail")} style={styles.secondaryButton}>Cambiar sector</button>
        </div>
      )}

      {step === "map" && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Mapa y ubicación</h2>
          <div style={styles.mapPlaceholder}>
            {mapEmbedUrl ? <iframe title="Mapa" src={mapEmbedUrl} key={mapCoords ? `${mapCoords.lat}-${mapCoords.lng}` : "default"} style={styles.mapFrame} /> : <div style={styles.emptyState}>Sin mapa.</div>}
          </div>
          <div style={styles.locationGrid}>
            <div style={styles.locationCard}>
              <span style={styles.locationTitle}>Automático</span>
              <p style={styles.locationHint}>{gpsLocation ? `${gpsLocation.latitude.toFixed(4)}, ${gpsLocation.longitude.toFixed(4)}` : "Sin datos."}</p>
              <button onClick={handleCaptureGps} style={styles.secondaryButton} disabled={isFetchingGps || locationMode === "manual"}>{isFetchingGps ? "..." : "Usar ubicación"}</button>
            </div>
            <div style={styles.locationCard}>
              <span style={styles.locationTitle}>Coordenadas UTM</span>
              <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                <select value={utmZone} onChange={(e) => setUtmZone(e.target.value)} style={styles.input}>
                    <option value="17">Zona 17S</option><option value="18">Zona 18S</option><option value="19">Zona 19S</option>
                </select>
                <input placeholder="Este (X)" value={utmEast} onChange={(e) => setUtmEast(e.target.value)} style={styles.input} />
                <input placeholder="Norte (Y)" value={utmNorth} onChange={(e) => setUtmNorth(e.target.value)} style={styles.input} />
                <button onClick={handleUpdateFromUtm} style={styles.secondaryButton}>Actualizar</button>
              </div>
            </div>
          </div>
          <button onClick={handleClearLocation} style={styles.ghostButton}>Limpiar ubicación</button>
          {selectedDetail && (
            <button onClick={() => handleOpenForm(selectedDetail)} style={styles.pinCard}>
              <div style={styles.pinHeader}><span style={styles.pinTitle}>{selectedActivity?.Nombre_Actividad}</span><span style={styles.statusPill}>pendiente</span></div>
              <div style={styles.pinMeta}>{selectedDetail.Nombre_Detalle}</div>
              <div style={styles.pinAction}>Registrar evidencia</div>
            </button>
          )}
          <button onClick={() => setStep("activity")} style={styles.secondaryButton}>Cambiar actividad</button>
        </div>
      )}

      {step === "form" && selectedDetail && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Registro en campo</h2>
          <div style={styles.formBlock}>
            <label style={styles.label}>Foto</label>
            <div style={styles.evidenceBox}>{evidencePreview ? <img src={evidencePreview} alt="Evidencia" style={styles.evidenceImage} /> : <span style={styles.emptyText}>Sin foto.</span>}</div>
            
            <input 
                ref={fileInputRef} 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                style={{ display: "none" }} 
            />
            <button onClick={handleCapturePhoto} style={styles.secondaryButton}>Tomar / Seleccionar foto</button>
          </div>
          <div style={styles.formBlock}>
            <label style={styles.label}>Comentario</label>
            <textarea placeholder="Detalle..." value={note} onChange={(e) => setNote(e.target.value)} style={styles.textArea} />
          </div>
          <button onClick={handleSave} style={styles.primaryButton}>{isLoadingData ? "..." : "Guardar"}</button>
          <button onClick={() => setStep("map")} style={styles.secondaryButton}>Volver</button>
        </div>
      )}

      {step === "profile" && (
        <div style={styles.card}>
            <h2 style={{...styles.sectionTitle, marginBottom: '10px'}}>Perfil</h2>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{...styles.label, fontSize: '12px', marginBottom: '4px'}}>Nombre</label>
                <input placeholder="Nombre" value={profileName} onChange={(e) => setProfileName(e.target.value)} style={{...styles.input, marginBottom: 0}} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{...styles.label, fontSize: '12px', marginBottom: '4px'}}>Apellido</label>
                <input placeholder="Apellido" value={profileLastName} onChange={(e) => setProfileLastName(e.target.value)} style={{...styles.input, marginBottom: 0}} />
              </div>
            </div>

            <label style={{...styles.label, fontSize: '12px', marginBottom: '4px'}}>Email</label>
            <input placeholder="tu@email.com" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} style={{...styles.input, marginBottom: '15px'}} />

            <div style={{...styles.readOnlyBlock, padding: '8px', marginBottom: '15px', fontSize: '12px'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={styles.readOnlyLabel}>Creado:</span>
                <span style={styles.readOnlyValue}>{profileCreatedAt ? new Date(profileCreatedAt).toLocaleDateString() : "—"}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={styles.readOnlyLabel}>Último ingreso:</span>
                <span style={styles.readOnlyValue}>{profileLastSignInAt ? new Date(profileLastSignInAt).toLocaleDateString() : "—"}</span>
              </div>
            </div>

            {profileMessage && <div style={styles.profileMessage}>{profileMessage}</div>}
            
            {/* botones perfil */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button onClick={() => setStep("user_records")} style={{...styles.secondaryButton, margin: 0, flex: 1, borderColor: '#0B5FFF', borderWidth: '1px', color: '#64748B'}}>
                    Ver Registros
                </button>
                <button onClick={() => setStep("files")} style={{...styles.secondaryButton, margin: 0, flex: 1, borderColor: '#0B5FFF', borderWidth: '1px', color: '#64748B'}}>
                    Ver Archivos
                </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={handleProfileSave} style={{...styles.primaryButton, flex: 1, margin: 0, ...(isProfileSaving ? styles.primaryButtonDisabled : undefined)}} disabled={isProfileSaving}>
                  {isProfileSaving ? "..." : "Guardar"}
                </button>
            </div>

            <button onClick={handleDeleteAccount} style={{...styles.dangerButton, padding: '8px', fontSize: '12px', marginBottom: '20px', width: '100%'}} disabled={isDeletingAccount}>
              {isDeletingAccount ? "Eliminando..." : "Eliminar cuenta"}
            </button>
        </div>
      )}

      {/* vista de registros ("user_records") */}
      {step === "user_records" && (
          <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Mis Registros (Edición)</h2>
              <p style={styles.sectionHint}>Gestiona tus evidencias subidas.</p>

              <div style={styles.historyContainer}>
                <div style={styles.historyList}>
                    {isLoadingRecords ? (
                        <div style={styles.emptyState}>Cargando...</div>
                    ) : userRecords.length === 0 ? (
                        <div style={styles.emptyState}>No tienes registros aún.</div>
                    ) : (
                        userRecords.map(rec => (
                            <div key={rec.id_registro} onClick={() => setSelectedRecordId(rec.id_registro)} style={selectedRecordId === rec.id_registro ? styles.historyItemActive : styles.historyItem}>
                                <div style={{...styles.searchOptionTitle, fontSize: '13px'}}>{new Date(rec.fecha_subida).toLocaleDateString()}</div>
                                <div style={{...styles.searchOptionMeta, fontSize: '11px'}}>{rec.nombre_actividad.substring(0, 20)}...</div>
                            </div>
                        ))
                    )}
                </div>
                <div style={styles.historyDetail}>
                    {(() => {
                        const selectedRec = userRecords.find(r => r.id_registro === selectedRecordId);
                        if (!selectedRec) return <div style={{padding: '10px', fontSize: '12px', color: '#666'}}>Selecciona un registro de la lista.</div>;
                        return (
                            <>
                            <h4 style={{ ...styles.title, fontSize: "14px", margin: "10px 0 5px" }}>Detalles</h4>
                            <div style={{...styles.detailInfoBox, padding: '0'}}>
                                <div style={{...styles.detailRow, padding: '6px 0'}}>
                                    <span style={{...styles.detailLabel, fontSize: '12px'}}>Actividad:</span>
                                    <span style={{...styles.detailValue, fontSize: '12px'}}>{selectedRec.nombre_actividad}</span>
                                </div>
                                <div style={{...styles.detailRow, padding: '6px 0'}}>
                                    <span style={{...styles.detailLabel, fontSize: '12px'}}>Localidad:</span>
                                    <span style={{...styles.detailValue, fontSize: '12px'}}>{selectedRec.nombre_localidad}</span>
                                </div>
                                <div style={{...styles.detailRow, padding: '6px 0', borderBottom: 'none'}}>
                                    <span style={{...styles.detailLabel, fontSize: '12px'}}>Obs:</span>
                                    <span style={{...styles.detailValue, fontSize: '12px', color: '#0B5FFF'}}>{selectedRec.comentario || "-"}</span>
                                </div>
                            </div>
                            <div style={{ marginTop: '10px' }}>
                                <div style={{ ...styles.evidenceBox, height: 'auto', minHeight: '100px', maxHeight: '150px', padding: '5px', backgroundColor: '#F1F5F9', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    {selectedRec.url_foto ? <img src={selectedRec.url_foto} alt="Evidencia" style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{fontSize: '11px', color: '#999'}}>Sin foto</span>}
                                </div>
                            </div>
                            <div style={{...styles.buttonsRow, marginTop: '10px', paddingBottom: '0'}}>
                                <button style={{ ...styles.dangerButton, marginTop: 0, padding: '8px', fontSize: '12px', flex: 1 }} onClick={() => handleDelete(selectedRec)}>Eliminar</button>
                                <button style={{ ...styles.secondaryButton, marginTop: 0, padding: '8px', fontSize: '12px', flex: 1 }} onClick={openPhotoModal}>Cambiar Foto</button>
                            </div>
                            </>
                        );
                    })()}
                </div>
            </div>
            
            <button onClick={() => setStep("profile")} style={styles.secondaryButton}>Volver al Perfil</button>
          </div>
      )}

      {/* vista de archivos (tabla) */}
      {step === "files" && (
        <div style={styles.card}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
             <h2 style={{...styles.sectionTitle, marginBottom: 0}}>Archivos de Usuario</h2>
             <button onClick={handleDownloadCSV} style={styles.secondaryButtonSmall}>Descargar CSV</button>
          </div>
          <div style={styles.tableContainer}>
            {isLoadingRecords ? (
              <div style={styles.sectionHint}>Cargando registros...</div>
            ) : userRecords.length === 0 ? (
              <div style={styles.sectionHint}>Sin registros para mostrar.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.tableRowHeader}>ID</th>
                    <th style={styles.tableRowHeader}>Actividad</th>
                    <th style={styles.tableRowHeader}>Localidad</th>
                    <th style={styles.tableRowHeader}>Detalle</th>
                    <th style={styles.tableRowHeader}>Comentario</th>
                    <th style={styles.tableRowHeader}>Lat</th>
                    <th style={styles.tableRowHeader}>Lon</th>
                  </tr>
                </thead>
                <tbody>
                  {userRecords.map((rec) => {
                    const isActive = selectedRecordId === rec.id_registro;
                    return (
                      <tr 
                        key={rec.id_registro}
                        onClick={() => handleRowClick(rec)}
                        style={{ 
                          ...styles.tableRow,
                          ...(isActive ? styles.tableRowActive : {})
                        }}
                      >
                        <td style={{ padding: '8px' }}>{rec.id_registro}</td>
                        <td style={{ padding: '8px' }}>{rec.nombre_actividad}</td>
                        <td style={{ padding: '8px' }}>{rec.nombre_localidad}</td>
                        <td style={{ padding: '8px' }}>{rec.nombre_detalle}</td>
                        <td style={{ padding: '8px', color: rec.comentario ? 'inherit' : '#999' }}>
                          {rec.comentario || '-'}
                        </td>
                        <td style={{ padding: '8px', fontSize: '11px' }}>
                          {rec.latitud !== null ? rec.latitud.toFixed(5) : '-'}
                        </td>
                        <td style={{ padding: '8px', fontSize: '11px' }}>
                          {rec.longitud !== null ? rec.longitud.toFixed(5) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <label style={{...styles.label, fontSize: '12px', marginBottom: '4px'}}>Propiedad</label>
          <select 
            value={selectedPropId} 
            onChange={(e) => setSelectedPropId(Number(e.target.value))}
            disabled={!selectedRecordId}
            style={{
              ...styles.input, 
              backgroundColor: !selectedRecordId ? '#f0f0f0' : 'white',
              marginBottom: '10px'
            }}
          >
            <option value="">-- Seleccionar --</option>
            {availableProperties.map((prop) => (
              <option key={prop.ID_Propiedad} value={prop.ID_Propiedad}>
                {prop.Propiedad}
              </option>
            ))}
          </select>
          <label style={{...styles.label, fontSize: '12px', marginBottom: '4px'}}>Detalle de Propiedad</label>
          <input 
            type="text" 
            value={detailText}
            onChange={(e) => setDetailText(e.target.value)}
            placeholder={!selectedRecordId ? "Selecciona un registro arriba..." : "Ej: 3 unidades, color rojo..."}
            disabled={!selectedRecordId}
            style={{
              ...styles.input, 
              backgroundColor: !selectedRecordId ? '#f0f0f0' : 'white',
              marginBottom: '10px'
            }}
          />
          <button onClick={handleSaveProperty} style={styles.secondaryButtonSmall} disabled={!selectedRecordId || !selectedPropId || !detailText.trim()}>
            Guardar Detalle de Propiedad
          </button>
          <button onClick={() => setStep("profile")} style={styles.secondaryButton}>Volver al Perfil</button>
        </div>
      )}

      {isPhotoModalOpen && (
        <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
                <h3>Editar Registro</h3>
                {previewUrl && <img src={previewUrl} style={styles.evidenceImage} />}
                
                <input 
                    ref={editFileInputRef} 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageSelect} 
                    style={{display: 'none'}} 
                />
                
                <button onClick={handleEditCapturePhoto} style={styles.secondaryButton}>Cambiar Foto</button>
                <input value={editComment} onChange={e => setEditComment(e.target.value)} style={styles.input} placeholder="Comentario" />
                <div style={styles.modalButtons}>
                    <button onClick={closePhotoModal} style={styles.secondaryButton}>Cancelar</button>
                    <button 
                        onClick={() => { const rec = userRecords.find(r => r.id_registro === selectedRecordId); if(rec) handleUpdate(rec); }} 
                        disabled={!hasChanges}
                        style={{ ...styles.primaryButton, ...(hasChanges ? {} : styles.primaryButtonDisabled) }}
                    >Guardar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

////////////////////////////////
// 5. styles
////////////////////////////////

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", backgroundColor: "#F5F7FB", fontFamily: "system-ui, -apple-system, sans-serif", paddingBottom: "32px", overflowY: "auto" },
  header: { padding: "24px" },
  headerActions: { display: "flex", gap: "8px", marginTop: "12px" },
  headerButton: { border: "none", backgroundColor: "#0B5FFF", color: "#FFFFFF", padding: "8px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  headerButtonOutline: { border: "1px solid #CBD5F5", backgroundColor: "#FFFFFF", color: "#0B5FFF", padding: "8px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  profileButton: { border: "1px solid #0B5FFF", backgroundColor: "#FFFFFF", color: "#0B5FFF", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, cursor: "pointer" },
  logo: { maxWidth: "160px", width: "100%", height: "64px", objectFit: "contain", display: "block" },
  logoRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", flexWrap: "wrap" },
  logoText: { fontSize: "14px", fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap" },
  title: { fontSize: "26px", fontWeight: 700, color: "#0F172A", marginBottom: "8px" },
  breadcrumbs: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", marginTop: "10px", fontSize: "12px" },
  breadcrumbActive: { color: "#0F172A", fontWeight: 600 },
  breadcrumbMuted: { color: "#94A3B8" },
  breadcrumbSeparator: { color: "#CBD5F5", fontSize: "14px" },
  userEmail: { marginTop: "8px", fontSize: "13px", color: "#0B5FFF", fontWeight: 600 },
  stepRow: { display: "flex", gap: "6px", marginTop: "12px" },
  stepDot: { width: "10px", height: "10px", borderRadius: "999px", backgroundColor: "#CBD5F5" },
  stepDotActive: { backgroundColor: "#0B5FFF" },
  card: { backgroundColor: "#FFFFFF", margin: "0 24px 24px", padding: "20px", borderRadius: "16px", boxShadow: "0 8px 16px rgba(15, 23, 42, 0.08)" },
  sectionTitle: { fontSize: "18px", fontWeight: 700, color: "#0F172A", marginBottom: "6px" },
  sectionHint: { fontSize: "13px", color: "#64748B", marginBottom: "16px" },
  label: { fontSize: "13px", fontWeight: 600, color: "#1E293B", marginBottom: "8px" },
  
  // boxSizing para evitar desbordamiento
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "12px 14px", fontSize: "15px", color: "#0F172A", marginBottom: "16px", backgroundColor: "#F8FAFC" },
  textArea: { width: "100%", boxSizing: "border-box", minHeight: "90px", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", color: "#0F172A", backgroundColor: "#F8FAFC" },
  primaryButton: { width: "100%", boxSizing: "border-box", backgroundColor: "#0B5FFF", color: "#FFFFFF", border: "none", borderRadius: "12px", padding: "14px", fontSize: "16px", fontWeight: 700, cursor: "pointer", marginTop: "12px" },
  primaryButtonDisabled: { backgroundColor: "#94A3B8", cursor: "not-allowed" },
  secondaryButton: { width: "100%", boxSizing: "border-box", marginTop: "12px", border: "1px solid #CBD5F5", borderRadius: "12px", padding: "12px", backgroundColor: "#FFFFFF", color: "#0B5FFF", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
  secondaryButtonSmall: { border: "1px solid #CBD5F5", borderRadius: "10px", padding: "6px 10px", backgroundColor: "#FFFFFF", color: "#0B5FFF", fontSize: "12px", fontWeight: 600, cursor: "pointer" },
  dangerButton: { width: "100%", boxSizing: "border-box", marginTop: "12px", border: "1px solid #FCA5A5", borderRadius: "12px", padding: "12px", backgroundColor: "#FEE2E2", color: "#991B1B", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
  ghostButton: { width: "100%", boxSizing: "border-box", marginBottom: "12px", border: "1px dashed #CBD5F5", borderRadius: "12px", padding: "10px", backgroundColor: "#FFFFFF", color: "#64748B", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  
  optionGrid: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" },
  optionButton: { border: "1px solid #E2E8F0", borderRadius: "12px", padding: "10px 12px", backgroundColor: "#F8FAFC", fontSize: "13px", fontWeight: 600, color: "#0F172A", cursor: "pointer" },
  mapPlaceholder: { borderRadius: "14px", overflow: "hidden", marginBottom: "16px", border: "1px solid #E2E8F0" },
  mapFrame: { width: "100%", height: "220px", border: "0" },
  emptyState: { padding: "16px", fontSize: "13px", color: "#94A3B8", textAlign: "center" },
  pinCard: { width: "100%", boxSizing: "border-box", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "14px", marginBottom: "12px", backgroundColor: "#FFFFFF", textAlign: "left", cursor: "pointer" },
  pinHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" },
  pinTitle: { fontSize: "15px", fontWeight: 700, color: "#0F172A" },
  statusPill: { padding: "4px 10px", borderRadius: "999px", backgroundColor: "#FEF3C7", fontSize: "12px", fontWeight: 600, color: "#0F172A", textTransform: "capitalize" },
  pinMeta: { fontSize: "12px", color: "#475569" },
  pinAction: { marginTop: "6px", fontSize: "12px", color: "#0B5FFF", fontWeight: 600 },
  formBlock: { marginBottom: "16px" },
  evidenceBox: { border: "1px solid #E2E8F0", borderRadius: "12px", padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC", marginBottom: "10px" },
  evidenceImage: { width: "100%", height: "160px", objectFit: "cover", borderRadius: "10px" },
  locationGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "12px" },
  locationCard: { border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px", backgroundColor: "#FFFFFF" },
  locationTitle: { fontSize: "13px", fontWeight: 700, color: "#0F172A", display: "block", marginBottom: "6px" },
  locationHint: { fontSize: "12px", color: "#475569", marginBottom: "12px" },
  emptyText: { fontSize: "12px", color: "#94A3B8" },
  searchBlock: { display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" },
  searchInput: { width: "100%", boxSizing: "border-box", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", color: "#0F172A", backgroundColor: "#F8FAFC" },
  searchResults: { display: "flex", flexDirection: "column", gap: "8px", maxHeight: "260px", overflowY: "auto", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "8px", backgroundColor: "#FFFFFF" },
  searchOption: { border: "1px solid #E2E8F0", borderRadius: "10px", padding: "10px 12px", backgroundColor: "#F8FAFC", textAlign: "left", cursor: "pointer" },
  searchOptionTitle: { display: "block", fontSize: "13px", fontWeight: 600, color: "#0F172A" },
  searchOptionMeta: { display: "block", fontSize: "12px", color: "#64748B", marginTop: "4px" },
  historyContainer: { display: "flex", height: "300px", border: "1px solid #E2E8F0", borderRadius: "14px", overflow: "hidden", marginTop: "16px", backgroundColor: "#FFFFFF" },
  historyList: { width: "40%", borderRight: "1px solid #E2E8F0", overflowY: "auto", backgroundColor: "#F8FAFC" },
  historyDetail: { flex: 1, padding: "12px", overflowY: "auto", backgroundColor: "#FFFFFF", display: "flex", flexDirection: "column", gap: "12px" },
  historyItem: { padding: "10px", borderBottom: "1px solid #E2E8F0", cursor: "pointer", fontSize: "12px" },
  historyItemActive: { backgroundColor: "#FFFFFF", borderLeft: "4px solid #0B5FFF", paddingLeft: "12px" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" },
  modalCard: { backgroundColor: "#FFFFFF", width: "100%", maxWidth: "400px", borderRadius: "16px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", display: "flex", flexDirection: "column", gap: "16px" },
  modalButtons: { display: "flex", gap: "10px", marginTop: "20px", width: "100%" },
  readOnlyBlock: { display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: "16px", padding: "12px", borderRadius: "12px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" },
  readOnlyLabel: { display: "block", fontSize: "12px", color: "#64748B", marginBottom: "4px" },
  readOnlyValue: { fontSize: "13px", fontWeight: 600, color: "#0F172A" },
  profileMessage: { marginTop: "8px", padding: "10px 12px", borderRadius: "10px", backgroundColor: "#F1F5F9", fontSize: "13px", color: "#0F172A" },
  detailInfoBox: { borderRadius: "12px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", padding: "12px" },
  detailRow: { display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #E2E8F0", paddingBottom: "6px", marginBottom: "6px", gap: "12px" },
  detailLabel: { color: "#64748B", fontSize: "12px", fontWeight: 700 },
  detailValue: { color: "#0F172A", fontSize: "13px", fontWeight: 600, textAlign: "right" },
  fileHelperText: { fontSize: "12px", color: "#64748B", textAlign: "center" },

  // Estilos de Tabla Archivos
  tableContainer: { overflowX: "auto", border: "1px solid #ccc", borderRadius: "4px", marginTop: "10px" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  tableHeaderRow: { backgroundColor: "#f5f5f5", textAlign: "left" },
  tableTh: { padding: "8px", borderBottom: "1px solid #ddd" },
  tableRow: { cursor: "pointer", borderBottom: "1px solid #eee", backgroundColor: "transparent" },
  tableRowActive: { backgroundColor: "#e6f7ff" },
  tableRowHeader: { padding: '8px', borderBottom: '1px solid #ddd' },
};

function setIsLoading(arg0: boolean) {
  throw new Error("Function not implemented.");
}