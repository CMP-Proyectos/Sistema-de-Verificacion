import { useState, useEffect, useRef } from "react";
import { validarFotoConIA } from "../../services/GoogleAI";
import { ActivityRecord } from "../../services/dataService";
import { EvidenceImage } from "../../features/reportFlow/types";
import proj4 from "proj4";
import { WGS84, utmZones } from "../../features/reportFlow/constants/geo";

type GpsLocation = { latitude: number; longitude: number };

const MAX_EVIDENCE_IMAGES = 5;

export function useEvidenceFlow(
  showToast: (msg: string, type: "success" | "error" | "info") => void,
  selectedActivity: ActivityRecord | null,
  isOnline: boolean
) {
  const [gpsLocation, setGpsLocation] = useState<GpsLocation | null>(null);
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [evidenceImages, setEvidenceImages] = useState<EvidenceImage[]>([]);
  const [note, setNote] = useState("");

  const [utmZone, setUtmZone] = useState("19");
  const [utmEast, setUtmEast] = useState("");
  const [utmNorth, setUtmNorth] = useState("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ type: "warning" | "info" | "success"; message: string } | null>(null);
  const evidenceImagesRef = useRef<EvidenceImage[]>([]);
  const activeAnalysisIdRef = useRef(0);

  useEffect(() => {
    evidenceImagesRef.current = evidenceImages;
  }, [evidenceImages]);

  useEffect(() => {
    return () => {
      evidenceImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  const handleCaptureGps = () => {
    if (!navigator.geolocation) return showToast("Sin soporte GPS", "error");
    setIsFetchingGps(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGpsLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude });
        setIsFetchingGps(false);
        showToast("GPS OK", "success");
      },
      (e) => {
        showToast(`Error GPS: ${e.message}`, "error");
        setIsFetchingGps(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const handleUpdateFromUtm = () => {
    if (!utmEast || !utmNorth) return showToast("Faltan datos UTM", "info");
    try {
      const [lng, lat] = proj4(utmZones[utmZone as keyof typeof utmZones], WGS84, [Number(utmEast), Number(utmNorth)]);
      setGpsLocation({ latitude: lat, longitude: lng });
      showToast("UTM OK", "success");
    } catch {
      showToast("UTM invalida", "error");
    }
  };

  const analyzeImage = async (file: File) => {
    const analysisId = ++activeAnalysisIdRef.current;
    setAiFeedback(null);
    setIsAnalyzing(true);
    try {
      const res = await validarFotoConIA(file, selectedActivity?.Nombre_Actividad || "Obra");
      if (analysisId !== activeAnalysisIdRef.current) return;

      if (res.esErrorTecnico) setAiFeedback({ type: "info", message: "Offline: Validar manual." });
      else if (!res.aprobado) setAiFeedback({ type: "warning", message: `IA: ${res.mensaje}` });
      else setAiFeedback({ type: "success", message: "Validado por IA." });
    } catch {
      if (analysisId !== activeAnalysisIdRef.current) return;
      setAiFeedback({ type: "info", message: "Error IA." });
    } finally {
      if (analysisId === activeAnalysisIdRef.current) {
        setIsAnalyzing(false);
      }
    }
  };

  const handleCaptureFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = Array.from(e.target.files || []);
    if (incomingFiles.length === 0) return;

    const availableSlots = MAX_EVIDENCE_IMAGES - evidenceImages.length;
    if (availableSlots <= 0) {
      showToast("Maximo 5 imagenes por registro", "info");
      e.target.value = "";
      return;
    }

    const filesToAdd = incomingFiles.slice(0, availableSlots);
    if (incomingFiles.length > filesToAdd.length) {
      showToast("Solo se agregaron hasta completar 5 imagenes", "info");
    }

    const nextImages = filesToAdd.map((file, index) => ({
      id: `${Date.now()}-${evidenceImages.length + index}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setEvidenceImages((current) => [...current, ...nextImages]);
    void analyzeImage(nextImages[0].file);
    e.target.value = "";
  };

  const removeEvidenceImage = (imageId: string) => {
    setEvidenceImages((current) => {
      const target = current.find((image) => image.id === imageId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((image) => image.id !== imageId);
    });
  };

  const resetEvidence = () => {
    activeAnalysisIdRef.current += 1;
    evidenceImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setEvidenceImages([]);
    setNote("");
    setAiFeedback(null);
    setIsAnalyzing(false);
    setGpsLocation(null);
    setUtmEast("");
    setUtmNorth("");
  };

  return {
    gpsLocation,
    setGpsLocation,
    isFetchingGps,
    handleCaptureGps,
    utmZone,
    setUtmZone,
    utmEast,
    setUtmEast,
    utmNorth,
    setUtmNorth,
    handleUpdateFromUtm,
    evidenceImages,
    evidenceFiles: evidenceImages.map((image) => image.file),
    evidencePreview: evidenceImages[0]?.previewUrl ?? null,
    note,
    setNote,
    handleCaptureFile,
    removeEvidenceImage,
    isAnalyzing,
    aiFeedback,
    resetEvidence,
  };
}
