import type { NormalizedWhatsAppMessage, ZApiWebhookPayload } from "../../types/whatsapp.js";

export function normalizeWebhookMessages(payload: ZApiWebhookPayload): NormalizedWhatsAppMessage[] {
  if (!payload.messageId || !payload.phone || payload.fromMe || payload.isGroup || payload.type !== "ReceivedCallback") {
    return [];
  }

  return [
    {
      messageId: payload.messageId,
      from: payload.phone,
      contactName: payload.senderName ?? payload.chatName ?? null,
      type: resolveMessageType(payload),
      text: resolveText(payload),
      mediaUrl: payload.audio?.audioUrl ?? payload.image?.imageUrl ?? null,
      mimeType: payload.audio?.mimeType ?? payload.image?.mimeType ?? null,
      timestamp: payload.momment ? new Date(payload.momment).toISOString() : new Date().toISOString()
    }
  ];
}

function resolveMessageType(payload: ZApiWebhookPayload): NormalizedWhatsAppMessage["type"] {
  if (payload.text?.message) {
    return "text";
  }

  if (payload.audio?.audioUrl) {
    return "audio";
  }

  if (payload.image?.imageUrl) {
    return "image";
  }

  if (payload.buttonsResponseMessage?.message) {
    return "button";
  }

  if (payload.listResponseMessage?.message) {
    return "list";
  }

  return "unknown";
}

function resolveText(payload: ZApiWebhookPayload): string | null {
  return (
    payload.text?.message ??
    payload.buttonsResponseMessage?.message ??
    payload.listResponseMessage?.message ??
    payload.image?.caption ??
    null
  );
}
