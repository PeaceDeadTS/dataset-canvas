import { describe, it, expect } from 'vitest';
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { getRepository } from 'typeorm';
import app from '../index'; // Assuming your express app is exported from index.ts
import { User, UserRole } from '../entity/User';
import { Dataset } from '../entity/Dataset';

describe('POST /api/datasets', () => {

  it('should create a new dataset for a developer', async () => {
    // 1. Setup: Create a user and get a token
    const userRepository = getRepository(User);
    let developer = userRepository.create({
      username: 'testdev',
      email: 'dev@test.com',
      password: 'password',
      role: UserRole.DEVELOPER,
    });
    developer.hashPassword();
    developer = await userRepository.save(developer);

    const token = jwt.sign(
      { userId: developer.id, email: developer.email, role: developer.role },
      process.env.JWT_SECRET || 'your_secret_key', // Ensure you have a secret key
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
    expect(response.body.user.id).toBe(developer.id);

    // 4. Assert: Check the database
    const datasetRepository = getRepository(Dataset);
    const savedDataset = await datasetRepository.findOne({ where: { name: datasetData.name } });
    expect(savedDataset).not.toBeNull();
    expect(savedDataset?.userId).toBe(developer.id);
  });

  it('should return 403 Forbidden for a regular user', async () => {
     // 1. Setup: Create a regular user and get a token
     const userRepository = getRepository(User);
     let regularUser = userRepository.create({
       username: 'testuser',
       email: 'user@test.com',
       password: 'password',
       role: UserRole.USER,
     });
     regularUser.hashPassword();
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
