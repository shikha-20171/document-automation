const prisma = require("../config/prismaClient");

/**
 * Subscription Repository
 * Handles SubscriptionPlan, OrganisationSubscription, SubscriptionRequest, SubscriptionHistory
 */

/* Subscription Plans */
const getPlans = async ({ status = "ACTIVE" } = {}) => {
  return await prisma.subscriptionPlan.findMany({
    where: status ? { status } : {},
    orderBy: { priceMonthly: "asc" },
  });
};

const getPlanById = async (id) => {
  return await prisma.subscriptionPlan.findUnique({
    where: { id: String(id) },
  });
};

const createPlan = async (planData) => {
  return await prisma.subscriptionPlan.create({
    data: planData,
  });
};

const updatePlan = async (id, updateData) => {
  return await prisma.subscriptionPlan.update({
    where: { id: String(id) },
    data: updateData,
  });
};

/* Organisation Subscriptions */
const getOrgSubscription = async (organisationId) => {
  return await prisma.organisationSubscription.findUnique({
    where: { organisationId: Number(organisationId) },
    include: { plan: true },
  });
};

const getAllSubscriptions = async () => {
  return await prisma.organisationSubscription.findMany({
    include: {
      organisation: true,
      plan: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

const createOrUpdateSubscription = async (organisationId, subscriptionData) => {
  return await prisma.organisationSubscription.upsert({
    where: { organisationId: Number(organisationId) },
    update: subscriptionData,
    create: {
      organisationId: Number(organisationId),
      planId: String(subscriptionData.planId),
      billingCycle: subscriptionData.billingCycle || "MONTHLY",
      status: subscriptionData.status || "ACTIVE",
      currentPeriodStart: subscriptionData.currentPeriodStart || new Date(),
      currentPeriodEnd: subscriptionData.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      autoRenew: subscriptionData.autoRenew ?? true,
    },
  });
};

/* Upgrade / Downgrade Requests */
const getSubscriptionRequests = async ({ status } = {}) => {
  const where = {};
  if (status) where.status = status;

  return await prisma.subscriptionRequest.findMany({
    where,
    orderBy: { requestedAt: "desc" },
    include: {
      organisation: true,
      currentPlan: true,
      requestedPlan: true,
    },
  });
};

const createSubscriptionRequest = async (requestData) => {
  return await prisma.subscriptionRequest.create({
    data: {
      organisationId: Number(requestData.organisationId),
      currentPlanId: requestData.currentPlanId ? String(requestData.currentPlanId) : null,
      requestedPlanId: String(requestData.requestedPlanId),
      requestType: requestData.requestType || "UPGRADE",
      status: requestData.status || "PENDING",
      requestedBy: requestData.requestedBy || null,
      notes: requestData.notes || null,
    },
  });
};

const updateSubscriptionRequestStatus = async (id, status, reviewedBy = null) => {
  return await prisma.subscriptionRequest.update({
    where: { id: String(id) },
    data: {
      status,
      reviewedBy,
      reviewedAt: new Date(),
    },
  });
};

module.exports = {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  getOrgSubscription,
  getAllSubscriptions,
  createOrUpdateSubscription,
  getSubscriptionRequests,
  createSubscriptionRequest,
  updateSubscriptionRequestStatus,
};
