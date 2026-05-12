import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { corsOptions } from "./config/http.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { whatsappRoutes } from "./modules/whatsapp/whatsapp.routes.js";
import { errorHandler } from "./shared/middlewares/error-handler.js";
import { notFoundHandler } from "./shared/middlewares/not-found.js";
import { apiRateLimiter } from "./shared/middlewares/rate-limit.js";
import { requestLogger } from "./shared/middlewares/request-logger.js";

export function createApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(compression());
  app.use(requestLogger);
  app.use(apiRateLimiter);
  app.use(express.json({ limit: "2mb" }));

  app.use("/health", healthRoutes);
  app.use("/webhooks/whatsapp", whatsappRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
