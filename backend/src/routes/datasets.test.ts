import request from 'supertest';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { app, startServer } from '../index'; // dataSource удален
import { AppDataSource } from '../data-source'; // Импортируем AppDataSource
import { User, UserRole } from '../entity/User.entity';
import jwt from 'jsonwebtoken';
import { Dataset } from '../entity/Dataset.entity';

let server;

describe('Datasets API', () => {
  let token: string;
  let adminToken: string;
  let userId: string;
  let adminId: string;

  beforeAll(async () => {
    await startServer();
    // Используем AppDataSource напрямую
    await AppDataSource.synchronize(true); // Очищаем и создаем схему для теста

    // Create users and tokens
    const userRepo = AppDataSource.getRepository(User);
    const datasetRepo = AppDataSource.getRepository(Dataset);

    // Clean up database before tests
    await datasetRepo.delete({});
    await userRepo.delete({});

    // Create users and tokens
    const devUser = userRepo.create({
      username: 'dev',
      password: 'password',
      email: 'dev@test.com',
      role: UserRole.DEVELOPER,
    });
    await devUser.hashPassword();
    await userRepo.save(devUser);

    const adminUser = userRepo.create({
      username: 'admin',
      password: 'password',
      email: 'admin@test.com',
      role: UserRole.ADMINISTRATOR,
    });
    await adminUser.hashPassword();
    await userRepo.save(adminUser);

    userId = devUser.id;
    adminId = adminUser.id;

    token = jwt.sign({ userId, role: UserRole.DEVELOPER }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    adminToken = jwt.sign({ userId: adminId, role: UserRole.ADMINISTRATOR }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it('should create a dataset for an authenticated developer', async () => {
    const response = await request(app)
      .post('/api/datasets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Dataset',
        description: 'A description for the test dataset.',
        isPublic: true,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Dataset');

    const datasetRepo = AppDataSource.getRepository(Dataset);
    const dataset = await datasetRepo.findOne({ where: { id: response.body.id } });
    expect(dataset).not.toBeNull();
  });

  it('should return 403 Forbidden for a regular user', async () => {
    const response = await request(app)
      .post('/api/datasets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Forbidden Dataset',
      });

    expect(response.status).toBe(403);
  });

  it('should return 403 Forbidden for an admin user', async () => {
    const response = await request(app)
      .post('/api/datasets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Forbidden Dataset',
      });

    expect(response.status).toBe(403);
  });

  it('should return 401 Unauthorized for unauthenticated requests', async () => {
    const response = await request(app)
      .post('/api/datasets')
      .send({
        name: 'Unauthorized Dataset',
      });

    expect(response.status).toBe(401);
  });
});
