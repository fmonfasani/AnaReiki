import crypto from "crypto";

export function verifyMpSignature(
  rawBody: string,
  signatureHeader: string | null,
  requestId: string | null,
  dataIdFromQuery: string | null,
): boolean {
  if (!signatureHeader || !requestId) return false;

  const parts = signatureHeader.split(",");
  let ts = "";
  let receivedSignature = "";

  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx);
    const value = part.slice(idx + 1);
    if (key === "ts") ts = value;
    if (key === "v1") receivedSignature = value;
  }

  if (!ts || !receivedSignature) return false;

  const dataId = dataIdFromQuery || "";
  if (!dataId) return false;

  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("MP_WEBHOOK_SECRET not configured, skipping signature verification");
    return true;
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(manifest);
  const computed = hmac.digest("hex");

  if (computed.length !== receivedSignature.length) return false;
  let match = 0;
  for (let i = 0; i < computed.length; i++) {
    match |= computed.charCodeAt(i) ^ receivedSignature.charCodeAt(i);
  }
  return match === 0;
}
