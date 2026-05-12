import rateLimit from "express-rate-limit";

import { env } from "../../config/env.js";

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: {
      code: "rate_limit_exceeded",
      message: "Calma aí, patrão 😅 Muitas requisições em pouco tempo."
    }
  }
});
