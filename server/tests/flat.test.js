const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Flat = require('../src/models/Flat');
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

describe('Flat Management & Assignment Suite', () => {
  let adminToken;
  let residentUser;

  beforeEach(async () => {
    const admin = await User.create({
      name: 'Manager Admin',
      email: 'manager@apartment.com',
      password: 'password123',
      role: 'admin'
    });
    adminToken = generateToken(admin);

    residentUser = await User.create({
      name: 'Resident Dave',
      email: 'dave.res@apartment.com',
      password: 'password123',
      role: 'resident'
    });
  });

  describe('CRUD & Uniqueness', () => {
    it('should create a flat successfully (201 Created)', async () => {
      const res = await request(app)
        .post('/api/flats')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          flatNumber: 'C-501',
          building: 'Block C',
          floor: 5,
          bhkType: '3BHK',
          squareFootage: 1450
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.flatNumber).toBe('C-501');
      expect(res.body.data.occupancyStatus).toBe('vacant');
    });

    it('should reject duplicate flat in the same building (409 Conflict)', async () => {
      await Flat.create({
        flatNumber: 'C-501',
        building: 'Block C',
        floor: 5
      });

      const res = await request(app)
        .post('/api/flats')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          flatNumber: 'C-501',
          building: 'Block C',
          floor: 5
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/already exists/i);
    });

    it('should allow assigning a resident to a flat (200 OK)', async () => {
      const flat = await Flat.create({
        flatNumber: 'C-502',
        building: 'Block C',
        floor: 5
      });

      const res = await request(app)
        .post(`/api/flats/${flat._id}/assign-resident`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          residentId: residentUser._id
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedFlat = await Flat.findById(flat._id);
      expect(updatedFlat.occupancyStatus).toBe('occupied');
      expect(updatedFlat.residents.map((r) => r.toString())).toContain(residentUser._id.toString());
    });

    it('should prevent deleting flat if it still has associated residents', async () => {
      const flat = await Flat.create({
        flatNumber: 'C-503',
        building: 'Block C',
        floor: 5,
        occupancyStatus: 'occupied',
        residents: [residentUser._id]
      });

      const res = await request(app)
        .delete(`/api/flats/${flat._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/cannot delete flat that currently has associated residents/i);
    });
  });
});
