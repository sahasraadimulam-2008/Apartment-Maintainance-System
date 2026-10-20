const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const generateToken = require('../src/utils/generateToken');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe('Role-Based Authorization Suite', () => {
  let adminToken;
  let residentToken;
  let staffToken;

  beforeEach(async () => {
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    });
    adminToken = generateToken(adminUser);

    const residentUser = await User.create({
      name: 'Resident John',
      email: 'john@example.com',
      password: 'password123',
      role: 'resident'
    });
    residentToken = generateToken(residentUser);

    const staffUser = await User.create({
      name: 'Plumber Bob',
      email: 'bob@example.com',
      password: 'password123',
      role: 'staff'
    });
    staffToken = generateToken(staffUser);
  });

  describe('Admin Privileged Operations', () => {
    it('should allow admin to create a new flat (201 Created)', async () => {
      const res = await request(app)
        .post('/api/flats')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          flatNumber: 'A-101',
          building: 'Block Alpha',
          floor: 1,
          bhkType: '2BHK'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.flatNumber).toBe('A-101');
    });

    it('should deny resident from creating a flat (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/flats')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          flatNumber: 'B-201',
          building: 'Block Beta',
          floor: 2
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/not authorized/i);
    });

    it('should allow admin to create a staff member record (201 Created)', async () => {
      const res = await request(app)
        .post('/api/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Charlie Davis',
          jobRole: 'Electrician',
          contactDetails: {
            email: 'charlie@example.com',
            phone: '9876543210'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Charlie Davis');
    });

    it('should deny resident from creating staff member (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/staff')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          name: 'David Electrician',
          jobRole: 'Electrician',
          contactDetails: { phone: '1234567890' }
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/not authorized/i);
    });

    it('should allow admin and staff to view resident roster, but deny resident', async () => {
      // Admin allowed
      const adminRes = await request(app)
        .get('/api/residents')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);

      // Staff allowed
      const staffRes = await request(app)
        .get('/api/residents')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(staffRes.status).toBe(200);

      // Resident denied
      const residentRes = await request(app)
        .get('/api/residents')
        .set('Authorization', `Bearer ${residentToken}`);
      expect(residentRes.status).toBe(403);
    });
  });
});
