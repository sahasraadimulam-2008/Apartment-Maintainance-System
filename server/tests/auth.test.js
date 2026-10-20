const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
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

describe('Authentication & Authorization Suite', () => {
  const validResident = {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'password123',
    role: 'resident',
    phone: '1234567890'
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validResident);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.data.email).toBe(validResident.email);
      expect(res.body.data.name).toBe(validResident.name);
      expect(res.body.data.role).toBe('resident');
      // Password must NEVER be exposed
      expect(res.body.data.password).toBeUndefined();

      // Verify user in database
      const dbUser = await User.findOne({ email: validResident.email }).select('+password');
      expect(dbUser).not.toBeNull();
      expect(dbUser.password).not.toBe(validResident.password); // Hashed
    });

    it('should reject registration if email is already registered (409 Conflict)', async () => {
      await request(app).post('/api/auth/register').send(validResident);

      const res = await request(app)
        .post('/api/auth/register')
        .send(validResident);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/already exists/i);
    });

    it('should reject registration if password is less than 6 characters (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bob Smith',
          email: 'bob@example.com',
          password: '123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should reject registration if email format is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bob Smith',
          email: 'invalid-email-string',
          password: 'password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should allow resident registration without a flat assignment', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Independent Resident',
          email: 'no_flat_resident@example.com',
          password: 'password123',
          phone: '+1-555-0199'
          // flat is omitted
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('resident');
      expect(res.body.data.flat).toBeNull();
    });

    it('should reject public attempt to register with role admin (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hacker Admin',
          email: 'fake_admin@example.com',
          password: 'password123',
          role: 'admin'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/administrator accounts cannot be registered publicly/i);
    });

    it('should reject staff registration without authorization code (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Public Staff Wannabe',
          email: 'unauthorized_staff@example.com',
          password: 'password123',
          role: 'staff'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/authorization code/i);
    });

    it('should reject staff registration with invalid authorization code (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Code Staff',
          email: 'bad_code_staff@example.com',
          password: 'password123',
          role: 'staff',
          staffInviteCode: 'WRONG-CODE-9999'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/authorization code/i);
    });

    it('should successfully register staff with valid authorization code and link Staff profile (201 Created)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Marcus Plumber',
          email: 'marcus.plumbing@example.com',
          password: 'password123',
          phone: '+1-555-0182',
          role: 'staff',
          jobRole: 'Plumber',
          staffInviteCode: 'NESTORA-STAFF-2026'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('staff');
      expect(res.body.token).toBeDefined();

      // Verify linked Staff profile in database
      const Staff = require('../src/models/Staff');
      const staffDoc = await Staff.findOne({ 'contactDetails.email': 'marcus.plumbing@example.com' });
      expect(staffDoc).not.toBeNull();
      expect(staffDoc.jobRole).toBe('Plumber');
      expect(staffDoc.user.toString()).toBe(res.body.data.id);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validResident);
    });

    it('should authenticate user with valid credentials and return token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validResident.email,
          password: validResident.password
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.data.email).toBe(validResident.email);
      expect(res.body.data.password).toBeUndefined();
    });

    it('should reject login with incorrect password (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validResident.email,
          password: 'wrong_password'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/invalid email or password/i);
    });

    it('should reject login for non-existent email (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/invalid email or password/i);
    });

    it('should reject login when email or password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validResident.email });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should authenticate existing administrator accounts', async () => {
      await User.create({
        name: 'System Admin',
        email: 'sys_admin@example.com',
        password: 'adminPassword123',
        role: 'admin'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'sys_admin@example.com',
          password: 'adminPassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('admin');
      expect(res.body.token).toBeDefined();
    });
  });

  describe('GET /api/auth/me (Protected Route)', () => {
    let token;

    beforeEach(async () => {
      const reg = await request(app).post('/api/auth/register').send(validResident);
      token = reg.body.token;
    });

    it('should return current user profile when valid bearer token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(validResident.email);
      expect(res.body.data.name).toBe(validResident.name);
      expect(res.body.data.password).toBeUndefined();
    });

    it('should reject access without token (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/token missing/i);
    });

    it('should reject access with malformed token (401 Unauthorized)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token_xyz');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/invalid or malformed token/i);
    });
  });
});
