const { validationResult } = require("express-validator");

/**
 * Validation Middleware using express-validator
 * Evaluates validation chains and returns 400 Bad Request if validation fails.
 */
const validate = (validations) => {
  return async (req, res, next) => {
    if (Array.isArray(validations)) {
      for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
      }
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return res.status(400).json({
      success: false,
      message: formattedErrors[0]?.message || "Validation failed.",
      errors: formattedErrors,
    });
  };
};

/**
 * Quick payload schema validator helper
 */
const validateRequiredFields = (requiredFields = []) => {
  return (req, res, next) => {
    const missing = [];
    const source = req.method === "GET" ? req.query : req.body;

    for (const field of requiredFields) {
      if (source[field] === undefined || source[field] === null || source[field] === "") {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required field(s): ${missing.join(", ")}`,
        missingFields: missing,
      });
    }

    next();
  };
};

module.exports = {
  validate,
  validateRequiredFields,
};
