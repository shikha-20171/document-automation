const PaymentProviderFactory = require("../services/payment/paymentProviderFactory");

const getAuthContext = (req) => ({
  organisationId: req.user?.organisation_id || req.user?.organization_id || 1,
  userId: req.user?.id || 1,
});

const getPaymentProviders = async (req, res, next) => {
  try {
    const providers = PaymentProviderFactory.getSupportedProviders();
    res.json({ success: true, data: providers });
  } catch (err) {
    next(err);
  }
};

const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const adapter = PaymentProviderFactory.getAdapter("RAZORPAY");
    const rawBody = JSON.stringify(req.body);

    const isValid = adapter.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid Razorpay webhook signature." });
    }

    const { organisationId = 1, paymentId, orderId, amount, planCode } = req.body;
    const result = await adapter.handlePaymentSuccess(organisationId, { paymentId, orderId, amount, planCode });

    res.json({ success: true, message: "Payment verified and subscription updated.", data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPaymentProviders,
  handleRazorpayWebhook,
};
