/**
 * NESTORA — Development Account Seeding Script
 * 
 * Safely provisions development Administrator, Maintenance Staff, and Resident accounts.
 * Enforces strict security safeguards:
 * - Refuses to execute in production environments (NODE_ENV === 'production')
 * - Validates emails, passwords, and roles
 * - Does not duplicate existing accounts
 * - Never prints plaintext passwords or sensitive credentials
 * - Uses existing User model and bcrypt password hashing
 */

// Guardrail 1: Refuse to run in production before loading any local env files
const initialEnv = (process.env.NODE_ENV || '').trim().toLowerCase();
if (initialEnv === 'production') {
  console.error('\n[Seed] FATAL: Seeding script is strictly disabled in production environments.');
  process.exit(1);
}

require('dotenv').config();

// Guardrail 2: Refuse to run if .env specifies production
const resolvedEnv = (process.env.NODE_ENV || '').trim().toLowerCase();
if (resolvedEnv === 'production') {
  console.error('\n[Seed] FATAL: Seeding script is strictly disabled in production environments.');
  process.exit(1);
}
const { connectDB, disconnectDB } = require('../config/database');
const User = require('../models/User');
const Staff = require('../models/Staff');
const Flat = require('../models/Flat');

const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

/**
 * Validate seed account attributes
 */
function validateAccount({ name, email, password, role }) {
  if (!name || name.trim().length === 0) {
    throw new Error(`Validation Error: Name is required for role '${role}'.`);
  }
  if (!email || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
    throw new Error(`Validation Error: Invalid email format for '${email}'.`);
  }
  if (!password || password.length < 6) {
    throw new Error(`Validation Error: Password for '${email}' must be at least 6 characters.`);
  }
  if (!['admin', 'staff', 'resident'].includes(role)) {
    throw new Error(`Validation Error: Invalid role '${role}'. Must be admin, staff, or resident.`);
  }
}

/**
 * Seed or update an individual user account
 */
async function seedUser({ name, email, password, role, phone = '' }) {
  validateAccount({ name, email, password, role });
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail }).select('+password');

  if (existingUser) {
    if (existingUser.role === role) {
      console.log(`[Seed] Account '${normalizedEmail}' already exists with role '${role}'.`);
      return existingUser;
    }

    // Role upgrade if account was previously created as resident
    console.log(`[Seed] Account '${normalizedEmail}' found with role '${existingUser.role}'. Upgrading to '${role}'...`);
    existingUser.role = role;
    if (name) existingUser.name = name.trim();
    if (phone) existingUser.phone = phone.trim();
    await existingUser.save();
    console.log(`[Seed] Account '${normalizedEmail}' successfully updated to role '${role}'.`);
    return existingUser;
  }

  // Create new user using existing User model (triggers pre-save bcrypt hashing)
  const newUser = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password, // Handled securely by userSchema.pre('save')
    role,
    phone: phone.trim()
  });

  console.log(`[Seed] Created verified ${role} account: ${normalizedEmail} (${name.trim()})`);
  return newUser;
}

/**
 * Main seeding workflow
 */
