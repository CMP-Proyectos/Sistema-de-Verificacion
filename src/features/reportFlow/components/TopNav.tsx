import React from 'react';
import { styles } from '../../../theme/styles';
import { Step } from '../types';
// Importamos iconos técnicos
import { ChevronLeft, Wifi, WifiOff } from 'lucide-react';
// IMPORTA TU LOGO AQUÍ (Asegúrate de tener la imagen en esa ruta)
// import logoImg from '../../../assets/logo_cenepa.png'; 

interface Props {
  step: Step;
  isOnline: boolean;
  onBack: () => void;
  breadcrumbNames: { project?: string; front?: string; locality?: string; detail?: string; };
}

export const TopNav = ({ step, isOnline, onBack, breadcrumbNames }: Props) => {
  if (step === "auth") return null;

  const isRootScreen = step === 'project' || step === 'profile' || step === 'user_records' || step === 'files';

  return (
    <>
        <div style={styles.navbar}>
             {/* Opción A: Texto estilizado */}
             <div style={styles.navbarBrand}>CMP CONTRATISTAS E.I.R.L.</div>
             
             {/* Opción B: Logo Imagen (Descomentar si tienes la imagen) */}
             {/* <img src={logoImg} alt="Logo" style={{ height: '32px', objectFit: 'contain' }} /> */}
        </div>

        <div style={styles.statusBar}>
            <div style={{
                color: isOnline ? '#10B981' : '#64748B', // Verde o Gris
                fontWeight: '600', display:'flex', alignItems:'center', gap:'6px'
            }}>
                {/* Icono de Wifi condicional */}
                {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                <span>{isOnline ? "CONECTADO" : "OFFLINE"}</span>
            </div>

            {!isRootScreen && (
                <button onClick={onBack} style={{
                    background: 'none', border: '1px solid #CBD5E1', borderRadius: '4px',
                    padding: '4px 8px', fontSize: '11px', fontWeight: '600', color: '#334155', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                    <ChevronLeft size={14} /> ATRÁS
                </button>
            )}
        </div>

        {!isRootScreen && (
             <div style={styles.breadcrumbs}>
                {breadcrumbNames.project && <span style={styles.breadcrumbItem}>{breadcrumbNames.project}</span>}
                {breadcrumbNames.front && <><span>/</span><span>{breadcrumbNames.front}</span></>}
                {breadcrumbNames.locality && <><span>/</span><span>{breadcrumbNames.locality}</span></>}
                {breadcrumbNames.detail && <><span>/</span><span>{breadcrumbNames.detail}</span></>}
             </div>
        )}
    </>
  );
};
