const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Announcement = require('../src/models/Announcement');
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

describe('Announcements Suite', () => {
  let adminToken;
  let residentToken;
  let staffToken;

  beforeEach(async () => {
    const admin = await User.create({
      name: 'Secretary Admin',
      email: 'secretary@apartment.com',
      password: 'password123',
      role: 'admin'
    });
    adminToken = generateToken(admin);

    const resident = await User.create({
      name: 'Resident Bob',
      email: 'bob.res@apartment.com',
      password: 'password123',
      role: 'resident'
    });
    residentToken = generateToken(resident);

    const staff = await User.create({
      name: 'Guard Dave',
      email: 'dave.guard@apartment.com',
      password: 'password123',
      role: 'staff'
    });
    staffToken = generateToken(staff);
  });

  describe('POST /api/announcements', () => {
    it('should allow admin to publish a society announcement (201 Created)', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Scheduled Water Tank Cleaning',
          message: 'Water supply will be paused between 1:00 PM and 4:00 PM on Thursday.',
          targetAudience: 'All',
          priority: 'Urgent'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Scheduled Water Tank Cleaning');
      expect(res.body.data.priority).toBe('Urgent');
    });

    it('should deny resident from publishing an announcement (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          title: 'Garage Sale',
          message: 'Selling old furniture this Sunday.'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject announcement with missing title or message (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          targetAudience: 'All'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET & DELETE /api/announcements', () => {
    let announcement;

    beforeEach(async () => {
      const admin = await User.findOne({ email: 'secretary@apartment.com' });
      announcement = await Announcement.create({
        title: 'Clubhouse Maintenance',
        message: 'Pool closed on Monday for weekly sanitization.',
        creator: admin._id,
        targetAudience: 'Residents',
        priority: 'Normal'
      });
    });

    it('should allow residents to view relevant announcements', async () => {
      const res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].title).toBe('Clubhouse Maintenance');
    });

    it('should allow admin to delete an announcement (200 OK)', async () => {
      const res = await request(app)
        .delete(`/api/announcements/${announcement._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbRecord = await Announcement.findById(announcement._id);
      expect(dbRecord).toBeNull();
    });
  });
});
