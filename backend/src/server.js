const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const requestLogger = require('./middleware/logger');

const healthRoutes = require('./routes/health');
const domainsRoutes = require('./routes/domains');
const documentsRoutes = require('./routes/documents');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(requestLogger);

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/domains', domainsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/chat', chatRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    system: 'Adaptive Domain-Aware RAG API Gateway',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      domains: '/api/domains',
      documents: '/api/documents',
      chat: '/api/chat/query'
    }
  });
});

// Global 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: `Path not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[Error] Unhandled exception: ${err.message}`, err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Adaptive Domain-Aware RAG Gateway is running!`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`🔗 AI Service URL: ${process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000'}`);
  console.log(`=======================================================`);
});
