const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const {
  runPharmacyAgent,
  parsePrescriptionVision,
  checkDrugInteractionsTool,
  getStockAlertsTool,
  createDraftPOTool,
  getStoreMetricsTool
} = require('../services/aiAgent.service');

// POST /api/ai/chat (Conversational Agent with Function Calling)
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, chatHistory } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const userRole = req.user?.role || 'PHARMACY_OWNER';
    const result = await runPharmacyAgent({
      userMessage: message,
      chatHistory,
      userRole
    });

    res.json(result);
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: error.message || 'Internal AI Agent Error' });
  }
});

// POST /api/ai/scan-prescription (Multimodal OCR & FEFO Stock Matcher)
router.post('/scan-prescription', authMiddleware, async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const parsedPrescription = await parsePrescriptionVision({
      base64Data: imageBase64,
      mimeType
    });

    res.json({
      success: true,
      data: parsedPrescription
    });
  } catch (error) {
    console.error('Prescription Scanner Error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze prescription' });
  }
});

// POST /api/ai/check-interactions (Live Drug Interactions & Clinical Safety Checker)
router.post('/check-interactions', authMiddleware, async (req, res) => {
  try {
    const { medicines } = req.body;
    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.json({ hasInteractions: false, alerts: [], riskLevel: 'SAFE' });
    }

    const analysis = await checkDrugInteractionsTool({ medicineNames: medicines });
    res.json(analysis);
  } catch (error) {
    console.error('Drug Interaction Checker Error:', error);
    res.status(500).json({ error: error.message || 'Failed to check interactions' });
  }
});

// GET /api/ai/alerts (Autonomous Stock & Expiry Health Check)
router.get('/alerts', authMiddleware, async (req, res) => {
  try {
    const alerts = await getStockAlertsTool();
    res.json(alerts);
  } catch (error) {
    console.error('Stock Alerts Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/auto-reorder (Owner-Only Auto-PO Creator)
router.post('/auto-reorder', authMiddleware, roleMiddleware(['PHARMACY_OWNER', 'ADMIN']), async (req, res) => {
  try {
    const { dealerId, items, notes } = req.body;
    const poResult = await createDraftPOTool({ dealerId, items, notes });
    res.json(poResult);
  } catch (error) {
    console.error('Auto Reorder Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
