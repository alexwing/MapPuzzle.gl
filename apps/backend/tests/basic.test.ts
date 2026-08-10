
import request from 'supertest';

import app from '../src/server';
import { connect, connection, PrepareDB } from '../src/server/database';

beforeAll(async () => {
  PrepareDB();
  await connect();
});
afterAll(async () => connection?.close());

describe('API tests', () => {
  // The most basic test
  test('API should return a 200 status', (done) => {
    request(app)
      .get('/api/users/testme')
      .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        done();
      });
  });

  test('sitemap endpoint should emit HTTPS URLs', async () => {
    const response = await request(app).get('/api/mapEditor/generateSitemap');

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/xml');
    expect(response.text).toContain('https://mappuzzle.xyz/?map=');
    expect(response.text).not.toContain('http://mappuzzle.xyz/?map=');
  });
});
