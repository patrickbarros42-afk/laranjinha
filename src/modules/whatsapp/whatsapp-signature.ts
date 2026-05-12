import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "../../config/env.js";

export function isValidMetaSignature(rawBody: Buffer | undefined, signatureHeader: string | undefined): boolean {
  if (!env.META_APP_SECRET) {
    return true;
  }

  if (!rawBody || !signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expected = createHmac("sha256", env.META_APP_SECRET).update(rawBody).digest("hex");
  const received = signatureHeader.replace("sha256=", "");
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
