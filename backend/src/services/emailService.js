const transporter = require("../config/mail");
const {
  organisationAdminCredentialsTemplate,
  forgotPasswordTemplate,
  invitationTemplate,
} = require("../utils/emailTemplates");

const sendAdminCredentialsEmail = async ({
  adminName,
  organisationName,
  branch,
  city,
  adminEmail,
  password,
}) => {
  const cleanEmail = (adminEmail || "").trim().toLowerCase();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const loginLink = `${frontendUrl}/auth/login`;

  if (!cleanEmail) {
    console.error("[EmailService] Recipient email address is missing!");
    return { success: false, error: "Recipient email address is required." };
  }

  console.log("==========================================================");
  console.log(`[EmailService] PREPARING DYNAMIC GMAIL DISPATCH`);
  console.log(`[EmailService] Sender (FROM): ${process.env.EMAIL_USER}`);
  console.log(`[EmailService] Recipient (TO): ${cleanEmail}`);
  console.log(`[EmailService] Organization: ${organisationName}`);
  console.log(`[EmailService] Admin Name: ${adminName}`);
  console.log("==========================================================");

  const html = organisationAdminCredentialsTemplate({
    adminName: adminName || "Organization Admin",
    organisationName: organisationName || "Organization",
    branch: branch || `${city || "HQ"} Branch`,
    city: city || "Headquarters",
    adminEmail: cleanEmail,
    password: password || "Password Set",
    loginLink,
  });

  const mailOptions = {
    from: `DocuCore AI <${process.env.EMAIL_USER || "gourshikha2001@gmail.com"}>`,
    to: cleanEmail,
    subject: `Welcome to DocuCore AI - Credentials for ${organisationName || "your Organization"}`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService]  GMAIL DISPATCH SUCCESSFUL to ${cleanEmail}!`);
    console.log(`[EmailService] Message ID: ${info.messageId || JSON.stringify(info)}`);
    console.log("==========================================================");
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService]  GMAIL DISPATCH FAILED for ${cleanEmail}:`, error.message);
    console.log("==========================================================");
    return { success: false, error: error.message };
  }
};

