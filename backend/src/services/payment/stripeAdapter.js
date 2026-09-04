const crypto = require("crypto");
const prisma = require("../../config/prismaClient");

class StripeAdapter {
  constructor(config = {}) {
    this.secretKey = config.secretKey || process.env.STRIPE_SECRET_KEY || null;
    this.webhookSecret = config.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || "whsec_stripe_dev";
  }

  isConfigured() {
    return Boolean(this.secretKey);
  }

  getStatus() {
    return this.isConfigured() ? "CONFIGURED" : "NOT_CONFIGURED";
  }

  verifyWebhookSignature(rawBody, signature) {
    if (!signature) return false;
    // Basic verification simulation
    return typeof signature === "string" && signature.length > 10;
  }

  async handlePaymentSuccess(organisationId, { paymentIntentId, amount, planCode }) {
    const tx = await prisma.paymentTransaction.create({
      data: {
        organisationId,
        provider: "STRIPE",
        transactionRef: paymentIntentId || `pi_${Date.now()}`,
        amount: Number(amount) || 499,
        currency: "USD",
        status: "SUCCESS",
        planCode: planCode || "ENTERPRISE",
      },
    });

    return tx;
  }
}

module.exports = StripeAdapter;
