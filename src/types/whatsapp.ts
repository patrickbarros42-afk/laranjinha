export type WhatsAppMessageType = "text" | "audio" | "image" | "button" | "list" | "unknown";

export interface ZApiWebhookPayload {
  isStatusReply?: boolean;
  connectedPhone?: string;
  waitingMessage?: boolean;
  isEdit?: boolean;
  isGroup?: boolean;
  isNewsletter?: boolean;
  instanceId?: string;
  messageId?: string;
  phone?: string;
  fromMe?: boolean;
  momment?: number;
  status?: string;
  chatName?: string;
  senderName?: string;
  participantPhone?: string | null;
  broadcast?: boolean;
  type?: string;
  fromApi?: boolean;
  text?: {
    message?: string;
    description?: string;
    title?: string;
    url?: string;
    thumbnailUrl?: string;
  };
  audio?: {
    ptt?: boolean;
    seconds?: number;
    audioUrl?: string;
    mimeType?: string;
    viewOnce?: boolean;
  };
  image?: {
    imageUrl?: string;
    thumbnailUrl?: string;
    mimeType?: string;
    caption?: string;
    downloadError?: string | null;
    width?: number;
    height?: number;
    viewOnce?: boolean;
  };
  buttonsResponseMessage?: {
    buttonId?: string;
    message?: string;
  };
  listResponseMessage?: {
    message?: string;
    title?: string;
    selectedRowId?: string;
  };
}

export interface NormalizedWhatsAppMessage {
  messageId: string;
  from: string;
  contactName: string | null;
  type: WhatsAppMessageType;
  text: string | null;
  mediaUrl: string | null;
  mimeType: string | null;
  timestamp: string;
}

export interface DownloadedMedia {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}
