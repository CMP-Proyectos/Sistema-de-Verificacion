import { useState, useRef, useEffect } from "react";
import { validarFotoConIA } from "../../services/GoogleAI";
import { ActivityRecord } from "../../services/dataService";
import { ActivitiesTypes } from "../../features/reportFlow/types";
import { supabase } from "../../services/dataService";
import proj4 from 'proj4';
import { WGS84, utmZones } from "../../features/reportFlow/constants/geo";

type GpsLocation = { latitude: number; longitude: number; };

export function useEvidenceFlow(
    showToast: (msg: string, type: 'success'|'error'|'info') => void,
    selectedActivity: ActivityRecord | null,
    isOnline: boolean
) {
  const [gpsLocation, setGpsLocation] = useState<GpsLocation | null>(null);
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  
  const [utmZone, setUtmZone] = useState("19");
  const [utmEast, setUtmEast] = useState("");
  const [utmNorth, setUtmNorth] = useState("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ type: 'warning' | 'info' | 'success', message: string } | null>(null);

  // Atributos Dinámicos
  const [registerProperties, setRegisterProperties] = useState<ActivitiesTypes[]>([]);
  const [registerPropId, setRegisterPropId] = useState<number | "">("");
  const [registerDetailText, setRegisterDetailText] = useState("");

  // Cargar propiedades cuando cambia la actividad
  useEffect(() => {
    const loadProps = async () => {
      if (isOnline && selectedActivity) {
        try {
          const { data } = await supabase.rpc('obtener_propiedades_por_actividad', { nombre_input: selectedActivity.Nombre_Actividad });
          if (data) setRegisterProperties(data.map((x: any) => ({ Tipo_Actividad: x.nombre_tipo, ID_Propiedad: x.id_propiedad, Propiedad: x.nombre_propiedad })));
        } catch (err) { console.error(err); }
      } else { setRegisterProperties([]); }
    };
    loadProps();
  }, [selectedActivity, isOnline]);

  const handleCaptureGps = () => { 
      if (!navigator.geolocation) return showToast("Sin soporte GPS", "error"); 
      setIsFetchingGps(true); 
      navigator.geolocation.getCurrentPosition(
          (p) => { setGpsLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude }); setIsFetchingGps(false); showToast("GPS OK", "success"); }, 
          (e) => { showToast(`Error GPS: ${e.message}`, "error"); setIsFetchingGps(false); },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      ); 
  };
  
  const handleUpdateFromUtm = () => { 
      if (!utmEast || !utmNorth) return showToast("Faltan datos UTM", "info"); 
      try { 
          const [lng, lat] = proj4(utmZones[utmZone as keyof typeof utmZones], WGS84, [Number(utmEast), Number(utmNorth)]); 
          setGpsLocation({ latitude: lat, longitude: lng }); 
          showToast("UTM OK", "success"); 
      } catch { showToast("UTM inválida", "error"); } 
  };

  const handleCaptureFile = async (e: React.ChangeEvent<HTMLInputElement>) => { 
    if (e.target.files?.[0]) { 
        const file = e.target.files[0];
        setEvidenceFile(file); setEvidencePreview(URL.createObjectURL(file)); 
        setAiFeedback(null); setIsAnalyzing(true);
        try {
            const res = await validarFotoConIA(file, selectedActivity?.Nombre_Actividad || "Obra");
            if (res.esErrorTecnico) setAiFeedback({ type: 'info', message: "Offline: Validar manual." });
            else if (!res.aprobado) setAiFeedback({ type: 'warning', message: `IA: ${res.mensaje}` });
            else setAiFeedback({ type: 'success', message: "Validado por IA." });
        } catch { setAiFeedback({ type: 'info', message: "Error IA." }); } 
        finally { setIsAnalyzing(false); }
    } 
  };

  const resetEvidence = () => {
      setEvidenceFile(null); setEvidencePreview(null); setNote(""); setAiFeedback(null);
      setGpsLocation(null); setRegisterPropId(""); setRegisterDetailText("");
  };

  return {
      gpsLocation, setGpsLocation, isFetchingGps, handleCaptureGps,
      utmZone, setUtmZone, utmEast, setUtmEast, utmNorth, setUtmNorth, handleUpdateFromUtm,
      evidenceFile, evidencePreview, note, setNote, handleCaptureFile,
      isAnalyzing, aiFeedback, resetEvidence,
      registerProperties, registerPropId, setRegisterPropId, registerDetailText, setRegisterDetailText
  };
}