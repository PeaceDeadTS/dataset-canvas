import { describe, it, expect } from 'vitest';
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { testDataSource } from '../test/test-setup'; // Import the test data source
import app from '../index'; 
import { User, UserRole } from '../entity/User';
import { Dataset } from '../entity/Dataset';

describe('POST /api/datasets', () => {
  it('should create a new dataset for a developer', async () => {
    const userRepository = testDataSource.getRepository(User);
    
    // 1. Setup: Create a user and get a token
    let developer = userRepository.create({
      username: 'testdev',
      email: 'dev@test.com',
      password: 'password',
      role: UserRole.DEVELOPER,
    });
    // In a real app, you'd hash the password. For this test, we assume a method exists.
    await developer.hashPassword();
    developer = await userRepository.save(developer);

    const token = jwt.sign(
      { userId: developer.id, email: developer.email, role: developer.role },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '1h' }
    );

    const datasetData = {
      name: 'My New Test Dataset',
      description: 'A description for the test dataset.',
      isPublic: true,
    };

    // 2. Act: Send the request
    const response = await request(app)
      .post('/api/datasets')
      .set('Authorization', `Bearer ${token}`)
      .send(datasetData);

    // 3. Assert: Check the response
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(datasetData.name);
    
    // The response now includes the full user object, so we check the nested id
    expect(response.body.user.id).toBe(developer.id);

    // 4. Assert: Check the database
    const datasetRepository = testDataSource.getRepository(Dataset);
    const savedDataset = await datasetRepository.findOne({ 
        where: { name: datasetData.name },
        relations: ['user']
    });
    expect(savedDataset).not.toBeNull();
    expect(savedDataset?.user.id).toBe(developer.id);
  });

  it('should return 403 Forbidden for a regular user', async () => {
    const userRepository = testDataSource.getRepository(User);

    // 1. Setup: Create a regular user and get a token
    let regularUser = userRepository.create({
      username: 'testuser',
      email: 'user@test.com',
      password: 'password',
      role: UserRole.USER,
    });
    await regularUser.hashPassword();
    regularUser = await userRepository.save(regularUser);

    const token = jwt.sign(
      { userId: regularUser.id, email: regularUser.email, role: regularUser.role },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '1h' }
    );

    const datasetData = {
      name: 'Forbidden Dataset',
    };

    // 2. Act: Send the request
    const response = await request(app)
      .post('/api/datasets')
      .set('Authorization', `Bearer ${token}`)
      .send(datasetData);

    // 3. Assert: Check the response
    expect(response.status).toBe(403);
  });
});
