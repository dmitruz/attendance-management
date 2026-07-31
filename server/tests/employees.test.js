require('./setup');
const { app, request, createUser, createAdmin } = require('./helpers');

describe('Employee management API', () => {
  describe('access control', () => {
    it('blocks non-admins from listing employees', async () => {
      const { token } = await createUser();
      const res = await request(app).get('/api/employees').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('blocks unauthenticated requests', async () => {
      const res = await request(app).get('/api/employees');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/employees', () => {
    it('allows an admin to create a new employee', async () => {
      const { token } = await createAdmin();

      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Hire', email: 'newhire@example.com', password: 'Password123!' });

      expect(res.status).toBe(201);
      expect(res.body.employee.email).toBe('newhire@example.com');
      expect(res.body.employee.role).toBe('employee');
    });

    it('rejects duplicate emails', async () => {
      const { token } = await createAdmin();
      await createUser({ email: 'dup@example.com' });

      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Dup', email: 'dup@example.com', password: 'Password123!' });

      expect(res.status).toBe(409);
    });

    it('validates required fields', async () => {
      const { token } = await createAdmin();
      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Missing Fields' });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/employees/:id', () => {
    it('updates an employee record', async () => {
      const { token } = await createAdmin();
      const { user } = await createUser({ name: 'Old Name' });

      const res = await request(app)
        .put(`/api/employees/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name', jobTitle: 'QA Engineer' });

      expect(res.status).toBe(200);
      expect(res.body.employee.name).toBe('New Name');
      expect(res.body.employee.jobTitle).toBe('QA Engineer');
    });

    it('returns 404 for a non-existent employee', async () => {
      const { token } = await createAdmin();
      const res = await request(app)
        .put('/api/employees/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Ghost' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/employees/:id', () => {
    it('deactivates rather than deletes an employee', async () => {
      const { token } = await createAdmin();
      const { user } = await createUser();

      const res = await request(app)
        .delete(`/api/employees/${user._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.employee.isActive).toBe(false);
    });
  });
});
