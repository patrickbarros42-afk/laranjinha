export interface WhatsAppWebhookPayload {
  object: string;
  entry?: WhatsAppEntry[];
}

export interface WhatsAppEntry {
  id: string;
  changes?: WhatsAppChange[];
}

export interface WhatsAppChange {
  field: string;
  value: {
    messaging_product?: string;
    metadata?: {
      display_phone_number?: string;
      phone_number_id?: string;
    };
    contacts?: WhatsAppContact[];
    messages?: WhatsAppIncomingMessage[];
    statuses?: unknown[];
  };
}

export interface WhatsAppContact {
  profile?: {
    name?: string;
  };
  wa_id: string;
}

export type WhatsAppMessageType = "text" | "audio" | "image" | "button" | "interactive" | "unknown";

export interface WhatsAppIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type?: WhatsAppMessageType;
  text?: {
    body?: string;
  };
  audio?: {
    id?: string;
    mime_type?: string;
    sha256?: string;
    voice?: boolean;
  };
  image?: {
    id?: string;
    mime_type?: string;
    sha256?: string;
    caption?: string;
  };
  button?: {
    text?: string;
    payload?: string;
  };
  interactive?: {
    type?: string;
  };
}

export interface NormalizedWhatsAppMessage {
  messageId: string;
  from: string;
  contactName: string | null;
  type: WhatsAppMessageType;
  text: string | null;
  mediaId: string | null;
  mimeType: string | null;
  timestamp: string;
}

export interface DownloadedMedia {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}
