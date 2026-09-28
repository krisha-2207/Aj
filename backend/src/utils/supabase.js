const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://xbzbgwfhuzrmnoighnaq.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_-XvvWAzmRwluOkYVnaV5sA_cIEa00tp';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_XgDp-pNNKcsniKEBVIDxyQ_Riw7HUf4';

// Standard client (Anon key)
const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client with full service role permissions (Server-side only)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = {
  supabase,
  supabaseAdmin,
  getSupabase: () => supabase,
  getSupabaseAdmin: () => supabaseAdmin
};
