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

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#64748B",
  marginBottom: "8px",
};

const infoPanelStyle: React.CSSProperties = {
  backgroundColor: "#F8FAFC",
  border: "1px solid #E2E8F0",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "18px",
};

const warningPanelStyle: React.CSSProperties = {
  backgroundColor: "#FFF7ED",
  border: "1px solid #FED7AA",
  borderRadius: "8px",
  padding: "12px 14px",
  marginBottom: "18px",
  color: "#9A3412",
  fontSize: "12px",
  lineHeight: 1.5,
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
  const isRecoveryFlow = recoveryView !== null;

  const renderRequestRecovery = () => (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onRequestRecovery();
      }}
    >
      <div style={{ ...infoPanelStyle, marginBottom: "16px" }}>
        <div style={sectionTitleStyle}>Solicitud de recuperacion</div>
        <div style={{ fontSize: "13px", color: "#334155", lineHeight: 1.6 }}>
          Este modulo envia un enlace temporal de restablecimiento al correo corporativo registrado.
        </div>
      </div>

      <div>
        <label style={styles.label}>Correo corporativo</label>
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
        {recoveryIsLoading ? recoveryLoadingLabel : "ENVIAR ENLACE DE RECUPERACION"}
      </button>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button type="button" onClick={onCloseRecovery} style={styles.btnLink}>
          Volver al inicio de sesion
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
      <div style={{ ...infoPanelStyle, marginBottom: "16px" }}>
        <div style={sectionTitleStyle}>Restablecimiento de contrasena</div>
        <div style={{ fontSize: "13px", color: "#334155", lineHeight: 1.6 }}>
          Completa el cambio de credenciales solo si abriste un enlace oficial enviado por el sistema.
        </div>
      </div>

      <div>
        <label style={styles.label}>Nueva contrasena</label>
        <input
          type="password"
          placeholder="Ingresa tu nueva contrasena"
          value={recoveryPassword}
          onChange={(event) => setRecoveryPassword(event.target.value)}
          style={styles.input}
          disabled={recoveryIsLoading}
        />
      </div>

      <div>
        <label style={styles.label}>Confirmar contrasena</label>
        <input
          type="password"
          placeholder="Repite la nueva contrasena"
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
        {recoveryIsLoading ? recoveryLoadingLabel : "ACTUALIZAR CONTRASENA"}
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
      <div style={{ ...styles.card, width: "100%", maxWidth: "560px", padding: "32px", maxHeight: "none" }}>
        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <div style={sectionTitleStyle}>{isRecoveryFlow ? "Modulo de recuperacion de acceso" : "Acceso institucional"}</div>
          <h1 style={{ ...styles.heading, borderBottom: "none", fontSize: "24px", marginBottom: "8px" }}>
            {recoveryView === "request"
              ? "Recuperar acceso"
              : recoveryView === "update"
                ? "Restablecer contrasena"
                : "Sistema de Verificacion de Reportes de Campo"}
          </h1>
          <p style={{ ...styles.text, color: "#64748B", fontSize: "14px", margin: 0 }}>
            {recoveryView === "request"
              ? "Solicitud de enlace de recuperacion para personal autorizado"
              : recoveryView === "update"
                ? "Actualizacion de credenciales mediante un enlace temporal de seguridad"
                : "Plataforma interna para registro y sincronizacion operativa"}
          </p>
        </div>

        <div style={infoPanelStyle}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", marginBottom: "8px" }}>
            CMP Contratistas SAC.
          </div>
          <div style={{ fontSize: "13px", color: "#334155", lineHeight: 1.6 }}>
            Sistema interno para el registro de reportes de campo, validacion operativa, sincronizacion y consulta de informacion del proyecto.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginTop: "14px" }}>
            <div>
              <div style={sectionTitleStyle}>Responsable</div>
              <div style={{ fontSize: "13px", color: "#0F172A" }}>CMP Contratistas SAC.</div>
            </div>
            <div>
              <div style={sectionTitleStyle}>Uso permitido</div>
              <div style={{ fontSize: "13px", color: "#0F172A" }}>Solo personal autorizado y cuentas corporativas</div>
            </div>
            <div>
              <div style={sectionTitleStyle}>Soporte</div>
              <div style={{ fontSize: "13px", color: "#0F172A" }}>Mesa de ayuda interna o coordinacion TI de CMP</div>
            </div>
          </div>
        </div>

        <div style={warningPanelStyle}>
          Acceso restringido para uso interno. Si no perteneces al equipo autorizado o no reconoces esta plataforma, no ingreses credenciales y comunicate con el canal interno de soporte.
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
                <label style={styles.label}>Correo corporativo</label>
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
                <label style={styles.label}>Contrasena</label>
                <input
                  type="password"
                  placeholder="********"
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

            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                borderRadius: "8px",
                border: "1px dashed #CBD5E1",
                backgroundColor: "#FAFCFF",
              }}
            >
              <div style={sectionTitleStyle}>Recuperacion de acceso</div>
              <div style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.5, marginBottom: "8px" }}>
                Usa este modulo solo si perdiste acceso a tu cuenta corporativa y necesitas un enlace oficial de restablecimiento.
              </div>
              <button type="button" onClick={onOpenRecoveryRequest} style={{ ...styles.btnLink, paddingLeft: 0 }} disabled={isLoading}>
                Solicitar recuperacion de contrasena
              </button>
            </div>

            <div style={{ marginTop: "24px", textAlign: "center", borderTop: "1px solid #F1F5F9", paddingTop: "20px" }}>
              <button type="button" onClick={() => setAuthMode(isLogin ? "signup" : "login")} style={styles.btnLink}>
                {isLogin ? "Aun no tienes acceso? Crear cuenta" : "Volver a iniciar sesion"}
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
