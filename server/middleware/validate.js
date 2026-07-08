const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const extracted = errors.array().map(err => ({ field: err.path, message: err.msg }));
    return res.status(400).json({ message: 'Validation failed', errors: extracted });
  }
  next();
};

module.exports = validate;
