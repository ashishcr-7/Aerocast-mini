import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';

// Routes
import healthRoutes from './routes/healthRoutes.js';
import stationRoutes from './routes/stationRoutes.js';
import observationRoutes from './routes/observationRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import forecastRoutes from './routes/forecastRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import modelRoutes from './routes/modelRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

const app = express();

// Security & parsing
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin or any local dev port
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === config.frontendUrl) {
      return callback(null, true);
    }
    callback(null, true);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

// Root route
app.get('/', (req, res) => {
  res.json({
    project: 'Air Pollution–Weather Coupled Forecasting System (Delhi NCR Focus)',
    status: 'online',
    frontendUrl: 'http://localhost:5173',
    message: 'The interactive Web UI is running at http://localhost:5173. Use the endpoints below for JSON data.',
    apiEndpoints: {
      health: '/api/health',
      stations: '/api/stations',
      forecast: '/api/forecast?stationId=<id>&hours=72',
      trapping: '/api/analysis/trapping?stationId=<id>',
      weather: '/api/weather?stationId=<id>&hours=72',
      observations: '/api/observations?stationId=<id>',
      modelMetrics: '/api/model/metrics',
    },
  });
});

// Routes
app.use('/api', healthRoutes);
app.use('/api', stationRoutes);
app.use('/api', observationRoutes);
app.use('/api', weatherRoutes);
app.use('/api', forecastRoutes);
app.use('/api', analysisRoutes);
app.use('/api', modelRoutes);
app.use('/api', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Global error handler
app.use(errorHandler);

export default app;
