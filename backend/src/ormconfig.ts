import { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

let logging: DataSourceOptions['logging'];
if (isProduction) {
  logging = ['error'];
} else {
  logging = true;
}

const baseConfig = {
  type: 'mariadb' as const,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'dataset_canvas',
  synchronize: false, // Always false in proper workflow
  logging, // Use variable
  entities: [path.join(__dirname, '**', '*.entity.{ts,js}')],
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
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
