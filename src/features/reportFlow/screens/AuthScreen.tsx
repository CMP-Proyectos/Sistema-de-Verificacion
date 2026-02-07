import React from 'react';
import { styles } from '../../../theme/styles';

interface Props {
  authEmail: string;
  setAuthEmail: (val: string) => void;
  authPassword: string;
  setAuthPassword: (val: string) => void;
  authMode: "login" | "signup";
  setAuthMode: (mode: "login" | "signup") => void;
  isLoading: boolean;
  syncStatus: string;
  onLogin: () => void;
}

export const AuthScreen = ({ 
    authEmail, setAuthEmail, authPassword, setAuthPassword, 
    authMode, setAuthMode, isLoading, syncStatus, onLogin 
}: Props) => {

  const isLogin = authMode === "login";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      
      {/* Tarjeta de Login */}
      <div style={{...styles.card, width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h1 style={{ ...styles.heading, borderBottom: 'none', fontSize: '24px', marginBottom: '8px' }}>
            CMP Contratistas E.I.R.L.
          </h1>
          <p style={{ ...styles.text, color: '#64748B', fontSize: '14px', margin: 0 }}>
            Plataforma de Reportes de Campo
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
          <div>
            <label style={styles.label}>Correo Corporativo</label>
            <input 
              type="email" 
              placeholder="usuario@empresa.com" 
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              style={styles.input}
              disabled={isLoading}
            />
          </div>

          <div>
            <label style={styles.label}>Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              style={styles.input}
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.btnPrimary,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'wait' : 'pointer'
            }}
          >
            {isLoading ? "AUTENTICANDO..." : (isLogin ? "INGRESAR AL SISTEMA" : "REGISTRAR CUENTA")}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
          <button 
            onClick={() => setAuthMode(isLogin ? "signup" : "login")}
            style={styles.btnLink}
          >
            {isLogin ? "¿No tienes acceso? Crear cuenta" : "Volver a Iniciar Sesión"}
          </button>
        </div>

        {syncStatus && (
          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#F0FDF4', color: '#166534', fontSize: '12px', textAlign: 'center', borderRadius: '4px' }}>
            STATUS: {syncStatus}
          </div>
        )}
      </div>
    </div>
  );
};
