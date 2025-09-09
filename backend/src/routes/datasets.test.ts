import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app, startServer, dataSource } from '../index'; // Use named import
import { User, UserRole } from '../entity/User';
import jwt from 'jsonwebtoken';
import { Dataset } from '../entity/Dataset';

describe('Dataset Routes', () => {
  let developerToken: string;
  let userToken: string;
  let developer: User;
  let regularUser: User;

  beforeAll(async () => {
    await startServer(); // Ensure server and DB connection are up
    const userRepository = dataSource.getRepository(User);
    const datasetRepository = dataSource.getRepository(Dataset);

    // Clean up database before tests
    await datasetRepository.delete({});
    await userRepository.delete({});

    // Create users and tokens
    developer = userRepository.create({
      username: 'dev',
      password: 'password',
      email: 'dev@test.com',
      role: UserRole.DEVELOPER,
    });
    await developer.hashPassword();
    await userRepository.save(developer);

    regularUser = userRepository.create({
      username: 'user',
      password: 'password',
      email: 'user@test.com',
      role: UserRole.USER,
    });
    await regularUser.hashPassword();
    await userRepository.save(regularUser);

    developerToken = jwt.sign(
      { userId: developer.id, role: developer.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
    userToken = jwt.sign(
      { userId: regularUser.id, role: regularUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('POST /api/datasets', () => {
    it('should create a new dataset for a developer', async () => {
      const res = await request(app)
        .post('/api/datasets')
        .set('Authorization', `Bearer ${developerToken}`)
        .send({
          name: 'Test Dataset',
          description: 'A description for the test dataset.',
          isPublic: true,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Test Dataset');
      expect(res.body.userId).toBe(developer.id);
    });

    it('should return 403 Forbidden for a regular user', async () => {
      const res = await request(app)
        .post('/api/datasets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Forbidden Dataset',
        });

      expect(res.status).toBe(403);
    });
  });
});
