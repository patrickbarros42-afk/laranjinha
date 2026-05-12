import axios, { type AxiosInstance } from "axios";

import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger.js";
import type { DownloadedMedia } from "../../types/whatsapp.js";

export class WhatsAppService {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${env.ZAPI_BASE_URL}/instances/${env.ZAPI_INSTANCE_ID}/token/${env.ZAPI_INSTANCE_TOKEN}`,
      timeout: 15_000,
      headers: {
        "Client-Token": env.ZAPI_CLIENT_TOKEN,
        "Content-Type": "application/json"
      }
    });
  }

  async sendText(to: string, body: string): Promise<void> {
    await this.withRetry(async () => {
      const response = await this.client.post("/send-text", {
        phone: to,
        message: body
      });

      logger.info({ to, messageId: response.data?.messageId, zaapId: response.data?.zaapId }, "Z-API text sent");
    }, "send_text");
  }

  async markAsRead(phone: string, messageId: string): Promise<void> {
    await this.withRetry(async () => {
      await this.client.post("/read-message", {
        phone,
        messageId
      });

      logger.debug({ phone, messageId }, "Z-API message marked as read");
    }, "mark_as_read");
  }

  async downloadMedia(mediaUrl: string, mimeTypeHint?: string | null): Promise<DownloadedMedia> {
    const mediaResponse = await this.withRetry(async () => {
      return axios.get<ArrayBuffer>(mediaUrl, {
        responseType: "arraybuffer",
        timeout: 20_000
      });
    }, "download_media");

    const contentTypeHeader = mediaResponse.headers["content-type"];
    const responseMimeType = Array.isArray(contentTypeHeader) ? contentTypeHeader[0] : contentTypeHeader;
    const mimeType = mimeTypeHint ?? (typeof responseMimeType === "string" ? responseMimeType : undefined) ?? "application/octet-stream";

    logger.info({ mediaUrl: redactUrl(mediaUrl), mimeType, bytes: mediaResponse.data.byteLength }, "Z-API media downloaded");

    return {
      buffer: Buffer.from(mediaResponse.data),
      mimeType,
      filename: `zapi-media-${Date.now()}.${extensionFromMimeType(mimeType)}`
    };
  }

  private async withRetry<T>(operation: () => Promise<T>, label: string): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        logger.warn({ error, attempt, label }, "Z-API attempt failed");

        if (attempt < 3) {
          await sleep(500 * attempt);
        }
      }
    }

    throw new AppError("Falha ao comunicar com a Z-API.", 502, "zapi_api_error", lastError);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function extensionFromMimeType(mimeType: string): string {
  if (mimeType.includes("ogg")) {
    return "ogg";
  }

  if (mimeType.includes("mpeg")) {
    return "mp3";
  }

  if (mimeType.includes("mp4")) {
    return "mp4";
  }

  if (mimeType.includes("jpeg")) {
    return "jpg";
  }

  if (mimeType.includes("png")) {
    return "png";
  }

  return "bin";
}

function redactUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return "[invalid-url]";
  }
}
