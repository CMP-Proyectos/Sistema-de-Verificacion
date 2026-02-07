import React, { useRef, useState } from 'react';
import { styles, evidenceStyles as es } from '../../../theme/styles'; 
import { ActivitiesTypes } from '../types';
import { RefreshCw, Navigation, MapPin, Camera, Image as ImageIcon, UploadCloud, AlertCircle } from 'lucide-react';

interface ParametricData {
  propId: string;
  value: string;
  quantity: string;
}

interface Props {
  isOnline: boolean;
  mapUrl: string | null;
  displayLat: number;
  displayLng: number;
  isFetchingGps: boolean;
  onCaptureGps: () => void;
  utmZone: string; setUtmZone: (v: string) => void;
  utmEast: string; setUtmEast: (v: string) => void;
  utmNorth: string; setUtmNorth: (v: string) => void;
  onUpdateUtm: () => void;
  evidencePreview: string | null;
  isAnalyzing: boolean;
  aiFeedback: { type: 'warning' | 'info' | 'success', message: string } | null;
  onCaptureFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  note: string; setNote: (v: string) => void;
  registerProperties: ActivitiesTypes[];
  registerPropId: string; setRegisterPropId: (v: string) => void;
  registerDetailText: string; setRegisterDetailText: (v: string) => void;
  registerDetailQuantity: string; setRegisterDetailQuantity: (v: string) => void;
  isLoading: boolean;
  onSave: () => void;
  // NUEVA PROP PARA EVIDENCIA PREVIA
  previousRecord?: any;
  parametricList: ParametricData[]; 
  setParametricList: React.Dispatch<React.SetStateAction<ParametricData[]>>;
}