const sendForgotPasswordEmail = async ({ email, name, resetLink }) => {
  const cleanEmail = (email || "").trim().toLowerCase();
  const html = forgotPasswordTemplate(name, resetLink);

  console.log(`[EmailService]  Sending Forgot Password Email to: ${cleanEmail}`);

  const mailOptions = {
    from: `DocuCore AI <${process.env.EMAIL_USER || "gourshikha2001@gmail.com"}>`,
    to: cleanEmail,
    subject: "Reset Password - DocuCore AI Platform",
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService]  Forgot password email sent to ${cleanEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService]  Failed to send forgot password email to ${cleanEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

const sendInvitationEmail = async ({
  adminName,
  organisationName,
  adminEmail,
  invitationUrl,
  expiresAt,
}) => {
  const cleanEmail = (adminEmail || "").trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: "Recipient email address is required." };
  }

  const html = invitationTemplate({
    adminName: adminName || "Organisation Admin",
    organisationName: organisationName || "Organisation",
    adminEmail: cleanEmail,
    invitationUrl,
    expiresAt,
  });

  const mailOptions = {
    from: `DocuCore AI <${process.env.EMAIL_USER || "gourshikha2001@gmail.com"}>`,
    to: cleanEmail,
    subject: `You're invited to join ${organisationName || "DocuCore AI"}`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService]  INVITATION EMAIL DISPATCH SUCCESSFUL to ${cleanEmail}! Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService]  INVITATION EMAIL DISPATCH FAILED for ${cleanEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

const sendTeamMemberInvitationEmail = async ({
  name,
  role,
  department,
  email,
  password,
  invitationUrl,
}) => {
  const cleanEmail = (email || "").trim().toLowerCase();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const loginUrl = `${frontendUrl}/auth/login`;

  if (!cleanEmail) {
    return { success: false, error: "Recipient email address is required." };
  }

  const { teamMemberInvitationTemplate } = require("../utils/emailTemplates");

  const html = teamMemberInvitationTemplate({
    name: name || email.split("@")[0],
    role: role || "Department Manager",
    department: department || "Legal & Operations",
    email: cleanEmail,
    password,
    invitationUrl: invitationUrl || `${frontendUrl}/accept-invitation/${Date.now()}`,
    loginUrl,
  });

  const mailOptions = {
    from: `DocuCore AI <${process.env.EMAIL_USER || "gourshikha2001@gmail.com"}>`,
    to: cleanEmail,
    replyTo: process.env.EMAIL_USER || "gourshikha2001@gmail.com",
    subject: `DocuCore AI - You have been added as ${role || "Department Manager"}`,
    text: `Hello ${name || cleanEmail},\n\nYou have been added as ${role || "Staff Member"} in the ${department || "Operations"} Department on DocuCore AI.\n\nTemporary Password: ${password || "Please set upon login"}\nAccept Invitation: ${invitationUrl || loginUrl}\nLogin Link: ${loginUrl}\n\nRegards,\nDocuCore AI Team`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] TEAM MEMBER INVITATION SENT to ${cleanEmail} (${role})! Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] TEAM MEMBER INVITATION FAILED for ${cleanEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

const sendTeamLeaderInvitationEmail = async ({
  teamLeadName,
  organisationName = "DocuCore AI Organisation",
  departmentName = "Operations",
  teamName = "Internal Operations",
  email,
  invitationUrl,
  managerName = "Department Manager",
  expiresAt,
}) => {
  const cleanEmail = (email || "").trim().toLowerCase();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const loginUrl = `${frontendUrl}/auth/login`;

  if (!cleanEmail) {
    console.error("[EmailService] Team Leader email address is required.");
    return { success: false, error: "Recipient email address is required." };
  }

  const { teamLeaderInvitationTemplate } = require("../utils/emailTemplates");

  const html = teamLeaderInvitationTemplate({
    teamLeadName: teamLeadName || cleanEmail.split("@")[0],
    organisationName,
    departmentName,
    teamName,
    invitationUrl,
    loginUrl,
    managerName,
    expiresAt,
  });

  const mailOptions = {
    from: `DocuCore AI <${process.env.EMAIL_USER || "gourshikha2001@gmail.com"}>`,
    to: cleanEmail,
    replyTo: process.env.EMAIL_USER || "gourshikha2001@gmail.com",
    subject: `You're invited as Team Leader for ${teamName} (${organisationName}) - Set Password`,
    text: `Hello ${teamLeadName || cleanEmail},\n\nYou have been appointed as Team Leader for "${teamName}" in ${departmentName} (${organisationName}) by ${managerName}.\n\nClick the link below to set your password and activate your account:\n${invitationUrl}\n\nThis invitation link is valid for 48 hours.\n\nRegards,\nDocuCore AI Platform`,
    html,
  };

  console.log("==========================================================");
  console.log(`[EmailService] DISPATCHING TEAM LEADER GMAIL INVITATION`);
  console.log(`[EmailService] TO: ${cleanEmail}`);
  console.log(`[EmailService] Team Lead: ${teamLeadName}`);
  console.log(`[EmailService] Team: ${teamName} | Dept: ${departmentName}`);
  console.log(`[EmailService] Invitation URL: ${invitationUrl}`);
  console.log("==========================================================");

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] TEAM LEADER INVITATION DISPATCH SUCCESSFUL to ${cleanEmail}! Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`[EmailService] TEAM LEADER INVITATION DISPATCH FAILED for ${cleanEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

const sendTaskAssignmentEmail = async ({
  employeeEmail,
  employeeName,
  taskTitle,
  description,
  priority = "NORMAL",
  dueDate = "2026-08-25",
  assignedBy = "Team Leader",
  teamName = "Financial Operations",
}) => {
  const cleanEmail = (employeeEmail || "").trim().toLowerCase();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const loginUrl = `${frontendUrl}/auth/login`;

  if (!cleanEmail) {
    return { success: false, error: "Employee email is required." };
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="background: linear-gradient(135deg, #274690 0%, #1f3561 100%); padding: 24px 32px; text-align: left;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">DocuCore AI • Task Assignment</h1>
          <p style="color: #c96f4a; margin: 4px 0 0 0; font-size: 13px; font-weight: 600;">${teamName} • Operational Workflow</p>
        </div>
        
        <div style="padding: 32px;">
          <p style="font-size: 15px; margin: 0 0 16px 0;">Hello <strong>${employeeName || "Team Associate"}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 0 0 20px 0;">
            A new operational task has been assigned to you by <strong>${assignedBy}</strong>.
          </p>

          <div style="background: #f1f5f9; border-left: 4px solid #274690; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 800; color: #1e293b;">${taskTitle}</p>
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #64748b;">${description || "Please review and complete as scheduled."}</p>
            <div style="font-size: 12px; color: #334155; display: flex; gap: 16px;">
              <span><strong>Priority:</strong> ${priority}</span> &nbsp;|&nbsp;
              <span><strong>Due Date:</strong> ${dueDate}</span>
            </div>
          </div>

          <p style="font-size: 13px; color: #64748b; margin-bottom: 24px;">
            You can log into your DocuCore AI workspace using the button below to access the documents and update task status:
          </p>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${loginUrl}" style="background: #274690; color: #ffffff; padding: 12px 28px; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 10px; display: inline-block; box-shadow: 0 2px 4px rgba(39, 70, 144, 0.3);">
              Log In & View Task →
            </a>
          </div>

          <p style="font-size: 11px; color: #94a3b8; margin: 24px 0 0 0; text-align: center;">
            Direct link: <a href="${loginUrl}" style="color: #274690;">${loginUrl}</a>
          </p>
        </div>
        
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
          © 2026 DocuCore AI • Enterprise Document Automation Platform
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `DocuCore AI <${process.env.EMAIL_USER || "gourshikha2001@gmail.com"}>`,
    to: cleanEmail,
    subject: `New Task Assigned: ${taskTitle} [Due: ${dueDate}]`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Task Assignment Email sent to ${cleanEmail}! Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Failed to send task assignment email to ${cleanEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendAdminCredentialsEmail,
  sendForgotPasswordEmail,
  sendInvitationEmail,
  sendTeamMemberInvitationEmail,
  sendTeamLeaderInvitationEmail,
  sendTaskAssignmentEmail,
};
