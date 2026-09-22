const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const aiClient = require('../services/aiServiceClient');

// POST /api/documents/upload
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'A valid document file must be provided in the "file" field.' });
    }

    const domain = (req.body.domain || 'rag').trim();
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const buffer = req.file.buffer;

    console.log(`[Gateway] Uploading '${originalName}' (${buffer.length} bytes) to domain '${domain}'...`);

    const ingestionResult = await aiClient.ingestDocument(buffer, originalName, mimeType, domain);
    res.status(201).json(ingestionResult);
  } catch (err) {
    next(err);
  }
});

// GET /api/documents
router.get('/', async (req, res, next) => {
  try {
    const docs = await aiClient.getDocuments();
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

// GET /api/documents/:id
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await aiClient.getDocument(req.params.id);
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await aiClient.deleteDocument(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
