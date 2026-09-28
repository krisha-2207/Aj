import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xbzbgwfhuzrmnoighnaq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_-XvvWAzmRwluOkYVnaV5sA_cIEa00tp';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getSupabase() {
  return supabase;
}

export default supabase;
