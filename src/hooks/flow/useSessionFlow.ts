import { useState, useEffect } from "react";
import { supabase } from "../../services/dataService";
import { db } from "../../services/db_local";
import { ToastState, ConfirmModalState } from "../../features/reportFlow/types";

export function useSessionFlow(
  showToast: (msg: string, type: 'success'|'error'|'info') => void,
  setConfirmModal: (modal: ConfirmModalState | null) => void
) {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [sessionUser, setSessionUser] = useState<{ email: string; id: string } | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login"|"signup">("login");
  const [isLoading, setIsLoading] = useState(false);

  // Perfil
  const [profileName, setProfileName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    checkSession();
    return () => { window.removeEventListener('online', handleStatus); window.removeEventListener('offline', handleStatus); };
  }, []);

  const checkSession = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      setSessionUser({ email: data.session.user.email!, id: data.session.user.id });
      return true;
    }
    return false;
  };

  const handleLogin = async (onSuccess: () => void) => {
    setIsLoading(true);
    try {
      if (authMode === "signup") {
         const { data, error } = await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword.trim() });
         if (error) throw error; if (!data.user) return showToast("Verifica tu correo", "info");
         setSessionUser({ email: data.user.email!, id: data.user.id });
      } else {
         const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword.trim() });
         if (error) throw error; if (data.user) setSessionUser({ email: data.user.email!, id: data.user.id });
      }
      onSuccess();
    } catch (e: any) { showToast(e.message || "Error al ingresar", "error"); } 
    finally { setIsLoading(false); }
  };

  const handleLogout = async () => {
    await db.projects.clear(); await db.fronts.clear(); await db.localities.clear(); await db.details.clear();
    await supabase.auth.signOut();
    setSessionUser(null);
  };

  // Lógica de Perfil (Resumida)
  const loadProfileData = async () => {
      const {data} = await supabase.auth.getUser();
      if(data.user) {
          setProfileEmail(data.user.email||"");
          setProfileName(data.user.user_metadata?.full_name||"");
          setProfileLastName(data.user.user_metadata?.last_name||"");
      }
  };

  const saveProfile = async () => { 
      if(!sessionUser) return; 
      setIsProfileSaving(true); 
      try { 
          await supabase.from('Detalle_Perfil').update({Nombre: profileName, Apellido: profileLastName}).eq('id', sessionUser.id); 
          showToast("Perfil actualizado", "success"); 
      } catch { showToast("Error al actualizar", "error"); } 
      finally { setIsProfileSaving(false); } 
  };

  return {
    isOnline, sessionUser, isLoading, setIsLoading,
    authEmail, setAuthEmail, authPassword, setAuthPassword, authMode, setAuthMode,
    profileName, setProfileName, profileLastName, setProfileLastName, profileEmail, isProfileSaving,
    checkSession, handleLogin, handleLogout, loadProfileData, saveProfile
  };
}
