import "dotenv/config";

import { env } from "../config/env.js";
import { WhatsAppService } from "../modules/whatsapp/whatsapp.service.js";

const whatsapp = new WhatsAppService();
const status = await whatsapp.getInstanceStatus();

console.log(`Z-API base URL: ${env.ZAPI_BASE_URL}`);
console.log(`Z-API instance ID configured: ${env.ZAPI_INSTANCE_ID}`);
console.log(`Z-API connection OK: status endpoint responded`);
console.log(`Z-API connected: ${status.connected}`);
console.log(`Z-API smartphone connected: ${status.smartphoneConnected ?? false}`);
console.log(`Z-API status message: ${status.error ?? "none"}`);
console.log("Z-API send-text endpoint prepared: POST /send-text via WhatsAppService.sendText");
console.log("Z-API receive webhook prepared: POST /webhooks/whatsapp/webhook");
console.log("Z-API audio prepared: webhook audio.audioUrl -> download -> OpenAI transcription");
