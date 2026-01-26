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
  const handleDownloadCSV = async () => { 
      if(!userRecords || userRecords.length === 0) return showToast("No hay datos", "info"); 
      setIsLoading(true);
      
      try {
          const recordIds = userRecords.map(r => r.id_registro);

          // PASO 1: Obtener detalles crudos (ID_Propiedad)
          const { data: detailsData, error: detailsError } = await supabase
            .from('Detalle_Propiedad')
            .select('ID_Registro, ID_Propiedad, Detalle_Propiedad')
            .in('ID_Registro', recordIds);
            
          if(detailsError) throw detailsError;

          // PASO 2: Obtener nombres de propiedades (Catálogo)
          // Intentamos buscar en 'Propiedades', si falla, intentamos manejarlo
          const { data: propsCatalog, error: catalogError } = await supabase
            .from('Propiedades') // Asegúrate de que esta tabla exista con este nombre
            .select('ID_Propiedad, Nombre_Propiedad');

          // Mapa de ID -> Nombre (ej: 1 -> "Altura")
          const propNameMap: Record<number, string> = {};
          if (propsCatalog) {
              propsCatalog.forEach((p: any) => {
                  propNameMap[p.ID_Propiedad] = p.Nombre_Propiedad;
              });
          }

          // PASO 3: Construir Pivot en memoria
          const pivotMap: Record<number, Record<string, string>> = {};
          const allHeaders = new Set<string>();

          detailsData?.forEach((d: any) => {
              const regId = d.ID_Registro;
              // Si tenemos el nombre en el catálogo lo usamos, si no, usamos "Propiedad-{ID}"
              const propName = propNameMap[d.ID_Propiedad] || `Propiedad-${d.ID_Propiedad}`;
              const val = d.Detalle_Propiedad || "";

              if (!pivotMap[regId]) pivotMap[regId] = {};
              pivotMap[regId][propName] = val;
              allHeaders.add(propName);
          });

          // PASO 4: Generar CSV
          const dynamicHeaders = Array.from(allHeaders).sort();
          const SEPARATOR = ";"; 
          const fixedHeaders = ["ID", "Fecha", "Actividad", "Proyecto", "Frente", "Localidad", "Detalle", "Comentario", "Latitud", "Longitud", "Foto"];
          const fullHeaders = [...fixedHeaders, ...dynamicHeaders];

          const csvRows = userRecords.map(r => {
              const clean = (t: any) => `"${String(t ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
              
              const fixedData = [
                  r.id_registro,
                  new Date(r.fecha_subida).toLocaleString('es-PE'),
                  clean(r.nombre_actividad),
                  clean(r.nombre_proyecto),
                  clean(r.nombre_frente),
                  clean(r.nombre_localidad),
                  clean(r.nombre_detalle),
                  clean(r.comentario),
                  r.latitud,
                  r.longitud,
                  clean(r.url_foto)
              ];

              const props = pivotMap[r.id_registro] || {};
              const dynamicData = dynamicHeaders.map(h => clean(props[h]));

              return [...fixedData, ...dynamicData].join(SEPARATOR);
          });

          const csvContent = "\uFEFF" + [fullHeaders.join(SEPARATOR), ...csvRows].join("\n");
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `reporte_${new Date().toISOString().slice(0,10)}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          showToast("CSV Generado", "success");

      } catch (err: any) {
          console.error("CSV Error:", err);
          showToast(`Error CSV: ${err.message}`, "error");
      } finally {
          setIsLoading(false);
      }
  };

  return {
      userRecords, isLoadingRecords, loadUserRecords, selectedRecordId, setSelectedRecordId,
      requestDeleteRecord, saveRecordEdits, isPhotoModalOpen, setIsPhotoModalOpen, openEditModal, 
      editComment, setEditComment, editPreviewUrl, setEditPreviewUrl, editEvidenceFile, setEditEvidenceFile, 
      handleDownloadCSV,
      // Helper para input file
      handleEditFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => { 
          if(e.target.files?.[0]) { 
              setEditEvidenceFile(e.target.files[0]); 
              setEditPreviewUrl(URL.createObjectURL(e.target.files[0])); 
          } 
      }
  };
}