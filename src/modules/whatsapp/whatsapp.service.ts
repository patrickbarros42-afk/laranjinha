import axios, { type AxiosInstance } from "axios";

import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger.js";
import type { DownloadedMedia } from "../../types/whatsapp.js";

export class WhatsAppService {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}`,
      timeout: 15_000,
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      }
    });
  }

  async sendText(to: string, body: string): Promise<void> {
    await this.withRetry(async () => {
      await this.client.post(`/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          preview_url: false,
          body
        }
      });
    }, "send_text");
  }

  async markAsRead(messageId: string): Promise<void> {
    await this.withRetry(async () => {
      await this.client.post(`/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId
      });
    }, "mark_as_read");
  }

  async downloadMedia(mediaId: string): Promise<DownloadedMedia> {
    const metadata = await this.withRetry(async () => {
      const response = await this.client.get<{ url: string; mime_type?: string }>(`/${mediaId}`);
      return response.data;
    }, "get_media_metadata");

    if (!metadata.url) {
      throw new AppError("Mídia do WhatsApp sem URL para download.", 502, "whatsapp_media_url_missing");
    }

    const mediaResponse = await this.withRetry(async () => {
      return axios.get<ArrayBuffer>(metadata.url, {
        responseType: "arraybuffer",
        timeout: 20_000,
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`
        }
      });
    }, "download_media");

    const mimeType = metadata.mime_type ?? mediaResponse.headers["content-type"] ?? "application/octet-stream";

    return {
      buffer: Buffer.from(mediaResponse.data),
      mimeType,
      filename: `whatsapp-${mediaId}.${extensionFromMimeType(mimeType)}`
    };
  }

  private async withRetry<T>(operation: () => Promise<T>, label: string): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        logger.warn({ error, attempt, label }, "WhatsApp API attempt failed");

        if (attempt < 3) {
          await sleep(500 * attempt);
        }
      }
    }

    throw new AppError("Falha ao comunicar com a API do WhatsApp.", 502, "whatsapp_api_error", lastError);
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
