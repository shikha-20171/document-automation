const pool = require("../config/db");

/* ---------------- Find User By Email ---------------- */

const findUserByEmail = async (email) => {
  const cleanEmail = (email || "").trim().toLowerCase();

  // 1. Check users table
  try {
    const userResult = await pool.query(
      `SELECT * FROM users WHERE LOWER(email) = LOWER($1)`,
      [cleanEmail]
    );

    if (userResult.rows.length > 0) {
      return userResult.rows[0];
    }
  } catch (err) {
    console.log("Users table lookup notice:", err.message);
  }

  // 2. Fallback check companies table (for super admin logins stored in companies table)
  try {
    const companyResult = await pool.query(
      `SELECT
         id,
         company_name as full_name,
         COALESCE(admin_email, email, company_email) as email,
         password_hash,
         'Super Admin' as role,
         true as is_active
       FROM companies
       WHERE (admin_email IS NOT NULL AND LOWER(admin_email) = LOWER($1))
          OR (email IS NOT NULL AND LOWER(email) = LOWER($1))
          OR (company_email IS NOT NULL AND LOWER(company_email) = LOWER($1))
       ORDER BY created_at DESC
       LIMIT 1`,
      [cleanEmail]
    );

    if (companyResult.rows.length > 0 && companyResult.rows[0].password_hash) {
      return companyResult.rows[0];
    }
  } catch (err) {
    console.log("Companies table login lookup notice:", err.message);
  }

  // 3. Fallback check organisations table
  try {
    const orgResult = await pool.query(
      `SELECT
         id,
         organisation_name as full_name,
         company_email as email,
         password_hash,
         'Super Admin' as role,
         true as is_active
       FROM organisations
       WHERE company_email IS NOT NULL AND LOWER(company_email) = LOWER($1)
       LIMIT 1`,
      [cleanEmail]
    );

    if (orgResult.rows.length > 0 && orgResult.rows[0].password_hash) {
      return orgResult.rows[0];
    }
  } catch (err) {
    console.log("Organisations table login lookup notice:", err.message);
  }

  return undefined;
};

/* ---------------- Update Last Login ---------------- */

const updateLastLogin = async (userId) => {
  const query = `
    UPDATE users
    SET
      last_login = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `;

  await pool.query(query, [userId]);
};

/* ---------------- Save Refresh Token ---------------- */

const createUserSession = async (
  userId,
  refreshToken,
  expiresAt
) => {
  const query = `
    INSERT INTO user_sessions
    (
      user_id,
      refresh_token,
      expires_at
    )
    VALUES
    (
      $1,$2,$3
    )
  `;

  await pool.query(query, [
    userId,
    refreshToken,
    expiresAt,
  ]);
};

/* ---------------- Save Reset Token ---------------- */

const saveResetToken = async (
  userId,
  token,
  expiresAt
) => {
  const query = `
    INSERT INTO password_reset_tokens
    (
      user_id,
      token,
      expires_at
    )
    VALUES
    (
      $1,$2,$3
    )
  `;

  await pool.query(query, [
    userId,
    token,
    expiresAt,
  ]);
};

/* ---------------- Find Reset Token ---------------- */

const findResetToken = async (token) => {
  const query = `
    SELECT *
    FROM password_reset_tokens
    WHERE token = $1
      AND is_used = false
  `;

  const result = await pool.query(query, [token]);

  return result.rows[0];
};

/* ---------------- Update Password ---------------- */

const updatePassword = async (
  userId,
  passwordHash
) => {
  const query = `
    UPDATE users
    SET
      password_hash = $1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `;

  await pool.query(query, [
    passwordHash,
    userId,
  ]);
};

/* ---------------- Mark Token Used ---------------- */

const markResetTokenUsed = async (tokenId) => {
  const query = `
    UPDATE password_reset_tokens
    SET
      is_used = true
    WHERE id = $1
  `;

  await pool.query(query, [tokenId]);
};

module.exports = {
  findUserByEmail,
  updateLastLogin,
  createUserSession,
  saveResetToken,
  findResetToken,
  updatePassword,
  markResetTokenUsed,
};