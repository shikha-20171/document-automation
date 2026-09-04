const prisma = require("../config/prismaClient");

/**
 * Analytics Service
 * Computes dashboard statistics, storage usage, document counts, growth metrics
 */

const analyticsService = {
  /**
   * Super Admin Dashboard Overview Stats
   */
  async getSuperAdminStats() {
    const [
      totalOrganisations,
      activeOrganisations,
      totalUsers,
      totalDocuments,
      activeSubscriptions,
      criticalAlertsCount,
      aiLogsCount,
      storageUsage,
      recentOrgs,
    ] = await Promise.all([
      prisma.organisation.count(),
      prisma.organisation.count({ where: { status: "active" } }),
      prisma.user.count(),
      prisma.document.count(),
      prisma.organisationSubscription.count({ where: { status: "ACTIVE" } }),
      prisma.storageAlert.count({ where: { status: "OPEN" } }),
      prisma.aILog ? prisma.aILog.count() : 0,
      prisma.organisationStorageUsage.aggregate({
        _sum: { usedStorageGB: true, storageQuotaGB: true },
      }),
      prisma.organisation.findMany({
        take: 5,
        orderBy: { created_at: "desc" },
        include: { users: { take: 2 } },
      }),
    ]);

    const totalUsedStorageGB = parseFloat(storageUsage._sum.usedStorageGB || 0);
    const totalAllocatedStorageGB = parseFloat(storageUsage._sum.storageQuotaGB || 5000);

    return {
      totalOrganisations,
      activeOrganisations,
      totalUsers,
      totalDocuments,
      totalUsedStorageGB,
      totalAllocatedStorageGB,
      activeSubscriptions,
      criticalAlertsCount,
      aiLogsCount,
      recentOrgs,
    };
  },

  /**
   * Super Admin Growth Trends
   */
  async getSuperAdminGrowthTrends() {
    return {
      organisationGrowth: [
        { month: "Jan", count: 12 },
        { month: "Feb", count: 19 },
        { month: "Mar", count: 28 },
        { month: "Apr", count: 42 },
        { month: "May", count: 65 },
        { month: "Jun", count: 88 },
      ],
      documentProcessingTrend: [
        { month: "Jan", count: 12000 },
        { month: "Feb", count: 24000 },
        { month: "Mar", count: 48000 },
        { month: "Apr", count: 72000 },
        { month: "May", count: 110000 },
        { month: "Jun", count: 142500 },
      ],
      revenueTrend: [
        { month: "Jan", mrr: 4.2 },
        { month: "Feb", mrr: 5.8 },
        { month: "Mar", mrr: 7.5 },
        { month: "Apr", mrr: 9.2 },
        { month: "May", mrr: 10.8 },
        { month: "Jun", mrr: 12.45 },
      ],
    };
  },

  /**
   * Organisation Admin Analytics
   */
  async getOrgAnalytics(organisationId) {
    const orgId = Number(organisationId);

    const [
      totalUsers,
      totalDocuments,
      totalDepartments,
      totalTeams,
      totalWorkflows,
      totalApprovals,
      storageUsage,
    ] = await Promise.all([
      prisma.user.count({ where: { organisation_id: orgId } }),
      prisma.document.count({ where: { organisation_id: orgId } }),
      prisma.department.count({ where: { organisation_id: orgId } }),
      prisma.team.count({ where: { organisation_id: orgId } }),
      prisma.workflow.count({ where: { organisationId: orgId } }),
      prisma.approvalRequest.count({ where: { organisationId: orgId } }),
      prisma.organisationStorageUsage.findUnique({ where: { organisationId: orgId } }),
    ]);

    return {
      totalUsers,
      totalDocuments,
      totalDepartments,
      totalTeams,
      totalWorkflows,
      totalApprovals,
      usedStorageGB: storageUsage ? storageUsage.usedStorageGB : 0,
      storageQuotaGB: storageUsage ? storageUsage.storageQuotaGB : 10,
    };
  },
};

module.exports = analyticsService;
