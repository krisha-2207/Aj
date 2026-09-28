import { createBrowserClient, createServerClient } from '@supabase/ssr';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xbzbgwfhuzrmnoighnaq.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_-XvvWAzmRwluOkYVnaV5sA_cIEa00tp';

/**
 * Creates a browser-side Supabase client using @supabase/ssr
 */
export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey
  );

export default createClient;
