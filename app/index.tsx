import React, { useRef, useState, useMemo } from "react";
import { useReportFlow } from "../src/hooks/useReportFlow";
import { styles } from "../src/theme/styles";
import proj4 from 'proj4';

const LOGO_SRC = "https://i.imgur.com/Ej1MRpv.png";

export default function IndexPage() {
  const {
    step, setStep, isOnline, isLoading, sessionUser,
    authEmail, setAuthEmail, authPassword, setAuthPassword, authMode, setAuthMode,
    projects, fronts, localities, filteredDetails, selectedActivities, selectedDetail, selectedActivity,
    selectedProjectId, selectedFrontId, selectedLocalityId, detailSearch, setDetailSearch,
    gpsLocation, setGpsLocation, evidencePreview, note, setNote, isFetchingGps, syncStatus,
    utmZone, setUtmZone, utmEast, setUtmEast, utmNorth, setUtmNorth, handleUpdateFromUtm, getMapUrl,
    handleLogin, handleLogout, selectProject, selectFront, selectLocality, selectDetail, 
    goBack,
    handleGoHome, 
    handleCaptureGps, handleCaptureFile, saveReport,
    profileName, setProfileName, profileLastName, setProfileLastName, profileEmail, setProfileEmail, profileCreatedAt, profileLastSignInAt, profileMessage, isProfileSaving, saveProfile, 
    requestDeleteAccount,
    userRecords, isLoadingRecords, selectedRecordId, setSelectedRecordId, 
    requestDeleteRecord,
    handleDownloadCSV, 
    availableProperties, selectedPropId, setSelectedPropId, detailText, setDetailText, handleRowClick, handleSaveProperty,
    isPhotoModalOpen, openEditModal, closeEditModal, editComment, setEditComment, editPreviewUrl, handleEditFileSelect, saveRecordEdits,
    isAnalyzing, 
    aiFeedback,
    toast, confirmModal, setConfirmModal,
    isMenuOpen, setIsMenuOpen,
    registerProperties, registerPropId, setRegisterPropId, registerDetailText, setRegisterDetailText
  } = useReportFlow();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  const mapUrl = getMapUrl();
  const displayLat = gpsLocation?.latitude ?? selectedDetail?.Latitud ?? 0;
  const displayLng = gpsLocation?.longitude ?? selectedDetail?.Longitud ?? 0;

  const selectedProjectName = useMemo(() => projects?.find(p => p.ID_Proyectos === selectedProjectId)?.Proyecto_Nombre, [projects, selectedProjectId]);
  const selectedFrontName = useMemo(() => fronts?.find(f => f.ID_Frente === selectedFrontId)?.Nombre_Frente, [fronts, selectedFrontId]);
  const selectedLocalityName = useMemo(() => localities?.find(l => l.ID_Localidad === selectedLocalityId)?.Nombre_Localidad, [localities, selectedLocalityId]);

  return (
    <div style={{
        ...styles.page, 
        height: '100dvh', 
        minHeight: 'unset', 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column',
        paddingBottom: '40px'
    }}>
      
      {step !== "auth" && (
        <>
          <div style={styles.navbar}>
            <div style={styles.navbarBrand}>CMP Contratistas E.I.R.L.</div>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={styles.hamburgerBtn}>☰</button>
          </div>

          {isMenuOpen && (
            <div style={styles.dropdownMenu}>
              <button onClick={() => { setStep("profile"); setIsMenuOpen(false); }} style={styles.menuItem}>Perfil</button>
              <button onClick={() => { setStep("user_records"); setIsMenuOpen(false); }} style={styles.menuItem}>Mis Registros</button>
              <button onClick={() => { setStep("files"); setIsMenuOpen(false); }} style={styles.menuItem}>Archivos</button>
            </div>
          )}

          <div style={styles.statusBar}>
             <div style={{color: isOnline ? 'green' : 'red', fontWeight: 'bold'}}>{isOnline ? "● Online" : "● Offline"}</div>
             {sessionUser && <div style={{color: '#64748B'}}>{sessionUser.email}</div>}
          </div>

          <div style={styles.navControls}>
             <button onClick={handleGoHome} style={styles.navButtonPrimary}>Inicio</button>
             {(step !== "project" && step !== "profile") && (
                <button onClick={goBack} style={styles.navButton}>Atrás</button>
             )}
          </div>

          {selectedProjectId && step !== "profile" && step !== "user_records" && step !== "files" && (
             <div style={styles.breadcrumbs}>
                <span style={styles.breadcrumbItem}>{selectedProjectName || "Proyecto"}</span>
                {selectedFrontId && <><span style={styles.breadcrumbSeparator}>›</span><span style={styles.breadcrumbItem}>{selectedFrontName || "Frente"}</span></>}
                {selectedLocalityId && <><span style={styles.breadcrumbSeparator}>›</span><span style={styles.breadcrumbItem}>{selectedLocalityName || "Loc"}</span></>}
                {selectedDetail && <><span style={styles.breadcrumbSeparator}>›</span><span style={styles.breadcrumbItem}>{selectedDetail.Nombre_Detalle}</span></>}
             </div>
          )}
        </>
      )}

      <div style={{flex: 1, padding: '0 24px', marginTop: '20px'}}>

      {step === "auth" && (
        <div style={{...styles.card, margin: '0 0 24px'}}>
          <div style={styles.logoRow}>
            <img src={LOGO_SRC} alt="Logo" style={styles.logo} />
            <span style={styles.logoText}>Consorcio Cenepa Asociados</span>
          </div>
          
          <h2 style={styles.sectionTitle}>{authMode === "login" ? "Inicia sesión" : "Crear cuenta"}</h2>
          
          {/* formulario con Enter */}
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <label style={styles.label}>Email</label>
              <input 
                  placeholder="tu@email.com" 
                  value={authEmail} 
                  onChange={(e) => setAuthEmail(e.target.value)} 
                  style={styles.input} 
              />
              <label style={styles.label}>Contraseña</label>
              <input 
                  placeholder="Contraseña" 
                  type="password" 
                  value={authPassword} 
                  onChange={(e) => setAuthPassword(e.target.value)} 
                  style={styles.input} 
              />
              <button 
                  onClick={handleLogin} 
                  disabled={isLoading || !authEmail || !authPassword} 
                  style={(!authEmail || !authPassword) ? styles.primaryButtonDisabled : styles.primaryButton}
              >
                  {isLoading ? "Cargando..." : (authMode === "login" ? "Ingresar" : "Crear")}
              </button>
          </form>

          <div style={styles.authFooter}>
              {authMode === "login" ? (<span onClick={() => setAuthMode("signup")} style={styles.linkText}>Crear cuenta</span>) : (<>¿Ya tienes una cuenta? <span onClick={() => setAuthMode("login")} style={styles.linkText}>Iniciar sesión</span></>)}
          </div>
          {syncStatus && <p style={{textAlign:'center', fontSize:12, color:'blue', marginTop:10}}>{syncStatus}</p>}
        </div>
      )}

      {/* navegation blocks */}
      {step === "project" && (
        <div style={{...styles.card, margin: '0 0 24px'}}><h2 style={styles.sectionTitle}>Selecciona un proyecto</h2><div style={styles.optionGrid}>{projects?.map(p => <button key={p.ID_Proyectos} onClick={() => selectProject(p.ID_Proyectos)} style={styles.optionButton}>{p.Proyecto_Nombre}</button>)}</div></div>
      )}
      {step === "front" && (<div style={{...styles.card, margin: '0 0 24px'}}><h2 style={styles.sectionTitle}>Selecciona un frente</h2><div style={styles.optionGrid}>{fronts?.map(f => <button key={f.ID_Frente} onClick={() => selectFront(f.ID_Frente)} style={styles.optionButton}>{f.Nombre_Frente}</button>)}</div></div>)}
      {step === "locality" && (<div style={{...styles.card, margin: '0 0 24px'}}><h2 style={styles.sectionTitle}>Selecciona una localidad</h2><div style={styles.optionGrid}>{localities?.map(l => <button key={l.ID_Localidad} onClick={() => selectLocality(l.ID_Localidad)} style={styles.optionButton}>{l.Nombre_Localidad}</button>)}</div></div>)}
      {step === "detail" && (
        <div style={{...styles.card, margin: '0 0 24px'}}>
            <h2 style={styles.sectionTitle}>Selecciona un sector</h2>
            <input placeholder="Buscar..." value={detailSearch} onChange={e => setDetailSearch(e.target.value)} style={styles.searchInput} />
            <div style={styles.searchResults}>
                {filteredDetails && filteredDetails.length > 0 ? (
                    filteredDetails.map(d => (
                        <button key={d.ID_DetallesActividad} onClick={() => selectDetail(d)} style={styles.searchOption}>
                            <span style={styles.searchOptionTitle}>{d.Nombre_Detalle}</span>
                            <span style={styles.searchOptionMeta}>{d.activityName}</span>
                        </button>
                    ))
                ) : (
                    <div style={{padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '13px'}}>No se encontraron actividades</div>
                )}
            </div>
        </div>
      )}
      {step === "activity" && selectedActivity && (
         <div style={{...styles.card, margin: '0 0 24px'}}><h2 style={styles.sectionTitle}>Confirmar Actividad</h2><div style={styles.detailInfoBox}><p style={{fontWeight:'bold'}}>{selectedActivity.Nombre_Actividad}</p></div><button onClick={() => setStep("map")} style={styles.primaryButton}>Ir al Mapa / Formulario</button></div>
      )}

      {/* --- form de registro --- */}
      {(step === "map" || step === "form") && (
        <div style={{...styles.card, margin: '0 0 24px'}}>
           <h2 style={styles.sectionTitle}>Registrar Evidencia</h2>
           
           <div style={{backgroundColor:'#F8FAFC', padding:15, borderRadius:12, border:'1px solid #E2E8F0', marginBottom:20}}>
               <h3 style={{fontSize:14, fontWeight:'normal', color:'#475569', marginTop:0, marginBottom:10}}>Ubicación</h3>
               <div style={{...styles.mapPlaceholder, height: '150px', marginBottom:10}}>
                   {isOnline && mapUrl ? <iframe title="Mapa" src={mapUrl} style={{...styles.mapFrame, height:'150px'}} /> : <div style={styles.emptyState}>Mapa Offline<br/>{displayLat.toFixed(5)}, {displayLng.toFixed(5)}</div>}
               </div>
               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, paddingBottom:12, borderBottom:'1px dashed #CBD5F5'}}>
                   <div><span style={{fontSize:11, color:'#64748B'}}>Automática (GPS)</span><div style={{fontSize:14, color:'#0F172A'}}>{displayLat.toFixed(5)}, {displayLng.toFixed(5)}</div></div>
                   <button onClick={handleCaptureGps} disabled={isFetchingGps} style={styles.secondaryButtonSmall}>{isFetchingGps ? "..." : "Actualizar"}</button>
               </div>
               <div>
                   <span style={{fontSize:11, color:'#64748B', display:'block', marginBottom:5}}>Manual (UTM)</span>
                   <div style={{display:'flex', gap:5}}>
                        <select value={utmZone} onChange={(e) => setUtmZone(e.target.value)} style={{...styles.inputCompact, width:'25%'}}><option value="17">17S</option><option value="18">18S</option><option value="19">19S</option></select>
                        <input placeholder="Este (E)" value={utmEast} onChange={(e) => setUtmEast(e.target.value)} style={{...styles.inputCompact, width:'30%'}} />
                        <input placeholder="Norte (N)" value={utmNorth} onChange={(e) => setUtmNorth(e.target.value)} style={{...styles.inputCompact, width:'30%'}} />
                        <button onClick={handleUpdateFromUtm} style={{...styles.secondaryButtonSmall, width:'auto', padding:'0 8px'}}>Aplicar</button>
                   </div>
               </div>
           </div>
           
           <div style={{backgroundColor:'#FFFFFF', padding:15, borderRadius:12, border:'1px solid #E2E8F0', marginBottom:20, boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
               <h3 style={{fontSize:14, fontWeight:'normal', color:'#475569', marginTop:0, marginBottom:10}}>Evidencia y datos</h3>
               <div style={{marginBottom:15}}>
                    <div style={{...styles.evidenceBox, backgroundColor:'#F1F5F9', borderStyle:'dashed', minHeight:'180px'}}>
                        {evidencePreview ? <img src={evidencePreview} style={{...styles.evidenceImage, height:'auto', maxHeight:'250px'}} /> : <span style={{color:'#94A3B8', fontSize:13}}>Sin foto seleccionada</span>}
                    </div>

                    {isAnalyzing && <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:10, backgroundColor:'#EFF6FF', borderRadius:8, color:'#1E40AF', fontSize:13}}><b>Analizando imagen con IA...</b></div>}
                    {aiFeedback && <div style={{padding:10, borderRadius:8, fontSize:13, marginTop:5, backgroundColor: aiFeedback.type === 'warning' ? '#FEF2F2' : (aiFeedback.type === 'info' ? '#EFF6FF' : '#F0FDF4'), border: aiFeedback.type === 'warning' ? '1px solid #FCA5A5' : (aiFeedback.type === 'info' ? '1px solid #BFDBFE' : '1px solid #86EFAC'), color: aiFeedback.type === 'warning' ? '#991B1B' : (aiFeedback.type === 'info' ? '#1E40AF' : '#166534')}}>{aiFeedback.type === 'warning' ? '⚠️' : (aiFeedback.type === 'info' ? 'ℹ️' : '✅')} <b>{aiFeedback.message}</b></div>}

                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCaptureFile} style={{display:'none'}} />
                    <button onClick={() => fileInputRef.current?.click()} style={{...styles.secondaryButton, marginTop:10}}>Tomar / Seleccionar foto</button>
               </div>
               <label style={styles.label}>Observaciones</label>
               <textarea value={note} onChange={e => setNote(e.target.value)} style={{...styles.textArea, minHeight:'70px'}} placeholder="Escribe aquí..." />
           </div>

           {/* --- atributos de actividad--- */}
           <div style={{backgroundColor: '#FFFFFF', padding: 15, borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 20, boxShadow: '0 2px 5px rgba(0,0,0,0.05)'}}>
               <h3 style={{fontSize: 14, fontWeight: 'normal', color: '#475569', marginTop: 0, marginBottom: 10}}>Atributos de Actividad</h3>
               {isOnline ? (
                   <>
                       {registerProperties.length > 0 ? (
                           <>
                               <label style={{...styles.label, fontSize: '11px', color:'#64748B'}}>Tipo de Propiedad</label>
                               <select value={registerPropId} onChange={(e) => setRegisterPropId(Number(e.target.value))} style={{...styles.input, padding: '8px', fontSize: '13px', marginBottom: '10px', height: 'auto'}}>
                                   <option value="">-- Seleccionar --</option>
                                   {registerProperties.map(p => (<option key={p.ID_Propiedad} value={p.ID_Propiedad}>{p.Propiedad}</option>))}
                               </select>
                               <label style={{...styles.label, fontSize: '11px', color:'#64748B'}}>Valor / Detalle</label>
                               <input value={registerDetailText} onChange={(e) => setRegisterDetailText(e.target.value)} style={{...styles.input, padding: '8px', fontSize: '13px', marginBottom: '0'}} placeholder="Ej: 50 metros, Color Rojo..." />
                           </>
                       ) : (
                           <div style={{fontSize: '12px', color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', padding: '10px'}}>No hay propiedades configuradas para esta actividad.</div>
                       )}
                   </>
               ) : (
                   <div style={{backgroundColor: '#FFF1F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px', fontSize: '12px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px'}}><span>⚠️</span> Propiedades no disponibles offline. Por favor, añada detalles importantes en las Observaciones.</div>
               )}
           </div>

           <button onClick={saveReport} disabled={isLoading || !evidencePreview || isAnalyzing} style={{...(isLoading || isAnalyzing ? styles.primaryButtonDisabled : styles.primaryButton), height: '50px', fontSize: '16px', marginBottom: '20px'}}>{isLoading ? "Guardando..." : (isAnalyzing ? "Analizando..." : "Guardar reporte")}</button>
        </div>
      )}
      
      {step === "profile" && (
         <div style={{...styles.card, margin: '0 0 24px'}}>
            <h2 style={styles.sectionTitle}>Mi Perfil</h2>
            <input placeholder="Nombre" value={profileName} onChange={(e) => setProfileName(e.target.value)} style={styles.input} />
            <input placeholder="Apellido" value={profileLastName} onChange={(e) => setProfileLastName(e.target.value)} style={styles.input} />
            <input placeholder="Email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} style={styles.input} />
            <div style={styles.readOnlyBlock}><span>Creado: {new Date(profileCreatedAt).toLocaleDateString()}</span></div>
            {profileMessage && <div style={styles.profileMessage}>{profileMessage}</div>}
            <div style={{marginTop: '20px'}}>
                <button onClick={saveProfile} disabled={isProfileSaving} style={styles.primaryButton}>Actualizar Datos</button>
                <button onClick={handleLogout} style={styles.secondaryButton}>Cerrar Sesión</button>
                <button onClick={requestDeleteAccount} style={styles.dangerButton}>Eliminar Cuenta</button>
            </div>
         </div>
      )}

      {step === "user_records" && (
         <div style={{...styles.card, margin: '0 0 24px', minHeight: '80vh'}}>
             <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 20}}>
                <div><h2 style={styles.sectionTitle}>Mis Registros</h2><p style={{fontSize: '13px', color: '#64748B', margin: 0}}>{userRecords?.length || 0} evidencias registradas</p></div>
             </div>
             {isLoadingRecords ? (<div style={styles.emptyState}>Cargando galería...</div>) : userRecords?.length === 0 ? (<div style={styles.emptyState}>No tienes registros aún.</div>) : (
                 <>
                    <div style={styles.gridContainer}>
                        {userRecords?.map(rec => (
                            <div key={rec.id_registro} style={styles.cardItem} onClick={() => setSelectedRecordId(rec.id_registro)}>
                                {rec.url_foto ? (<img src={rec.url_foto} alt="Evidencia" style={styles.cardImage} loading="lazy" />) : (<div style={styles.cardImagePlaceholder}>📷</div>)}
                                <div style={styles.cardFooter}><span style={styles.cardTitle}>{rec.nombre_actividad}</span></div>
                            </div>
                        ))}
                    </div>
                    {selectedRecordId && (() => {
                        const rec = userRecords.find(r => r.id_registro === selectedRecordId);
                        if (!rec) return null;
                        const proyectoStr = rec.nombre_proyecto || (rec.bucket ? rec.bucket.replace(/_/g, ' ').toUpperCase() : "PROYECTO GENERAL");
                        let frenteStr = rec.nombre_frente || "No identificado";
                        if ((!rec.nombre_frente || rec.nombre_frente === "No identificado") && rec.ruta_archivo) {
                            const parts = rec.ruta_archivo.split('/');
                            if (parts.length > 0) {
                                if (parts[0].toLowerCase() === 'uploads' && parts.length > 1) { frenteStr = parts[1].replace(/_/g, ' '); } 
                                else if (parts[0].toLowerCase() !== 'uploads') { frenteStr = parts[0].replace(/_/g, ' '); }
                            }
                        }
                        return (
                            <div style={styles.detailOverlay}>
                                <div style={styles.detailHeader}>
                                    <button onClick={() => setSelectedRecordId(null)} style={styles.backArrowBtn}>←</button>
                                    <h3 style={{margin: 0, fontSize: '15px', color: '#0F172A', fontWeight: 'bold', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{rec.nombre_actividad}</h3>
                                </div>
                                <div style={styles.detailContent}>
                                    <div style={{textAlign:'center'}}>{rec.url_foto ? (<img src={rec.url_foto} style={styles.detailImageLarge} alt="Evidencia Grande" />) : (<div style={{...styles.detailImageLarge, backgroundColor:'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center', color:'#94A3B8'}}>Sin Foto</div>)}</div>
                                    <div style={styles.attributeList}>
                                        <div style={styles.attributeItem}><span style={styles.attributeLabel}>Proyecto</span><span style={styles.attributeValue}>{proyectoStr}</span></div>
                                        <div style={styles.attributeItem}><span style={styles.attributeLabel}>Frente</span><span style={styles.attributeValue}>{frenteStr.toUpperCase()}</span></div>
                                        <div style={styles.attributeItem}><span style={styles.attributeLabel}>Localidad</span><span style={styles.attributeValue}>{rec.nombre_localidad}</span></div>
                                        <div style={styles.attributeItem}><span style={styles.attributeLabel}>Sector</span><span style={styles.attributeValue}>{rec.nombre_detalle}</span></div>
                                        <div style={styles.attributeItem}><span style={styles.attributeLabel}>Actividad</span><span style={styles.attributeValue}>{rec.nombre_actividad}</span></div>
                                        <div style={styles.attributeItem}><span style={styles.attributeLabel}>Comentario</span><span style={{...styles.attributeValue, fontStyle: rec.comentario ? 'normal' : 'italic', color: rec.comentario ? '#0F172A' : '#94A3B8'}}>{rec.comentario || "Sin comentarios"}</span></div>
                                        <div style={{...styles.attributeItem, borderBottom: 'none'}}><span style={styles.attributeLabel}>Ubicación</span><span style={{...styles.attributeValue, fontFamily: 'monospace', fontSize: '12px', backgroundColor:'#F1F5F9', padding:'4px 8px', borderRadius:'4px', display:'inline-block'}}>{rec.latitud ? `${rec.latitud.toFixed(6)}, ${rec.longitud?.toFixed(6)}` : "Sin coordenadas"}</span></div>
                                    </div>
                                    <div style={{marginTop: '40px', display: 'flex', gap: '10px', paddingBottom: '40px'}}>
                                        <button onClick={() => requestDeleteRecord(rec)} style={{...styles.dangerButton, flex: 1, marginTop: 0}}>Eliminar</button>
                                        <button onClick={openEditModal} style={{...styles.secondaryButton, flex: 1, marginTop: 0}}>Editar</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                 </>
             )}
         </div>
      )}

      {step === "files" && (
         <div style={{...styles.card, margin: '0 0 24px'}}>
             <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10}}>
                <h2 style={{...styles.sectionTitle, marginBottom:0}}>Archivos</h2>
                <button onClick={handleDownloadCSV} style={{...styles.secondaryButtonSmall, width:'auto'}}>Descargar CSV</button>
             </div>
             <div style={styles.tableContainer}>
                 <table style={styles.table}>
                   <thead><tr style={styles.tableHeaderRow}><th style={styles.tableTh}>ID</th><th style={styles.tableTh}>Localidad</th><th style={styles.tableTh}>Sector</th><th style={styles.tableTh}>Actividad</th><th style={styles.tableTh}>Fecha</th></tr></thead>
                   <tbody>
                       {userRecords?.map(r => (
                          <tr key={r.id_registro} onClick={() => handleRowClick(r)} style={selectedRecordId === r.id_registro ? styles.tableRowActive : styles.tableRow}>
                             <td style={{padding:8}}>{r.id_registro}</td><td style={{padding:8}}>{r.nombre_localidad}</td><td style={{padding:8}}>{r.nombre_detalle}</td><td style={{padding:8}}>{r.nombre_actividad}</td><td style={{padding:8}}>{new Date(r.fecha_subida).toLocaleDateString()}</td>
                          </tr>
                       ))}
                   </tbody>
                 </table>
             </div>
             {selectedRecordId ? (
                 <div style={{marginTop:20, borderTop:'1px solid #eee', paddingTop:15, backgroundColor:'#FAFAFA', padding:15, borderRadius:8}}>
                     <h4 style={{marginTop:0, fontSize:14, color:'#0B5FFF'}}>Propiedades del Registro #{selectedRecordId}</h4>
                     <label style={styles.label}>Tipo de Propiedad</label>
                     <select value={selectedPropId} onChange={e=>setSelectedPropId(Number(e.target.value))} style={styles.input}><option value="">-- Seleccionar --</option>{availableProperties?.map(p=><option key={p.ID_Propiedad} value={p.ID_Propiedad}>{p.Propiedad}</option>)}</select>
                     <label style={styles.label}>Valor / Detalle</label>
                     <input value={detailText} onChange={e=>setDetailText(e.target.value)} style={styles.input} placeholder="Ej: 50 metros..." />
                     <button onClick={handleSaveProperty} style={styles.secondaryButtonSmall}>Guardar Propiedad</button>
                 </div>
             ) : (<div style={{marginTop:20, padding:15, textAlign:'center', color:'#94A3B8', border:'1px dashed #CBD5F5', borderRadius:8}}>Selecciona una fila para anadir propiedades.</div>)}
         </div>
      )}

      {isPhotoModalOpen && (
         <div style={styles.modalOverlay}><div style={styles.modalCard}><h3>Editar</h3>{editPreviewUrl && <img src={editPreviewUrl} style={styles.evidenceImage} />}<button onClick={() => editFileInputRef.current?.click()} style={styles.secondaryButton}>Cambiar Foto</button><input ref={editFileInputRef} type="file" onChange={handleEditFileSelect} style={{display:'none'}} /><input value={editComment} onChange={e => setEditComment(e.target.value)} style={styles.input} /><div style={styles.modalButtons}><button onClick={closeEditModal} style={styles.secondaryButton}>Cancelar</button><button onClick={saveRecordEdits} style={styles.primaryButton}>Guardar</button></div></div></div>
      )}

      {toast && (
        <div style={{position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', backgroundColor: toast.type === 'error' ? '#FEF2F2' : (toast.type === 'info' ? '#EFF6FF' : '#F0FDF4'), border: toast.type === 'error' ? '1px solid #FCA5A5' : (toast.type === 'info' ? '1px solid #BFDBFE' : '1px solid #86EFAC'), color: toast.type === 'error' ? '#991B1B' : (toast.type === 'info' ? '1E40AF' : '#166534'), padding: '12px 24px', borderRadius: '50px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap'}}>
            <span>{toast.type === 'error' ? '⚠️' : (toast.type === 'info' ? 'ℹ️' : '✅')}</span>{toast.msg}
        </div>
      )}

      {confirmModal?.open && (
        <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
                <h3 style={{marginTop:0, color:'#0F172A'}}>{confirmModal.title}</h3>
                <p style={{color:'#64748B', marginBottom:20}}>{confirmModal.message}</p>
                <div style={styles.modalButtons}><button onClick={() => setConfirmModal(null)} style={styles.secondaryButton}>Cancelar</button><button onClick={confirmModal.onConfirm} style={styles.dangerButton}>Confirmar</button></div>
            </div>
        </div>
      )}

      </div>
    </div>
  );
}