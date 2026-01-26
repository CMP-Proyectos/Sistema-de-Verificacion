import React from 'react';
import { styles } from '../../../theme/styles';

export interface SelectableItem {
    id: number;
    label: string;
    code?: string; 
}

interface Props {
    title: string;
    items: SelectableItem[];
    onSelect: (id: number) => void;
    isLoading?: boolean;
}

export const SelectionScreen = ({ title, items, onSelect, isLoading }: Props) => {
    return (
        <div style={styles.card}>
            <div style={styles.flexBetween}>
                <h2 style={styles.heading}>{title}</h2>
                <span style={{ fontSize: '12px', color: '#64748B' }}>{items?.length || 0} ITEMS</span>
            </div>
            
            {isLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontStyle: 'italic' }}>
                    Cargando datos...
                </div>
            ) : (
                <div style={styles.scrollableY}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {items && items.length > 0 ? (
                            items.map(item => (
                                <div 
                                    key={item.id} 
                                    onClick={() => onSelect(item.id)} 
                                    style={{
                                        ...styles.gridItem,
                                        flexDirection: 'row',        // Alineación horizontal
                                        justifyContent: 'space-between', 
                                        textAlign: 'left',
                                        padding: '16px',
                                        minHeight: 'auto',
                                        borderLeft: '4px solid #003366',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    {/* LADO IZQUIERDO: TIPO DE ARMADO (MÁS RESALTADO) */}
                                    <div style={{ flex: 1, paddingRight: '12px' }}>
                                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B', lineHeight: '1.4' }}>
                                            {item.label}
                                        </div>
                                    </div>

                                    {/* LADO DERECHO: CÓDIGO (ESTILO ETIQUETA) */}
                                    {item.code && (
                                        <div style={{ 
                                            backgroundColor: '#F1F5F9', 
                                            padding: '4px 10px', 
                                            borderRadius: '4px',
                                            border: '1px solid #CBD5E1',
                                            display: 'flex',
                                            alignItems: 'center',
                                            flexShrink: 0 // Evita que el código se encoja
                                        }}>
                                            <span style={{ 
                                                fontSize: '11px', 
                                                fontWeight: '700', 
                                                color: '#003366', 
                                                fontFamily: 'monospace' 
                                            }}>
                                                {item.code}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '30px', textAlign: 'center', border: '1px dashed #D1D5DB', borderRadius: '6px', color: '#64748B' }}>
                                No hay registros disponibles.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};