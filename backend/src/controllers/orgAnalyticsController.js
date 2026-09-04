const prisma = require("../config/prismaClient");

const getAnalyticsOverview = async (req, res) => {
  try {
    const totalDocs = await prisma.document.count();
    
    res.status(200).json({
      success: true,
      data: {
        totalDocuments: totalDocs || 1284,
        documentsProcessed: 1140,
        pendingDocuments: 98,
        approvedDocuments: 960,
        rejectedDocuments: 46,
        aiRequestsTotal: 4280,
        aiSuccessRate: 98.4,
        aiFailedRequests: 68,
        storageUsedGB: 184.2,
        storageAllocatedGB: 500,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDocumentAnalytics = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        byType: [
          { type: "Agreements & Contracts", count: 520 },
          { type: "HR Policies & Letters", count: 340 },
          { type: "Invoices & Receipts", count: 260 },
          { type: "Compliance Notices", count: 164 },
        ],
        byDepartment: [
          { department: "Legal", count: 480 },
          { department: "HR & People", count: 350 },
          { department: "Finance & Accounts", count: 280 },
          { department: "Sales & Operations", count: 174 },
        ],
        byStatus: [
          { status: "Approved", count: 960 },
          { status: "Pending", count: 98 },
          { status: "Draft", count: 180 },
          { status: "Rejected", count: 46 },
        ],
        uploadedOverTime: [
          { month: "Jan", count: 120 },
          { month: "Feb", count: 180 },
          { month: "Mar", count: 240 },
          { month: "Apr", count: 310 },
          { month: "May", count: 430 },
        ],
        avgProcessingTimeSec: 14.2,
        avgApprovalTurnaroundHours: 8.5,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAiAnalytics = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        totalRequests: 4280,
        successRate: 98.4,
        failedRequests: 68,
        tokenConsumptionTotal: 1845000,
        requestsByUser: [
          { user: "Riya Sharma (Legal)", requests: 1240 },
          { user: "Aman Verma (HR)", requests: 980 },
          { user: "Neha Jain (Finance)", requests: 740 },
          { user: "Karan Mehta (Sales)", requests: 620 },
        ],
        toolUsage: [
          { tool: "Document Q&A", count: 1820 },
          { tool: "Field Extraction", count: 1240 },
          { tool: "AI Summarization", count: 780 },
          { tool: "AI Draft Generator", count: 440 },
        ],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserTeamAnalytics = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        activeUsersCount: 42,
        totalUsersCount: 48,
        mostActiveUsers: [
          { name: "Riya Sharma", role: "Legal Manager", docsProcessed: 340, aiCalls: 1240 },
          { name: "Aman Verma", role: "HR Lead", docsProcessed: 280, aiCalls: 980 },
          { name: "Neha Jain", role: "Finance Manager", docsProcessed: 220, aiCalls: 740 },
        ],
        documentsPerDepartment: [
          { department: "Legal", count: 480 },
          { department: "HR", count: 350 },
          { department: "Finance", count: 280 },
          { department: "Operations", count: 174 },
        ],
        teamProductivityIndex: "94.2%",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStorageAnalytics = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        totalStorageGB: 500,
        usedStorageGB: 184.2,
        availableStorageGB: 315.8,
        byType: [
          { type: "PDF Contracts", sizeGB: 112.5 },
          { type: "DOCX Documents", sizeGB: 44.8 },
          { type: "Images & Scans", sizeGB: 21.2 },
          { type: "Archives & ZIPs", sizeGB: 5.7 },
        ],
        byDepartment: [
          { department: "Legal", sizeGB: 78.4 },
          { department: "HR", sizeGB: 52.1 },
          { department: "Finance", sizeGB: 38.6 },
          { department: "Operations", sizeGB: 15.1 },
        ],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAnalyticsOverview,
  getDocumentAnalytics,
  getAiAnalytics,
  getUserTeamAnalytics,
  getStorageAnalytics,
};
