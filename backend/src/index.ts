import "reflect-metadata";
import express from 'express';
import cors from 'cors';
import { createConnection } from 'typeorm';
import config from '../ormconfig';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import datasetRoutes from './routes/datasets';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/datasets', datasetRoutes);

app.get('/', (req, res) => {
  res.send('Hello from Data Studio Backend!');
});

createConnection(config)
  .then(() => {
    console.log('Database connected successfully');
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => console.log('TypeORM connection error: ', error));
