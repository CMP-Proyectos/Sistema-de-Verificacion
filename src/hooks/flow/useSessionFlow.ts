import { useEffect, useRef, useState } from "react";
import { supabase } from "../../services/dataService";
import { db } from "../../services/db_local";
import { ConfirmModalState } from "../../features/reportFlow/types";

type AuthView = "login" | "reset_request" | "password_recovery";
type AuthCheckResult = "authenticated" | "unauthenticated" | "password_recovery";
type AuthMessage = {
  type: "success" | "error" | "info";
  text: string;
} | null;

const getFriendlyAuthErrorMessage = (error: any) => {
  const rawMessage = String(error?.message || error?.code || "").toLowerCase();

  if (rawMessage.includes("auth session missing")) {
    return "No se pudo actualizar la contraseña porque la sesión de recuperación no está activa. Solicita un nuevo enlace e inténtalo nuevamente.";
  }

  if (rawMessage.includes("password should contain at least one character of each")) {
    return "La contraseña debe contener al menos una mayúscula, una minúscula y un número.";
  }

  if (
    rawMessage.includes("otp_expired") ||
    rawMessage.includes("expired") ||
    rawMessage.includes("invalid") ||
    rawMessage.includes("session_not_found") ||
    rawMessage.includes("flow state")
  ) {
    return "El enlace de recuperación expiró o ya no es válido. Solicita un nuevo enlace para continuar.";
  }

  return error?.message || "Ocurrió un error inesperado.";
};

const getRecoveryRedirectTo = () => {
  if (typeof window === "undefined") return "https://sistema-de-verificacion.vercel.app/?recovery=1";
  return `${window.location.origin}${window.location.pathname}?recovery=1`;
};

const isPasswordRecoveryUrl = () => {
  if (typeof window === "undefined") return false;

  const searchParams = new URLSearchParams(window.location.search);
  const hasRecoveryQuery = searchParams.get("recovery") === "1";
  const hasRecoveryHash = window.location.hash.includes("type=recovery") && window.location.hash.includes("access_token=");

  return hasRecoveryQuery || hasRecoveryHash;
};

const clearRecoveryUrl = () => {
  if (typeof window === "undefined") return;
  window.history.replaceState({}, document.title, `${window.location.origin}${window.location.pathname}`);
};

const getRecoveryHashState = () => {
  if (typeof window === "undefined") {
    return { hasRecoveryHash: false, hasRecoveryError: false };
  }

  const hash = window.location.hash.toLowerCase();
  return {
    hasRecoveryHash: hash.includes("type=recovery") || hash.includes("access_token="),
    hasRecoveryError: hash.includes("otp_expired") || hash.includes("error_code=") || hash.includes("error="),
  };
};

