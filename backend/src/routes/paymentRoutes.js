const express = require("express");
const router = express.Router();
const {
  getPaymentProviders,
  handleRazorpayWebhook,
} = require("../controllers/paymentController");

router.get("/providers", getPaymentProviders);
router.post("/webhooks/razorpay", handleRazorpayWebhook);

module.exports = router;
