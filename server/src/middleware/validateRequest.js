const { validationResult } = require('express-validator');

/**
 * Middleware to check validation results from express-validator
 * Formats errors and returns consistent 400 response
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return res.status(400).json({
      success: false,
      error: formattedErrors[0]?.message || 'Invalid input data',
      errors: formattedErrors
    });
  }
  next();
};

module.exports = { validateRequest };