export function useSessionFlow(
  showToast: (msg: string, type: "success" | "error" | "info") => void,
  setConfirmModal: (modal: ConfirmModalState | null) => void,
  openAuthScreen: () => void
) {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [sessionUser, setSessionUser] = useState<{ email: string; id: string } | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authView, setAuthView] = useState<AuthView>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryPasswordConfirm, setRecoveryPasswordConfirm] = useState("");
  const [authMessage, setAuthMessage] = useState<AuthMessage>(null);
  const recoveryFlowActiveRef = useRef(false);

  const [profileName, setProfileName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  const activatePasswordRecovery = (message: string) => {
    recoveryFlowActiveRef.current = true;
    openAuthScreen();
    setIsAuthLoading(false);
    setAuthView("password_recovery");
    setRecoveryPassword("");
    setRecoveryPasswordConfirm("");
    setAuthMessage({
      type: "info",
      text: message,
    });
  };

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleStatus);
    window.addEventListener("offline", handleStatus);
    checkSession();

    return () => {
      window.removeEventListener("online", handleStatus);
      window.removeEventListener("offline", handleStatus);
    };
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setSessionUser({ email: session.user.email || "", id: session.user.id });
      }

      if (event === "SIGNED_OUT") {
        recoveryFlowActiveRef.current = false;
        setSessionUser(null);
      }

      if (event === "PASSWORD_RECOVERY") {
        activatePasswordRecovery("Define una nueva contraseña para completar la recuperación.");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [openAuthScreen]);

  const checkSession = async (): Promise<AuthCheckResult> => {
    const { data } = await supabase.auth.getSession();
    const { hasRecoveryHash, hasRecoveryError } = getRecoveryHashState();

    if (isPasswordRecoveryUrl() || hasRecoveryHash || hasRecoveryError) {
      if (data.session?.user) {
        setSessionUser({ email: data.session.user.email || "", id: data.session.user.id });
      }
      activatePasswordRecovery(
        hasRecoveryError
          ? "El enlace de recuperación expiró o no es válido. Solicita uno nuevo para continuar."
          : "Ingresa tu nueva contraseña para terminar el proceso."
      );
      return "password_recovery";
    }

    if (data.session?.user) {
      setSessionUser({ email: data.session.user.email || "", id: data.session.user.id });
      return "authenticated";
    }

    return "unauthenticated";
  };

  const handleLogin = async (onSuccess: () => void | Promise<void>) => {
    setIsLoading(true);
    setIsAuthLoading(true);
    setAuthMessage(null);

    try {
      console.log("[AUTH] Iniciando login", { mode: authMode, email: authEmail.trim() });
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword.trim(),
        });
        if (error) throw error;
        if (!data.user) return showToast("Verifica tu correo", "info");
        setSessionUser({ email: data.user.email || "", id: data.user.id });
        console.log("[AUTH] Signup exitoso", { userId: data.user.id });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword.trim(),
        });
        if (error) throw error;
        if (data.user) setSessionUser({ email: data.user.email || "", id: data.user.id });
        console.log("[AUTH] SignIn exitoso", { userId: data.user?.id });
      }

      console.log("[AUTH] Ejecutando post-login");
      await onSuccess();
      console.log("[AUTH] Post-login completado");
    } catch (error: any) {
      console.error("[AUTH] Error en login/post-login", error);
      const message = error?.message || "No se pudo completar el inicio de sesión.";
      setAuthMessage({ type: "error", text: message });
      showToast(message, "error");
    } finally {
      setIsAuthLoading(false);
      setIsLoading(false);
    }
  };

  const openResetPassword = () => {
    setResetEmail(authEmail.trim());
    setAuthMessage(null);
    setIsAuthLoading(false);
    setAuthView("reset_request");
  };

  const returnToLogin = () => {
    void supabase.auth.signOut();
    recoveryFlowActiveRef.current = false;
    setSessionUser(null);
    setIsAuthLoading(false);
    clearRecoveryUrl();
    setRecoveryPassword("");
    setRecoveryPasswordConfirm("");
    setAuthMessage(null);
    setAuthView("login");
  };

  const handleRequestPasswordReset = async () => {
    const email = (resetEmail || authEmail).trim();
    if (!email) {
      setAuthMessage({ type: "error", text: "Ingresa tu correo para enviar el enlace." });
      return;
    }

    const redirectTo = getRecoveryRedirectTo();
    if (!redirectTo) {
      setAuthMessage({ type: "error", text: "No se pudo construir la URL de recuperación." });
      return;
    }

    setIsAuthLoading(true);
    setAuthMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;

      setAuthEmail(email);
      setResetEmail(email);
      setAuthMessage({
        type: "success",
        text: "Enlace enviado. Revisa tu correo y abre el link de recuperación.",
      });
    } catch (error: any) {
      setAuthMessage({
        type: "error",
        text: getFriendlyAuthErrorMessage(error),
      });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!recoveryPassword.trim() || !recoveryPasswordConfirm.trim()) {
      setAuthMessage({ type: "error", text: "Completa ambos campos de contraseña." });
      return;
    }

    if (recoveryPassword !== recoveryPasswordConfirm) {
      setAuthMessage({ type: "error", text: "Las contraseñas no coinciden." });
      return;
    }

    setIsAuthLoading(true);
    setAuthMessage(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        throw new Error("Auth session missing");
      }

      const { error } = await supabase.auth.updateUser({ password: recoveryPassword });
      if (error) throw error;

      await supabase.auth.signOut();
      recoveryFlowActiveRef.current = false;
      setSessionUser(null);
      setAuthPassword("");
      setRecoveryPassword("");
      setRecoveryPasswordConfirm("");
      setAuthView("login");
      clearRecoveryUrl();
      openAuthScreen();
      setAuthMessage({
        type: "success",
        text: "Contraseña actualizada. Inicia sesión con tu nueva clave.",
      });
    } catch (error: any) {
      setRecoveryPassword("");
      setRecoveryPasswordConfirm("");
      setAuthMessage({
        type: "error",
        text: getFriendlyAuthErrorMessage(error),
      });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await db.catalog_projects.clear();
      await db.catalog_fronts.clear();
      await db.catalog_localities.clear();
      await db.catalog_details.clear();
      await db.catalog_activities.clear();

      await supabase.auth.signOut();
      setSessionUser(null);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setSessionUser(null);
    }
  };

  const loadProfileData = async () => {
    if (!sessionUser) return;

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("Error al obtener usuario autenticado:", authError);
    }

    const authUser = authData.user;
    setProfileEmail(authUser?.email || sessionUser.email || "");

    const { data: profileData, error: profileError } = await supabase
      .from("Detalle_Perfil")
      .select("Nombre, Apellido")
      .eq("id", sessionUser.id)
      .maybeSingle();

    if (profileError) {
      console.error("Error al cargar perfil:", profileError);
      setProfileName("");
      setProfileLastName("");
      return;
    }

    setProfileName(profileData?.Nombre || "");
    setProfileLastName(profileData?.Apellido || "");
  };

  const saveProfile = async () => {
    if (!sessionUser) return;

    setIsProfileSaving(true);
    try {
      const { error: upsertError } = await supabase.from("Detalle_Perfil").upsert(
        {
          id: sessionUser.id,
          Nombre: profileName,
          Apellido: profileLastName,
        },
        { onConflict: "id" }
      );

      if (upsertError) {
        throw upsertError;
      }

      const { data: persistedProfile, error: reloadError } = await supabase
        .from("Detalle_Perfil")
        .select("Nombre, Apellido")
        .eq("id", sessionUser.id)
        .single();

      if (reloadError) {
        throw reloadError;
      }

      setProfileName(persistedProfile?.Nombre || "");
      setProfileLastName(persistedProfile?.Apellido || "");
      showToast("Perfil actualizado", "success");
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      showToast("Error al actualizar", "error");
    } finally {
      setIsProfileSaving(false);
    }
  };

  return {
    isOnline,
    sessionUser,
    isLoading,
    setIsLoading,
    isAuthLoading,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authMode,
    setAuthMode,
    authView,
    setAuthView,
    authMessage,
    setAuthMessage,
    resetEmail,
    setResetEmail,
    recoveryPassword,
    setRecoveryPassword,
    recoveryPasswordConfirm,
    setRecoveryPasswordConfirm,
    profileName,
    setProfileName,
    profileLastName,
    setProfileLastName,
    profileEmail,
    isProfileSaving,
    checkSession,
    handleLogin,
    handleLogout,
    loadProfileData,
    saveProfile,
    openResetPassword,
    returnToLogin,
    handleRequestPasswordReset,
    handleUpdatePassword,
    passwordResetRedirectTo: getRecoveryRedirectTo(),
    hasRecoveryFlowActive: () => recoveryFlowActiveRef.current,
  };
}
