const express = require('express');
const router = express.Router();
const aiClient = require('../services/aiServiceClient');

router.get('/', async (req, res) => {
  const aiHealth = await aiClient.checkHealth();
  const isHealthy = aiHealth && aiHealth.status === 'HEALTHY';
  res.json({
    status: isHealthy ? 'HEALTHY' : 'DEGRADED',
    gateway: 'Node.js Express',
    ai_service: aiHealth,
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
