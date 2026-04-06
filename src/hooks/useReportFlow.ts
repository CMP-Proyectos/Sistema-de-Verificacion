import { useState, useEffect, useCallback, useRef } from "react";
import {
  uploadEvidence,
  createCheckedActivity,
  createRegistro,
  createRegistroImagenes,
  fetchHistoryForDetail,
  syncHistoryToLocal,
} from "../services/dataService";
import { db, PendingRecord } from "../services/db_local";
import { Step, ToastState, ConfirmModalState } from "../features/reportFlow/types";

import { useSessionFlow } from "./flow/useSessionFlow";
import type { SessionUser } from "./flow/useSessionFlow";
import { usePasswordRecoveryFlow } from "./flow/usePasswordRecoveryFlow";
import { useCatalogFlow } from "./flow/useCatalogFlow";
import { useEvidenceFlow } from "./flow/useEvidenceFlow";
import { useRecordsFlow } from "./flow/useRecordsFlow";

const MASTER_BUCKET = "user-assets";
const MAX_EVIDENCE_IMAGES = 5;
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

  const session = useSessionFlow(showToast, setConfirmModal);
  const recovery = usePasswordRecoveryFlow(showToast);
  const catalog = useCatalogFlow(session.isOnline);
  const evidence = useEvidenceFlow(showToast, catalog.selectedActivity, session.isOnline);
  const records = useRecordsFlow(session.sessionUser?.id, showToast, setConfirmModal, session.setIsLoading, MASTER_BUCKET);

  const syncStatus = session.isOnline ? "ONLINE" : "OFFLINE";

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

  const syncPendingUploads = useCallback(async () => {
      try {
          if (!session.sessionUser) return;
          const count = await db.pendingUploads.count();
          if(count > 0) {
              showToast(`Subiendo ${count} pendientes...`, "info");
              const recs = await db.pendingUploads.toArray();

               for(const r of recs) {
                   try {
                       console.log("[SYNC] Procesando:", r.meta.fileName || r.meta.fileNames?.[0]);
                       const targetBucket = MASTER_BUCKET;
                       const offlineFiles = (r.evidenceBlobs && r.evidenceBlobs.length > 0)
                         ? r.evidenceBlobs.map((blob, index) => ({
                             blob,
                             fileName: r.meta.fileNames?.[index] || `offline_${r.timestamp}_${index + 1}.jpg`,
                             fullPath: r.meta.fullPaths?.[index] || r.meta.fullPath || `pendiente/${r.timestamp}_${index + 1}.jpg`,
                             fileType: r.fileTypes?.[index] || "image/jpeg",
                           }))
                         : (r.evidenceBlob && r.meta.fileName && r.meta.fullPath)
                           ? [{
                               blob: r.evidenceBlob,
                               fileName: r.meta.fileName,
                               fullPath: r.meta.fullPath,
                               fileType: r.fileType || "image/jpeg",
                             }]
                           : [];

                       if (offlineFiles.length === 0) {
                         throw new Error("Registro offline sin imagenes");
                       }

                       const uploadedImages = [];
                       for (const [index, image] of offlineFiles.entries()) {
                         const pub = await uploadEvidence(targetBucket, image.fullPath, image.blob, image.fileType);
                         uploadedImages.push({
                           Orden: index + 1,
                           Nombre_Archivo: image.fileName,
                           URL_Archivo: pub,
                           Ruta_Archivo: image.fullPath,
                           Bucket: targetBucket,
                           Es_Principal: index === 0,
                         });
                       }

                       const chk = await createCheckedActivity({
                           ID_DetallesActividad: r.meta.detailId,
                          Latitud: r.meta.lat,
                          Longitud: r.meta.lng,
                          Cantidad: 0
                       });

                       const mainImage = uploadedImages[0];
                       const regData = await createRegistro({
                           Nombre_Archivo: mainImage.Nombre_Archivo,
                           URL_Archivo: mainImage.URL_Archivo,
                            user_id: r.meta.userId,
                            ID_Verificada: chk.ID_Verificada,
                            Comentario: r.meta.comment,
                            Ruta_Archivo: mainImage.Ruta_Archivo,
                            Bucket: targetBucket
                        });

                       const registroId = regData.data?.[0]?.ID_Registros;
                       if (registroId) {
                         await createRegistroImagenes(
                           uploadedImages.map((image) => ({
                             ID_Registro: registroId,
                             ...image,
                           }))
                         );
                       }

                      if(r.id) await db.pendingUploads.delete(r.id);
                  } catch (err: any) { console.error(`[SYNC ERROR]`, err); }
              }
              await records.loadUserRecords();
              showToast("SincronizaciÃ³n finalizada", "success");
          }
      } catch (e) { console.error("[SYNC FATAL]", e); }
  }, [records.loadUserRecords, session.sessionUser]);

  useEffect(() => {
      if (session.isOnline) syncPendingUploads();
  }, [session.isOnline, syncPendingUploads]);

  const bootstrappedSessionUserIdRef = useRef<string | null>(null);
  const bootstrapInFlightRef = useRef<Promise<void> | null>(null);

  const bootstrapAuthenticatedUser = useCallback(async (user: SessionUser, origin: string) => {
    if (bootstrappedSessionUserIdRef.current === user.id) {
      console.info("[AUTH FLOW] Bootstrap omitido: usuario ya inicializado", { origin, userId: user.id });
      return;
    }

    if (bootstrapInFlightRef.current) {
      console.info("[AUTH FLOW] Esperando bootstrap en curso", { origin, userId: user.id });
      await bootstrapInFlightRef.current;
      return;
    }

    const runBootstrap = async () => {
      console.info("[AUTH FLOW] Iniciando bootstrap autenticado", {
        origin,
        userId: user.id,
        isOnline: session.isOnline,
        isRecoveryContextActive: recovery.isRecoveryContextActive,
      });

      session.setIsLoading(true);
      session.setAuthLoadingLabel(session.isOnline ? "SINCRONIZANDO DATOS..." : "RESTAURANDO SESION...");

      try {
        if (session.isOnline) {
          await catalog.performScopedSync();
          await syncHistoryToLocal(user.id);
          await syncPendingUploads();
        } else {
          console.info("[AUTH FLOW] Restaurando sesion offline con datos locales", { userId: user.id });
        }

        await catalog.loadProjectsLocal();
        bootstrappedSessionUserIdRef.current = user.id;
        setStep("project");
      } catch (error) {
        console.error("[AUTH FLOW] Bootstrap autenticado fallo; usando cache local si existe", error);
        try {
          await catalog.loadProjectsLocal();
          bootstrappedSessionUserIdRef.current = user.id;
          setStep("project");
          showToast(
            session.isOnline
              ? "Se restauró la sesión con datos locales tras un fallo de sincronización."
              : "Sesión restaurada con datos locales sin conexión.",
            "info"
          );
        } catch (localError) {
          console.error("[AUTH FLOW] Tampoco se pudo restaurar la cache local", localError);
          session.setAuthMessage({
            type: "error",
            text: "No se pudo cargar la información necesaria para ingresar. Intenta nuevamente.",
          });
          showToast("No se pudo cargar la información necesaria para ingresar. Intenta nuevamente.", "error");
        }
      } finally {
        session.setAuthLoadingLabel("AUTENTICANDO...");
        session.setIsLoading(false);
        bootstrapInFlightRef.current = null;
      }
    };

    bootstrapInFlightRef.current = runBootstrap();
    await bootstrapInFlightRef.current;
  }, [catalog, recovery.isRecoveryContextActive, session, syncPendingUploads]);

  useEffect(() => {
    if (!recovery.hasResolvedInitialCheck || !session.hasResolvedInitialSession) {
      return;
    }

    if (recovery.isRecoveryContextActive) {
      if (step !== "auth") {
        console.info("[AUTH FLOW] Recovery tiene prioridad; manteniendo vista auth", { previousStep: step });
        setStep("auth");
      }
      return;
    }

    if (!session.sessionUser) {
      bootstrappedSessionUserIdRef.current = null;
      return;
    }

    void bootstrapAuthenticatedUser(session.sessionUser, "session-restore");
  }, [
    bootstrapAuthenticatedUser,
    recovery.hasResolvedInitialCheck,
    recovery.isRecoveryContextActive,
    session.hasResolvedInitialSession,
    session.sessionUser,
    step,
  ]);

  useEffect(() => {
    if (!recovery.hasResolvedInitialCheck || !session.hasResolvedInitialSession || recovery.isRecoveryContextActive) {
      return;
    }

    if (!session.sessionUser && step !== "auth") {
      console.info("[AUTH FLOW] No hay sesion activa; regresando a auth", { previousStep: step });
      setStep("auth");
    }
  }, [
    recovery.hasResolvedInitialCheck,
    recovery.isRecoveryContextActive,
    session.hasResolvedInitialSession,
    session.sessionUser,
    step,
  ]);

  useEffect(() => {
    if ((step === "profile" || step === "user_records" || step === "files") && session.sessionUser) {
        if(step === "profile") session.loadProfileData();
        else records.loadUserRecords();
    }
  }, [step, session.sessionUser, records.loadUserRecords]);

  const handleGoHome = () => {
      catalog.resetSelection();
      evidence.resetEvidence();
      setStep("project");
      setIsMenuOpen(false);
  };

  const saveReport = async () => {
    if (evidence.isAnalyzing) return showToast("Analizando imagen...", "info");
    if (evidence.evidenceFiles.length === 0 || !session.sessionUser || !catalog.selectedDetail) return showToast("Faltan datos", "error");
    if (evidence.evidenceFiles.length > MAX_EVIDENCE_IMAGES) return showToast("Maximo 5 imagenes", "error");

    session.setIsLoading(true);
    const timestamp = Date.now();

    const currentProject = catalog.projects.find(p => p.ID_Proyectos === catalog.selectedProjectId);
    const currentFront = catalog.fronts.find(f => f.ID_Frente === catalog.selectedFrontId);
    const currentLocality = catalog.localities.find(l => l.ID_Localidad === catalog.selectedLocalityId);

    const folderProject = sanitizeName(currentProject?.Proyecto_Nombre || "General");
    const folderFront = sanitizeName(currentFront?.Nombre_Frente || "Sin_Frente");
    const folderLocality = sanitizeName(currentLocality?.Nombre_Localidad || "Sin_Localidad");
    const activityTag = sanitizeName(catalog.selectedActivity?.Nombre_Actividad || "Evidencia").substring(0, 30);

    const evidenceFiles = evidence.evidenceFiles.map((file, index) => {
      const order = index + 1;
      const fileName = `${activityTag}_${timestamp}_${order}.jpg`;
      return {
        file,
        order,
        fileName,
        path: `${folderProject}/${folderFront}/${folderLocality}/${fileName}`,
      };
    });

    try {
        if(navigator.onLine) {
            const checked = await createCheckedActivity({
              ID_DetallesActividad: catalog.selectedDetail.ID_DetallesActividad,
              Latitud: evidence.gpsLocation?.latitude || catalog.selectedDetail.Latitud,
              Longitud: evidence.gpsLocation?.longitude || catalog.selectedDetail.Longitud,
              Cantidad: 0
            });

            const uploadedImages = [];
            for (const image of evidenceFiles) {
              const pubUrl = await uploadEvidence(MASTER_BUCKET, image.path, image.file, "image/jpeg");
              uploadedImages.push({
                Orden: image.order,
                Nombre_Archivo: image.fileName,
                URL_Archivo: pubUrl,
                Ruta_Archivo: image.path,
                Bucket: MASTER_BUCKET,
                Es_Principal: image.order === 1,
              });
            }

            const mainImage = uploadedImages[0];
            const regData = await createRegistro({
                Nombre_Archivo: mainImage.Nombre_Archivo, URL_Archivo: mainImage.URL_Archivo, user_id: session.sessionUser.id,
                ID_Verificada: checked.ID_Verificada, Comentario: evidence.note, Ruta_Archivo: mainImage.Ruta_Archivo, Bucket: MASTER_BUCKET
            });

            const registroId = regData.data?.[0]?.ID_Registros;
            if (registroId) {
              await createRegistroImagenes(
                uploadedImages.map((image) => ({
                  ID_Registro: registroId,
                  ...image,
                }))
              );
            }
            await records.loadUserRecords();
            if (checked.excedido) {
              showToast(`Guardado: Se ha superado el metrado (Total: ${checked.acumulado})`, "info");
            } else {
              showToast("Reporte guardado exitosamente", "success");
            }
        } else {
            const pend: PendingRecord = {
                timestamp,
                evidenceBlobs: evidenceFiles.map((image) => image.file),
                fileTypes: evidenceFiles.map(() => "image/jpeg"),
                meta: {
                    bucketName: MASTER_BUCKET,
                    fullPaths: evidenceFiles.map((image) => image.path),
                    fileNames: evidenceFiles.map((image) => image.fileName),
                    fullPath: evidenceFiles[0]?.path,
                    fileName: evidenceFiles[0]?.fileName,
                    userId: session.sessionUser.id, detailId: catalog.selectedDetail.ID_DetallesActividad,
                    lat: evidence.gpsLocation?.latitude || 0, lng: evidence.gpsLocation?.longitude || 0, comment: evidence.note,
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
    session.handleLogin(async (authenticatedUser) => {
      await bootstrapAuthenticatedUser(authenticatedUser, "login");
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
      message: "La eliminaciÃ³n total de la cuenta requiere validaciÃ³n de administraciÃ³n.",
      onConfirm: async () => {
        try {
          await handleLogoutBridge();
          showToast("SesiÃ³n cerrada.", "info");
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
    authLoadingLabel: session.authLoadingLabel, setAuthLoadingLabel: session.setAuthLoadingLabel,
    authEmail: session.authEmail, setAuthEmail: session.setAuthEmail, authPassword: session.authPassword, setAuthPassword: session.setAuthPassword, authMode: session.authMode, setAuthMode: session.setAuthMode,
    authMessage: session.authMessage,
    recoveryView: recovery.view,
    recoveryMessage: recovery.message,
    recoveryEmail: recovery.email,
    setRecoveryEmail: recovery.setEmail,
    recoveryPassword: recovery.password,
    setRecoveryPassword: recovery.setPassword,
    recoveryPasswordConfirm: recovery.passwordConfirm,
    setRecoveryPasswordConfirm: recovery.setPasswordConfirm,
    recoveryIsLoading: recovery.isLoading,
    recoveryLoadingLabel: recovery.loadingLabel,
    openRecoveryRequest: () => recovery.openRequest(session.authEmail.trim()),
    closeRecovery: recovery.closeRecovery,
    requestRecovery: recovery.handleRequestReset,
    submitRecoveryPassword: recovery.handleUpdatePassword,
    profileName: session.profileName, setProfileName: session.setProfileName, profileLastName: session.profileLastName, setProfileLastName: session.setProfileLastName, profileEmail: session.profileEmail, isProfileSaving: session.isProfileSaving,
    handleLogin: handleLoginBridge, handleLogout: handleLogoutBridge, saveProfile: session.saveProfile, requestDeleteAccount,

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
    evidenceImages: evidence.evidenceImages, evidencePreview: evidence.evidencePreview, handleCaptureFile: evidence.handleCaptureFile, removeEvidenceImage: evidence.removeEvidenceImage, note: evidence.note, setNote: evidence.setNote, isFetchingGps: evidence.isFetchingGps, isAnalyzing: evidence.isAnalyzing, aiFeedback: evidence.aiFeedback,
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
