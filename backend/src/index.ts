import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import http from 'http';
import { AppDataSource } from './data-source';
import { getCorsOrigin, getListenTarget, isUnixSocket } from './config';
import authRoutes from './routes/auth';
import datasetsRoutes from './routes/datasets';
import usersRoutes from './routes/users';
import permissionsRoutes from './routes/permissions';
import recentChangesRoutes from './routes/recent-changes';
import discussionsRoutes from './routes/discussions';
import logger from './logger';

const app = express();

app.set('trust proxy', true);

app.use(cors({
  origin: getCorsOrigin(),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['token'],
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/datasets', datasetsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/recent-changes', recentChangesRoutes);
app.use('/api', discussionsRoutes);

// Global error handler (must be last)
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Global unhandled error', {
    errorMessage: error.message,
    errorStack: error.stack,
    error: error,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });
  res.status(500).send('Internal Server Error');
});

export async function startServer() {
  try {
    await AppDataSource.initialize(); // Use AppDataSource
    logger.info('Data Source has been initialized!');

    if (process.env.NODE_ENV !== 'test') {
      const listenTarget = getListenTarget();
      const server = http.createServer(app);

      const requestTimeoutMs = Number(process.env.SERVER_REQUEST_TIMEOUT_MS || 30 * 60 * 1000);
      const headersTimeoutMs = Number(process.env.SERVER_HEADERS_TIMEOUT_MS || 31 * 60 * 1000);
      const keepAliveTimeoutMs = Number(process.env.SERVER_KEEP_ALIVE_TIMEOUT_MS || 65 * 1000);

      server.requestTimeout = requestTimeoutMs;
      server.headersTimeout = headersTimeoutMs;
      server.keepAliveTimeout = keepAliveTimeoutMs;

      if (isUnixSocket(listenTarget)) {
        if (fs.existsSync(listenTarget)) {
          fs.unlinkSync(listenTarget);
        }
        server.listen(listenTarget, () => {
          fs.chmodSync(listenTarget, 0o660);
          logger.info(`Server is listening on unix socket ${listenTarget}`);
        });
      } else {
        server.listen(listenTarget, () => {
          logger.info(`Server is running on port ${listenTarget}`);
        });
      }
    }
  } catch (error) {
    logger.error('Error during Data Source initialization', { error });
    process.exit(1);
  }
}

// Start the server only if this file is run directly
if (require.main === module) {
  startServer();
}

export { app }; // Export only app
