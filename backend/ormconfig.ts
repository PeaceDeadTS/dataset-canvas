import { DataSourceOptions } from 'typeorm';
import { User } from './src/entity/User';
import { Dataset } from './src/entity/Dataset';
import { DatasetImage } from './src/entity/DatasetImage';
import * as dotenv from 'dotenv';

dotenv.config();

// Base connection details, default to TCP/IP
let connectionDetails: Partial<DataSourceOptions> = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
};

// If a socket path is provided in the environment, use it instead
if (process.env.DB_SOCKET_PATH) {
  connectionDetails = {
    socketPath: process.env.DB_SOCKET_PATH,
  };
}

export const connectionConfig: DataSourceOptions = {
  type: 'mariadb',
  ...connectionDetails, // Spread the appropriate connection details
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'dataset_canvas',
  synchronize: false, // Synchronization should not be enabled in production
  logging: false,
  entities: [User, Dataset, DatasetImage],
  migrations: [],
  subscribers: [],
};
