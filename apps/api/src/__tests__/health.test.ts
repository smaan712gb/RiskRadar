import { describe, it, expect, afterAll } from 'vitest';
import { buildTestApp, closeTestApp } from './helpers/test-app.js';

describe('Health Check', () => {
  afterAll(async () => {
    await closeTestApp();
  });

  it('GET /api/v1/health returns 200', async () => {
    const app = await buildTestApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('ok');
  });
});
