import React, { useEffect } from "react"; // 1. Importamos useEffect
import ReportFlowPage from "../src/features/reportFlow/ReportFlowPage";

export default function IndexPage() {

  // --- EL INTERRUPTOR OFFLINE (Service Worker) ---
  /*useEffect(() => {
    // Verificamos si el navegador soporta Service Workers
    // y evitamos activarlo en localhost para que no te moleste mientras programas
    if ('serviceWorker' in navigator && !window.location.host.includes('localhost')) {
      
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ Modo Offline Activado (SW registrado):', registration.scope);
        })
        .catch((err) => {
          console.error('❌ Error al activar Modo Offline:', err);
        });
        
    }
  }, []); // El array vacío [] hace que esto corra solo una vez al iniciar la app
*/
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister(); // <--- ESTO MATA AL ZOMBIE
        }
      });
    }
  }, []);
  return <ReportFlowPage />;
}
