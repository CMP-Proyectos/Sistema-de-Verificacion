import React, { useEffect } from "react";
import ReportFlowPage from "../src/features/reportFlow/ReportFlowPage";
import { getAllActivities, getAllDetails } from "../src/services/dataService";
import { db } from "../src/services/db_local";

// TEMP DEBUG: exponer funciones y DB al navegador
if (typeof window !== "undefined") {
  (window as any).getAllActivities = getAllActivities;
  (window as any).getAllDetails = getAllDetails;
  (window as any).db = db;
}

export default function IndexPage() {
  useEffect(() => {
    if ("serviceWorker" in navigator && !window.location.host.includes("localhost")) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("✅ Modo Offline Activado (SW registrado):", registration.scope);
        })
        .catch((err) => {
          console.error("❌ Error al activar Modo Offline:", err);
        });
    }
  }, []);

  return <ReportFlowPage />;
}