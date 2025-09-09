import { DataSource } from 'typeorm';
import { connectionConfig as originalConnectionConfig } from '../../ormconfig'; // Import the original config
import { exec } from 'child_process';
import { promisify } from 'util';
import { vi } from 'vitest';

const execAsync = promisify(exec);

let testDataSource: DataSource;

// Create a mutable copy of the connection options
const connectionConfig = { ...originalConnectionConfig };

// Setup a global test database before all tests run
beforeAll(async () => {
  const testDbName = 'dataset_canvas_test_safe';

  // Use a separate connection to create the test database
  const { database, ...initialConfig } = connectionConfig;

  const initialConnection = new DataSource({
    ...initialConfig,
  });
  await initialConnection.initialize();
  await initialConnection.query(`CREATE DATABASE IF NOT EXISTS \`${testDbName}\``);
  await initialConnection.destroy();

  // Now, connect the main test DataSource to the newly created database
  connectionConfig.database = testDbName;

  // Override with environment variables if they exist (for CI/CD)
  if (process.env.DB_SOCKET_PATH) {
    (connectionConfig as any).socketPath = process.env.DB_SOCKET_PATH;
    (connectionConfig as any).host = undefined;
    (connectionConfig as any).port = undefined;
  } else {
    (connectionConfig as any).host = process.env.DB_HOST || 'localhost';
    (connectionConfig as any).port = Number(process.env.DB_PORT) || 3306;
  }

  testDataSource = new DataSource(connectionConfig);
  await testDataSource.initialize();

  // Make the data source globally available for tests
  (global as any).testDataSource = testDataSource;
});

// Close the database connection after all tests run
afterAll(async () => {
  if (testDataSource.isInitialized) {
    await testDataSource.destroy();
  }
});

// Clear all data from tables before each test
beforeEach(async () => {
  const entities = testDataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = testDataSource.getRepository(entity.name);
    // Use delete instead of clear to handle tables without primary keys if any, and it's generally safer
    await repository.query(`DELETE FROM \`${entity.tableName}\`;`);
  }
});

// Mock logger to prevent it from writing to files during tests
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));
