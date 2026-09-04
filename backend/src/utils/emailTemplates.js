const forgotPasswordTemplate = (name, resetLink) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Reset Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:30px;">
      <div style="max-width:600px; margin:auto; background:#ffffff; padding:30px; border-radius:8px;">
        <h2 style="color:#274690;">AI Document Automation</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>We received a request to reset your password.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}" style="display:inline-block; padding:12px 20px; background:#274690; color:white; text-decoration:none; border-radius:5px;">
          Reset Password
        </a>
        <p style="margin-top:20px;">This link will expire in <strong>15 minutes</strong>.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <hr />
        <p style="font-size:12px;color:gray;">© AI Document Automation Platform</p>
      </div>
    </body>
  </html>
  `;
};

const welcomeTemplate = (name, organisationName) => {
  return `
  <!DOCTYPE html>
  <html>
    <body style="font-family:Arial; background:#f5f5f5; padding:30px;">
      <div style="background:white; padding:30px; border-radius:8px;">
        <h2>Welcome ${name}</h2>
        <p>Your organisation <strong>${organisationName}</strong> has been created successfully.</p>
        <p>You can now login to the system.</p>
      </div>
    </body>
  </html>
  `;
};

const organisationAdminCredentialsTemplate = ({
  adminName,
  organisationName,
  branch,
  city,
  adminEmail,
  password,
  loginLink,
}) => {
  return `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 30px;">
      <div style="max-width: 640px; margin: auto; background: #ffffff; padding: 32px; border-radius: 10px; border: 1px solid #e2e8f0;">
        <h2 style="color: #274690; margin-top: 0;">Welcome to AI Document Automation Platform</h2>
        <p>Hello <strong>${adminName}</strong>,</p>
        <p>You have been assigned as Organisation Admin for <strong>${organisationName}</strong> (${branch || 'Headquarters'}).</p>
        <p>Below are your account login details:</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px;"><strong>Organisation Name:</strong> ${organisationName}</p>
          <p style="margin: 0 0 8px;"><strong>Branch / Office:</strong> ${branch || 'Headquarters'}</p>
          <p style="margin: 0 0 8px;"><strong>City / Location:</strong> ${city || 'Default'}</p>
          <p style="margin: 0 0 8px;"><strong>Login Email:</strong> ${adminEmail}</p>
          <p style="margin: 0;"><strong>Temporary Password:</strong> ${password}</p>
        </div>
        <p style="margin-top: 24px;">
          <a href="${loginLink}" style="display: inline-block; padding: 12px 20px; background: #274690; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Login to Super Admin Platform
          </a>
        </p>
        <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
          * Note: You will be asked to change your password after your first login.
        </p>
      </div>
    </body>
  </html>
  `;
};

const invitationTemplate = ({
  adminName,
  organisationName,
  adminEmail,
  invitationUrl,
  expiresAt,
}) => {
  return `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif; background: #f8fafc; padding: 30px; margin: 0;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #274690; margin: 0; font-size: 24px; font-weight: 800;">DocuCore AI SaaS</h2>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Enterprise Multi-Tenant SaaS Platform</p>
        </div>

        <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
          <h3 style="color: #0f172a; margin-top: 0; font-size: 18px;">You're Invited to Administer ${organisationName}</h3>
          <p style="color: #334155; font-size: 14px; line-height: 1.5; margin: 8px 0;">
            Hello <strong>${adminName}</strong> (${adminEmail}),
          </p>
          <p style="color: #334155; font-size: 14px; line-height: 1.5; margin: 8px 0;">
            Super Admin has invited you to set up your Organisation Admin account for <strong>${organisationName}</strong> on the DocuCore AI platform.
          </p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${invitationUrl}" style="display: inline-block; padding: 14px 32px; background: #274690; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(39, 70, 144, 0.35);">
            Accept Invitation & Activate Account →
          </a>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; color: #64748b; font-size: 12px;">
          <p style="margin: 4px 0;"><strong>Security Note:</strong> This invitation link expires in <strong>24 hours</strong> (${new Date(expiresAt).toUTCString()}).</p>
          <p style="margin: 4px 0;">For security, no password has been generated by the Super Admin. You will create your own password during activation.</p>
        </div>

        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} DocuCore AI Systems. If you did not expect this invitation, please ignore this email.
        </p>
      </div>
    </body>
  </html>
  `;
};

const teamMemberInvitationTemplate = ({
  name,
  role,
  department,
  email,
  password,
  invitationUrl,
  loginUrl,
}) => {
  return `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif; background: #f8fafc; padding: 30px; margin: 0;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #274690; margin: 0; font-size: 24px; font-weight: 800;">DocuCore AI SaaS</h2>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Team Access & Role Assignment Notification</p>
        </div>

        <div style="background: #eef4fb; padding: 20px; border-radius: 12px; border-left: 4px solid #274690; margin-bottom: 24px;">
          <h3 style="color: #1f3561; margin-top: 0; font-size: 18px;">You've Been Assigned as ${role || 'Team Member'}</h3>
          <p style="color: #334155; font-size: 14px; line-height: 1.5; margin: 8px 0;">
            Hello <strong>${name || 'Team Member'}</strong>,
          </p>
          <p style="color: #334155; font-size: 14px; line-height: 1.5; margin: 8px 0;">
            Your Organisation Admin has added you to the platform in the <strong>${department || 'Legal & Operations'}</strong> department with the role of <strong style="color: #274690;">${role}</strong>.
          </p>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #0f172a; font-size: 14px;">Your Account Credentials:</h4>
          <p style="margin: 6px 0; font-size: 13px; color: #334155;"><strong>Login Email:</strong> <span style="font-family: monospace; color: #274690;">${email}</span></p>
          <p style="margin: 6px 0; font-size: 13px; color: #334155;"><strong>Assigned Role:</strong> <span style="font-weight: bold; color: #059669;">${role}</span></p>
          ${password ? `<p style="margin: 6px 0; font-size: 13px; color: #334155;"><strong>Temporary Password:</strong> <span style="font-family: monospace; font-weight: bold; background: #e2e8f0; padding: 2px 6px; rounded: 4px;">${password}</span></p>` : ''}
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${invitationUrl || loginUrl}" style="display: inline-block; padding: 14px 28px; background: #274690; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(39, 70, 144, 0.3);">
            Set Your Password & Login →
          </a>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; color: #64748b; font-size: 12px;">
          <p style="margin: 4px 0;"><strong>Direct Login URL:</strong> <a href="${loginUrl}" style="color: #274690;">${loginUrl}</a></p>
          <p style="margin: 4px 0;">You can use this email and your password to access the ${role} workspace.</p>
        </div>

        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} DocuCore AI Systems.
        </p>
      </div>
    </body>
  </html>
  `;
};

const teamLeaderInvitationTemplate = ({
  teamLeadName,
  organisationName = "DocuCore AI Organisation",
  departmentName = "Operations",
  teamName = "Internal Operations",
  invitationUrl,
  loginUrl,
  managerName = "Department Manager",
  expiresAt,
}) => {
  const expiryFormatted = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "48 Hours";

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Team Leader Invitation - DocuCore AI</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; padding: 30px 15px; margin: 0;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 36px 32px; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);">
        
        <!-- Header / Logo -->
        <div style="text-align: center; margin-bottom: 28px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
          <div style="display: inline-block; background: #274690; color: #ffffff; font-weight: 900; font-size: 16px; padding: 8px 16px; border-radius: 12px; letter-spacing: 0.5px; margin-bottom: 10px;">
            DocuCore AI
          </div>
          <h1 style="color: #0f172a; margin: 8px 0 4px 0; font-size: 22px; font-weight: 800;">
            Team Leader Appointment & Account Activation
          </h1>
          <p style="color: #64748b; font-size: 13px; margin: 0;">
            ${organisationName} • ${departmentName} Department
          </p>
        </div>

        <!-- Greeting & Content -->
        <div style="margin-bottom: 24px;">
          <p style="font-size: 15px; color: #1e293b; margin: 0 0 12px 0;">
            Hello <strong>${teamLeadName}</strong>,
          </p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 16px 0;">
            You have been assigned as <strong>Team Leader</strong> for the <strong>"${teamName}"</strong> team in the <strong>${departmentName}</strong> department by <strong>${managerName}</strong>.
          </p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0;">
            To access your Team Lead workspace, review team documents, and oversee assigned workflows, please set your secure account password below:
          </p>
        </div>

        <!-- Role & Scope Details Card -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 28px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 40%;">Appointed Role:</td>
              <td style="padding: 6px 0; color: #274690; font-weight: 800;">Team Leader (Supervisor)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Department:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${departmentName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Assigned Team:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${teamName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Organisation:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${organisationName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Link Validity:</td>
              <td style="padding: 6px 0; color: #c96f4a; font-weight: 700;">Valid until ${expiryFormatted}</td>
            </tr>
          </table>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${invitationUrl}" style="display: inline-block; background: #274690; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 15px 36px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(39, 70, 144, 0.4); letter-spacing: 0.3px;">
            Set Password & Activate Account →
          </a>
        </div>

        <!-- Fallback Link -->
        <div style="background: #f1f5f9; border-radius: 12px; padding: 14px; margin-bottom: 24px; font-size: 11px; color: #64748b; word-break: break-all;">
          <p style="margin: 0 0 6px 0; font-weight: 700; color: #475569;">If the button above does not work, copy and paste this link in your browser:</p>
          <a href="${invitationUrl}" style="color: #274690; text-decoration: underline;">${invitationUrl}</a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; text-align: center; color: #94a3b8; font-size: 12px;">
          <p style="margin: 0 0 4px 0;">Questions? Contact your Department Manager (${managerName}) or system administrator.</p>
          <p style="margin: 0;">© ${new Date().getFullYear()} DocuCore AI Enterprise SaaS. All rights reserved.</p>
        </div>

      </div>
    </body>
  </html>
  `;
};

module.exports = {
  forgotPasswordTemplate,
  welcomeTemplate,
  organisationAdminCredentialsTemplate,
  invitationTemplate,
  teamMemberInvitationTemplate,
  teamLeaderInvitationTemplate,
};
