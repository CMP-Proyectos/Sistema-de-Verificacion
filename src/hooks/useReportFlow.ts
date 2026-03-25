import { useState, useEffect, useCallback } from "react";
import { uploadEvidence, createCheckedActivity, createRegistro, supabase, fetchHistoryForDetail } from "../services/dataService";
import { db, PendingRecord } from "../services/db_local";
import { Step, ToastState, ConfirmModalState } from "../features/reportFlow/types";

import { useSessionFlow } from "./flow/useSessionFlow";
import { useCatalogFlow } from "./flow/useCatalogFlow";
import { useEvidenceFlow } from "./flow/useEvidenceFlow";
import { useRecordsFlow } from "./flow/useRecordsFlow";

const MASTER_BUCKET = "Remodelacion_Tacna"; 
const sanitizeName = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();

export function useReportFlow() {
  const [step, setStep] = useState<Step>("auth");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [previousRecord, setPreviousRecord] = useState<any>(null);

  const showToast = (msg: string, type: 'success'|'error'|'info' = 'success') => {
      setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const session = useSessionFlow(showToast, setConfirmModal, () => setStep("auth"));
  const catalog = useCatalogFlow(session.isOnline);
  const evidence = useEvidenceFlow(showToast, catalog.selectedActivity, session.isOnline);
  const records = useRecordsFlow(session.sessionUser?.id, showToast, setConfirmModal, session.setIsLoading, MASTER_BUCKET);

  const syncStatus = session.isOnline ? "ONLINE" : "OFFLINE";

  // --- CONSULTA ON-DEMAND ---
  useEffect(() => {
    const checkPreviousRecord = async () => {
      if (!catalog.selectedDetail || !session.isOnline) {
        setPreviousRecord(null);
        return;
      }
      try {
        const record = await fetchHistoryForDetail(catalog.selectedDetail.ID_DetallesActividad);
        setPreviousRecord(record);
      } catch (err) {
        console.error("Error consultando registro previo:", err);
        setPreviousRecord(null);
      }
    };
    checkPreviousRecord();
  }, [catalog.selectedDetail, session.isOnline]);

  const isAlreadyRegistered = !!previousRecord;

  // --- SINCRONIZACIÓN ---
  const syncPendingUploads = useCallback(async () => { 
      try {
          const count = await db.pendingUploads.count(); 
          if(count > 0) { 
              showToast(`Subiendo ${count} pendientes...`, "info");
              const recs = await db.pendingUploads.toArray(); 
              
              for(const r of recs) { 
                  try { 
                      console.log("[SYNC] Procesando:", r.meta.fileName);
                      const targetBucket = MASTER_BUCKET; 
                      const pub = await uploadEvidence(targetBucket, r.meta.fullPath, r.evidenceBlob, "image/jpeg"); 
                      
                      const chk = await createCheckedActivity({ 
                          ID_DetallesActividad: r.meta.detailId, 
                          Latitud: r.meta.lat, 
                          Longitud: r.meta.lng,
                          Cantidad: r.meta.quantity || 0
                      }); 
                      
                      await createRegistro({ 
                          Nombre_Archivo: r.meta.fileName, 
                          URL_Archivo: pub, 
                          user_id: r.meta.userId, 
                          ID_Verificada: chk.ID_Verificada, 
                          Comentario: r.meta.comment, 
                          Valor: r.meta.propertyValue || null,
                          Ruta_Archivo: r.meta.fullPath,
                          Bucket: targetBucket
                      });
                      
                      if(r.id) await db.pendingUploads.delete(r.id); 
                  } catch (err: any) { console.error(`[SYNC ERROR]`, err); } 
              }
              showToast("Sincronización finalizada", "success");
              if(step === "user_records" && session.sessionUser) records.loadUserRecords();
          } 
      } catch (e) { console.error("[SYNC FATAL]", e); }
  }, [step, session.sessionUser]);

  useEffect(() => {
      if (session.isOnline) syncPendingUploads();
  }, [session.isOnline, syncPendingUploads]);

  // --- COORDINACIÓN INICIAL ---
  useEffect(() => {
    session.checkSession().then((authState) => {
      if (authState === "authenticated" && !session.hasRecoveryFlowActive()) {
        if(session.isOnline) {
            session.setIsLoading(true);
            syncPendingUploads();
        }
        catalog.performFullSync().then(() => {
          if (session.hasRecoveryFlowActive()) {
            session.setIsLoading(false);
            return;
          }
          catalog.loadProjectsLocal();
          session.setIsLoading(false);
          setStep("project");
        });
      }
    });
  }, []);

  useEffect(() => {
    if ((step === "profile" || step === "user_records" || step === "files") && session.sessionUser) {
        if(step === "profile") session.loadProfileData();
        else records.loadUserRecords();
    }
  }, [step, session.sessionUser]);

  const handleGoHome = () => { 
      catalog.resetSelection(); 
      evidence.resetEvidence(); 
      setStep("project"); 
      setIsMenuOpen(false); 
  };

  const saveReport = async () => {
    if (evidence.isAnalyzing) return showToast("Analizando imagen...", "info");
    if (!evidence.evidenceFile || !session.sessionUser || !catalog.selectedDetail) return showToast("Faltan datos", "error"); 
    
    session.setIsLoading(true);
    const timestamp = Date.now();
    
    const currentProject = catalog.projects.find(p => p.ID_Proyectos === catalog.selectedProjectId);
    const currentFront = catalog.fronts.find(f => f.ID_Frente === catalog.selectedFrontId);
    const currentLocality = catalog.localities.find(l => l.ID_Localidad === catalog.selectedLocalityId);
    
    const folderProject = sanitizeName(currentProject?.Proyecto_Nombre || "General");
    const folderFront = sanitizeName(currentFront?.Nombre_Frente || "Sin_Frente");
    const folderLocality = sanitizeName(currentLocality?.Nombre_Localidad || "Sin_Localidad");
    const activityTag = sanitizeName(catalog.selectedActivity?.Nombre_Actividad || "Evidencia").substring(0, 30);
    
    const fileName = `${activityTag}_${timestamp}.jpg`;
    const path = `${folderProject}/${folderFront}/${folderLocality}/${fileName}`;

    try {
        if(navigator.onLine) {
            const pubUrl = await uploadEvidence(MASTER_BUCKET, path, evidence.evidenceFile, "image/jpeg");
            const checked = await createCheckedActivity({ 
              ID_DetallesActividad: catalog.selectedDetail.ID_DetallesActividad, 
              Latitud: evidence.gpsLocation?.latitude || catalog.selectedDetail.Latitud, 
              Longitud: evidence.gpsLocation?.longitude || catalog.selectedDetail.Longitud,
              Cantidad: Number(evidence.registerDetailQuantity) || 0
            });
            await createRegistro({ 
                Nombre_Archivo: fileName, URL_Archivo: pubUrl, user_id: session.sessionUser.id, 
                ID_Verificada: checked.ID_Verificada, Comentario: evidence.note, Valor: evidence.registerDetailText || null, Ruta_Archivo: path, Bucket: MASTER_BUCKET 
            });
            if (checked.excedido) {
              showToast(`Guardado: Se ha superado el metrado (Total: ${checked.acumulado})`, "info");
            } else {
              showToast("Reporte guardado exitosamente", "success");
            }
        } else {
            const pend: PendingRecord = { 
                timestamp, evidenceBlob: evidence.evidenceFile, fileType: "image/jpeg", 
                meta: { 
                
                    bucketName: MASTER_BUCKET, fullPath: path, fileName, userId: session.sessionUser.id, detailId: catalog.selectedDetail.ID_DetallesActividad, 
                    lat: evidence.gpsLocation?.latitude || 0, lng: evidence.gpsLocation?.longitude || 0, comment: evidence.note,
                    // Parametric fields for offline support
                    quantity: Number(evidence.registerDetailQuantity) || 0,
                    propertyId: evidence.registerPropId ? Number(evidence.registerPropId) : null,
                    propertyValue: evidence.registerDetailText || ''
                } 
            };
            await db.pendingUploads.add(pend);
            showToast("Guardado localmente (Pendiente)", "info");
        }
        handleGoHome();
    } catch (err) { console.error(err); showToast("Error al guardar", "error"); } 
    finally { session.setIsLoading(false); }
  };

  const selectProject = (id: number) => {
    catalog.setSelectedProjectId(id);
    catalog.loadFrontsLocal(id);
    setStep("front");
  };

  const selectFront = (id: number) => {
    catalog.setSelectedFrontId(id);
    catalog.loadLocalitiesLocal(id);
    setStep("locality");
  };

  const selectLocality = (id: number) => {
    catalog.setSelectedLocalityId(id);
    catalog.setSelectedItem(null);
    catalog.setSelectedGroup(null);
    catalog.setSelectedActivity(null);
    catalog.setSelectedDetail(null);
    catalog.setItemSearch("");
    catalog.setGroupSearch("");
    catalog.setDetailSearch("");
    catalog.loadDetailsLocal(id);
    setStep("item");
  };

  const selectItem = (item: string) => {
    catalog.selectItem(item);
    setStep("group");
  };

  const selectGroup = (group: string) => {
    catalog.selectGroup(group);
    setStep("activity");
  };

  const selectActivity = (activityId: number) => {
    const activity = catalog.filteredActivities.find((item) => item.ID_Actividad === activityId);
    if (!activity) return;

    catalog.selectActivity(activity);
    setStep("detail");
  };

  const selectDetail = (detail: any) => {
    catalog.selectDetail(detail);
    setStep("confirm");
  };

  const goBack = () => { 
      const stepMap: Record<string, Step> = {
        "front": "project",
        "locality": "front",
        "item": "locality",
        "group": "item",
        "activity": "group",
        "detail": "activity",
        "confirm": "detail",
        "map": "confirm",
        "form": "map",
        "profile": "project",
        "user_records": "profile",
        "files": "profile"
      };
      setStep(stepMap[step] || "project");
  };

  const handleLoginBridge = () => {
    session.handleLogin(async () => {
      session.setAuthLoadingLabel("SINCRONIZANDO DATOS...");
      console.log("[AUTH] Post-login: iniciando sincronización");
      try {
        await catalog.performFullSync();
        console.log("[AUTH] Post-login: sincronización completada");
      } catch (error) {
        console.error("[AUTH] Post-login: fallo en performFullSync", error);
        throw new Error("No se pudo sincronizar la información necesaria para ingresar. Intenta nuevamente.");
      }

      console.log("[AUTH] Post-login: cargando proyectos locales");
      await catalog.loadProjectsLocal();
      console.log("[AUTH] Post-login: proyectos locales listos");

      setStep("project");
      console.log("[AUTH] Post-login: navegación a project completada");
      syncPendingUploads();
    });
  };

  const handleLogoutBridge = async () => {
    await session.handleLogout();
    catalog.resetSelection();
    setStep("auth");
    setIsMenuOpen(false);
  };

  const requestDeleteAccount = () => {
    setConfirmModal({
      open: true,
      title: "Eliminar mi cuenta",
      message: "La eliminación total de la cuenta requiere validación de administración.",
      onConfirm: async () => {
        try {
          await handleLogoutBridge();
          showToast("Sesión cerrada.", "info");
        } catch {
          showToast("No se pudo completar", "error");
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };
  
  const getMapUrl = () => { const lat = evidence.gpsLocation?.latitude ?? catalog.selectedDetail?.Latitud; const lng = evidence.gpsLocation?.longitude ?? catalog.selectedDetail?.Longitud; return (lat && lng) ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.005}%2C${lat-0.005}%2C${lng+0.005}%2C${lat+0.005}&layer=mapnik&marker=${lat}%2C${lng}` : null; };


  return {
    step, setStep, isMenuOpen, setIsMenuOpen, toast, confirmModal, setConfirmModal,
    isOnline: session.isOnline, syncStatus,
    isLoading: session.isLoading, sessionUser: session.sessionUser,
    isAuthLoading: session.isAuthLoading,
    authLoadingLabel: session.authLoadingLabel, setAuthLoadingLabel: session.setAuthLoadingLabel,
    authEmail: session.authEmail, setAuthEmail: session.setAuthEmail, authPassword: session.authPassword, setAuthPassword: session.setAuthPassword, authMode: session.authMode, setAuthMode: session.setAuthMode,
    authView: session.authView, authMessage: session.authMessage,
    resetEmail: session.resetEmail, setResetEmail: session.setResetEmail,
    recoveryPassword: session.recoveryPassword, setRecoveryPassword: session.setRecoveryPassword,
    recoveryPasswordConfirm: session.recoveryPasswordConfirm, setRecoveryPasswordConfirm: session.setRecoveryPasswordConfirm,
    openResetPassword: session.openResetPassword, returnToLogin: session.returnToLogin,
    handleRequestPasswordReset: session.handleRequestPasswordReset, handleUpdatePassword: session.handleUpdatePassword,
    passwordResetRedirectTo: session.passwordResetRedirectTo,
    profileName: session.profileName, setProfileName: session.setProfileName, profileLastName: session.profileLastName, setProfileLastName: session.setProfileLastName, profileEmail: session.profileEmail, isProfileSaving: session.isProfileSaving,
    handleLogin: handleLoginBridge, handleLogout: handleLogoutBridge, saveProfile: session.saveProfile, requestDeleteAccount,
    
    // CATALOGO EXPORTS (Aquí agregamos lo nuevo)
    projects: catalog.projects, 
    fronts: catalog.fronts, 
    localities: catalog.localities,
    filteredLocalities: catalog.filteredLocalities,
    localitySearch: catalog.localitySearch,
    setLocalitySearch: catalog.setLocalitySearch,
    items: catalog.items,
    filteredItems: catalog.filteredItems,
    itemSearch: catalog.itemSearch,
    setItemSearch: catalog.setItemSearch,
    selectedItem: catalog.selectedItem,
    groups: catalog.groups,
    filteredGroups: catalog.filteredGroups,
    groupSearch: catalog.groupSearch,
    setGroupSearch: catalog.setGroupSearch,
    selectedGroup: catalog.selectedGroup,
    expandedGroups: catalog.expandedGroups,
    groupActivityPreviewMap: catalog.groupActivityPreviewMap,
    toggleGroupExpanded: catalog.toggleGroupExpanded,
    
    filteredDetails: catalog.filteredDetails, 
    selectedDetail: catalog.selectedDetail, 
    selectedActivity: catalog.selectedActivity, 
    filteredActivities: catalog.filteredActivities,
    detailSearch: catalog.detailSearch, 
    setDetailSearch: catalog.setDetailSearch,
    
    selectedProjectId: catalog.selectedProjectId, selectedFrontId: catalog.selectedFrontId, selectedLocalityId: catalog.selectedLocalityId,
    selectProject, selectFront, selectLocality, selectItem, selectGroup, selectActivity, selectDetail,
    gpsLocation: evidence.gpsLocation, handleCaptureGps: evidence.handleCaptureGps,
    utmZone: evidence.utmZone, setUtmZone: evidence.setUtmZone, utmEast: evidence.utmEast, setUtmEast: evidence.setUtmEast, utmNorth: evidence.utmNorth, setUtmNorth: evidence.setUtmNorth, handleUpdateFromUtm: evidence.handleUpdateFromUtm,
    evidencePreview: evidence.evidencePreview, handleCaptureFile: evidence.handleCaptureFile, note: evidence.note, setNote: evidence.setNote, isFetchingGps: evidence.isFetchingGps, isAnalyzing: evidence.isAnalyzing, aiFeedback: evidence.aiFeedback,
    registerProperties: evidence.registerProperties, registerPropId: evidence.registerPropId, setRegisterPropId: evidence.setRegisterPropId, registerDetailText: evidence.registerDetailText, setRegisterDetailText: evidence.setRegisterDetailText, registerDetailQuantity: evidence.registerDetailQuantity, setRegisterDetailQuantity: evidence.setRegisterDetailQuantity,
    saveReport, getMapUrl,
    userRecords: records.userRecords, isLoadingRecords: records.isLoadingRecords, selectedRecordId: records.selectedRecordId, setSelectedRecordId: records.setSelectedRecordId,
    requestDeleteRecord: records.requestDeleteRecord, 
    handleDownloadCSV: records.handleCreateCSV,
    isPhotoModalOpen: records.isPhotoModalOpen,
    openEditModal: records.openEditModal,
    closeEditModal: () => records.setIsPhotoModalOpen(false),
    editComment: records.editComment, setEditComment: records.setEditComment, editPreviewUrl: records.editPreviewUrl, handleEditFileSelect: (e:any) => { if(e.target.files?.[0]) { records.setEditEvidenceFile(e.target.files[0]); records.setEditPreviewUrl(URL.createObjectURL(e.target.files[0])); } }, 
    saveRecordEdits: records.saveRecordEdits,
    handleGoHome, goBack,
    previousRecord,
    isAlreadyRegistered
  };
}
