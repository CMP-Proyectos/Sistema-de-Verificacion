import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://torwsfbxltzibydrlrqc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_3JI-glaa0JqNcYOucy00kw_c75LwHld";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
/*
Desarrollado por
alonmiorro@gmail.com
jdhuaylupo@gmail.com
*/