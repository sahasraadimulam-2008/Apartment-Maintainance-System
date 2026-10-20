const mongoose = require('mongoose');
const User = require('../src/models/User');
const Staff = require('../src/models/Staff');
const Flat = require('../src/models/Flat');
const { seedUser, validateAccount } = require('../src/scripts/seedUsers');
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

describe('Development Seeding Mechanism Suite', () => {
  describe('Validation Guardrails', () => {
    it('should reject account validation if email format is invalid', () => {
      expect(() => {
        validateAccount({
          name: 'Admin User',
          email: 'invalid-email-string',
          password: 'password123',
          role: 'admin'
        });
      }).toThrow(/Invalid email format/i);
    });

    it('should reject account validation if password is shorter than 6 characters', () => {
      expect(() => {
        validateAccount({
          name: 'Admin User',
          email: 'admin@example.com',
          password: '123',
          role: 'admin'
        });
      }).toThrow(/at least 6 characters/i);
    });

    it('should reject account validation if role is invalid', () => {
      expect(() => {
        validateAccount({
          name: 'Super User',
          email: 'admin@example.com',
          password: 'password123',
          role: 'superadmin'
        });
      }).toThrow(/Invalid role/i);
    });
  });

  describe('Account Provisioning & Idempotency', () => {
    it('should securely provision an admin account and hash password', async () => {
      const admin = await seedUser({
        name: 'Executive Admin',
        email: 'exec_admin@test.com',
        password: 'securePassAdmin123',
        role: 'admin'
      });

      expect(admin).toBeDefined();
      expect(admin.role).toBe('admin');
      expect(admin.email).toBe('exec_admin@test.com');

      // Fetch user with password to verify hashing
      const savedAdmin = await User.findById(admin._id).select('+password');
      expect(savedAdmin.password).not.toBe('securePassAdmin123');
      expect(savedAdmin.password.startsWith('$2')).toBe(true);

      const isMatch = await savedAdmin.comparePassword('securePassAdmin123');
      expect(isMatch).toBe(true);
    });

    it('should provision a staff member and prevent duplicates on second run', async () => {
      // First run: Creates staff
      const staffFirst = await seedUser({
        name: 'Plumbing Staff',
        email: 'technician@test.com',
        password: 'staffPassword123',
        role: 'staff'
      });

      expect(staffFirst.role).toBe('staff');

      // Second run: Detects existing user and skips recreation
      const staffSecond = await seedUser({
        name: 'Plumbing Staff',
        email: 'technician@test.com',
        password: 'staffPassword123',
        role: 'staff'
      });

      expect(staffSecond._id.toString()).toBe(staffFirst._id.toString());
      const userCount = await User.countDocuments({ email: 'technician@test.com' });
      expect(userCount).toBe(1);
    });

    it('should upgrade existing resident to admin if email matches seed admin configuration', async () => {
      // User registered previously via public registration as resident
      const initialResident = await User.create({
        name: 'Admin Candidate',
        email: 'future_admin@test.com',
        password: 'residentPassword123',
        role: 'resident'
      });

      expect(initialResident.role).toBe('resident');

      // Run seed targeting future_admin@test.com
      const upgraded = await seedUser({
        name: 'Admin Candidate',
        email: 'future_admin@test.com',
        password: 'residentPassword123',
        role: 'admin'
      });

      expect(upgraded.role).toBe('admin');
      const refreshed = await User.findById(initialResident._id);
      expect(refreshed.role).toBe('admin');
    });
  });
});
