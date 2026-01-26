import React, { useMemo } from "react";
import { useReportFlow } from "../../hooks/useReportFlow";
import { styles } from "../../theme/styles";

// Componentes UI
import { TopNav } from "./components/TopNav";
import { BottomNav } from "./components/BottomNav"; // <--- NUEVO
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
      
      {/* HEADER SUPERIOR (Solo marca y estado) */}
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

      {/* CONTENEDOR PRINCIPAL (Con padding bottom extra para la barra) */}
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

        {/* FLUJO DE SELECCIÓN */}
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
            <div style={styles.card}>
                <h2 style={styles.heading}>Buscar Localidad</h2>
                <input 
                    placeholder="Filtrar por nombre..." 
                    value={flow.localitySearch} 
                    onChange={e => flow.setLocalitySearch(e.target.value)} 
                    style={styles.input} 
                    autoFocus 
                />
                <div style={styles.scrollableY}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {flow.filteredLocalities && flow.filteredLocalities.length > 0 ? (
                            flow.filteredLocalities.map(l => (
                                <button 
                                    key={l.ID_Localidad} 
                                    onClick={() => flow.selectLocality(l)} 
                                    style={{
                                        ...styles.gridItem, flexDirection: 'row', justifyContent: 'space-between', 
                                        textAlign: 'left', padding: '16px', minHeight: 'auto'
                                    }}
                                >
                                    <span style={{ fontWeight: '700', color: '#003366' }}>{l.Nombre_Localidad}</span>
                                    <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase' }}>{l.Nombre_Localidad}</span>
                                </button>
                            ))
                        ) : (
                            <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>Sin resultados</div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/*{flow.step === "locality" && (
            <SelectionScreen 
                title="Seleccionar Localidad"
                items={flow.localities.map(l => ({ id: l.ID_Localidad, label: l.Nombre_Localidad }))}
                onSelect={flow.selectLocality}
            />
        )}*/}
        
        {flow.step === "detail" && (
            <div style={styles.card}>
                <h2 style={styles.heading}>Buscar Sector</h2>
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
                                        ...styles.gridItem, flexDirection: 'row', justifyContent: 'space-between', 
                                        textAlign: 'left', padding: '16px', minHeight: 'auto'
                                    }}
                                >
                                    <span style={{ fontWeight: '700', color: '#003366' }}>{d.Nombre_Detalle}</span>
                                    <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase' }}>{d.activityName}</span>
                                </button>
                            ))
                        ) : (
                            <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>Sin resultados</div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {flow.step === "activity" && flow.selectedActivity && (
             <div style={styles.card}>
                <h2 style={styles.heading}>Confirmar</h2>
                <div style={{ padding: '20px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', marginBottom: '20px', borderRadius: '4px' }}>
                    <label style={styles.label}>Actividad</label>
                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#003366', margin: 0 }}>
                        {flow.selectedActivity.Nombre_Actividad}
                    </p>
                </div>
                <button onClick={() => flow.setStep("map")} style={styles.btnPrimary}>
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
                isLoading={flow.isLoading} onSave={() => { flow.saveReport(); /* Opcional: flow.setStep("user_records"); */ }}
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
                <button onClick={flow.requestDeleteAccount} style={{...styles.btnDanger, marginTop: '10px', background:'none', border:'none', color:'#EF4444', textDecoration:'underline'}}>Eliminar mi cuenta</button>
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
                 <hr style={{ border: 'none', borderBottom: '2px solid #F4F7F9', margin: '15px 0' }} />
                 <div style={styles.scrollableY}>
                     <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '500px' }}>
                       <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
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
                                 <td style={{ padding: '10px', fontWeight: '600', color: '#003366' }}>{r.nombre_actividad}</td>
                                 <td style={{ padding: '10px' }}>{new Date(r.fecha_subida).toLocaleDateString()}</td>
                              </tr>
                           ))}
                       </tbody>
                     </table>
                 </div>
             </div>
        )}

      </div>

      {/* BARRA INFERIOR (Solo visible si estamos logueados) */}
      {flow.step !== "auth" && (
          <BottomNav 
            step={flow.step}
            onNavHome={flow.handleGoHome}
            onNavRecords={() => flow.setStep("user_records")}
            onNavFiles={() => flow.setStep("files")}
            onNavProfile={() => flow.setStep("profile")}
          />
      )}

      {/* MODALES GLOBALES */}
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