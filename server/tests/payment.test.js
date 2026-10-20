const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Flat = require('../src/models/Flat');
const Payment = require('../src/models/Payment');
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

describe('Maintenance Payment Suite', () => {
  let adminToken;
  let resident1Token;
  let resident2Token;
  let resident1;
  let resident2;
  let flat1;

  beforeEach(async () => {
    flat1 = await Flat.create({
      flatNumber: 'B-304',
      building: 'Tower B',
      floor: 3
    });

    const admin = await User.create({
      name: 'Accounts Manager',
      email: 'accounts@complex.com',
      password: 'password123',
      role: 'admin'
    });
    adminToken = generateToken(admin);

    resident1 = await User.create({
      name: 'Resident One',
      email: 'res1@complex.com',
      password: 'password123',
      role: 'resident',
      flat: flat1._id
    });
    resident1Token = generateToken(resident1);

    resident2 = await User.create({
      name: 'Resident Two',
      email: 'res2@complex.com',
      password: 'password123',
      role: 'resident'
    });
    resident2Token = generateToken(resident2);
  });

  describe('POST /api/payments (Admin Create Dues)', () => {
    it('should allow admin to create a maintenance payment due record (201 Created)', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          residentId: resident1._id,
          flatId: flat1._id,
          amount: 2500,
          billingPeriod: 'November 2026',
          dueDate: '2026-11-10T00:00:00.000Z',
          notes: 'Standard monthly maintenance charge'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(2500);
      expect(res.body.data.status).toBe('Pending');
      expect(res.body.data.billingPeriod).toBe('November 2026');
    });

    it('should reject payment creation with negative amount (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          residentId: resident1._id,
          flatId: flat1._id,
          amount: -500,
          billingPeriod: 'November 2026',
          dueDate: '2026-11-10T00:00:00.000Z'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should reject payment creation when resident or flat is missing', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 2500,
          billingPeriod: 'November 2026',
          dueDate: '2026-11-10T00:00:00.000Z'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should deny non-admin from creating payment dues (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${resident1Token}`)
        .send({
          residentId: resident1._id,
          flatId: flat1._id,
          amount: 2500,
          billingPeriod: 'November 2026',
          dueDate: '2026-11-10T00:00:00.000Z'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET & PATCH /api/payments', () => {
    let paymentRecord;

    beforeEach(async () => {
      paymentRecord = await Payment.create({
        resident: resident1._id,
        flat: flat1._id,
        amount: 3000,
        billingPeriod: 'October 2026',
        dueDate: new Date('2026-10-10'),
        status: 'Pending'
      });
    });

    it('resident should be able to view their own payment record', async () => {
      const res = await request(app)
        .get(`/api/payments/${paymentRecord._id}`)
        .set('Authorization', `Bearer ${resident1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(3000);
    });

    it('resident should NOT be able to view another resident\'s payment record (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/payments/${paymentRecord._id}`)
        .set('Authorization', `Bearer ${resident2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/permission/i);
    });

    it('admin should update payment status manually to Paid with method and reference', async () => {
      const res = await request(app)
        .patch(`/api/payments/${paymentRecord._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'Paid',
          paymentMethod: 'Bank Transfer',
          paymentReference: 'TXN-984321748',
          notes: 'Received via NEFT'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Paid');
      expect(res.body.data.paymentMethod).toBe('Bank Transfer');
      expect(res.body.data.paymentReference).toBe('TXN-984321748');
      expect(res.body.data.paidAt).toBeDefined();
    });

    it('should reject invalid payment status value (400 Bad Request)', async () => {
      const res = await request(app)
        .patch(`/api/payments/${paymentRecord._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'InvalidStatus'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
