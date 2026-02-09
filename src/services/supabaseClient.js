// src/services/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// ← your Supabase project URL and public anon key
const SUPABASE_URL = "https://xvbnxpshskmnruymwrge.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_OolIVOJxCGORJuleNgeUqg_vy_C8AFX";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
