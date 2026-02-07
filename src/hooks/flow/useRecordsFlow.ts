import { useState } from "react";
import { supabase } from "../../services/dataService";
import { UserRecord, ConfirmModalState } from "../../features/reportFlow/types";

export function useRecordsFlow(
    sessionUserId: string | undefined,
    showToast: (msg: string, type: 'success'|'error'|'info') => void,
    setConfirmModal: (modal: ConfirmModalState | null) => void,
    setIsLoading: (v: boolean) => void,
    MASTER_BUCKET: string
) {
  const [userRecords, setUserRecords] = useState<UserRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  
  // Estado Modal Edición
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [editEvidenceFile, setEditEvidenceFile] = useState<File | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editPreviewUrl, setEditPreviewUrl] = useState("");

  const loadUserRecords = async () => { 
      if(!sessionUserId) return; 
      setIsLoadingRecords(true); 
      try { 
          const {data, error} = await supabase.rpc('obtener_historial_usuario', { usuario_uid: sessionUserId }); 
          if (error) throw error;
          setUserRecords(data || []); 
      } catch (err) {
          console.error("Error historial:", err);
      } finally { setIsLoadingRecords(false); } 
  };
  
  const requestDeleteRecord = (i: UserRecord) => { 
      setConfirmModal({
          open: true, title: "Borrar registro", message: "¿Eliminar permanentemente?",
          onConfirm: async () => {
              setConfirmModal(null); setIsLoading(true); 
              try { 
                  if(i.bucket && i.ruta_archivo) await supabase.storage.from(i.bucket).remove([i.ruta_archivo]); 
                  await supabase.rpc('eliminar_evidencia_completa', { p_id_registro: i.id_registro }); 
                  await loadUserRecords(); setSelectedRecordId(null); showToast("Eliminado", "success");
              } catch { showToast("Error al eliminar", "error"); } finally { setIsLoading(false); } 
          }
      });
  };

  const saveRecordEdits = async () => {
      const item = userRecords.find(r => r.id_registro === selectedRecordId); 
      if(!item) return; 
      setIsLoading(true);
      try {
          let updates: any = { Comentario: editComment };
          
          if(editEvidenceFile && item.bucket) {
              const bucketToUse = item.bucket || MASTER_BUCKET;
              const folder = item.ruta_archivo?.includes('/') ? item.ruta_archivo.split('/').slice(0,-1).join('/') : "general";
              const fn=`edit_${Date.now()}.jpg`; 
              
              const {data, error: upErr} = await supabase.storage.from(bucketToUse).upload(`${folder}/${fn}`, editEvidenceFile);
              if (upErr) throw upErr;

              if(data){ 
                  const {data:p}=supabase.storage.from(bucketToUse).getPublicUrl(data.path); 
                  updates.URL_Archivo = p.publicUrl;
                  updates.Ruta_Archivo = data.path;
                  updates.Nombre_Archivo = fn;
                  
                  if(item.ruta_archivo) await supabase.storage.from(bucketToUse).remove([item.ruta_archivo]); 
              }
          }
          const { error } = await supabase.from('Registros').update(updates).eq('ID_Registros', item.id_registro);
          if (error) throw error;

          showToast("Actualizado", "success");
          setIsPhotoModalOpen(false); setEditEvidenceFile(null); loadUserRecords();
      } catch (e) { console.error(e); showToast("Error al actualizar", "error"); } finally { setIsLoading(false); }
  };

  const openEditModal = () => { 
      const r = userRecords.find(i => i.id_registro === selectedRecordId); 
      if(r){ setEditComment(r.comentario??""); setEditEvidenceFile(null); setEditPreviewUrl(r.url_foto??""); setIsPhotoModalOpen(true); } 
  };

  // --- LÓGICA CSV ROBUSTA (SIN JOIN SQL) ---
  const handleCreateCSV = (records: UserRecord[]) => {
    if (!records || records.length === 0) {
      alert("No hay registros para descargar.");
      return;
    }
    const headers = [
      "ID Registro", "Fecha", "Actividad", "Localidad", "Detalle", "Comentario", "Latitud", "Longitud", "Cantidad"
    ];
    const rows = records.map(rec => {
      return [
        rec.id_registro,
        `"${rec.fecha_subida || ''}"`,
        `"${rec.nombre_actividad || ''}"`,
        `"${rec.nombre_localidad || ''}"`,
        `"${rec.nombre_detalle || ''}"`,
        `"${(rec.comentario || '').replace(/"/g, '""')}"`,
        rec.latitud,
        rec.longitud,
        rec.cantidad
      ].join(";");
    });
    const csvContent = [headers.join(";"), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Registros_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
      userRecords, isLoadingRecords, loadUserRecords, selectedRecordId, setSelectedRecordId,
      requestDeleteRecord, saveRecordEdits, isPhotoModalOpen, setIsPhotoModalOpen, openEditModal, 
      editComment, setEditComment, editPreviewUrl, setEditPreviewUrl, editEvidenceFile, setEditEvidenceFile, 
      handleCreateCSV,
      // Helper para input file
      handleEditFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => { 
          if(e.target.files?.[0]) { 
              setEditEvidenceFile(e.target.files[0]); 
              setEditPreviewUrl(URL.createObjectURL(e.target.files[0])); 
          } 
      }
  };
}
