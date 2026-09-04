const crypto = require("crypto");
const prisma = require("../../config/prismaClient");

class RazorpayAdapter {
  constructor(config = {}) {
    this.keyId = config.keyId || process.env.RAZORPAY_KEY_ID || null;
    this.keySecret = config.keySecret || process.env.RAZORPAY_KEY_SECRET || null;
    this.webhookSecret = config.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || "razorpay_webhook_secret_dev";
  }

  isConfigured() {
    return Boolean(this.keyId && this.keySecret);
  }

  getStatus() {
    return this.isConfigured() ? "CONFIGURED" : "NOT_CONFIGURED";
  }

  verifyWebhookSignature(rawBody, signature) {
    if (!signature) return false;
    const expected = crypto.createHmac("sha256", this.webhookSecret).update(rawBody).digest("hex");
    return expected === signature;
  }

  async handlePaymentSuccess(organisationId, { paymentId, orderId, amount, planCode }) {
    // Record payment transaction
    const tx = await prisma.paymentTransaction.create({
      data: {
        organisationId,
        provider: "RAZORPAY",
        transactionRef: paymentId || `pay_${Date.now()}`,
        amount: Number(amount) || 45000,
        currency: "INR",
        status: "SUCCESS",
        planCode: planCode || "ENTERPRISE",
      },
    });

    // Update organisation subscription tier
    try {
      const targetPlan = await prisma.subscriptionPlan.findFirst({
        where: { planCode: planCode || "ENTERPRISE" },
      });

      if (targetPlan) {
        await prisma.organisationSubscription.updateMany({
          where: { organisationId: String(organisationId) },
          data: {
            planId: targetPlan.id,
            status: "ACTIVE",
          },
        });
      }
    } catch {}

    return tx;
  }
}

module.exports = RazorpayAdapter;
