import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './data-source'; // Import AppDataSource
import authRoutes from './routes/auth';
import datasetsRoutes from './routes/datasets';
import usersRoutes from './routes/users';
import permissionsRoutes from './routes/permissions';
import recentChangesRoutes from './routes/recent-changes';
import discussionsRoutes from './routes/discussions';
import logger from './logger';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // Explicitly specify allowed origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Allow all required methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow required headers
  exposedHeaders: ['token'], // Specify that frontend can read 'token' header
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
      const port = process.env.PORT || 5000;
      app.listen(port, () => {
        logger.info(`Server is running on port ${port}`);
      });
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
