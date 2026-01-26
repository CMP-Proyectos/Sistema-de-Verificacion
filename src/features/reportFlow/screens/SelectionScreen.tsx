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
          /* AQUÍ AGREGAMOS EL SCROLL WRAPPER */
          <div style={styles.scrollableY}>
              <div style={styles.grid}>
                {items && items.length > 0 ? (
                    items.map(item => (
                        <div 
                            key={item.id} 
                            onClick={() => onSelect(item.id)} 
                            style={{
                                ...styles.gridItem,
                                borderLeft: '4px solid #003366'
                            }}
                        >
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#003366', marginBottom: '4px' }}>
                                 {item.label}
                            </div>
                            {item.code && (
                                <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                                    {item.code}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', border: '1px dashed #D1D5DB', borderRadius: '6px', color: '#64748B' }}>
                        No hay registros disponibles.
                    </div>
                )}
              </div>
          </div>
      )}
    </div>
  );
};