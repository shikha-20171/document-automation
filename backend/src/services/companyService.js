const db = require("../config/db");
const { hashPassword } = require("../utils/password");

// Helper to sanitize company object by stripping password and password_hash
const sanitizeCompany = (company) => {
  if (!company) return null;
  const sanitized = { ...company };
  delete sanitized.password;
  delete sanitized.password_hash;
  return sanitized;
};

// Create Company
const createCompany = async (data, userId) => {
  const {
    companyName,
    companyCode,
    email,
    phoneNo,
    phone_number,
    website,
    city,
    street,
    state,
    country,
    timezone,
    currency,
    logo,
    subscriptionPlan,
  } = data;

  const effectiveEmail = email || data.companyEmail || data.adminEmail || "office@company.com";
  const effectivePhone = phoneNo || phone_number || data.phone || "";
  const effectiveStreet = street || data.street_address || data.address || "";
  const effectiveLogo = logo || data.logo_url || "";
  const code = companyCode || "ORG" + Date.now().toString().slice(-6);

  const targetAdminEmail = (data.adminEmail || effectiveEmail || "").trim().toLowerCase();
  const targetOfficeEmail = (email || data.companyEmail || "").trim().toLowerCase();
  const rawPassword = (data.password || "").trim();

  let passwordHash = null;
  if (rawPassword) {
    passwordHash = await hashPassword(rawPassword);
  }

  // Check if company already exists (only if userId is provided)
  if (userId) {
    const existingCompany = await db.query(
      "SELECT id FROM companies WHERE created_by = $1",
      [userId]
    );

    if (existingCompany.rows.length > 0) {
      throw new Error("Company already exists.");
    }
  }

  let result;
  try {
    result = await db.query(
      `INSERT INTO companies
      (
        company_name,
        company_code,
        email,
        company_email,
        admin_email,
        password_hash,
        phone_no,
        phone_number,
        website,
        city,
        street,
        street_address,
        state,
        country,
        timezone,
        currency,
        logo,
        logo_url,
        subscription_plan,
        created_by
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20
      )
      RETURNING *`,
      [
        companyName || "My Company",
        code,
        effectiveEmail,
        effectiveEmail,
        targetAdminEmail || effectiveEmail,
        passwordHash,
        effectivePhone,
        effectivePhone,
        website || "",
        city || "",
        effectiveStreet,
        effectiveStreet,
        state || "",
        country || "",
        timezone || "UTC",
        currency || "USD",
        effectiveLogo,
        effectiveLogo,
        subscriptionPlan || "Enterprise",
        userId || null,
      ]
    );
  } catch (err) {
    // Safe fallback if optional legacy columns vary
    result = await db.query(
      `INSERT INTO companies
      (
        company_name,
        email,
        company_email,
        admin_email,
        password_hash,
        phone_no,
        phone_number,
        website,
        city,
        street,
        state,
        country,
        timezone,
        currency,
        logo,
        subscription_plan,
        created_by
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
      )
      RETURNING *`,
      [
        companyName || "My Company",
        effectiveEmail,
        effectiveEmail,
        targetAdminEmail || effectiveEmail,
        passwordHash,
        effectivePhone,
        effectivePhone,
        website || "",
        city || "",
        effectiveStreet,
        state || "",
        country || "",
        timezone || "UTC",
        currency || "USD",
        effectiveLogo,
        subscriptionPlan || "Enterprise",
        userId || null,
      ]
    );
  }

  const company = result.rows[0];

  // Also sync into organisations table if applicable
  try {
    await db.query(
      `INSERT INTO organisations
       (organisation_name, organisation_code, company_email, phone_number, website, street_address, city, state, country, logo_url, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT DO NOTHING`,
      [companyName || "My Company", code, effectiveEmail, effectivePhone, website || "", effectiveStreet, city || "", state || "", country || "", effectiveLogo, passwordHash]
    );
  } catch (orgErr) {
    // Non-blocking sync notice
  }

  // If password is provided, create/update Super Admin user in users table
  if (rawPassword && passwordHash) {
    try {
      const adminName = (data.adminName || data.fullName || `${companyName} Super Admin`).trim();
      const emailsToCreate = Array.from(new Set([targetAdminEmail, targetOfficeEmail].filter(Boolean)));

      for (const userEmail of emailsToCreate) {
        const existingUser = await db.query(
          "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
          [userEmail]
        );

        if (existingUser.rows.length === 0) {
          try {
            await db.query(
              `INSERT INTO users (full_name, email, password_hash, role, is_active)
               VALUES ($1, $2, $3, 'Super Admin', true)`,
              [adminName, userEmail, passwordHash]
            );
          } catch (insErr1) {
            await db.query(
              `INSERT INTO users (full_name, email, password_hash, role, is_active, organisation_id)
               VALUES ($1, $2, $3, 'Super Admin', true, $4)`,
              [adminName, userEmail, passwordHash, company.id]
            ).catch(() => {});
          }
        } else {
          await db.query(
            `UPDATE users
             SET password_hash = $1, role = 'Super Admin', is_active = true, updated_at = NOW()
             WHERE LOWER(email) = LOWER($2)`,
            [passwordHash, userEmail]
          );
        }
      }
    } catch (userErr) {
      // Non-blocking
    }
  }

  return sanitizeCompany(company);
};

// Get Company
const getCompany = async (userId, role) => {
  if (userId) {
    const result = await db.query(
      "SELECT * FROM companies WHERE created_by = $1",
      [userId]
    );

    if (result.rows.length > 0) {
      return sanitizeCompany(result.rows[0]);
    }
  }

  const normalizedRole = (role || "").toLowerCase();
  const isSuperAdmin = normalizedRole === "super admin" || normalizedRole === "super_admin";

  if (isSuperAdmin || !userId) {
    const fallbackResult = await db.query(
      `SELECT * FROM companies
       ORDER BY created_at ASC
       LIMIT 1`
    );

    if (fallbackResult.rows.length > 0) {
      return sanitizeCompany(fallbackResult.rows[0]);
    }
  }

  throw new Error("Company not found.");
};

// Update Company
const updateCompany = async (companyId, data) => {
  const {
    companyName,
    email,
    phoneNo,
    website,
    city,
    street,
    state,
    country,
    timezone,
    currency,
    logo,
    subscriptionPlan,
    status,
    isActive,
  } = data;

  const result = await db.query(
    `UPDATE companies
     SET
      company_name = $1,
      email = $2,
      company_email = $2,
      phone_no = $3,
      phone_number = $3,
      website = $4,
      city = $5,
      street = $6,
      state = $7,
      country = $8,
      timezone = $9,
      currency = $10,
      logo = $11,
      subscription_plan = $12,
      status = $13,
      is_active = $14,
      updated_at = NOW()
     WHERE id = $15
     RETURNING *`,
    [
      companyName,
      email,
      phoneNo,
      website,
      city,
      street,
      state,
      country,
      timezone,
      currency,
      logo,
      subscriptionPlan,
      status,
      isActive,
      companyId,
    ]
  );

  if (result.rows.length === 0) {
    throw new Error("Company not found.");
  }

  return sanitizeCompany(result.rows[0]);
};

module.exports = {
  createCompany,
  getCompany,
  updateCompany,
};