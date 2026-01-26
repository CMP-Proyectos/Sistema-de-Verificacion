import { createClient } from "@supabase/supabase-js";

// Recomendado: mover a variables de entorno (se mantienen defaults para no romper el proyecto).
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  "https://torwsfbxltzibydrlrqc.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_3JI-glaa0JqNcYOucy00kw_c75LwHld";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
