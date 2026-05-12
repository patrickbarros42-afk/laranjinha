import type { IncomingMessage, ServerResponse } from "node:http";

import { pinoHttp } from "pino-http";

import { logger } from "../logger.js";

export const requestLogger = pinoHttp({
  logger,
  customLogLevel(_request: IncomingMessage, response: ServerResponse, error?: Error) {
    if (error || response.statusCode >= 500) {
      return "error";
    }

    if (response.statusCode >= 400) {
      return "warn";
    }

    return "info";
  }
});
