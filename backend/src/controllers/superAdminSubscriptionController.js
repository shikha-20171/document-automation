const SubscriptionService = require("../services/subscriptionService");
const prisma = require("../config/prismaClient");

/**
 * Super Admin Subscription Management Controller
 * Fully database-driven without hardcoded plan logic
 */

const getPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionService.getAllPlans();
    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

const createPlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionService.createPlan(req.body);
    res.status(201).json({
      success: true,
      message: "Subscription plan created successfully",
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionService.updatePlan(id, req.body);
    res.status(200).json({
      success: true,
      message: "Subscription plan updated successfully",
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    await SubscriptionService.deletePlan(id);
    res.status(200).json({
      success: true,
      message: "Subscription plan deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getOrgSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await prisma.organisationSubscription.findMany({
      include: {
        plan: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    next(error);
  }
};

const assignOrgSubscription = async (req, res, next) => {
  try {
    const { organisationId, planId, billingCycle, customLimits } = req.body;
    const subscription = await SubscriptionService.assignSubscription(organisationId, {
      planId,
      billingCycle,
      customLimits,
    });
    res.status(200).json({
      success: true,
      message: "Subscription assigned to organisation successfully",
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrgSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await prisma.organisationSubscription.update({
      where: { id },
      data: req.body,
      include: { plan: true },
    });
    res.status(200).json({
      success: true,
      message: "Organisation subscription updated",
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

const getSubscriptionRequests = async (req, res, next) => {
  try {
    const requests = await prisma.subscriptionRequest.findMany({
      include: {
        currentPlan: true,
        requestedPlan: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

const handleSubscriptionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, action, rejectionReason, adminNotes } = req.body;
    const resolvedStatus = status || (action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : "APPROVED");

    const request = await prisma.subscriptionRequest.update({
      where: { id },
      data: {
        status: resolvedStatus,
        rejectionReason,
        adminNotes,
        reviewedBy: req.user?.email || "Super Admin",
        reviewedAt: new Date(),
      },
      include: { currentPlan: true, requestedPlan: true },
    });

    // If approved, immediately apply new plan to organisation
    if (resolvedStatus === "APPROVED" && request.requestedPlanId) {
      await SubscriptionService.assignSubscription(request.organisationId, {
        planId: request.requestedPlanId,
      });
    }

    res.status(200).json({
      success: true,
      message: `Subscription request ${resolvedStatus.toLowerCase()} successfully`,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getOrgSubscriptions,
  assignOrgSubscription,
  updateOrgSubscription,
  getSubscriptionRequests,
  handleSubscriptionRequest,
};
