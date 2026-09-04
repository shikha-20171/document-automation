const crypto = require("crypto");
const prisma = require("../config/prismaClient");

/**
 * Enterprise Webhook Dispatch Engine
 * Signs payloads with HMAC-SHA256 and dispatches events to registered tenant endpoints.
 */
class WebhookService {
  /**
   * Dispatch an event to all active webhooks for the organisation
   */
  static async triggerEvent({ organisationId, event, payload }) {
    try {
      const orgId = Number(organisationId);
      if (!orgId) return { deliveredCount: 0 };

      // Find active webhooks subscribed to this event or "*"
      const webhooks = await prisma.organisationWebhook.findMany({
        where: {
          organisationId: orgId,
          status: "ACTIVE",
        },
      }).catch(() => []);

      const matchingWebhooks = webhooks.filter((wh) => {
        if (!wh.events || wh.events.includes("*") || wh.events.includes(event)) {
          return true;
        }
        return false;
      });

      if (matchingWebhooks.length === 0) {
        return { deliveredCount: 0, message: "No active webhooks configured for this event." };
      }

      const eventPayload = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        event,
        organisationId: orgId,
        timestamp: new Date().toISOString(),
        data: payload,
      };

      const results = await Promise.allSettled(
        matchingWebhooks.map(async (wh) => {
          const bodyString = JSON.stringify(eventPayload);
          // Compute HMAC-SHA256 signature
          const signingKey = wh.secretHash || wh.secret || process.env.JWT_SECRET || "webhook-secret";
          const signature = crypto
            .createHmac("sha256", signingKey)
            .update(bodyString)
            .digest("hex");

          const response = await fetch(wh.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-DocuCore-Event": event,
              "X-DocuCore-Signature": `sha256=${signature}`,
              "X-DocuCore-Delivery": eventPayload.id,
            },
            body: bodyString,
            signal: AbortSignal.timeout(10000), // 10s timeout
          }).catch((err) => ({ ok: false, status: 500, statusText: err.message }));

          return {
            webhookId: wh.id,
            url: wh.url,
            success: response.ok,
            statusCode: response.status,
          };
        })
      );

      return {
        deliveredCount: results.filter((r) => r.status === "fulfilled" && r.value.success).length,
        totalWebhooks: matchingWebhooks.length,
        results,
      };
    } catch (err) {
      console.warn("[WebhookService] Event trigger notice:", err.message);
      return { deliveredCount: 0, error: err.message };
    }
  }
}

module.exports = WebhookService;
