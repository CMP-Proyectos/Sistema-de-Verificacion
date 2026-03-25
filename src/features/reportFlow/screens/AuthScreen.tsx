import React from "react";
import { styles } from "../../../theme/styles";

type AuthMessage = {
  type: "success" | "error" | "info";
  text: string;
} | null;

interface Props {
  authEmail: string;
  setAuthEmail: (val: string) => void;
  authPassword: string;
  setAuthPassword: (val: string) => void;
  authMode: "login" | "signup";
  setAuthMode: (mode: "login" | "signup") => void;
  isLoading: boolean;
  authLoadingLabel: string;
  authMessage: AuthMessage;
  syncStatus: string;
  onLogin: () => void;
}

const feedbackStyles: Record<NonNullable<AuthMessage>["type"], React.CSSProperties> = {
  success: {
    backgroundColor: "#F0FDF4",
    color: "#166534",
    border: "1px solid #BBF7D0",
  },
  error: {
    backgroundColor: "#FEF2F2",
    color: "#B91C1C",
    border: "1px solid #FECACA",
  },
  info: {
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    border: "1px solid #BFDBFE",
  },
};

export const AuthScreen = ({
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authMode,
  setAuthMode,
  isLoading,
  authLoadingLabel,
  authMessage,
  syncStatus,
  onLogin,
}: Props) => {
  const isLogin = authMode === "login";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
      <div style={{ ...styles.card, width: "100%", maxWidth: "400px", padding: "40px" }}>
        <div style={{ marginBottom: "30px", textAlign: "center" }}>
          <h1 style={{ ...styles.heading, borderBottom: "none", fontSize: "24px", marginBottom: "8px" }}>
            CMP Contratistas SAC.
          </h1>
          <p style={{ ...styles.text, color: "#64748B", fontSize: "14px", margin: 0 }}>
            Plataforma de Reportes de Campo
          </p>
        </div>

        {authMessage ? (
          <div
            style={{
              ...feedbackStyles[authMessage.type],
              borderRadius: "6px",
              padding: "12px",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {authMessage.text}
          </div>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onLogin();
          }}
        >
          <div>
            <label style={styles.label}>Correo Corporativo</label>
            <input
              type="email"
              placeholder="usuario@empresa.com"
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
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
              onChange={(event) => setAuthPassword(event.target.value)}
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
              cursor: isLoading ? "wait" : "pointer",
            }}
          >
            {isLoading ? authLoadingLabel : isLogin ? "INGRESAR AL SISTEMA" : "REGISTRAR CUENTA"}
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center", borderTop: "1px solid #F1F5F9", paddingTop: "20px" }}>
          <button type="button" onClick={() => setAuthMode(isLogin ? "signup" : "login")} style={styles.btnLink}>
            {isLogin ? "¿Aún no tienes acceso? Crear cuenta" : "Volver a iniciar sesión"}
          </button>
        </div>

        {syncStatus && (
          <div
            style={{
              marginTop: "20px",
              padding: "10px",
              backgroundColor: "#F0FDF4",
              color: "#166534",
              fontSize: "12px",
              textAlign: "center",
              borderRadius: "4px",
            }}
          >
            STATUS: {syncStatus}
          </div>
        )}
      </div>
    </div>
  );
};
