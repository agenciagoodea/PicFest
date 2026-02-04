import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Tenta usar a chave de publicação moderna primeiro, cai para a anon se não houver
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or API Key missing in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
