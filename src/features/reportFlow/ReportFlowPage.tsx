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

        {/* LOGIN */}
        {flow.step === "auth" && (
            <AuthScreen 
                authEmail={flow.authEmail} setAuthEmail={flow.setAuthEmail}
                authPassword={flow.authPassword} setAuthPassword={flow.setAuthPassword}
                authMode={flow.authMode} setAuthMode={flow.setAuthMode}
                isLoading={flow.isLoading} syncStatus={flow.syncStatus}
                onLogin={flow.handleLogin}
            />
        )}

        {/* SELECCIONES INICIALES */}
        {flow.step === "project" && (
            <SelectionScreen 
                title="Seleccionar Proyecto"
                items={flow.projects.map(p => ({ id: p.ID_Proyectos, label: p.Proyecto_Nombre }))}
                onSelect={flow.selectProject}
            />
        )}
        
        {flow.step === "front" && (
            <SelectionScreen 
                title="Seleccionar Frente"
                items={flow.fronts.map(f => ({ id: f.ID_Frente, label: f.Nombre_Frente }))}
                onSelect={flow.selectFront}
            />
        )}

        {flow.step === "locality" && (
            <SelectionScreen 
                title="Seleccionar Localidad"
                items={flow.localities.map(l => ({ id: l.ID_Localidad, label: l.Nombre_Localidad }))}
                onSelect={flow.selectLocality}
            />
        )}
        
        {/* BUSCAR SECTOR (CORREGIDO Y RESALTADO) */}
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
                                    {/* IZQUIERDA: TIPO DE ARMADO (MÁS RESALTADO) */}
                                    <div style={{ flex: 1, paddingRight: '10px' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '770', color: '#1E293B' }}>
                                            {d.activityName}
                                        </div>
                                    </div>
                                    {/* DERECHA: CÓDIGO (IDENTIFICADOR) */}
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

        {/* CONFIRMACIÓN DE ACTIVIDAD (REINSTAURADA) */}
        {flow.step === "activity" && flow.selectedActivity && (
             <div style={styles.card}>
                <h2 style={styles.heading}>CONFIRMAR</h2>
                <div style={{ padding: '24px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', marginBottom: '20px', borderRadius: '4px' }}>
                    <label style={styles.label}>ACTIVIDAD</label>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#003366', margin: 0 }}>
                        {flow.selectedActivity.Nombre_Actividad}
                    </p>
                </div>
                <button onClick={() => flow.setStep("map")} style={{ ...styles.btnPrimary, height: '56px' }}>
                    COMENZAR REPORTE
                </button>
             </div>
        )}

        {/* FORMULARIO DE EVIDENCIA */}
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
        
        {/* PANTALLAS DE NAVEGACIÓN INFERIOR */}
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