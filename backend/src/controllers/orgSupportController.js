const prisma = require("../config/prismaClient");

// ===============================================
// SUPPORT MODULE FOR ORG ADMIN
// Tickets, Conversation Thread, Help Center
// Statuses: Open, In Progress, Waiting for Support, Resolved, Closed
// Priority: Low, Medium, High, Critical
// ===============================================

const getSupportDashboardMetrics = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        openTickets: 3,
        pendingTickets: 1,
        resolvedTickets: 18,
        criticalTickets: 0,
        avgResponseTimeHours: 1.8,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTickets = async (req, res) => {
  try {
    const { status, priority } = req.query;

    res.status(200).json({
      success: true,
      data: [
        {
          id: "tck-101",
          ticketCode: "TICKET-84920",
          subject: "Custom S3 Storage Bucket Connection Timeout",
          category: "Integrations & Storage",
          priority: "HIGH",
          status: "IN_PROGRESS",
          description: "When connecting our organization S3 bucket in ap-south-1, the verification test fails with timeout error.",
          createdAt: "2026-08-12 11:30",
          lastReplyAt: "2026-08-12 14:20",
        },
        {
          id: "tck-102",
          ticketCode: "TICKET-84915",
          subject: "Request AI Quota Increase for Q3 Contract Processing",
          category: "AI Quota & Limits",
          priority: "MEDIUM",
          status: "WAITING_FOR_SUPPORT",
          description: "We anticipate processing over 8,000 vendor agreements this month and need token quota expanded.",
          createdAt: "2026-08-10 09:15",
          lastReplyAt: "2026-08-10 16:45",
        },
        {
          id: "tck-103",
          ticketCode: "TICKET-84880",
          subject: "SSO Metadata XML Entity ID Verification Issue",
          category: "Authentication & SSO",
          priority: "LOW",
          status: "RESOLVED",
          description: "Azure AD SSO login redirect URL configured and verified.",
          createdAt: "2026-08-04 15:00",
          lastReplyAt: "2026-08-05 10:12",
        },
      ],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTicket = async (req, res) => {
  try {
    const { subject, category, priority = "MEDIUM", description, attachments } = req.body;

    const newTicketCode = `TICKET-${Math.floor(10000 + Math.random() * 90000)}`;

    res.status(201).json({
      success: true,
      message: `Support ticket ${newTicketCode} created successfully.`,
      data: {
        id: `tck-${Date.now()}`,
        ticketCode: newTicketCode,
        subject,
        category,
        priority,
        status: "OPEN",
        description,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTicketDetails = async (req, res) => {
  try {
    const { id } = req.params;

    res.status(200).json({
      success: true,
      data: {
        id,
        ticketCode: "TICKET-84920",
        subject: "Custom S3 Storage Bucket Connection Timeout",
        category: "Integrations & Storage",
        priority: "HIGH",
        status: "IN_PROGRESS",
        description: "When connecting our organization S3 bucket in ap-south-1, the verification test fails with timeout error.",
        createdAt: "2026-08-12 11:30",
        replies: [
          {
            id: "r-1",
            senderName: "Shikha Gour",
            senderRole: "Organisation Admin",
            message: "We've verified our AWS IAM policy has s3:PutObject and s3:GetObject permissions. Please check network routing.",
            createdAt: "2026-08-12 11:30",
          },
          {
            id: "r-2",
            senderName: "Platform Engineer (DocuCore Support)",
            senderRole: "Super Admin Support",
            message: "Hello Shikha! Our team is investigating the regional gateway endpoint. We will update you shortly.",
            createdAt: "2026-08-12 14:20",
          },
        ],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addTicketReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, attachments } = req.body;

    res.status(200).json({
      success: true,
      message: "Reply added to ticket.",
      data: {
        id: `r-${Date.now()}`,
        ticketId: id,
        senderName: "Organisation Admin",
        senderRole: "Organisation Admin",
        message,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getHelpCenterGuides = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        faqs: [
          { question: "How do I configure AI limits for my organisation?", answer: "Go to Settings -> AI Settings tab. Select default AI model and specify token quota limits." },
          { question: "Can Organisation Admins add custom AI provider keys?", answer: "No. Provider API keys are managed at the platform level by Super Admin. Org Admins select from approved models." },
          { question: "How do I set up webhooks for approval events?", answer: "Navigate to Integrations -> Webhooks tab. Click 'Create Webhook' and select 'approval.approved' event." },
        ],
        guides: [
          { title: "AI Document Builder Quickstart", category: "Builder", readTime: "5 min", url: "#" },
          { title: "Managing Roles & Permissions", category: "Team", readTime: "4 min", url: "#" },
          { title: "Connecting S3 & GDrive Storage", category: "Integrations", readTime: "6 min", url: "#" },
        ],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSupportDashboardMetrics,
  getTickets,
  createTicket,
  getTicketDetails,
  addTicketReply,
  getHelpCenterGuides,
};
