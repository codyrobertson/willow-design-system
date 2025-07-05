/**
 * Willow Registry Server
 * REST API for component registry
 */

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { createServer } from 'http';
import { registryRouter } from './registry/routes';
import { searchRouter } from './registry/search';
import { analyticsRouter } from './registry/analytics';
import { createLogger } from './core/logger';
import { loadServerConfig } from './core/config';

const app = express();
const logger = createLogger();

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/components', registryRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/analytics', analyticsRouter);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export async function startServer() {
  const config = await loadServerConfig();
  const server = createServer(app);
  
  const port = config.port || process.env.PORT || 3000;
  
  server.listen(port, () => {
    logger.info(`Willow Registry Server running on port ${port}`);
  });
  
  return server;
}

// Start server if run directly
if (require.main === module) {
  startServer().catch(err => {
    logger.error('Failed to start server:', err);
    process.exit(1);
  });
}

export { app };