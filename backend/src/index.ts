import 'reflect-metadata';
import express from 'express';
import { DataSource } from 'typeorm';
import cors from 'cors';
import { connectionConfig } from '../ormconfig';
import authRoutes from './routes/auth';
import datasetsRoutes from './routes/datasets';
import logger from './logger';

const app = express();
let dataSource: DataSource;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/datasets', datasetsRoutes);

export async function startServer() {
  try {
    dataSource = new DataSource(connectionConfig);
    await dataSource.initialize();
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

export { app, dataSource };
