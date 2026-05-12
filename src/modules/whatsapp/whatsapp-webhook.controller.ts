import type { Request, Response } from "express";

import { env } from "../../config/env.js";
import { FinanceAssistantService } from "../finance/finance-assistant.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger.js";
import type { WhatsAppWebhookPayload } from "../../types/whatsapp.js";
import { isValidMetaSignature } from "./whatsapp-signature.js";
import { normalizeWebhookMessages } from "./whatsapp-webhook.mapper.js";

export class WhatsAppWebhookController {
  constructor(private readonly financeAssistant = new FinanceAssistantService()) {}

  verify(request: Request, response: Response): void {
    const mode = request.query["hub.mode"];
    const token = request.query["hub.verify_token"];
    const challenge = request.query["hub.challenge"];

    if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN && typeof challenge === "string") {
      response.status(200).send(challenge);
      return;
    }

    throw new AppError("Webhook verification failed.", 403, "whatsapp_webhook_verification_failed");
  }

  async receive(request: Request, response: Response): Promise<void> {
    const signature = request.header("x-hub-signature-256");

    if (!isValidMetaSignature(request.rawBody, signature)) {
      throw new AppError("Assinatura do webhook inválida.", 401, "invalid_meta_signature");
    }

    const payload = request.body as WhatsAppWebhookPayload;
    const messages = normalizeWebhookMessages(payload);

    response.status(200).json({ received: true });

    for (const message of messages) {
      try {
        await this.financeAssistant.handleIncomingMessage(message);
      } catch (error) {
        logger.error({ error, messageId: message.messageId, from: message.from }, "Failed to process WhatsApp message");
      }
    }
  }
}
