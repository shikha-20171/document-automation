const prisma = require("../config/prismaClient");
const PaymentProviderFactory = require("../services/payment/paymentProviderFactory");

const getBillingOverview = async (req, res, next) => {
  try {
    const transactions = await prisma.paymentTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const totalRevenue = transactions.reduce((acc, t) => acc + (t.status === "SUCCESS" ? t.amount : 0), 0);
    const activeSubscriptions = await prisma.organisationSubscription.count({
      where: { status: "ACTIVE" },
    });

    const failedPaymentsCount = transactions.filter((t) => t.status === "FAILED").length;
    const providers = PaymentProviderFactory.getSupportedProviders();

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: `₹${totalRevenue.toLocaleString()}`,
        monthlyRecurringRevenue: `₹${(totalRevenue / 12).toFixed(0)}`,
        activeSubscriptions,
        pendingInvoices: 0,
        failedPaymentsCount,
        paymentProviders: providers,
        totalTransactionsCount: transactions.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getInvoices = async (req, res, next) => {
  try {
    const txs = await prisma.paymentTransaction.findMany({
      orderBy: { createdAt: "desc" },
    });

    const invoices = txs.map((t, idx) => ({
      id: t.id,
      invoiceNumber: `INV-2026-${String(idx + 101).padStart(4, "0")}`,
      organisationId: t.organisationId,
      amount: `₹${t.amount.toLocaleString()}`,
      status: t.status === "SUCCESS" ? "PAID" : t.status,
      provider: t.provider,
      invoiceDate: t.createdAt.toISOString().split("T")[0],
    }));

    res.status(200).json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    next(error);
  }
};

const createInvoice = async (req, res, next) => {
  try {
    const { organisation_id, amount, due_date } = req.body;
    res.status(201).json({
      success: true,
      message: "Invoice created successfully.",
      data: {
        id: `inv_${Date.now()}`,
        invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        organisationId: organisation_id,
        amount: Number(amount) || 0,
        dueDate: due_date || new Date().toISOString(),
        status: "PENDING",
      },
    });
  } catch (error) {
    next(error);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const transactions = await prisma.paymentTransaction.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

const getRefunds = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
};

const updateRefund = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: "Refund updated" });
  } catch (error) {
    next(error);
  }
};

const getGateways = async (req, res, next) => {
  try {
    const providers = PaymentProviderFactory.getSupportedProviders();
    res.status(200).json({ success: true, data: providers });
  } catch (error) {
    next(error);
  }
};

const updateGateway = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: "Gateway updated", data: req.body });
  } catch (error) {
    next(error);
  }
};

const getBillingSettings = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        currency: "INR",
        taxRatePct: 18,
        invoiceGraceDays: 7,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateBillingSettings = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: "Billing settings saved successfully.",
      data: req.body,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBillingOverview,
  getInvoices,
  createInvoice,
  getTransactions,
  getRefunds,
  updateRefund,
  getGateways,
  updateGateway,
  getBillingSettings,
  updateBillingSettings,
};
