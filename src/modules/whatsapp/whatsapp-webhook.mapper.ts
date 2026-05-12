import type {
  NormalizedWhatsAppMessage,
  WhatsAppContact,
  WhatsAppIncomingMessage,
  WhatsAppWebhookPayload
} from "../../types/whatsapp.js";

export function normalizeWebhookMessages(payload: WhatsAppWebhookPayload): NormalizedWhatsAppMessage[] {
  const messages: NormalizedWhatsAppMessage[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const contactsByPhone = new Map<string, WhatsAppContact>();

      for (const contact of change.value.contacts ?? []) {
        contactsByPhone.set(contact.wa_id, contact);
      }

      for (const message of change.value.messages ?? []) {
        messages.push(normalizeMessage(message, contactsByPhone.get(message.from)));
      }
    }
  }

  return messages;
}

function normalizeMessage(
  message: WhatsAppIncomingMessage,
  contact?: WhatsAppContact
): NormalizedWhatsAppMessage {
  const type = message.type ?? "unknown";

  return {
    messageId: message.id,
    from: message.from,
    contactName: contact?.profile?.name ?? null,
    type,
    text: message.text?.body ?? message.button?.text ?? null,
    mediaId: message.audio?.id ?? message.image?.id ?? null,
    mimeType: message.audio?.mime_type ?? message.image?.mime_type ?? null,
    timestamp: message.timestamp
  };
}
