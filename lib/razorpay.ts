import crypto from "node:crypto";
import Razorpay from "razorpay";
import { requireEnv } from "@/lib/utils";

export function createRazorpayClient() {
  return new Razorpay({
    key_id: requireEnv("NEXT_PUBLIC_RAZORPAY_KEY_ID"),
    key_secret: requireEnv("RAZORPAY_KEY_SECRET")
  });
}

export function verifyRazorpayWebhookSignature(body: string, signature: string) {
  const expectedSignature = crypto
    .createHmac("sha256", requireEnv("RAZORPAY_WEBHOOK_SECRET"))
    .update(body)
    .digest("hex");

  if (expectedSignature.length !== signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}
