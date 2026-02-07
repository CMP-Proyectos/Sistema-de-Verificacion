import React from 'react';
import { styles } from '../../../theme/styles';
import { UserRecord } from '../types';

interface Props {
  records: UserRecord[];
  isLoading: boolean;
  selectedRecordId: number | null;
  onSelectRecord: (id: number | null) => void;
  onDelete: (rec: UserRecord) => void;
  onEdit: () => void;
}

export const UserGalleryScreen = ({ 
    records, isLoading, selectedRecordId, onSelectRecord, onDelete, onEdit 
}: Props) => {

  const renderDetail = () => {
    const rec = records.find(r => r.id_registro === selectedRecordId);
    if (!rec) return null;

    const proyectoStr = rec.nombre_proyecto || (rec.bucket ? rec.bucket.replace(/_/g, ' ').toUpperCase() : "GENERAL");

    return (
        <div style={styles.detailOverlay}>
            {/* Header */}
            <div style={styles.detailHeader}>
                <div style={{flex: 1}}>
                    <span style={{fontSize:'11px', color:'#64748B', textTransform:'uppercase', display:'block', fontWeight:'700'}}>
                        ACTIVIDAD REGISTRADA
                    </span>
                    <h3 style={{margin:0, fontSize:'16px', color:'#0F172A', fontWeight:'700', lineHeight:'1.2'}}>
                        {rec.nombre_actividad}
                    </h3>
                </div>
                <button onClick={() => onSelectRecord(null)} style={styles.backArrowBtn}>
                    ←
                </button>
            </div>

            {/* Contenido */}
            <div style={styles.detailContent}>
                
                {/* Imagen */}
                <div style={{
                    backgroundColor:'#F1F5F9', border: '1px solid #E2E8F0', borderRadius:'8px', 
                    marginBottom:'24px', display:'flex', justifyContent:'center', alignItems: 'center',
                    minHeight:'250px', padding: '10px'
                }}>
                    {rec.url_foto ? (
                        <img src={rec.url_foto} style={{maxWidth:'100%', maxHeight:'50vh', objectFit:'contain', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} alt="Evidencia" />
                    ) : (
                        <div style={{color:'#94A3B8', fontWeight:'600'}}>SIN IMAGEN DISPONIBLE</div>
                    )}
                </div>

                {/* Datos */}
                <div style={{...styles.card, padding: '20px', boxShadow: 'none', border: '1px solid #E2E8F0'}}>
                    <h4 style={{...styles.heading, fontSize: '14px', borderBottom: '1px solid #F1F5F9'}}>
                        DATOS DEL REPORTE
                    </h4>
                    
                    <div style={{display:'grid', gap:'16px'}}>
                        <div>
                            <label style={styles.label}>PROYECTO</label>
                            <div style={styles.text}>{proyectoStr}</div>
                        </div>
                        
                        <div>
                            <label style={styles.label}>LOCALIDAD</label>
                            <div style={styles.text}>{rec.nombre_localidad || "---"}</div>
                        </div>

                        <div>
                            <label style={styles.label}>SECTOR / DETALLE</label>
                            <div style={styles.text}>{rec.nombre_detalle || "---"}</div>
                        </div>

                        <div>
                            <label style={styles.label}>COORDENADAS</label>
                            <div style={styles.monoText}>
                                {rec.latitud ? `${rec.latitud.toFixed(6)}, ${rec.longitud?.toFixed(6)}` : "NO REGISTRADAS"}
                            </div>
                        </div>

                        <div>
                            <label style={styles.label}>OBSERVACIONES</label>
                            <div style={{
                                ...styles.text, backgroundColor: '#F8FAFC', padding: '10px', 
                                borderRadius: '4px', border: '1px solid #F1F5F9',
                                color: rec.comentario ? '#334155' : '#94A3B8',
                                fontStyle: rec.comentario ? 'normal' : 'italic'
                            }}>
                                {rec.comentario || "Sin observaciones."}
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTONES CORREGIDOS CON GRID (Alineación Perfecta) */}
                <div style={{
                    display: 'grid',               // Usamos Grid en vez de Flex
                    gridTemplateColumns: '1fr 1fr', // Dos columnas exactamente iguales
                    gap: '16px',
                    paddingBottom: '40px',
                    marginTop: '20px'
                }}>
                    <button 
                        onClick={() => onDelete(rec)} 
                        style={{
                            ...styles.btnDanger, 
                            margin: 0, 
                            height: '48px', // Altura forzada
                            width: '100%'
                        }}
                    >
                        ELIMINAR
                    </button>
                    <button 
                        onClick={onEdit} 
                        style={{
                            ...styles.btnSecondary, 
                            margin: 0, 
                            height: '48px', // Altura forzada
                            width: '100%'
                        }}
                    >
                        EDITAR
                    </button>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div style={styles.card}>
        <div style={styles.flexBetween}>
            <h2 style={styles.heading}>Mis Registros</h2>
            <span style={{fontSize:'12px', color:'#64748B', fontWeight:'600'}}>{records?.length || 0} ITEMS</span>
        </div>

        {selectedRecordId && renderDetail()}

        <div style={styles.scrollableY}>
            {isLoading ? (
                <div style={{padding:'40px', textAlign:'center', color:'#64748B'}}>Cargando galería...</div>
            ) : records?.length === 0 ? (
                <div style={{padding:'40px', textAlign:'center', color:'#64748B', fontStyle:'italic'}}>
                    No se han encontrado registros.
                </div>
            ) : (
                <div style={styles.grid}>
                    {records.map(rec => (
                        <div 
                            key={rec.id_registro} 
                            onClick={() => onSelectRecord(rec.id_registro)} 
                            style={{
                                ...styles.gridItem, padding: 0, overflow: 'hidden',
                                border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column',
                                height: 'auto', aspectRatio: '1/1.1'
                            }}
                        >
                            <div style={{
                                width:'100%', flex: 1, backgroundColor:'#F8FAFC', 
                                display:'flex', alignItems:'center', justifyContent:'center',
                                borderBottom: '1px solid #E2E8F0'
                            }}>
                                {rec.url_foto ? (
                                    <img src={rec.url_foto} style={{width:'100%', height:'100%', objectFit:'cover'}} loading="lazy" alt="thumb" />
                                ) : (
                                    <span style={{fontSize:'24px', opacity:0.3}}>📷</span>
                                )}
                            </div>
                            <div style={{
                                padding:'8px 10px', width:'100%', boxSizing:'border-box', 
                                backgroundColor: '#FFFFFF', minHeight: '40px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <span style={{
                                    fontSize:'10px', fontWeight:'700', color:'#334155', lineHeight:'1.3',
                                    textAlign: 'center', display: '-webkit-box',
                                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                }}>
                                    {rec.nombre_actividad}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};
