import 'reflect-metadata';
import express from 'express';
import { DataSource } from 'typeorm';
import cors from 'cors';
import { connectionConfig } from '../ormconfig';
import authRoutes from './routes/auth';
import datasetsRoutes from './routes/datasets';
import { logger } from './logger';

export async function startServer() {
  try {
    const appDataSource = new DataSource(connectionConfig);
    await appDataSource.initialize();
    logger.info('Data Source has been initialized!');

    const app = express();

    app.use(cors());
    app.use(express.json());

    app.use('/api/auth', authRoutes);
    app.use('/api/datasets', datasetsRoutes);

    if (process.env.NODE_ENV !== 'test') {
      const port = process.env.PORT || 5000;
      app.listen(port, () => {
        logger.info(`Server running on http://localhost:${port}`);
      });
    }
  } catch (error) {
    logger.error('TypeORM connection error: ', error);
    // Exit process with failure
    process.exit(1);
  }
}

// Start the server only if this file is run directly
if (require.main === module) {
  startServer();
}
