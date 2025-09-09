import { createConnection, getConnection } from 'typeorm';
import config from '../../ormconfig';

beforeAll(async () => {
  // Set the environment to test
  process.env.NODE_ENV = 'test';
  try {
    await createConnection(config);
    console.log('Test database connection created.');
  } catch (error) {
    console.error('Error creating test database connection:', error);
    process.exit(1);
  }
});

afterAll(async () => {
  const connection = getConnection();
  await connection.close();
  console.log('Test database connection closed.');
});

// This will run before each test in the suite
beforeEach(async () => {
  const connection = getConnection();
  // This is a simple way to clear all tables.
  // For more complex scenarios, you might use a library like `typeorm-seeding`.
  await connection.synchronize(true);
});
