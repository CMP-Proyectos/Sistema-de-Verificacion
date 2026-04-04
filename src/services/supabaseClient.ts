import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  "https://ydkxmguafdrmllgpxdct.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlka3htZ3VhZmRybWxsZ3B4ZGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5ODk0OTcsImV4cCI6MjA5MDU2NTQ5N30.RMfAbXGbtur79Ptl4eU3ZH21aGM5vPrUzgaoVAytPac";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
