require('./setup');
const { app, request, createUser } = require('./helpers');

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials and returns a token', async () => {
      await createUser({ email: 'jane@example.com', password: 'Password123!' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'jane@example.com', password: 'Password123!' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('jane@example.com');
      expect(res.body.user.password).toBeUndefined();
    });

    it('rejects an incorrect password', async () => {
      await createUser({ email: 'jane@example.com', password: 'Password123!' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'jane@example.com', password: 'wrong-password' });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid credentials/i);
    });

    it('rejects an unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'Password123!' });

      expect(res.status).toBe(401);
    });

    it('requires both email and password', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'jane@example.com' });
      expect(res.status).toBe(400);
    });

    it('rejects login for a deactivated account', async () => {
      await createUser({ email: 'inactive@example.com', password: 'Password123!', isActive: false });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'inactive@example.com', password: 'Password123!' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the current user when a valid token is provided', async () => {
      const { token, user } = await createUser({ email: 'me@example.com' });

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(user.email);
    });

    it('rejects requests without a token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('rejects requests with a malformed token', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token');
      expect(res.status).toBe(401);
    });
  });
});