async function runSeed() {
  // Guardrail 1: Refuse to run in production
  const currentEnv = (process.env.NODE_ENV || '').trim().toLowerCase();
  if (currentEnv === 'production') {
    console.error('\n[Seed] FATAL: Seeding script is strictly disabled in production environments.');
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log('   NESTORA — Development Account Provisioning Tool    ');
  console.log('======================================================\n');

  try {
    await connectDB();

    // 1. Resolve environment configuration or safe dev defaults
    const adminConfig = {
      name: process.env.SEED_ADMIN_NAME || process.env.ADMIN_NAME || 'System Administrator',
      email: process.env.SEED_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@example.com',
      password: process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'password123',
      role: 'admin',
      phone: '+1-555-0100'
    };

    const staffConfig = {
      name: process.env.SEED_STAFF_NAME || process.env.STAFF_NAME || 'Marcus Vance',
      email: process.env.SEED_STAFF_EMAIL || process.env.STAFF_EMAIL || 'staff@example.com',
      password: process.env.SEED_STAFF_PASSWORD || process.env.STAFF_PASSWORD || 'password123',
      role: 'staff',
      jobRole: process.env.SEED_STAFF_JOBROLE || 'Plumber',
      phone: process.env.SEED_STAFF_PHONE || '+1-555-0182'
    };

    const residentConfig = {
      name: process.env.SEED_RESIDENT_NAME || process.env.RESIDENT_NAME || 'Sarah Connor',
      email: process.env.SEED_RESIDENT_EMAIL || process.env.RESIDENT_EMAIL || 'resident@example.com',
      password: process.env.SEED_RESIDENT_PASSWORD || process.env.RESIDENT_PASSWORD || 'password123',
      role: 'resident',
      phone: '+1-555-0199'
    };

    // 2. Provision Admin Account
    console.log('[Seed] Provisioning Administrator Account...');
    await seedUser(adminConfig);

    // 3. Provision Staff Account & Link Staff Profile
    console.log('[Seed] Provisioning Maintenance Staff Account...');
    const staffUser = await seedUser(staffConfig);

    // Ensure linked Staff document exists for complaint dispatch
    const existingStaffProfile = await Staff.findOne({
      $or: [{ user: staffUser._id }, { 'contactDetails.email': staffConfig.email.toLowerCase() }]
    });

    if (!existingStaffProfile) {
      await Staff.create({
        name: staffConfig.name,
        jobRole: staffConfig.jobRole,
        contactDetails: {
          email: staffConfig.email.toLowerCase(),
          phone: staffConfig.phone
        },
        availabilityStatus: 'Available',
        user: staffUser._id
      });
      console.log(`[Seed] Linked technician profile record created for ${staffConfig.email}.`);
    } else if (!existingStaffProfile.user) {
      existingStaffProfile.user = staffUser._id;
      await existingStaffProfile.save();
      console.log(`[Seed] Linked existing technician profile to user ID.`);
    }

    // 4. Provision Resident Account & Sample Unit if needed
    console.log('[Seed] Provisioning Resident Account...');
    const residentUser = await seedUser(residentConfig);

    // Create sample flat units if directory is completely empty
    const flatsCount = await Flat.countDocuments();
    if (flatsCount === 0) {
      console.log('[Seed] Creating initial apartment units...');
      const flat101 = await Flat.create({
        flatNumber: '101',
        building: 'Tower A',
        floor: 1,
        bhkType: '2BHK',
        squareFootage: 1150,
        occupancyStatus: 'occupied',
        residents: [residentUser._id]
      });

      await Flat.create({
        flatNumber: '202',
        building: 'Tower B',
        floor: 2,
        bhkType: '3BHK',
        squareFootage: 1450,
        occupancyStatus: 'vacant'
      });

      // Associate unit with resident
      residentUser.flat = flat101._id;
      await residentUser.save();
      console.log(`[Seed] Assigned ${residentConfig.email} to Unit Tower A-101.`);
    }

    // 5. Optional check for promoting an existing user specified by SEED_PROMOTE_ADMIN_EMAIL
    if (process.env.SEED_PROMOTE_ADMIN_EMAIL) {
      const targetEmail = process.env.SEED_PROMOTE_ADMIN_EMAIL.trim().toLowerCase();
      const userToPromote = await User.findOne({ email: targetEmail });
      if (userToPromote) {
        userToPromote.role = 'admin';
        await userToPromote.save();
        console.log(`[Seed] Promoted existing account '${targetEmail}' to 'admin'.`);
      }
    }

    console.log('\n[Seed] Provisioning complete. All accounts are ready for testing.');
    console.log('------------------------------------------------------');
    console.log(`Administrator Login : ${adminConfig.email}`);
    console.log(`Technician Login    : ${staffConfig.email}`);
    console.log(`Resident Login      : ${residentConfig.email}`);
    console.log('------------------------------------------------------\n');
  } catch (error) {
    console.error(`\n[Seed] ERROR: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

// Execute if run directly via CLI
if (require.main === module) {
  runSeed();
}

module.exports = {
  runSeed,
  seedUser,
  validateAccount
};
