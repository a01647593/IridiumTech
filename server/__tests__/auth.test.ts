import request from 'supertest';
import { app } from '../index';

describe('Auth protections', () => {
  test('GET /api/messages/:userId without token returns 401', async () => {
    const res = await request(app).get('/api/messages/persona-4');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('GET /api/messages/:userId with invalid token returns 401', async () => {
    const res = await request(app)
      .get('/api/messages/persona-4')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});
