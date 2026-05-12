import { Router, type Router as ExpressRouter } from "express";

import { asyncHandler } from "../../shared/utils/async-handler.js";
import { WhatsAppWebhookController } from "./whatsapp-webhook.controller.js";

const controller = new WhatsAppWebhookController();

export const whatsappRoutes: ExpressRouter = Router();

whatsappRoutes.get(
  "/webhook",
  asyncHandler(async (request, response) => {
    controller.info(request, response);
  })
);

whatsappRoutes.post(
  "/webhook",
  asyncHandler(async (request, response) => {
    await controller.receive(request, response);
  })
);
