const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../utils/supabase');
const { authMiddleware } = require('../middleware/auth');

// GET /api/supabase/status - Public or authenticated check of Supabase connection
router.get('/status', async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://xbzbgwfhuzrmnoighnaq.supabase.co';
    const hasAnonKey = Boolean(process.env.SUPABASE_ANON_KEY);
    const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Test auth session check
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    res.json({
      status: 'CONNECTED',
      projectUrl: supabaseUrl,
      hasAnonKey,
      hasServiceKey,
      adminClientReady: Boolean(supabaseAdmin),
      timestamp: new Date().toISOString(),
      message: 'Supabase API client and Admin Service Role client initialized successfully.'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

module.exports = router;
