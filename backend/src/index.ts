import 'reflect-metadata';
import * as express from 'express';
import * as cors from 'cors';
import { createConnection } from 'typeorm';
import config from '../ormconfig';
import * as dotenv from 'dotenv';
import authRoutes from './routes/auth';
import datasetRoutes from './routes/datasets';
import logger from './logger';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

createConnection(config)
    .then(async connection => {
        logger.info('Database connected successfully');
    }).catch(error => logger.error('TypeORM connection error: ', error));


app.use('/api/auth', authRoutes);
app.use('/api/datasets', datasetRoutes);

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        logger.info(`Server running on http://localhost:${port}`);
    });
}


export default app;
