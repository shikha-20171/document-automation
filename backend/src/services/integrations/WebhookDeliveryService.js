const axios = require("axios");
const prisma = require("../../config/prismaClient");
const { generateHmacSignature } = require("../../utils/cryptoUtils");

/**
 * Real Webhook Delivery Service with HMAC-SHA256 Signatures
 */
class WebhookDeliveryService {
  /**
   * Dispatch an event to all active webhooks subscribed to the event in an organisation
   */
  static async triggerEvent(organisationId, event, payload = {}) {
    if (!organisationId || !event) return [];

    try {
      const webhooks = await prisma.organisationWebhook.findMany({
        where: {
          organisationId: Number(organisationId),
          status: "ACTIVE",
          events: { has: event },
        },
      });

      const results = [];
      for (const wh of webhooks) {
        const res = await this.deliverWebhook(wh, event, payload);
        results.push(res);
      }
      return results;
    } catch (err) {
      console.warn("[WebhookDelivery] Trigger event error:", err.message);
      return [];
    }
  }

  /**
   * Deliver a single webhook payload and record delivery log
   */
  static async deliverWebhook(webhook, event, payload) {
    const startTime = Date.now();
    const eventPayload = {
      event,
      timestamp: new Date().toISOString(),
      organisationId: webhook.organisationId,
      webhookId: webhook.id,
      data: payload,
    };

    const signature = generateHmacSignature(eventPayload, webhook.secretHash);

    // Initial delivery record in DB
    let deliveryRecord = null;
    try {
      deliveryRecord = await prisma.webhookDelivery.create({
        data: {
          organisationId: webhook.organisationId,
          webhookId: webhook.id,
          event,
          status: "PENDING",
          payload: eventPayload,
          signature,
        },
      });
    } catch (e) {
      // Ignore initial log error
    }

    try {
      const response = await axios.post(webhook.url, eventPayload, {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "DocuCore-Webhook-Delivery-Engine/1.0",
          "X-DocuCore-Event": event,
          "X-DocuCore-Signature": signature,
          "X-DocuCore-Delivery": deliveryRecord?.id || "delivery_" + Date.now(),
        },
        timeout: 10000,
        validateStatus: () => true,
      });

      const isSuccess = response.status >= 200 && response.status < 300;
      const responseBody = typeof response.data === "string" ? response.data : JSON.stringify(response.data);

      if (deliveryRecord) {
        await prisma.webhookDelivery.update({
          where: { id: deliveryRecord.id },
          data: {
            status: isSuccess ? "SUCCESS" : "FAILED",
            responseStatus: response.status,
            responseBody: responseBody ? responseBody.slice(0, 2000) : null,
            deliveredAt: new Date(),
          },
        });
      }

      return {
        deliveryId: deliveryRecord?.id,
        webhookId: webhook.id,
        status: isSuccess ? "SUCCESS" : "FAILED",
        httpStatus: response.status,
        latencyMs: Date.now() - startTime,
      };
    } catch (err) {
      if (deliveryRecord) {
        await prisma.webhookDelivery.update({
          where: { id: deliveryRecord.id },
          data: {
            status: "FAILED",
            errorMessage: err.message,
            deliveredAt: new Date(),
          },
        });
      }

      return {
        deliveryId: deliveryRecord?.id,
        webhookId: webhook.id,
        status: "FAILED",
        error: err.message,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Retry a failed webhook delivery
   */
  static async retryDelivery(deliveryId, organisationId) {
    const delivery = await prisma.webhookDelivery.findFirst({
      where: { id: deliveryId, organisationId: Number(organisationId) },
      include: { webhook: true },
    });

    if (!delivery || !delivery.webhook) {
      throw new Error("Webhook delivery not found or unauthorized.");
    }

    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        attempts: { increment: 1 },
        status: "RETRYING",
      },
    });

    return this.deliverWebhook(delivery.webhook, delivery.event, delivery.payload?.data || {});
  }
}

module.exports = WebhookDeliveryService;
