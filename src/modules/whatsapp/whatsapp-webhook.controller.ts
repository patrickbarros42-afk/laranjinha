import type { Request, Response } from "express";

import { env } from "../../config/env.js";
import { FinanceAssistantService } from "../finance/finance-assistant.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger.js";
import type { ZApiWebhookPayload } from "../../types/whatsapp.js";
import { normalizeWebhookMessages } from "./whatsapp-webhook.mapper.js";

export class WhatsAppWebhookController {
  constructor(private readonly financeAssistant = new FinanceAssistantService()) {}

  info(_request: Request, response: Response): void {
    response.status(200).json({
      provider: "z-api",
      endpoint: "/webhooks/whatsapp/webhook",
      expectedHeader: "Client-Token"
    });
  }

  async receive(request: Request, response: Response): Promise<void> {
    const payload = request.body as ZApiWebhookPayload;
    this.validateWebhook(request, payload);
    const messages = normalizeWebhookMessages(payload);

    response.status(200).json({ received: true });

    logger.info(
      {
        provider: "z-api",
        instanceId: payload.instanceId,
        messageId: payload.messageId,
        phone: payload.phone,
        type: payload.type,
        status: payload.status,
        normalizedMessages: messages.length
      },
      "Z-API webhook received"
    );

    for (const message of messages) {
      try {
        await this.financeAssistant.handleIncomingMessage(message);
      } catch (error) {
        logger.error({ error, messageId: message.messageId, from: message.from }, "Failed to process Z-API message");
      }
    }
  }

  private validateWebhook(request: Request, payload: ZApiWebhookPayload): void {
    const clientToken = request.header("client-token");

    if (clientToken !== env.ZAPI_CLIENT_TOKEN) {
      throw new AppError("Webhook Z-API sem Client-Token válido.", 401, "invalid_zapi_client_token");
    }

    if (payload.instanceId && payload.instanceId !== env.ZAPI_INSTANCE_ID) {
      throw new AppError("Webhook Z-API de instância inesperada.", 401, "invalid_zapi_instance");
    }
  }
}
