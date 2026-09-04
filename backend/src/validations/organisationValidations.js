const validateCreateOrganisation = (data) => {
  if (!data.organisation_name) {
    throw new Error("Organisation name is required.");
  }

  if (!data.company_email) {
    throw new Error("Company email is required.");
  }

  if (!data.password || data.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  return true;
};

module.exports = {
  validateCreateOrganisation,
};