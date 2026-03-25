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
  recoveryView: "request" | "update" | null;
  recoveryMessage: AuthMessage;
  recoveryEmail: string;
  setRecoveryEmail: (val: string) => void;
  recoveryPassword: string;
  setRecoveryPassword: (val: string) => void;
  recoveryPasswordConfirm: string;
  setRecoveryPasswordConfirm: (val: string) => void;
  recoveryIsLoading: boolean;
  recoveryLoadingLabel: string;
  onOpenRecoveryRequest: () => void;
  onCloseRecovery: () => void | Promise<void>;
  onRequestRecovery: () => void;
  onSubmitRecoveryPassword: () => void;
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
  recoveryView,
  recoveryMessage,
  recoveryEmail,
  setRecoveryEmail,
  recoveryPassword,
  setRecoveryPassword,
  recoveryPasswordConfirm,
  setRecoveryPasswordConfirm,
  recoveryIsLoading,
  recoveryLoadingLabel,
  onOpenRecoveryRequest,
  onCloseRecovery,
  onRequestRecovery,
  onSubmitRecoveryPassword,
}: Props) => {
  const isLogin = authMode === "login";
  const activeMessage = recoveryView ? recoveryMessage : recoveryMessage || authMessage;

  const renderRequestRecovery = () => (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onRequestRecovery();
      }}
    >
      <div>
        <label style={styles.label}>Correo Corporativo</label>
        <input
          type="email"
          placeholder="usuario@empresa.com"
          value={recoveryEmail}
          onChange={(event) => setRecoveryEmail(event.target.value)}
          style={styles.input}
          disabled={recoveryIsLoading}
        />
      </div>

      <button
        type="submit"
        disabled={recoveryIsLoading}
        style={{
          ...styles.btnPrimary,
          opacity: recoveryIsLoading ? 0.7 : 1,
          cursor: recoveryIsLoading ? "wait" : "pointer",
        }}
      >
        {recoveryIsLoading ? recoveryLoadingLabel : "ENVIAR ENLACE DE RECUPERACIÓN"}
      </button>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button type="button" onClick={onCloseRecovery} style={styles.btnLink}>
          Volver al inicio de sesión
        </button>
      </div>
    </form>
  );

  const renderUpdateRecovery = () => (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmitRecoveryPassword();
      }}
    >
      <div>
        <label style={styles.label}>Nueva Contraseña</label>
        <input
          type="password"
          placeholder="Ingresa tu nueva contraseña"
          value={recoveryPassword}
          onChange={(event) => setRecoveryPassword(event.target.value)}
          style={styles.input}
          disabled={recoveryIsLoading}
        />
      </div>

      <div>
        <label style={styles.label}>Confirmar Contraseña</label>
        <input
          type="password"
          placeholder="Repite la nueva contraseña"
          value={recoveryPasswordConfirm}
          onChange={(event) => setRecoveryPasswordConfirm(event.target.value)}
          style={styles.input}
          disabled={recoveryIsLoading}
        />
      </div>

      <button
        type="submit"
        disabled={recoveryIsLoading}
        style={{
          ...styles.btnPrimary,
          opacity: recoveryIsLoading ? 0.7 : 1,
          cursor: recoveryIsLoading ? "wait" : "pointer",
        }}
      >
        {recoveryIsLoading ? recoveryLoadingLabel : "ACTUALIZAR CONTRASEÑA"}
      </button>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button type="button" onClick={onCloseRecovery} style={styles.btnLink}>
          Cancelar y volver al login
        </button>
      </div>
    </form>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
      <div style={{ ...styles.card, width: "100%", maxWidth: "400px", padding: "40px" }}>
        <div style={{ marginBottom: "30px", textAlign: "center" }}>
          <h1 style={{ ...styles.heading, borderBottom: "none", fontSize: "24px", marginBottom: "8px" }}>
            {recoveryView === "request"
              ? "Recuperar contraseña"
              : recoveryView === "update"
                ? "Definir nueva contraseña"
                : "CMP Contratistas SAC."}
          </h1>
          <p style={{ ...styles.text, color: "#64748B", fontSize: "14px", margin: 0 }}>
            {recoveryView === "request"
              ? "Ingresa tu correo para enviarte el enlace de recuperación"
              : recoveryView === "update"
                ? "Completa el cambio de contraseña desde el enlace recibido"
                : "Plataforma de Reportes de Campo"}
          </p>
        </div>

        {activeMessage ? (
          <div
            style={{
              ...feedbackStyles[activeMessage.type],
              borderRadius: "6px",
              padding: "12px",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {activeMessage.text}
          </div>
        ) : null}

        {recoveryView === "request" ? (
          renderRequestRecovery()
        ) : recoveryView === "update" ? (
          renderUpdateRecovery()
        ) : (
          <>
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

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-8px", marginBottom: "8px" }}>
                <button type="button" onClick={onOpenRecoveryRequest} style={{ ...styles.btnLink, paddingRight: 0 }} disabled={isLoading}>
                  ¿Olvidaste tu contraseña?
                </button>
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
          </>
        )}

        {syncStatus && !recoveryView && (
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
