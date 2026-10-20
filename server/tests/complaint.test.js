const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Flat = require('../src/models/Flat');
const Staff = require('../src/models/Staff');
const Complaint = require('../src/models/Complaint');
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

describe('Complaint Management Suite', () => {
  let adminToken;
  let resident1Token;
  let resident2Token;
  let staffToken;
  let flat1;
  let flat2;
  let staffRecord;

  beforeEach(async () => {
    // Create flats
    flat1 = await Flat.create({
      flatNumber: '101',
      building: 'Tower A',
      floor: 1,
      occupancyStatus: 'occupied'
    });

    flat2 = await Flat.create({
      flatNumber: '201',
      building: 'Tower A',
      floor: 2,
      occupancyStatus: 'occupied'
    });

    // Create users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@complex.com',
      password: 'password123',
      role: 'admin'
    });
    adminToken = generateToken(admin);

    const resident1 = await User.create({
      name: 'Resident One',
      email: 'res1@complex.com',
      password: 'password123',
      role: 'resident',
      flat: flat1._id
    });
    resident1Token = generateToken(resident1);

    const resident2 = await User.create({
      name: 'Resident Two',
      email: 'res2@complex.com',
      password: 'password123',
      role: 'resident',
      flat: flat2._id
    });
    resident2Token = generateToken(resident2);

    const staffUser = await User.create({
      name: 'Maintenance Staff',
      email: 'staff@complex.com',
      password: 'password123',
      role: 'staff'
    });
    staffToken = generateToken(staffUser);

    staffRecord = await Staff.create({
      name: 'Bob The Plumber',
      jobRole: 'Plumber',
      contactDetails: { phone: '555-0199' },
      user: staffUser._id
    });
  });

  describe('POST /api/complaints', () => {
    it('should allow resident to create complaint for their own flat (201 Created)', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${resident1Token}`)
        .send({
          title: 'Kitchen sink pipe leaking',
          description: 'Constant dripping water under the kitchen cabinet',
          flatId: flat1._id,
          category: 'Plumbing',
          priority: 'High'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Kitchen sink pipe leaking');
      expect(res.body.data.status).toBe('Open');
      expect(res.body.data.statusHistory.length).toBe(1);
    });

    it('should reject complaint creation when resident targets someone else\'s flat (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${resident1Token}`)
        .send({
          title: 'Unauthorized flat complaint',
          description: 'Trying to complain about flat 201',
          flatId: flat2._id
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/assigned flat/i);
    });

    it('should reject complaint creation when title or description is missing (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${resident1Token}`)
        .send({
          flatId: flat1._id
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/complaints & Privacy Restrictions', () => {
    let complaint1;
    let complaint2;

    beforeEach(async () => {
      const res1User = await User.findOne({ email: 'res1@complex.com' });
      const res2User = await User.findOne({ email: 'res2@complex.com' });

      complaint1 = await Complaint.create({
        title: 'Resident 1 Issue',
        description: 'Private bathroom leak',
        resident: res1User._id,
        flat: flat1._id,
        category: 'Plumbing',
        priority: 'High'
      });

      complaint2 = await Complaint.create({
        title: 'Resident 2 Issue',
        description: 'Living room switch sparking',
        resident: res2User._id,
        flat: flat2._id,
        category: 'Electrical',
        priority: 'Critical'
      });
    });

    it('resident should ONLY see their own complaints when listing', async () => {
      const res = await request(app)
        .get('/api/complaints')
        .set('Authorization', `Bearer ${resident1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].title).toBe('Resident 1 Issue');
    });

    it('resident should be denied viewing another resident\'s complaint details (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/complaints/${complaint2._id}`)
        .set('Authorization', `Bearer ${resident1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/permission/i);
    });

    it('resident CAN view their own complaint details (200 OK)', async () => {
      const res = await request(app)
        .get(`/api/complaints/${complaint1._id}`)
        .set('Authorization', `Bearer ${resident1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Resident 1 Issue');
    });

    it('admin and staff can view all complaints', async () => {
      const adminRes = await request(app)
        .get('/api/complaints')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminRes.status).toBe(200);
      expect(adminRes.body.count).toBe(2);

      const staffRes = await request(app)
        .get('/api/complaints')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(staffRes.status).toBe(200);
      expect(staffRes.body.count).toBe(2);
    });
  });

  describe('PATCH /api/complaints/:id/status & Staff Assignment', () => {
    let complaint;

    beforeEach(async () => {
      const res1User = await User.findOne({ email: 'res1@complex.com' });
      complaint = await Complaint.create({
        title: 'Water Heater Malfunction',
        description: 'No hot water in master bathroom',
        resident: res1User._id,
        flat: flat1._id,
        category: 'Plumbing',
        priority: 'Medium'
      });
    });

    it('staff should be able to update complaint status to In Progress (200 OK)', async () => {
      const res = await request(app)
        .patch(`/api/complaints/${complaint._id}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          status: 'In Progress',
          note: 'Technician on the way to check thermostat'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('In Progress');
      expect(res.body.data.statusHistory.length).toBe(1);
    });

    it('resident should NOT be allowed to change complaint status (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/complaints/${complaint._id}/status`)
        .set('Authorization', `Bearer ${resident1Token}`)
        .send({
          status: 'Resolved'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid status values (400 Bad Request)', async () => {
      const res = await request(app)
        .patch(`/api/complaints/${complaint._id}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          status: 'NonExistentStatus'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('admin should be able to assign complaint to staff technician', async () => {
      const res = await request(app)
        .patch(`/api/complaints/${complaint._id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          staffId: staffRecord._id,
          note: 'Assigned to Bob for water heater repair'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assignedStaff).toBe(staffRecord._id.toString());
      expect(res.body.data.status).toBe('In Progress');
    });
  });
});
