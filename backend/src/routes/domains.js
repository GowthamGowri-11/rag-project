const express = require('express');
const router = express.Router();
const aiClient = require('../services/aiServiceClient');

// GET /api/domains - List all active domains
router.get('/', async (req, res, next) => {
  try {
    const domains = await aiClient.getDomains();
    res.json(domains);
  } catch (err) {
    next(err);
  }
});

// POST /api/domains - Create dynamic domain
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Domain name is required' });
    }
    const created = await aiClient.createDomain(name.trim(), description || '');
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// GET /api/domains/:id - Get domain details
router.get('/:id', async (req, res, next) => {
  try {
    const domains = await aiClient.getDomains();
    const domain = domains.find(d => d.id === req.params.id.toLowerCase() || d.name.toLowerCase() === req.params.id.toLowerCase());
    if (!domain) {
      return res.status(404).json({ error: `Domain '${req.params.id}' not found` });
    }
    res.json(domain);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
