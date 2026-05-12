import pino from "pino";

import { env } from "../config/env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers.client-token",
      "headers.authorization",
      "headers.Client-Token",
      "ZAPI_INSTANCE_TOKEN",
      "ZAPI_CLIENT_TOKEN",
      "SUPABASE_SERVICE_ROLE_KEY",
      "OPENAI_API_KEY"
    ],
    censor: "[REDACTED]"
  }
});
