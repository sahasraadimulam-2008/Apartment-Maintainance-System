const jwt = require('jsonwebtoken');

/**
 * Generate a signed JSON Web Token for authenticated users.
 * @param {string|Object} payload - User ID or object containing user payload (id, role)
 * @param {string} [expiresIn] - Expiration string (defaults to JWT_EXPIRES_IN or '7d')
 * @returns {string} - Signed JWT
 */
const generateToken = (payload, expiresIn) => {
  const secret = process.env.JWT_SECRET || 'apartment_maintenance_dev_secret_key_123';
  const options = {
    expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '7d'
  };

  // Support passing either a plain id string or an object with id and role
  const tokenPayload = typeof payload === 'string'
    ? { id: payload }
    : { id: payload.id || payload._id, role: payload.role };

  return jwt.sign(tokenPayload, secret, options);
};

module.exports = generateToken;
