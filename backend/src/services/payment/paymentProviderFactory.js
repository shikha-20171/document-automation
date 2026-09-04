const RazorpayAdapter = require("./razorpayAdapter");
const StripeAdapter = require("./stripeAdapter");

class PaymentProviderFactory {
  static getAdapter(providerName = "RAZORPAY") {
    const p = providerName.toUpperCase();
    if (p === "RAZORPAY") return new RazorpayAdapter();
    if (p === "STRIPE") return new StripeAdapter();
    throw new Error(`Unsupported payment provider: ${providerName}`);
  }

  static getSupportedProviders() {
    const rz = new RazorpayAdapter();
    const st = new StripeAdapter();

    return [
      { code: "MANUAL", name: "Manual Offline Invoicing", type: "INTERNAL_ENGINE", status: "CONFIGURED" },
      { code: "RAZORPAY", name: "Razorpay Payment Gateway", type: "REAL_PROVIDER", status: rz.getStatus() },
      { code: "STRIPE", name: "Stripe Subscriptions", type: "REAL_PROVIDER", status: st.getStatus() },
    ];
  }
}

module.exports = PaymentProviderFactory;
