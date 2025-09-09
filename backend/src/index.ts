import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { createConnection } from 'typeorm';
import config from '../ormconfig';
import authRoutes from './routes/auth';
import datasetRoutes from './routes/datasets';
import logger from './logger';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/datasets', datasetRoutes);

export const startServer = async () => {
  try {
    await createConnection(config);
    logger.info('Database connected successfully');
    
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
};

// Start the server only if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;
