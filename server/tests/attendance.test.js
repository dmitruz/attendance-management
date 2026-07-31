require('./setup');
const { app, request, createUser, createAdmin } = require('./helpers');

describe('Attendance API', () => {
  describe('POST /api/attendance/check-in', () => {
    it('creates a check-in record for today', async () => {
      const { token } = await createUser();

      const res = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(201);
      expect(res.body.attendance.checkIn).toBeTruthy();
      expect(['present', 'late']).toContain(res.body.attendance.status);
    });

    it('rejects a second check-in on the same day', async () => {
      const { token } = await createUser();
      await request(app).post('/api/attendance/check-in').set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/attendance/check-out', () => {
    it('rejects check-out before check-in', async () => {
      const { token } = await createUser();
      const res = await request(app)
        .post('/api/attendance/check-out')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    it('records a check-out after a check-in', async () => {
      const { token } = await createUser();
      await request(app).post('/api/attendance/check-in').set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .post('/api/attendance/check-out')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.attendance.checkOut).toBeTruthy();
      expect(res.body.attendance.workHours).not.toBeNull();
    });

    it('rejects a second check-out on the same day', async () => {
      const { token } = await createUser();
      await request(app).post('/api/attendance/check-in').set('Authorization', `Bearer ${token}`);
      await request(app).post('/api/attendance/check-out').set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .post('/api/attendance/check-out')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/attendance/me', () => {
    it("returns only the requesting employee's own records", async () => {
      const { token: tokenA } = await createUser({ email: 'a@example.com' });
      const { token: tokenB } = await createUser({ email: 'b@example.com' });

      await request(app).post('/api/attendance/check-in').set('Authorization', `Bearer ${tokenA}`);
      await request(app).post('/api/attendance/check-in').set('Authorization', `Bearer ${tokenB}`);

      const res = await request(app).get('/api/attendance/me').set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.attendance).toHaveLength(1);
    });
  });

  describe('admin views', () => {
    it('blocks employees from listing all attendance', async () => {
      const { token } = await createUser();
      const res = await request(app).get('/api/attendance').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('lets an admin list attendance across all employees', async () => {
      const { token: adminToken } = await createAdmin();
      const { token: empToken } = await createUser();
      await request(app).post('/api/attendance/check-in').set('Authorization', `Bearer ${empToken}`);

      const res = await request(app).get('/api/attendance').set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.attendance.length).toBeGreaterThanOrEqual(1);
    });

    it('exports attendance as CSV', async () => {
      const { token: adminToken } = await createAdmin();
      const { token: empToken } = await createUser();
      await request(app).post('/api/attendance/check-in').set('Authorization', `Bearer ${empToken}`);

      const res = await request(app).get('/api/attendance/export').set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.text).toMatch(/employeeEmail/);
    });

    it('allows an admin to correct a record (e.g. mark on-leave)', async () => {
      const { token: adminToken } = await createAdmin();
      const { token: empToken } = await createUser();
      const checkInRes = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', `Bearer ${empToken}`);

      const recordId = checkInRes.body.attendance._id;
      const res = await request(app)
        .put(`/api/attendance/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'on-leave', notes: 'Approved leave' });

      expect(res.status).toBe(200);
      expect(res.body.attendance.status).toBe('on-leave');
    });
  });
});
