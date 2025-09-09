import { DataSource } from 'typeorm';
import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { User } from '../entity/User';
import { Dataset } from '../entity/Dataset';
import { DatasetImage } from '../entity/DatasetImage';

dotenv.config();

const TEST_DB_NAME = 'dataset_canvas_test_safe';

export let testDataSource: DataSource;

const createDatabaseIfNotExists = async () => {
  const connectionConfig: mysql.ConnectionOptions = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };

  if (process.env.DB_SOCKET_PATH) {
    connectionConfig.socketPath = process.env.DB_SOCKET_PATH;
  } else {
    connectionConfig.host = process.env.DB_HOST || 'localhost';
    connectionConfig.port = Number(process.env.DB_PORT) || 3306;
  }

  const connection = await mysql.createConnection(connectionConfig);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${TEST_DB_NAME}\`;`);
  await connection.end();
};

beforeAll(async () => {
  try {
    await createDatabaseIfNotExists();

    const connectionConfig: any = {
      type: 'mariadb',
      database: TEST_DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      entities: [User, Dataset, DatasetImage],
      synchronize: true,
      dropSchema: true,
    };

    if (process.env.DB_SOCKET_PATH) {
      connectionConfig.socketPath = process.env.DB_SOCKET_PATH;
    } else {
      connectionConfig.host = process.env.DB_HOST || 'localhost';
      connectionConfig.port = Number(process.env.DB_PORT) || 3306;
    }

    testDataSource = new DataSource(connectionConfig);
    await testDataSource.initialize();
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  }
});

afterAll(async () => {
  if (testDataSource) {
    await testDataSource.destroy();
  }
});

beforeEach(async () => {
  // The dropSchema:true and synchronize:true combo handles cleanup,
  // but if you need to re-seed data before each test, this is the place.
});