export const EvidenceFormScreen = ({
    isOnline, mapUrl, displayLat, displayLng,
    isFetchingGps, onCaptureGps,
    utmZone, setUtmZone, utmEast, setUtmEast, utmNorth, setUtmNorth, onUpdateUtm,
    evidencePreview, isAnalyzing, aiFeedback, onCaptureFile,
    note, setNote,
    registerProperties, registerPropId, setRegisterPropId, registerDetailText, setRegisterDetailText, registerDetailQuantity, setRegisterDetailQuantity,
    isLoading, onSave,
    previousRecord,
    parametricList, setParametricList
}: Props) => {

  const addParametricRow = () => {
    setParametricList([...parametricList, { propId: '', value: '', quantity: '' }]);
  };

  const removeParametricRow = (index: number) => {
    const newList = parametricList.filter((_, i) => i !== index);
    setParametricList(newList);
  };

  const updateParametricRow = (index: number, field: keyof ParametricData, value: string) => {
    const newList = [...parametricList];
    newList[index] = {
        ...newList[index],
        [field]: value
    };
    setParametricList(newList);
  };

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [geoMode, setGeoMode] = useState<'gps' | 'utm'>('gps');

  const getToggleStyle = (mode: 'gps' | 'utm') => ({
      ...es.toggleBtn,
      ...(geoMode === mode ? es.toggleBtnActive : {})
  });

  const getBadgeStyle = () => ({
      ...es.badgeBase,
      ...(isOnline ? es.badgeOnline : es.badgeOffline)
  });

  const getCameraBtnStyle = () => ({
      ...es.uploadBtnLarge,
      ...es.uploadBtnLargeActive
  });

  return (
    <div style={styles.scrollableY}>
        
        {/* --- BLOQUE NUEVO: EVIDENCIA PREVIA (SOLO SI EXISTE) --- */}
        {previousRecord && (
            <div style={{
                ...styles.card,
                backgroundColor: '#FFFFFF',
                borderLeft: '5px solid #F59E0B',
                padding: '16px',
                marginBottom: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <AlertCircle size={18} color="#92400E" />
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#92400E', textTransform: 'uppercase' }}>
                        Registro previo encontrado en este sector
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {/* Miniatura de la foto anterior guardada localmente */}
                    <img 
                        src={previousRecord.URL_Archivo} 
                        style={{ 
                            width: '85px', 
                            height: '85px', 
                            borderRadius: '6px', 
                            objectFit: 'cover', 
                            border: '1px solid #E2E8F0',
                            backgroundColor: '#F1F5F9'
                        }} 
                        alt="Evidencia anterior"
                    />
                    
                    <div style={{ flex: 1 }}>
                        <label style={{ ...styles.label, fontSize: '10px', color: '#64748B', marginBottom: '4px' }}>
                            COMENTARIO ANTERIOR
                        </label>
                        <p style={{ fontSize: '13px', color: '#1E293B', fontWeight: '600', margin: 0, fontStyle: 'italic' }}>
                            "{previousRecord.comentario || 'Sin comentario registrado'}"
                        </p>
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                            <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0 }}>
                                Registrado el: {new Date(previousRecord.fecha_subida).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- BLOQUE 1: UBICACIÓN --- */}
        <div style={styles.card}>
            <div style={{...styles.flexBetween, ...styles.mb16}}>
                <h3 style={es.headerClean}>1. Ubicación Geodésica</h3>
                <span style={getBadgeStyle()}>
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
            </div>

            <div style={es.toggleContainer}>
                <button onClick={() => setGeoMode('gps')} style={getToggleStyle('gps')}>GPS AUTO</button>
                <button onClick={() => setGeoMode('utm')} style={getToggleStyle('utm')}>UTM MANUAL</button>
            </div>
            
            <div style={es.mapContainer}>
                {isOnline && mapUrl ? (
                    <iframe title="Mapa" src={mapUrl} style={es.mapIframe} loading="lazy" />
                ) : (
                    <div style={es.mapPlaceholder}>
                        <MapPin size={24} />
                        <span style={{fontSize:'11px', fontWeight:'600', marginTop:'4px'}}>SIN REFERENCIA VISUAL</span>
                    </div>
                )}
            </div>

            {geoMode === 'gps' && (
                <>
                    <div style={es.grid2}>
                        <div>
                            <label style={styles.label}>Latitud</label>
                            <div style={es.inputReadOnly}>{displayLat.toFixed(6)}</div>
                        </div>
                        <div>
                            <label style={styles.label}>Longitud</label>
                            <div style={es.inputReadOnly}>{displayLng.toFixed(6)}</div>
                        </div>
                    </div>
                    <button onClick={onCaptureGps} disabled={isFetchingGps} style={styles.btnSecondary}>
                        {isFetchingGps ? <RefreshCw className="spin" size={16}/> : <Navigation size={16}/>}
                        <span style={{marginLeft: '8px'}}>{isFetchingGps ? "TRIANGULANDO..." : "ACTUALIZAR POSICIÓN"}</span>
                    </button>
                </>
            )}

            {geoMode === 'utm' && (
                <div style={es.utmRow}>
                    <div style={{width: 'auto', minWidth: '100px', marginRight: '10px'}}>
                        <label style={styles.label}>ZONA</label>
                        <select value={utmZone} onChange={(e) => setUtmZone(e.target.value)} style={styles.selects}>
                            <option value="17">Zona 17S</option><option value="18">Zona 18S</option><option value="19">Zona 19S</option>
                        </select>
                    </div>
                    <div style={{flex: 1}}>
                        <label style={styles.label}>ESTE (X)</label>
                        <input type="number" value={utmEast} onChange={e => setUtmEast(e.target.value)} placeholder="Ej: 280500" style={es.inputNoMargin} />
                    </div>
                    <div style={{flex: 1}}>
                        <label style={styles.label}>NORTE (Y)</label>
                        <input type="number" value={utmNorth} onChange={e => setUtmNorth(e.target.value)} placeholder="Ej: 8665000" style={es.inputNoMargin} />
                    </div>
                    <button onClick={onUpdateUtm} style={es.btnSquare}>
                        <RefreshCw size={18} />
                    </button>
                </div>
            )}
        </div>

        {/* --- BLOQUE 2: EVIDENCIA --- */}
        <div style={styles.card}>
            <h3 style={styles.heading}>2. Evidencia de Campo</h3>
            
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={onCaptureFile} style={{ display: 'none' }} />
            <input ref={galleryInputRef} type="file" accept="image/*" onChange={onCaptureFile} style={{ display: 'none' }} />

            {!evidencePreview ? (
                <div style={es.uploadRow}>
                    <button onClick={() => cameraInputRef.current?.click()} style={getCameraBtnStyle()}>
                        <Camera size={32} style={{ marginBottom: '8px' }} />
                        <span style={{ fontSize: '12px', fontWeight: '700' }}>CÁMARA</span>
                    </button>

                    <button onClick={() => galleryInputRef.current?.click()} style={es.uploadBtnLarge}>
                        <ImageIcon size={32} style={{ marginBottom: '8px' }} />
                        <span style={{ fontSize: '12px', fontWeight: '700' }}>GALERÍA</span>
                    </button>
                </div>
            ) : (
                <div style={{marginBottom: '16px'}}>
                    <div style={es.previewContainer}>
                        <img src={evidencePreview} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Evidencia" />
                    </div>
                    <div style={es.actionsRow}>
                        <button onClick={() => cameraInputRef.current?.click()} style={es.btnSmall}>
                            <Camera size={14} /> RE-TOMAR
                        </button>
                        <button onClick={() => galleryInputRef.current?.click()} style={es.btnSmall}>
                            <UploadCloud size={14} /> SUBIR OTRA
                        </button>
                    </div>
                </div>
            )}

            {(isAnalyzing || aiFeedback) && (
                <div style={{ ...es.console, borderLeft: `4px solid ${aiFeedback?.type === 'warning' ? '#EF4444' : '#10B981'}` }}>
                    {isAnalyzing && <div>&gt; SYSTEM: ANALYZING IMAGE DATA...</div>}
                    {aiFeedback && (
                        <>
                            <div>&gt; STATUS: {aiFeedback.type === 'warning' ? 'REVIEW_REQUIRED' : 'APPROVED'}</div>
                            <div style={{ color: '#E2E8F0' }}>&gt; MSG: {aiFeedback.message}</div>
                        </>
                    )}
                </div>
            )}

            <label style={styles.label}>Observaciones Técnicas</label>
            <textarea 
                value={note} onChange={e => setNote(e.target.value)} 
                style={{...styles.input, height: '80px', fontFamily: 'sans-serif', resize: 'vertical'}} 
                placeholder="Describa condiciones o detalles relevantes..." 
            />
        </div>

        {/* --- BLOQUE 2:  --- */}
        {isOnline && (
            <div style={styles.card}>
                <h3 style={styles.heading}>3. Datos Paramétricos</h3>
                <div style={es.grid2}>
                    <div>
                        <label style={styles.label}>Propiedad</label>
                        <select 
                        value={registerPropId} 
                        onChange={(e) => setRegisterPropId(e.target.value)} 
                        style={styles.input}
                        disabled={registerProperties.length === 0}
                        >
                        {registerProperties.length > 0 ? (
                            <>
                            <option value="">-- SELECCIONAR --</option>
                            {registerProperties.map(p => (
                                <option key={p.ID_Propiedad} value={String(p.ID_Propiedad)}>
                                {p.Propiedad}
                                </option>
                            ))}
                            </>
                        ) : (
                            <option value="">NO HAY PROPIEDADES DISPONIBLES</option>
                        )}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Valor</label>
                        <input value={registerDetailText} onChange={(e) => setRegisterDetailText(e.target.value)} style={styles.input} placeholder={registerProperties.length === 0 ? "No Hay Propiedades Disponibles" : "Valor"} disabled={registerProperties.length === 0} />
                    </div>
                    <div>
                        <label style={styles.label}>Cantidad</label>
                        <input type="number" step="any" min="0" value={registerDetailQuantity} onChange={(e) => setRegisterDetailQuantity(e.target.value)} style={styles.input} placeholder="Cantidad" />
                    </div>
                </div>
            </div>
        )}

        <div style={{ marginBottom: '24px' }}>
            <button 
                onClick={onSave} 
                disabled={isLoading || !evidencePreview || isAnalyzing} 
                style={{
                    ...styles.btnPrimary,
                    opacity: (isLoading || !evidencePreview) ? 0.6 : 1,
                    cursor: (isLoading || !evidencePreview) ? 'not-allowed' : 'pointer'
                }}
            >
                {isLoading ? "GUARDANDO..." : "GUARDAR Y FINALIZAR"}
            </button>
        </div>
    </div>
  );
};
