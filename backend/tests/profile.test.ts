import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import * as envModule from '../src/config/env';
import * as dbModule from '../src/db';
import * as userServiceModule from '../src/services/userService';

describe('Profile Endpoints (GET /profile, PUT /profile)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 when accessing GET /profile in production mode without auth header', async () => {
    vi.spyOn(envModule, 'env', 'get').mockReturnValue({
      ...envModule.env,
      AUTH_MODE: 'production'
    });

    const app = createApp();
    const response = await request(app).get('/profile');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('retrieves profile in demo mode for authenticated user', async () => {
    vi.spyOn(envModule, 'env', 'get').mockReturnValue({
      ...envModule.env,
      AUTH_MODE: 'demo'
    });

    const app = createApp();
    const response = await request(app)
      .get('/profile')
      .set('x-demo-user-id', 'user-profile-test-1');

    expect(response.status).toBe(200);
    expect(response.body.profile).toBeDefined();
    expect(response.body.profile.userId).toBe('user-profile-test-1');
  });

  it('updates profile with valid Eligibility DNA input in demo mode', async () => {
    vi.spyOn(envModule, 'env', 'get').mockReturnValue({
      ...envModule.env,
      AUTH_MODE: 'demo'
    });

    const app = createApp();
    const payload = {
      fullName: 'Anita Sharma',
      dateOfBirth: '2004-05-15',
      gender: 'female',
      category: 'OBC',
      religion: 'HINDU',
      domicileState: 'Karnataka',
      annualFamilyIncome: 180000,
      educationLevel: 'undergraduate',
      academicPercentage: 88.5
    };

    const response = await request(app)
      .put('/profile')
      .set('x-demo-user-id', 'user-profile-test-1')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.profile).toMatchObject({
      userId: 'user-profile-test-1',
      fullName: 'Anita Sharma',
      gender: 'female',
      category: 'OBC',
      domicileState: 'Karnataka',
      annualFamilyIncome: 180000,
      academicPercentage: 88.5
    });
  });

  it('returns 400 VALIDATION_ERROR for invalid dateOfBirth format', async () => {
    vi.spyOn(envModule, 'env', 'get').mockReturnValue({
      ...envModule.env,
      AUTH_MODE: 'demo'
    });

    const app = createApp();
    const response = await request(app)
      .put('/profile')
      .set('x-demo-user-id', 'user-profile-test-1')
      .send({ dateOfBirth: '15-05-2004' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.issues).toBeDefined();
  });

  it('returns 400 VALIDATION_ERROR when academicPercentage exceeds 100', async () => {
    vi.spyOn(envModule, 'env', 'get').mockReturnValue({
      ...envModule.env,
      AUTH_MODE: 'demo'
    });

    const app = createApp();
    const response = await request(app)
      .put('/profile')
      .set('x-demo-user-id', 'user-profile-test-1')
      .send({ academicPercentage: 105 });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('ensures user record is upserted to satisfy foreign key constraint when database is healthy', async () => {
    vi.spyOn(envModule, 'env', 'get').mockReturnValue({
      ...envModule.env,
      AUTH_MODE: 'demo'
    });
    vi.spyOn(dbModule, 'checkDatabaseHealth').mockResolvedValue(true);

    const upsertUserSpy = vi.spyOn(userServiceModule, 'upsertUser').mockResolvedValue({
      id: 'demo-student-fk-test',
      authMode: 'demo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const mockProfileRow = {
      id: 'test-uuid-123',
      userId: 'demo-student-fk-test',
      fullName: 'Sunita Sharma',
      gender: 'female',
      category: 'GENERAL',
      domicileState: 'KARNATAKA',
      annualFamilyIncome: 200000,
      educationLevel: 'undergraduate',
      currentCourse: 'BSc Computer Science',
      courseYear: 1,
      academicPercentage: 88,
      instituteState: 'KARNATAKA',
      isSingleGirlChild: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    vi.spyOn(dbModule, 'query').mockResolvedValue({
      rows: [mockProfileRow],
      rowCount: 1,
      command: 'INSERT',
      oid: 0,
      fields: []
    });

    const app = createApp();
    const response = await request(app)
      .put('/profile')
      .set('x-demo-user-id', 'demo-student-fk-test')
      .send({
        fullName: 'Sunita Sharma',
        gender: 'female'
      });

    expect(response.status).toBe(200);
    expect(upsertUserSpy).toHaveBeenCalledWith('demo-student-fk-test');
    expect(response.body.profile.fullName).toBe('Sunita Sharma');
  });
});
