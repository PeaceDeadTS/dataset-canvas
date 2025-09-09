import { DataSourceOptions } from 'typeorm';
import { User } from './src/entity/User';
import { Dataset } from './src/entity/Dataset';
import { DatasetImage } from './src/entity/DatasetImage';
import * as dotenv from 'dotenv';

dotenv.config();

const baseConfig = {
  type: 'mariadb' as const, // Use `as const` to help TypeScript narrow the type
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'dataset_canvas',
  synchronize: false,
  logging: false,
  entities: [User, Dataset, DatasetImage],
  migrations: [],
  subscribers: [],
};

let connectionConfig: DataSourceOptions;

if (process.env.DB_SOCKET_PATH) {
  connectionConfig = {
    ...baseConfig,
    socketPath: process.env.DB_SOCKET_PATH,
  };
} else {
  connectionConfig = {
    ...baseConfig,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
  };
}

export { connectionConfig };
