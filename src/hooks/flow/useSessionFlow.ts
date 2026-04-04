import { useEffect, useState } from "react";
import { supabase, clearAllLocalData } from "../../services/dataService";
import { ConfirmModalState } from "../../features/reportFlow/types";

type AuthMessage = {
  type: "success" | "error" | "info";
  text: string;
} | null;

const hasRecoveryContextInUrl = () => {
  if (typeof window === "undefined") return false;

  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.toLowerCase();

  return (
    searchParams.get("recovery") === "1" ||
    hash.includes("type=recovery") ||
    hash.includes("access_token=")
  );
};

export function useSessionFlow(
  showToast: (msg: string, type: "success" | "error" | "info") => void,
  setConfirmModal: (modal: ConfirmModalState | null) => void
) {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [sessionUser, setSessionUser] = useState<{ email: string; id: string } | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [authLoadingLabel, setAuthLoadingLabel] = useState("AUTENTICANDO...");
  const [authMessage, setAuthMessage] = useState<AuthMessage>(null);

  const [profileName, setProfileName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleStatus);
    window.addEventListener("offline", handleStatus);
    if (!hasRecoveryContextInUrl()) {
      void checkSession();
    }

    return () => {
      window.removeEventListener("online", handleStatus);
      window.removeEventListener("offline", handleStatus);
    };
  }, []);

  const checkSession = async () => {
    if (hasRecoveryContextInUrl()) {
      return null;
    }

    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const user = { email: data.session.user.email || "", id: data.session.user.id };
      setSessionUser(user);
      return user;
    }
    return null;
  };

  const handleLogin = async (onSuccess: () => void | Promise<void>) => {
    setIsLoading(true);
    setAuthLoadingLabel("AUTENTICANDO...");
    setAuthMessage(null);

    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword.trim(),
        });
        if (error) throw error;
        if (!data.user) {
          showToast("Verifica tu correo", "info");
          return;
        }
        setSessionUser({ email: data.user.email || "", id: data.user.id });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword.trim(),
        });
        if (error) throw error;
        if (data.user) {
          setSessionUser({ email: data.user.email || "", id: data.user.id });
        }
      }

      await onSuccess();
    } catch (error: any) {
      const message = error?.message || "No se pudo completar el inicio de sesión.";
      setAuthMessage({ type: "error", text: message });
      showToast(message, "error");
    } finally {
      setAuthLoadingLabel("AUTENTICANDO...");
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await clearAllLocalData();

      await supabase.auth.signOut();
      setSessionUser(null);
      setAuthMessage(null);
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

      if (upsertError) throw upsertError;

      const { data: persistedProfile, error: reloadError } = await supabase
        .from("Detalle_Perfil")
        .select("Nombre, Apellido")
        .eq("id", sessionUser.id)
        .single();

      if (reloadError) throw reloadError;

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
    authLoadingLabel,
    setAuthLoadingLabel,
    authMessage,
    setAuthMessage,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authMode,
    setAuthMode,
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
  };
}
