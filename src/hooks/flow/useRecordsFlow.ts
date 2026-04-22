import { useCallback, useEffect, useState } from "react";
import { supabase, fetchUserRecords } from "../../services/dataService";
import { UserRecord, ConfirmModalState } from "../../features/reportFlow/types";

export function useRecordsFlow(
    sessionUserId: string | undefined,
    showToast: (msg: string, type: "success" | "error" | "info") => void,
    setConfirmModal: (modal: ConfirmModalState | null) => void,
    setIsLoading: (v: boolean) => void,
    MASTER_BUCKET: string
) {
  const [userRecords, setUserRecords] = useState<UserRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [hasLoadedUserRecords, setHasLoadedUserRecords] = useState(false);

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [editEvidenceFile, setEditEvidenceFile] = useState<File | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editPreviewUrl, setEditPreviewUrl] = useState("");

  useEffect(() => {
    setUserRecords([]);
    setSelectedRecordId(null);
    setHasLoadedUserRecords(false);
  }, [sessionUserId]);

  const loadUserRecords = useCallback(async () => {
    if (!sessionUserId) return;

    setIsLoadingRecords(true);
    try {
      const data = await fetchUserRecords(sessionUserId);
      setUserRecords(data);
      setHasLoadedUserRecords(true);
    } catch (err) {
      console.error("Error historial:", err);
    } finally {
      setIsLoadingRecords(false);
    }
  }, [sessionUserId]);

  const requestDeleteRecord = (i: UserRecord) => {
    setConfirmModal({
      open: true,
      title: "Borrar registro",
      message: "Eliminar permanentemente?",
      onConfirm: async () => {
        setConfirmModal(null);
        setIsLoading(true);
        try {
          const filesToDelete = new Set<string>();
          const bucketToUse = i.bucket || MASTER_BUCKET;

          if (i.ruta_archivo) filesToDelete.add(i.ruta_archivo);

          const { data: childImages } = await supabase
            .from("Registro_Imagenes")
            .select("Ruta_Archivo")
            .eq("ID_Registro", i.id_registro);

          (childImages || []).forEach((image: { Ruta_Archivo?: string | null }) => {
            if (image.Ruta_Archivo) filesToDelete.add(image.Ruta_Archivo);
          });

          if (bucketToUse && filesToDelete.size > 0) {
            await supabase.storage.from(bucketToUse).remove(Array.from(filesToDelete));
          }

          const { error: rpcError } = await supabase.rpc("eliminar_evidencia_completa", {
            p_id_registro: i.id_registro,
          });

          if (rpcError) {
            const { error: childDeleteError } = await supabase
              .from("Registro_Imagenes")
              .delete()
              .eq("ID_Registro", i.id_registro);
            if (childDeleteError) throw childDeleteError;

            const { error: registroDeleteError } = await supabase
              .from("Registros")
              .delete()
              .eq("ID_Registros", i.id_registro);
            if (registroDeleteError) throw registroDeleteError;

            if (i.id_verificada) {
              const { error: checkedDeleteError } = await supabase
                .from("Actividad_Verificada")
                .delete()
                .eq("ID_Verificada", i.id_verificada);
              if (checkedDeleteError) throw checkedDeleteError;
            }
          }

          await loadUserRecords();
          setSelectedRecordId(null);
          showToast("Eliminado", "success");
        } catch {
          showToast("Error al eliminar", "error");
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const saveRecordEdits = async () => {
    const item = userRecords.find((record) => record.id_registro === selectedRecordId);
    if (!item) return;

    setIsLoading(true);
    try {
      const updates: any = { Comentario: editComment };

      if (editEvidenceFile && item.bucket) {
        const bucketToUse = item.bucket || MASTER_BUCKET;
        const folder = item.ruta_archivo?.includes("/")
          ? item.ruta_archivo.split("/").slice(0, -1).join("/")
          : "general";
        const fn = `edit_${Date.now()}.jpg`;

        const { data, error: upErr } = await supabase.storage
          .from(bucketToUse)
          .upload(`${folder}/${fn}`, editEvidenceFile);
        if (upErr) throw upErr;

        if (data) {
          const { data: publicUrl } = supabase.storage.from(bucketToUse).getPublicUrl(data.path);
          updates.URL_Archivo = publicUrl.publicUrl;
          updates.Ruta_Archivo = data.path;
          updates.Nombre_Archivo = fn;

          if (item.ruta_archivo) {
            await supabase.storage.from(bucketToUse).remove([item.ruta_archivo]);
          }

          await supabase
            .from("Registro_Imagenes")
            .update({
              URL_Archivo: publicUrl.publicUrl,
              Ruta_Archivo: data.path,
              Nombre_Archivo: fn,
              Bucket: bucketToUse,
            })
            .eq("ID_Registro", item.id_registro)
            .eq("Es_Principal", true);
        }
      }

      const { error } = await supabase
        .from("Registros")
        .update(updates)
        .eq("ID_Registros", item.id_registro);
      if (error) throw error;

      showToast("Actualizado", "success");
      setIsPhotoModalOpen(false);
      setEditEvidenceFile(null);
      await loadUserRecords();
    } catch (e) {
      console.error(e);
      showToast("Error al actualizar", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = () => {
    const record = userRecords.find((item) => item.id_registro === selectedRecordId);
    if (record) {
      setEditComment(record.comentario ?? "");
      setEditEvidenceFile(null);
      setEditPreviewUrl(record.url_foto ?? "");
      setIsPhotoModalOpen(true);
    }
  };

  const handleCreateCSV = (records: UserRecord[]) => {
    if (!records || records.length === 0) {
      alert("No hay registros para descargar.");
      return;
    }

    const headers = [
      "ID Registro",
      "Fecha",
      "Actividad",
      "Localidad",
      "Detalle",
      "Comentario",
      "Latitud",
      "Longitud",
      "Cantidad",
    ];

    const rows = records.map((rec) => {
      return [
        rec.id_registro,
        `"${rec.fecha_subida ? new Date(rec.fecha_subida).toLocaleString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) : ""}"`,
        `"${rec.nombre_actividad || ""}"`,
        `"${rec.nombre_localidad || ""}"`,
        `"${rec.nombre_detalle || ""}"`,
        `"${(rec.comentario || "").replace(/"/g, "\"\"")}"`,
        rec.latitud,
        rec.longitud,
        rec.cantidad,
      ].join(";");
    });

    const csvContent = [headers.join(";"), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Registros_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    userRecords,
    isLoadingRecords,
    hasLoadedUserRecords,
    loadUserRecords,
    selectedRecordId,
    setSelectedRecordId,
    requestDeleteRecord,
    saveRecordEdits,
    isPhotoModalOpen,
    setIsPhotoModalOpen,
    openEditModal,
    editComment,
    setEditComment,
    editPreviewUrl,
    setEditPreviewUrl,
    editEvidenceFile,
    setEditEvidenceFile,
    handleCreateCSV,
    handleEditFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
        setEditEvidenceFile(e.target.files[0]);
        setEditPreviewUrl(URL.createObjectURL(e.target.files[0]));
      }
    },
  };
}
