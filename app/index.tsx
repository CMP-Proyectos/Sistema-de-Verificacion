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
    handleLogin, handleLogout, selectProject, selectFront, selectLocality, selectDetail, goBack,
    handleCaptureGps, handleCaptureFile, saveReport,
    profileName, setProfileName, profileLastName, setProfileLastName, profileEmail, setProfileEmail, profileCreatedAt, profileLastSignInAt, profileMessage, isProfileSaving, saveProfile, deleteAccount,
    userRecords, isLoadingRecords, selectedRecordId, setSelectedRecordId, 
    deleteRecord, 
    handleDownloadCSV, 
    availableProperties, selectedPropId, setSelectedPropId, detailText, setDetailText, handleRowClick, handleSaveProperty,
    isPhotoModalOpen, openEditModal, closeEditModal, editComment, setEditComment, editPreviewUrl, handleEditFileSelect, saveRecordEdits,
    isAnalyzing, aiError 
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
    // FIX DE SCROLL: Usamos 'height: 100dvh' para ocupar exactamente la pantalla del móvil 
    // y 'overflowY: auto' para que el scroll ocurra dentro de este div y no en el body global.
    <div style={{
        ...styles.page, 
        height: '100dvh', 
        minHeight: 'unset', 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column',
        paddingBottom: '40px' // Un padding normal es suficiente ahora
    }}>
      
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={styles.title}>Reporte de Obras</h1>
          {step !== "auth" && (
             <div style={{display: 'flex', gap: '8px'}}>
                 <button onClick={() => setStep("project")} style={styles.headerButtonOutline}>Inicio</button>
                 <button onClick={() => setStep("profile")} style={styles.profileButton}>Perfil</button>
             </div>
          )}
        </div>
        <div style={{fontSize: '11px', color: isOnline ? 'green' : 'red', fontWeight: 'bold'}}>{isOnline ? "Online" : "Offline"}</div>

        {step !== "auth" && sessionUser && (
          <>
            <p style={styles.userEmail}>Sesión: {sessionUser.email}</p>
            {step !== "profile" && step !== "user_records" && step !== "files" && selectedProjectId && (
                <div style={styles.breadcrumbs}>
                    <span style={styles.breadcrumbItem}>{selectedProjectName || "Proyecto"}</span>
                    {selectedFrontId && <><span style={styles.breadcrumbSeparator}>›</span><span style={styles.breadcrumbItem}>{selectedFrontName || "Frente"}</span></>}
                    {selectedLocalityId && <><span style={styles.breadcrumbSeparator}>›</span><span style={styles.breadcrumbItem}>{selectedLocalityName || "Loc"}</span></>}
                    {selectedDetail && <><span style={styles.breadcrumbSeparator}>›</span><span style={styles.breadcrumbItem}>{selectedDetail.Nombre_Detalle}</span></>}
                </div>
            )}
            <div style={styles.headerActions}>
              {(step !== "project" && step !== "profile") && <button onClick={goBack} style={styles.headerButton}>Atrás</button>}
              <button onClick={handleLogout} style={styles.headerButtonOutline}>Cerrar sesión</button>
            </div>
          </>
        )}
      </div>

      {/* Contenedor flexible para el contenido que scrollea */}
      <div style={{flex: 1, padding: '0 24px'}}>

      {step === "auth" && (
        <div style={{...styles.card, margin: '0 0 24px'}}>
          <div style={styles.logoRow}><img src={LOGO_SRC} style={styles.logo} alt="Logo" /></div>
          <h2 style={styles.sectionTitle}>{authMode === "login" ? "Inicia sesión" : "Crear cuenta"}</h2>
          <label style={styles.label}>Email</label>
          <input placeholder="tu@email.com" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} style={styles.input} />
          <label style={styles.label}>Contraseña</label>
          <input placeholder="Contraseña" type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={styles.input} />
          <button onClick={handleLogin} disabled={isLoading} style={styles.primaryButton}>{isLoading ? "Cargando..." : (authMode === "login" ? "Ingresar" : "Crear")}</button>
          <div style={styles.authFooter}>
              {authMode === "login" ? (<span onClick={() => setAuthMode("signup")} style={styles.linkText}>Crear cuenta</span>) : (<>¿Ya tienes una cuenta? <span onClick={() => setAuthMode("login")} style={styles.linkText}>Iniciar sesión</span></>)}
          </div>
          {syncStatus && <p style={{textAlign:'center', fontSize:12, color:'blue', marginTop:10}}>{syncStatus}</p>}
        </div>
      )}

      {step === "project" && (
        <div style={{...styles.card, margin: '0 0 24px'}}><h2 style={styles.sectionTitle}>Selecciona un proyecto</h2><div style={styles.optionGrid}>{projects?.map(p => <button key={p.ID_Proyectos} onClick={() => selectProject(p.ID_Proyectos)} style={styles.optionButton}>{p.Proyecto_Nombre}</button>)}</div></div>
      )}
      {step === "front" && (<div style={{...styles.card, margin: '0 0 24px'}}><h2 style={styles.sectionTitle}>Selecciona un frente</h2><div style={styles.optionGrid}>{fronts?.map(f => <button key={f.ID_Frente} onClick={() => selectFront(f.ID_Frente)} style={styles.optionButton}>{f.Nombre_Frente}</button>)}</div></div>)}
      {step === "locality" && (<div style={{...styles.card, margin: '0 0 24px'}}><h2 style={styles.sectionTitle}>Selecciona una localidad</h2><div style={styles.optionGrid}>{localities?.map(l => <button key={l.ID_Localidad} onClick={() => selectLocality(l.ID_Localidad)} style={styles.optionButton}>{l.Nombre_Localidad}</button>)}</div></div>)}
      {step === "detail" && (
        <div style={{...styles.card, margin: '0 0 24px'}}><h2 style={styles.sectionTitle}>Selecciona un sector</h2><input placeholder="Buscar..." value={detailSearch} onChange={e => setDetailSearch(e.target.value)} style={styles.searchInput} /><div style={styles.searchResults}>{filteredDetails?.map(d => (<button key={d.ID_DetallesActividad} onClick={() => selectDetail(d)} style={styles.searchOption}><span style={styles.searchOptionTitle}>{d.Nombre_Detalle}</span><span style={styles.searchOptionMeta}>{d.activityName}</span></button>))}</div></div>
      )}
      {step === "activity" && selectedActivity && (
         <div style={{...styles.card, margin: '0 0 24px'}}><h2 style={styles.sectionTitle}>Confirmar Actividad</h2><div style={styles.detailInfoBox}><p style={{fontWeight:'bold'}}>{selectedActivity.Nombre_Actividad}</p></div><button onClick={() => setStep("map")} style={styles.primaryButton}>Ir al Mapa / Formulario</button></div>
      )}

      {(step === "map" || step === "form") && (
        <div style={{...styles.card, margin: '0 0 24px'}}>
           <h2 style={styles.sectionTitle}>Registrar Evidencia</h2>
           
           {/* BLOQUE 1: UBICACIÓN */}
           <div style={{backgroundColor:'#F8FAFC', padding:15, borderRadius:12, border:'1px solid #E2E8F0', marginBottom:20}}>
               <h3 style={{fontSize:14, fontWeight:'normal', color:'#475569', marginTop:0, marginBottom:10}}>Ubicación</h3>
               
               <div style={{...styles.mapPlaceholder, height: '150px', marginBottom:10}}>
                   {isOnline && mapUrl ? <iframe title="Mapa" src={mapUrl} style={{...styles.mapFrame, height:'150px'}} /> : <div style={styles.emptyState}>Mapa Offline<br/>{displayLat.toFixed(5)}, {displayLng.toFixed(5)}</div>}
               </div>

               {/* GPS ROW */}
               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, paddingBottom:12, borderBottom:'1px dashed #CBD5F5'}}>
                   <div>
                       <span style={{fontSize:11, color:'#64748B'}}>Automática (GPS)</span>
                       <div style={{fontSize:14, color:'#0F172A'}}>{displayLat.toFixed(5)}, {displayLng.toFixed(5)}</div>
                   </div>
                   <button onClick={handleCaptureGps} disabled={isFetchingGps} style={styles.secondaryButtonSmall}>
                       {isFetchingGps ? "..." : "Actualizar"}
                   </button>
               </div>

               {/* UTM ROW */}
               <div>
                   <span style={{fontSize:11, color:'#64748B', display:'block', marginBottom:5}}>Manual (UTM)</span>
                   <div style={{display:'flex', gap:5}}>
                        <select value={utmZone} onChange={(e) => setUtmZone(e.target.value)} style={{...styles.inputCompact, width:'25%'}}>
                            <option value="17">17S</option><option value="18">18S</option><option value="19">19S</option>
                        </select>
                        <input placeholder="Este (E)" value={utmEast} onChange={(e) => setUtmEast(e.target.value)} style={{...styles.inputCompact, width:'30%'}} />
                        <input placeholder="Norte (N)" value={utmNorth} onChange={(e) => setUtmNorth(e.target.value)} style={{...styles.inputCompact, width:'30%'}} />
                        <button onClick={handleUpdateFromUtm} style={{...styles.secondaryButtonSmall, width:'auto', padding:'0 8px'}}>Aplicar</button>
                   </div>
               </div>
           </div>
           
           {/* BLOQUE 2: EVIDENCIA */}
           <div style={{backgroundColor:'#FFFFFF', padding:15, borderRadius:12, border:'1px solid #E2E8F0', marginBottom:20, boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
               <h3 style={{fontSize:14, fontWeight:'normal', color:'#475569', marginTop:0, marginBottom:10}}>Evidencia y datos</h3>
               
               <div style={{marginBottom:15}}>
                    <div style={{...styles.evidenceBox, backgroundColor:'#F1F5F9', borderStyle:'dashed', minHeight:'180px'}}>
                        {evidencePreview ? 
                            <img src={evidencePreview} style={{...styles.evidenceImage, height:'auto', maxHeight:'250px'}} /> 
                            : <span style={{color:'#94A3B8', fontSize:13}}>Sin foto seleccionada</span>
                        }
                    </div>

                    {isAnalyzing && (
                        <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:10, backgroundColor:'#EFF6FF', borderRadius:8, color:'#1E40AF', fontSize:13}}>
                            <b>Analizando imagen con IA...</b>
                        </div>
                    )}
                    {aiError && (
                        <div style={{padding:10, backgroundColor:'#FEF2F2', borderRadius:8, color:'#991B1B', fontSize:13, border:'1px solid #FCA5A5', marginTop:5}}>
                            <b>Rechazado:</b> {aiError}
                        </div>
                    )}

                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCaptureFile} style={{display:'none'}} />
                    <button onClick={() => fileInputRef.current?.click()} style={{...styles.secondaryButton, marginTop:10}}>
                        Tomar / Seleccionar foto
                    </button>
               </div>

               <label style={styles.label}>Observaciones</label>
               <textarea value={note} onChange={e => setNote(e.target.value)} style={{...styles.textArea, minHeight:'70px'}} placeholder="Escribe aquí..." />
           </div>

           <button 
                onClick={saveReport} 
                disabled={isLoading || !evidencePreview || isAnalyzing || !!aiError} 
                style={{
                    ...(isLoading || isAnalyzing || !!aiError ? styles.primaryButtonDisabled : styles.primaryButton),
                    height: '50px',
                    fontSize: '16px',
                    marginBottom: '20px' // Margen final extra por seguridad
                }}
           >
               {isLoading ? "Guardando..." : (isAnalyzing ? "Analizando..." : "Guardar reporte")}
           </button>
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
            <div style={{ display: 'flex', gap: '8px', margin: '10px 0' }}>
               <button onClick={() => setStep("user_records")} style={styles.secondaryButton}>Mis Registros</button>
               <button onClick={() => setStep("files")} style={styles.secondaryButton}>Archivos</button>
            </div>
            <button onClick={saveProfile} disabled={isProfileSaving} style={styles.primaryButton}>Actualizar</button>
            <button onClick={deleteAccount} style={styles.dangerButton}>Eliminar Cuenta</button>
         </div>
      )}

      {step === "user_records" && (
         <div style={{...styles.card, margin: '0 0 24px'}}>
             <h2 style={styles.sectionTitle}>Historial</h2>
             <div style={styles.historyContainer}>
                <div style={styles.historyList}>
                   {isLoadingRecords ? <div style={styles.emptyState}>Cargando...</div> : userRecords?.map(rec => (
                       <div key={rec.id_registro} onClick={() => setSelectedRecordId(rec.id_registro)} style={selectedRecordId === rec.id_registro ? styles.historyItemActive : styles.historyItem}>
                           <div>{new Date(rec.fecha_subida).toLocaleDateString()}</div>
                           <div style={{fontSize:'10px', color:'#666'}}>{rec.nombre_actividad.substring(0,15)}...</div>
                       </div>
                   ))}
                </div>
                <div style={styles.historyDetail}>
                   {selectedRecordId && userRecords?.find(r => r.id_registro === selectedRecordId) ? (
                       <>
                         <h4>{userRecords.find(r => r.id_registro === selectedRecordId)?.nombre_actividad}</h4>
                         <p style={{fontSize:'12px', color:'blue'}}>{userRecords.find(r => r.id_registro === selectedRecordId)?.comentario || "-"}</p>
                         <div style={styles.evidenceBox}>{userRecords.find(r => r.id_registro === selectedRecordId)?.url_foto ? <img src={userRecords.find(r => r.id_registro === selectedRecordId)?.url_foto!} style={{maxHeight:'100px'}} /> : "Sin foto"}</div>
                         <div style={{display:'flex', gap:'5px'}}>
                            <button onClick={() => deleteRecord(userRecords.find(r => r.id_registro === selectedRecordId)!)} style={styles.dangerButton}>Borrar</button>
                            <button onClick={openEditModal} style={styles.secondaryButton}>Editar</button>
                         </div>
                       </>
                   ) : <div style={styles.emptyState}>Selecciona uno.</div>}
                </div>
             </div>
             <button onClick={() => setStep("profile")} style={styles.secondaryButton}>Volver</button>
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
                   <thead>
                     <tr style={styles.tableHeaderRow}>
                       <th style={styles.tableTh}>ID</th>
                       <th style={styles.tableTh}>Localidad</th>
                       <th style={styles.tableTh}>Sector</th>
                       <th style={styles.tableTh}>Actividad</th>
                       <th style={styles.tableTh}>Fecha</th>
                     </tr>
                   </thead>
                   <tbody>
                       {userRecords?.map(r => (
                          <tr 
                            key={r.id_registro} 
                            onClick={() => handleRowClick(r)}
                            style={selectedRecordId === r.id_registro ? styles.tableRowActive : styles.tableRow}
                          >
                             <td style={{padding:8}}>{r.id_registro}</td>
                             <td style={{padding:8}}>{r.nombre_localidad}</td>
                             <td style={{padding:8}}>{r.nombre_detalle}</td>
                             <td style={{padding:8}}>{r.nombre_actividad}</td>
                             <td style={{padding:8}}>{new Date(r.fecha_subida).toLocaleDateString()}</td>
                          </tr>
                       ))}
                   </tbody>
                 </table>
             </div>

             {selectedRecordId ? (
                 <div style={{marginTop:20, borderTop:'1px solid #eee', paddingTop:15, backgroundColor:'#FAFAFA', padding:15, borderRadius:8}}>
                     <h4 style={{marginTop:0, fontSize:14, color:'#0B5FFF'}}>Propiedades del Registro #{selectedRecordId}</h4>
                     <label style={styles.label}>Tipo de Propiedad</label>
                     <select value={selectedPropId} onChange={e=>setSelectedPropId(Number(e.target.value))} style={styles.input}>
                         <option value="">-- Seleccionar --</option>
                         {availableProperties?.map(p=><option key={p.ID_Propiedad} value={p.ID_Propiedad}>{p.Propiedad}</option>)}
                     </select>
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
      </div>
    </div>
  );
}