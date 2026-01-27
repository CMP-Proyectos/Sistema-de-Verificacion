import React, { useMemo } from "react";
import { useReportFlow } from "../../hooks/useReportFlow";
import { styles } from "../../theme/styles";

// Componentes UI
import { TopNav } from "./components/TopNav";
import { BottomNav } from "./components/BottomNav";
import { Toast } from "./components/Toast";
import { ConfirmModal } from "./components/ConfirmModal";
import { PhotoEditModal } from "./components/PhotoEditModal";

// Screens
import { AuthScreen } from "./screens/AuthScreen";
import { SelectionScreen } from "./screens/SelectionScreen";
import { EvidenceFormScreen } from "./screens/EvidenceFormScreen";
import { UserGalleryScreen } from "./screens/UserGalleryScreen";
// Pantalla de historial
import { ActivityConfirmationScreen } from "./screens/ActivityConfirmationScreen";

export default function ReportFlowPage() {
  const flow = useReportFlow();
  
  // Helpers
  const mapUrl = flow.getMapUrl();
  const displayLat = flow.gpsLocation?.latitude ?? flow.selectedDetail?.Latitud ?? 0;
  const displayLng = flow.gpsLocation?.longitude ?? flow.selectedDetail?.Longitud ?? 0;

  const selectedProjectName = useMemo(() => flow.projects?.find(p => p.ID_Proyectos === flow.selectedProjectId)?.Proyecto_Nombre, [flow.projects, flow.selectedProjectId]);
  const selectedFrontName = useMemo(() => flow.fronts?.find(f => f.ID_Frente === flow.selectedFrontId)?.Nombre_Frente, [flow.fronts, flow.selectedFrontId]);
  const selectedLocalityName = useMemo(() => flow.localities?.find(l => l.ID_Localidad === flow.selectedLocalityId)?.Nombre_Localidad, [flow.localities, flow.selectedLocalityId]);

  return (
    <div style={styles.page}>
      
      <TopNav 
        step={flow.step}
        isOnline={flow.isOnline}
        onBack={flow.goBack}
        breadcrumbNames={{
            project: selectedProjectName,
            front: selectedFrontName,
            locality: selectedLocalityName,
            detail: flow.selectedDetail?.Nombre_Detalle
        }}
      />

      <div style={styles.container}>

        {/* --- PANTALLAS DE AUTENTICACIÓN --- */}
        {flow.step === "auth" && (
            <AuthScreen 
                authEmail={flow.authEmail} setAuthEmail={flow.setAuthEmail}
                authPassword={flow.authPassword} setAuthPassword={flow.setAuthPassword}
                authMode={flow.authMode} setAuthMode={flow.setAuthMode}
                isLoading={flow.isLoading} syncStatus={flow.syncStatus}
                onLogin={flow.handleLogin}
            />
        )}

        {/* --- SELECCIÓN DE PROYECTO --- */}
        {flow.step === "project" && (
            <SelectionScreen 
                title="Seleccionar Proyecto"
                items={flow.projects.map(p => ({ id: p.ID_Proyectos, label: p.Proyecto_Nombre }))}
                onSelect={flow.selectProject}
            />
        )}
        
        {/* --- SELECCIÓN DE FRENTE --- */}
        {flow.step === "front" && (
            <SelectionScreen 
                title="Seleccionar Frente"
                items={flow.fronts.map(f => ({ id: f.ID_Frente, label: f.Nombre_Frente }))}
                onSelect={flow.selectFront}
            />
        )}

        {/* --- SELECCIÓN DE LOCALIDAD (CON BUSCADOR Y ALINEACIÓN IZQUIERDA) --- */}
        {flow.step === "locality" && (
            <div style={styles.card}>
                <h2 style={styles.heading}>SELECCIONAR LOCALIDAD</h2>
                
                {/* INPUT DE BÚSQUEDA */}
                <input 
                    placeholder="Buscar localidad..." 
                    value={flow.localitySearch} 
                    onChange={e => flow.setLocalitySearch(e.target.value)}
                    style={styles.input}
                    autoFocus 
                />

                {/* LISTA FILTRADA */}
                <div style={styles.scrollableY}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {flow.filteredLocalities && flow.filteredLocalities.length > 0 ? (
                            flow.filteredLocalities.map(l => (
                                <button 
                                    key={l.ID_Localidad} 
                                    onClick={() => flow.selectLocality(l.ID_Localidad)}
                                    style={{
                                        ...styles.gridItem,
                                        // CORRECCIÓN DE ALINEACIÓN:
                                        display: 'flex',
                                        flexDirection: 'row',        // Flujo horizontal
                                        justifyContent: 'flex-start', // Pegado a la izquierda
                                        alignItems: 'center',         // Centrado verticalmente
                                        textAlign: 'left',            // Texto a la izquierda
                                        
                                        // ESTILOS:
                                        padding: '16px',
                                        width: '100%',
                                        minHeight: 'auto',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        borderLeft: '4px solid #003366',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    {l.Nombre_Localidad}
                                </button>
                            ))
                        ) : (
                            <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                                No se encontraron localidades
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
        
        {/* --- SELECCIÓN DE SECTOR (CON BUSCADOR) --- */}
        {flow.step === "detail" && (
            <div style={styles.card}>
                <h2 style={styles.heading}>BUSCAR SECTOR</h2>
                <input 
                    placeholder="Filtrar por nombre o código..." 
                    value={flow.detailSearch} 
                    onChange={e => flow.setDetailSearch(e.target.value)}
                    style={styles.input}
                    autoFocus 
                />
                <div style={styles.scrollableY}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {flow.filteredDetails && flow.filteredDetails.length > 0 ? (
                            flow.filteredDetails.map(d => (
                                <button 
                                    key={d.ID_DetallesActividad} 
                                    onClick={() => flow.selectDetail(d)}
                                    style={{
                                        ...styles.gridItem, 
                                        flexDirection: 'row', 
                                        justifyContent: 'space-between', 
                                        textAlign: 'left', 
                                        padding: '16px', 
                                        minHeight: 'auto', 
                                        width: '100%',
                                        borderLeft: '4px solid #003366', 
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <div style={{ flex: 1, paddingRight: '10px' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '770', color: '#1E293B' }}>
                                            {d.activityName}
                                        </div>
                                    </div>
                                    <div style={{ backgroundColor: '#F1F5F9', padding: '4px 8px', borderRadius: '4px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#003366', fontFamily: 'monospace' }}>
                                            {d.Nombre_Detalle}
                                        </span>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>Sin resultados</div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- PANTALLA DE CONFIRMACIÓN MODULARIZADA --- */}
        {flow.step === "activity" && (
             <ActivityConfirmationScreen 
                selectedActivity={flow.selectedActivity}
                selectedDetail={flow.selectedDetail}
                onContinue={() => flow.setStep("map")}
             />
        )}

        {/* --- FORMULARIOS Y OTRAS PANTALLAS --- */}
        {(flow.step === "map" || flow.step === "form") && (
            <EvidenceFormScreen 
                isOnline={flow.isOnline}
                mapUrl={mapUrl} displayLat={displayLat} displayLng={displayLng}
                isFetchingGps={flow.isFetchingGps} onCaptureGps={flow.handleCaptureGps}
                utmZone={flow.utmZone} setUtmZone={flow.setUtmZone} utmEast={flow.utmEast} setUtmEast={flow.setUtmEast} utmNorth={flow.utmNorth} setUtmNorth={flow.setUtmNorth} onUpdateUtm={flow.handleUpdateFromUtm}
                evidencePreview={flow.evidencePreview} isAnalyzing={flow.isAnalyzing} aiFeedback={flow.aiFeedback} onCaptureFile={flow.handleCaptureFile}
                note={flow.note} setNote={flow.setNote}
                registerProperties={flow.registerProperties} registerPropId={flow.registerPropId} setRegisterPropId={flow.setRegisterPropId} registerDetailText={flow.registerDetailText} setRegisterDetailText={flow.setRegisterDetailText}
                isLoading={flow.isLoading} onSave={() => { flow.saveReport(); }}
            />
        )}
        
        {flow.step === "profile" && (
             <div style={styles.card}>
                <h2 style={styles.heading}>Mi Perfil</h2>
                <div style={{marginBottom:'20px'}}>
                    <label style={styles.label}>Usuario</label>
                    <div style={{fontSize:'14px', color:'#1E293B'}}>{flow.sessionUser?.email}</div>
                </div>
                <input value={flow.profileName} onChange={(e) => flow.setProfileName(e.target.value)} style={styles.input} placeholder="Nombres" />
                <input value={flow.profileLastName} onChange={(e) => flow.setProfileLastName(e.target.value)} style={styles.input} placeholder="Apellidos" />
                <button onClick={flow.saveProfile} disabled={flow.isProfileSaving} style={styles.btnPrimary}>Actualizar Datos</button>
                <button onClick={flow.handleLogout} style={{...styles.btnSecondary, width: '100%', marginTop: '20px'}}>Cerrar Sesión</button>
             </div>
        )}

        {flow.step === "user_records" && (
            <UserGalleryScreen 
                records={flow.userRecords}
                isLoading={flow.isLoadingRecords}
                selectedRecordId={flow.selectedRecordId}
                onSelectRecord={flow.setSelectedRecordId}
                onDelete={(rec) => flow.requestDeleteRecord(rec)}
                onEdit={flow.openEditModal}
            />
        )}

        {flow.step === "files" && (
             <div style={styles.card}>
                 <div style={styles.flexBetween}>
                    <h2 style={{...styles.heading, borderBottom: 'none', margin: 0}}>Exportar Datos</h2>
                    <button onClick={flow.handleDownloadCSV} style={styles.btnSecondary}>DESCARGAR CSV</button>
                 </div>
                 <div style={styles.scrollableY}>
                     <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '500px' }}>
                       <thead>
                           <tr style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}>
                               <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
                               <th style={{ padding: '10px', textAlign: 'left' }}>Actividad</th>
                               <th style={{ padding: '10px', textAlign: 'left' }}>Fecha</th>
                           </tr>
                       </thead>
                       <tbody>
                           {flow.userRecords?.map(r => (
                              <tr key={r.id_registro} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                 <td style={{ padding: '10px' }}>{r.id_registro}</td>
                                 <td style={{ padding: '10px', fontWeight: '600' }}>{r.nombre_actividad}</td>
                                 <td style={{ padding: '10px' }}>{new Date(r.fecha_subida).toLocaleDateString()}</td>
                              </tr>
                           ))}
                       </tbody>
                     </table>
                 </div>
             </div>
        )}

      </div>

      {flow.step !== "auth" && (
          <BottomNav 
            step={flow.step}
            onNavHome={flow.handleGoHome}
            onNavRecords={() => flow.setStep("user_records")}
            onNavFiles={() => flow.setStep("files")}
            onNavProfile={() => flow.setStep("profile")}
          />
      )}

      <PhotoEditModal 
        open={flow.isPhotoModalOpen}
        previewUrl={flow.editPreviewUrl}
        comment={flow.editComment}
        onCommentChange={flow.setEditComment}
        onFileSelect={flow.handleEditFileSelect}
        onClose={flow.closeEditModal}
        onSave={flow.saveRecordEdits}
      />
      <Toast toast={flow.toast} />
      <ConfirmModal modal={flow.confirmModal} onClose={() => flow.setConfirmModal(null)} />

    </div>
  );
}