const express = require('express');
const router = express.Router();
const aiClient = require('../services/aiServiceClient');

// POST /api/chat/query
router.post('/query', async (req, res, next) => {
  try {
    const { query, domain_override, retrieval_strategy_override } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Query text is required' });
    }

    const payload = {
      query: query.trim(),
      domain_override: domain_override ? domain_override.trim() : null,
      retrieval_strategy_override: retrieval_strategy_override || null
    };

    console.log(`[Gateway] Dispatching query to AI service: "${payload.query}"`);
    const result = await aiClient.query(payload);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
