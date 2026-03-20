import React from 'react';
import { styles } from '../../../theme/styles';
import { Step } from '../types';
// 1. Importamos los iconos que necesitamos
import { Home, Camera, FileSpreadsheet, User } from 'lucide-react';

interface Props {
  step: Step;
  onNavHome: () => void;
  onNavRecords: () => void;
  onNavFiles: () => void;
  onNavProfile: () => void;
}

export const BottomNav = ({ step, onNavHome, onNavRecords, onNavFiles, onNavProfile }: Props) => {
  
  // Lógica de activo
  const isHomeActive = !['user_records', 'files', 'profile'].includes(step);
  const isRecordsActive = step === 'user_records';
  const isFilesActive = step === 'files';
  const isProfileActive = step === 'profile';

  // Helper para color. Usamos los colores de tu paleta (definidos en styles.ts conceptualmente)
  const getIconColor = (isActive: boolean) => isActive ? "#003366" : "#64748B"; // Navy vs SlateLight

  // Helper para estilo del contenedor
  const getItemStyle = (isActive: boolean) => ({
    ...styles.bottomNavItem,
    ...(isActive ? styles.bottomNavItemActive : {})
  });

  return (
    <div style={styles.bottomNav}>
      
      <button onClick={onNavHome} style={getItemStyle(isHomeActive)}>
        {/* Usamos el componente Icono y le pasamos tamaño y color */}
        <Home size={24} color={getIconColor(isHomeActive)} strokeWidth={isHomeActive ? 2.5 : 2} style={{ marginBottom: 4 }} />
        <span style={styles.navLabel}>Inicio</span>
      </button>

      <button onClick={onNavRecords} style={getItemStyle(isRecordsActive)}>
        <Camera size={24} color={getIconColor(isRecordsActive)} strokeWidth={isRecordsActive ? 2.5 : 2} style={{ marginBottom: 4 }} />
        <span style={styles.navLabel}>Galería</span>
      </button>

      <button onClick={onNavFiles} style={getItemStyle(isFilesActive)}>
        <FileSpreadsheet size={24} color={getIconColor(isFilesActive)} strokeWidth={isFilesActive ? 2.5 : 2} style={{ marginBottom: 4 }} />
        <span style={styles.navLabel}>Archivos</span>
      </button>

      <button onClick={onNavProfile} style={getItemStyle(isProfileActive)}>
        <User size={24} color={getIconColor(isProfileActive)} strokeWidth={isProfileActive ? 2.5 : 2} style={{ marginBottom: 4 }} />
        <span style={styles.navLabel}>Cuenta</span>
      </button>

    </div>
  );
};
