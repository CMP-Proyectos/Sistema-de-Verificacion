import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  supabase, 
  getAllProjects, getAllFronts, getAllLocalities, getAllDetails, getAllActivities, 
  uploadEvidence, createCheckedActivity, createRegistro, 
  ProjectRecord, FrontRecord, LocalityRecord, DetailRecord, ActivityRecord 
} from "../services/dataService";
import { db, PendingRecord } from "../services/db_local";
import { validarFotoConIA, IAValidationResult } from "../services/GoogleAI"; 
import proj4 from 'proj4';

export type Step = "auth" | "project" | "front" | "locality" | "detail" | "activity" | "map" | "form" | "profile" | "user_records" | "files";

export interface UserRecord { 
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
    nombre_proyecto?: string;
    nombre_frente?: string;
}

export interface ActivitiesTypes { Tipo_Actividad: string; ID_Propiedad: number; Propiedad: string; }
type DetailWithActivity = DetailRecord & { activityName: string };
type GpsLocation = { latitude: number; longitude: number; };

const WGS84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
const utmZones: Record<string, string> = { "17": "+proj=utm +zone=17 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs", "18": "+proj=utm +zone=18 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs", "19": "+proj=utm +zone=19 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs" };

export function useReportFlow() {
  const [step, setStep] = useState<Step>("auth");
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  const [sessionUser, setSessionUser] = useState<{ email: string; id: string } | null>(null);
  
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login"|"signup">("login");

  const [profileName, setProfileName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileCreatedAt, setProfileCreatedAt] = useState("");
  const [profileLastSignInAt, setProfileLastSignInAt] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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

  const [gpsLocation, setGpsLocation] = useState<GpsLocation | null>(null);
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [utmZone, setUtmZone] = useState("19");
  const [utmEast, setUtmEast] = useState("");
  const [utmNorth, setUtmNorth] = useState("");

  const [userRecords, setUserRecords] = useState<UserRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  
  // --- propiedad (pestaña archivos) ---
  const [availableProperties, setAvailableProperties] = useState<ActivitiesTypes[]>([]);
  const [selectedPropId, setSelectedPropId] = useState<number | "">("");
  const [detailText, setDetailText] = useState("");

  // --- propieidad (pestaña mapa / formulario) ---
  const [registerProperties, setRegisterProperties] = useState<ActivitiesTypes[]>([]);
  const [registerPropId, setRegisterPropId] = useState<number | "">("");
  const [registerDetailText, setRegisterDetailText] = useState("");

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [editEvidenceFile, setEditEvidenceFile] = useState<File | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editPreviewUrl, setEditPreviewUrl] = useState("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ type: 'warning' | 'info' | 'success', message: string } | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3500);
  };

  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleStatus = () => { setIsOnline(navigator.onLine); if(navigator.onLine) syncPendingUploads(); };
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    checkSession();
    return () => { window.removeEventListener('online', handleStatus); window.removeEventListener('offline', handleStatus); };
  }, []);

  useEffect(() => {
    if ((step === "profile" || step === "user_records" || step === "files") && sessionUser) { 
        loadProfileData(); 
        if (step !== "profile") loadUserRecords(); 
    }
  }, [step, sessionUser]);

  // --- carga automática de propiedades para registro (solo online) ---
  useEffect(() => {
    const loadRegisterProperties = async () => {
      if ((step === "map" || step === "form") && isOnline && selectedActivity) {
        try {
          const { data } = await supabase.rpc('obtener_propiedades_por_actividad', { 
            nombre_input: selectedActivity.Nombre_Actividad 
          });
          if (data) {
            setRegisterProperties(data.map((x: any) => ({
              Tipo_Actividad: x.nombre_tipo,
              ID_Propiedad: x.id_propiedad,
              Propiedad: x.nombre_propiedad
            })));
          }
        } catch (err) {
          console.error("Error cargando propiedades registro:", err);
        }
      } else {
        setRegisterProperties([]);
      }
    };
    loadRegisterProperties();
  }, [step, selectedActivity, isOnline]);

  const performFullSync = async () => {
    if (!navigator.onLine) return;
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

  const checkSession = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      setSessionUser({ email: data.session.user.email!, id: data.session.user.id });
      const count = await db.projects.count();
      if(count === 0 && navigator.onLine) await performFullSync();
      else if(navigator.onLine) performFullSync().then(loadProjectsLocal);
      await loadProjectsLocal();
      setStep("project");
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      if (authMode === "signup") {
         const { data, error } = await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword.trim() });
         if (error) throw error; if (!data.user) return showToast("Verifica tu correo para continuar", "info");
         setSessionUser({ email: data.user.email!, id: data.user.id });
      } else {
         const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword.trim() });
         if (error) throw error; if (data.user) setSessionUser({ email: data.user.email!, id: data.user.id });
      }
      await performFullSync();
      await loadProjectsLocal();
      setStep("project");
    } catch (e: any) { showToast(e.message || "Error al ingresar", "error"); } finally { setIsLoading(false); }
  };

  const handleLogout = async () => {
    await db.projects.clear(); await db.fronts.clear(); await db.localities.clear(); await db.details.clear();
    await supabase.auth.signOut();
    setSessionUser(null); setStep("auth"); setProjects([]); setIsMenuOpen(false);
  };

  const loadProfileData = async () => {
      const {data} = await supabase.auth.getUser();
      if(data.user) {
          setProfileEmail(data.user.email||"");
          setProfileName(data.user.user_metadata?.full_name||"");
          setProfileLastName(data.user.user_metadata?.last_name||"");
          setProfileCreatedAt(data.user.created_at||"");
          setProfileLastSignInAt(data.user.last_sign_in_at||"");
      }
  };
  const saveProfile = async () => { 
      if(!sessionUser) return; 
      setIsProfileSaving(true); 
      try { await supabase.from('Detalle_Perfil').update({Nombre: profileName, Apellido: profileLastName}).eq('id', sessionUser.id); showToast("Perfil actualizado", "success"); loadProfileData(); } 
      catch { showToast("No se pudo actualizar el perfil", "error"); } 
      finally { setIsProfileSaving(false); } 
  };
  
  const requestDeleteAccount = () => {
      setConfirmModal({
          open: true,
          title: "Eliminar cuenta",
          message: "¿Estás seguro de que quieres eliminar tu cuenta y todos tus datos? Esta acción no se puede deshacer.",
          onConfirm: async () => {
              setConfirmModal(null);
              setIsDeletingAccount(true);
              try { await supabase.rpc("delete_user"); handleLogout(); showToast("Cuenta eliminada", "info"); } 
              catch { showToast("Error al eliminar cuenta", "error"); setIsDeletingAccount(false); }
          }
      });
  };
  
  const loadUserRecords = async () => { if(!sessionUser) return; setIsLoadingRecords(true); try { const {data} = await supabase.rpc('obtener_historial_usuario', { usuario_uid: sessionUser.id }); setUserRecords(data || []); } catch {} finally { setIsLoadingRecords(false); } };
  
  const requestDeleteRecord = (i: UserRecord) => { 
      setConfirmModal({
          open: true,
          title: "Borrar registro",
          message: "¿Deseas eliminar este registro y su foto permanentemente?",
          onConfirm: async () => {
              setConfirmModal(null);
              setIsLoading(true); 
              try { 
                  if(i.bucket && i.ruta_archivo) await supabase.storage.from(i.bucket).remove([i.ruta_archivo]); 
                  await supabase.rpc('eliminar_evidencia_completa', { p_id_registro: i.id_registro }); 
                  await loadUserRecords(); 
                  setSelectedRecordId(null);
                  showToast("Registro eliminado", "success");
              } catch { showToast("Error al eliminar", "error"); } 
              finally { setIsLoading(false); } 
          }
      });
  };

  const handleDownloadCSV = () => { 
      if(!userRecords.length) return showToast("No hay datos para descargar", "info"); 
      const h=["ID","Fecha","Actividad","Localidad","Detalle","Comentario","Latitud","Longitud"]; 
      const r=userRecords.map(i=>[i.id_registro, i.fecha_subida, `"${i.nombre_actividad}"`, `"${i.nombre_localidad}"`, `"${i.nombre_detalle}"`, `"${(i.comentario||'').replace(/"/g, '""')}"`, i.latitud, i.longitud].join(";")); 
      const csvContent = "\uFEFF" + [h.join(";"), ...r].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `data_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Descarga iniciada", "success");
  };

  const saveRecordEdits = async () => {
      const item = userRecords.find(r => r.id_registro === selectedRecordId); if(!item) return; setIsLoading(true);
      try {
          let u=item.url_foto, r=item.ruta_archivo, n=null;
          if(editEvidenceFile && item.bucket) {
              const fn=`ev-${Date.now()}.jpg`; const {data}=await supabase.storage.from(item.bucket).upload(`${item.ruta_archivo?.split('/').slice(0,-1).join('/')}/${fn}`, editEvidenceFile);
              if(data){ const {data:p}=supabase.storage.from(item.bucket).getPublicUrl(data.path); u=p.publicUrl; r=data.path; n=fn; if(item.ruta_archivo) await supabase.storage.from(item.bucket).remove([item.ruta_archivo]); }
          }
          await supabase.from('Registros').update({ Comentario: editComment, ...(editEvidenceFile && { URL_Archivo: u, Ruta_Archivo: r, Nombre_Archivo: n }) }).eq('ID_Registros', item.id_registro);
          showToast("Registro actualizado correctamente", "success");
          setIsPhotoModalOpen(false); setEditEvidenceFile(null); loadUserRecords();
      } catch { showToast("No se pudo actualizar", "error"); } finally { setIsLoading(false); }
  };
  
  const handleGoHome = () => {
      setSelectedProjectId(null); setSelectedFrontId(null); setSelectedLocalityId(null); setSelectedDetail(null); setSelectedActivity(null);
      setGpsLocation(null); setNote(""); setStep("project"); setIsMenuOpen(false);
      // Limpiar datos del formulario de registro
      setRegisterPropId("");
      setRegisterDetailText("");
  };

  const selectProject = (id: number) => { setSelectedProjectId(id); loadFrontsLocal(id); setStep("front"); };
  const selectFront = (id: number) => { setSelectedFrontId(id); loadLocalitiesLocal(id); setStep("locality"); };
  const selectLocality = (id: number) => { setSelectedLocalityId(id); loadDetailsLocal(id); setStep("detail"); };
  const selectDetail = (d: DetailWithActivity) => { setSelectedDetail(d); setSelectedActivity(activityMap.get(d.ID_Actividad) || null); setStep("activity"); };
  
  const goBack = () => { 
      if(step==="front")setStep("project");
      else if(step==="locality")setStep("front");
      else if(step==="detail")setStep("locality");
      else if(step==="activity")setStep("detail");
      else if(step==="map")setStep("activity");
      else if(step==="form")setStep("map");
      else if(step==="profile")setStep("project");
      else if(step==="user_records"||step==="files")setStep("profile");
      else setStep("project");
  };
  
  const handleCaptureGps = () => { 
      if (!navigator.geolocation) return showToast("Tu navegador no soporta GPS", "error"); 
      setIsFetchingGps(true); 
      navigator.geolocation.getCurrentPosition(
          (p) => { setGpsLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude }); setIsFetchingGps(false); showToast("GPS Actualizado", "success"); }, 
          (e) => { showToast(`Error GPS: ${e.message}`, "error"); setIsFetchingGps(false); },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      ); 
  };
  
  const handleUpdateFromUtm = () => { if (!utmEast || !utmNorth) return showToast("Faltan coordenadas UTM", "info"); try { const [lng, lat] = proj4(utmZones[utmZone], WGS84, [Number(utmEast), Number(utmNorth)]); setGpsLocation({ latitude: lat, longitude: lng }); showToast("Ubicación actualizada desde UTM", "success"); } catch { showToast("Coordenadas UTM inválidas", "error"); } };
  const getMapUrl = () => { const lat = gpsLocation?.latitude ?? selectedDetail?.Latitud; const lng = gpsLocation?.longitude ?? selectedDetail?.Longitud; if (!lat || !lng) return null; return `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.005}%2C${lat-0.005}%2C${lng+0.005}%2C${lat+0.005}&layer=mapnik&marker=${lat}%2C${lng}`; };
  
  const handleCaptureFile = async (e: React.ChangeEvent<HTMLInputElement>) => { 
    if (e.target.files?.[0]) { 
        const file = e.target.files[0];
        setEvidenceFile(file); 
        setEvidencePreview(URL.createObjectURL(file)); 
        
        setAiFeedback(null); 
        setIsAnalyzing(true);
        try {
            const nombreActividad = selectedActivity?.Nombre_Actividad || "Actividad de obra";
            const resultado = await validarFotoConIA(file, nombreActividad);
            
            if (resultado.esErrorTecnico) {
                setAiFeedback({ type: 'info', message: "No se pudo validar imagen (Sin conexión). Puedes guardar." });
            } else if (!resultado.aprobado) {
                setAiFeedback({ type: 'warning', message: `La IA detectó: "${resultado.mensaje}". ¿Deseas guardar de todos modos?` });
            } else {
                setAiFeedback({ type: 'success', message: "Imagen verificada correctamente." });
            }
        } catch (err) {
            console.error(err);
            setAiFeedback({ type: 'info', message: "Verificación IA omitida (Error interno)." });
        } finally {
            setIsAnalyzing(false);
        }
    } 
  };

  const saveReport = async () => {
    if (isAnalyzing) return showToast("Espera un momento, analizando imagen...", "info");
    if (!evidenceFile || !sessionUser || !selectedDetail) return showToast("Faltan datos (foto o sector)", "error"); setIsLoading(true);
    const timestamp = Date.now(); const fileName = `evidencia-${timestamp}.jpg`;
    const pName = projects.find(p => p.ID_Proyectos === selectedProjectId)?.Proyecto_Nombre || "default";
    const bucket = pName.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"_"); const path = `uploads/${fileName}`;
    
    try {
        if(navigator.onLine) {
            const pubUrl = await uploadEvidence(bucket, path, evidenceFile, "image/jpeg");
            const checked = await createCheckedActivity({ 
                ID_DetallesActividad: selectedDetail.ID_DetallesActividad, 
                Latitud: gpsLocation?.latitude || selectedDetail.Latitud, 
                Longitud: gpsLocation?.longitude || selectedDetail.Longitud 
            });

            // guardar registro
            const { data: regData, error: regError } = await createRegistro({ 
                Nombre_Archivo: fileName, 
                URL_Archivo: pubUrl, 
                user_id: sessionUser.id, 
                ID_Verificada: checked.ID_Verificada, 
                Comentario: note, 
                Ruta_Archivo: path, 
                Bucket: bucket 
            });

            if (regError) throw regError;

            // guardar atributos si aplica
            const newRecordId = regData && regData[0] ? regData[0].ID_Registros : null;
            if (newRecordId && registerPropId && registerDetailText.trim() !== "") {
                const { error: propError } = await supabase.from('Detalle_Propiedad').insert([{ 
                    ID_Registro: newRecordId, 
                    ID_Propiedad: Number(registerPropId), 
                    Detalle_Propiedad: registerDetailText 
                }]);
                if (propError) console.error("Error guardando propiedad:", propError);
                else showToast("Reporte y atributos guardados", "success");
            } else {
                showToast("Reporte guardado exitosamente", "success");
            }

        } else {
            // offline case (se ignoran atributos)
            const pend: PendingRecord = { 
                timestamp, evidenceBlob: evidenceFile, fileType: "image/jpeg", 
                meta: { bucketName: bucket, fullPath: path, fileName, userId: sessionUser.id, detailId: selectedDetail.ID_DetallesActividad, lat: gpsLocation?.latitude || selectedDetail.Latitud, lng: gpsLocation?.longitude || selectedDetail.Longitud, comment: note } 
            };
            await db.pendingUploads.add(pend);
            showToast("Guardado localmente (Atributos no disponibles offline)", "info");
        }
        
        setStep("map"); setEvidenceFile(null); setEvidencePreview(null); setNote(""); setAiFeedback(null);
        setRegisterPropId(""); setRegisterDetailText(""); // Limpieza de campos

    } catch (err: any) { 
        console.error(err);
        showToast("Ocurrió un error al guardar", "error"); 
    } finally { 
        setIsLoading(false); 
    }
  };
  
  const syncPendingUploads = async () => { const count = await db.pendingUploads.count(); if(count > 0) { const recs = await db.pendingUploads.toArray(); for(const r of recs) { try { const pub = await uploadEvidence(r.meta.bucketName, r.meta.fullPath, r.evidenceBlob, "image/jpeg"); const chk = await createCheckedActivity({ ID_DetallesActividad: r.meta.detailId, Latitud: r.meta.lat, Longitud: r.meta.lng }); await createRegistro({ Nombre_Archivo: r.meta.fileName, URL_Archivo: pub, user_id: r.meta.userId, ID_Verificada: chk.ID_Verificada, Comentario: r.meta.comment, Ruta_Archivo: r.meta.fullPath, Bucket: r.meta.bucketName }); if(r.id) await db.pendingUploads.delete(r.id); } catch {} } } };
  const handleRowClick = async (r: UserRecord) => { setSelectedRecordId(r.id_registro); try { const { data } = await supabase.rpc('obtener_propiedades_por_actividad', { nombre_input: r.nombre_actividad }); if(data) setAvailableProperties(data.map((x:any)=>({Tipo_Actividad:x.nombre_tipo, ID_Propiedad:x.id_propiedad, Propiedad:x.nombre_propiedad}))); } catch {} };
  const handleSaveProperty = async () => { if(!selectedRecordId || !selectedPropId) return; try { await supabase.from('Detalle_Propiedad').insert([{ ID_Registro: selectedRecordId, ID_Propiedad: Number(selectedPropId), Detalle_Propiedad: detailText }]); showToast("Propiedad guardada", "success"); setDetailText(""); } catch { showToast("Error al guardar propiedad", "error"); } };
  const openEditModal = () => { const r = userRecords.find(i => i.id_registro === selectedRecordId); if(r){ setEditComment(r.comentario??""); setEditEvidenceFile(null); setEditPreviewUrl(r.url_foto??""); setIsPhotoModalOpen(true); } };
  const closeEditModal = () => { setIsPhotoModalOpen(false); setEditEvidenceFile(null); };
  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if(e.target.files?.[0]) { setEditEvidenceFile(e.target.files[0]); setEditPreviewUrl(URL.createObjectURL(e.target.files[0])); } };

  const activityMap = useMemo(() => new Map((activities||[]).map((a) => [a.ID_Actividad, a])), [activities]);
  const derivedDetails = useMemo(() => (details||[]).map((d) => ({ ...d, activityName: activityMap.get(d.ID_Actividad)?.Nombre_Actividad ?? "Cargando..." })), [details, activityMap]);
  const filteredDetails = useMemo(() => { const query = detailSearch.trim().toLowerCase(); return query ? derivedDetails.filter((d) => `${d.Nombre_Detalle} ${d.activityName}`.toLowerCase().includes(query)) : derivedDetails; }, [detailSearch, derivedDetails]);
  const selectedActivities = useMemo(() => { if (!selectedDetail) return []; const activity = activityMap.get(selectedDetail.ID_Actividad); return activity ? [activity] : []; }, [activityMap, selectedDetail]);

  return {
    step, setStep, isOnline, isLoading, syncStatus, sessionUser, authEmail, setAuthEmail, authPassword, setAuthPassword, authMode, setAuthMode,
    projects, fronts, localities, derivedDetails, filteredDetails, selectedActivities, selectedDetail, selectedActivity,
    selectProject, selectFront, selectLocality, selectDetail, detailSearch, setDetailSearch,
    gpsLocation, setGpsLocation, evidencePreview, setEvidencePreview, note, setNote, isFetchingGps,
    utmZone, setUtmZone, utmEast, setUtmEast, utmNorth, setUtmNorth, handleUpdateFromUtm, getMapUrl, handleCaptureGps, handleCaptureFile,
    saveReport, profileName, setProfileName, profileLastName, setProfileLastName, profileEmail, setProfileEmail, profileCreatedAt, profileLastSignInAt, profileMessage, isProfileSaving, isDeletingAccount, saveProfile, 
    requestDeleteAccount, 
    userRecords, isLoadingRecords, selectedRecordId, setSelectedRecordId, availableProperties, selectedPropId, setSelectedPropId, detailText, setDetailText, 
    handleDownloadCSV, 
    requestDeleteRecord, 
    handleUpdateRecord: saveRecordEdits, 
    handleRowClick, handleSaveProperty,
    isPhotoModalOpen, openEditModal, closeEditModal, editComment, setEditComment, editPreviewUrl, handleEditFileSelect, saveRecordEdits,
    handleLogin, handleLogout, goBack, handleGoHome,
    isAnalyzing, aiFeedback, toast, confirmModal, setConfirmModal, isMenuOpen, setIsMenuOpen,
    registerProperties, registerPropId, setRegisterPropId, registerDetailText, setRegisterDetailText
  };
}