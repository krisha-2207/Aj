const { supabaseAdmin, supabase } = require('../src/utils/supabase');
const fs = require('fs');
const path = require('path');

async function testSupabase() {
  console.log('Testing Supabase REST & API connectivity...');

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_XgDp-pNNKcsniKEBVIDxyQ_Riw7HUf4';
  const url = process.env.SUPABASE_URL || 'https://xbzbgwfhuzrmnoighnaq.supabase.co';

  // 1. Test REST endpoint
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    console.log('REST Endpoint status:', res.status);
    const text = await res.text();
    console.log('REST Response:', text.slice(0, 300));
  } catch (err) {
    console.error('REST Error:', err.message);
  }

  // 2. Test Supabase Database Query endpoint
  try {
    const sqlRes = await fetch(`https://api.supabase.com/v1/projects/xbzbgwfhuzrmnoighnaq/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'SELECT current_database(), version();'
      })
    });
    console.log('SQL Query API status:', sqlRes.status);
    const sqlText = await sqlRes.text();
    console.log('SQL Query API Response:', sqlText.slice(0, 300));
  } catch (err) {
    console.error('SQL Query API Error:', err.message);
  }
}

testSupabase();
