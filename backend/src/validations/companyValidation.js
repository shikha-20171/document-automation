const { body, validationResult } = require("express-validator");

const validateCreateCompany = async (req, res, next) => {
  const validations = [
    body("companyName")
      .trim()
      .notEmpty()
      .withMessage("Company name is required"),

    body("email")
      .isEmail()
      .withMessage("Valid email is required"),

    body("phoneNo")
      .notEmpty()
      .withMessage("Phone number is required"),

    body("city")
      .notEmpty()
      .withMessage("City is required"),

    body("state")
      .notEmpty()
      .withMessage("State is required"),

    body("country")
      .notEmpty()
      .withMessage("Country is required"),

    body("timezone")
      .notEmpty()
      .withMessage("Timezone is required"),

    body("currency")
      .notEmpty()
      .withMessage("Currency is required"),

    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ];

  // Run all validations
  await Promise.all(validations.map(validation => validation.run(req)));
  
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  next();
};

module.exports = {
  validateCreateCompany,
};
