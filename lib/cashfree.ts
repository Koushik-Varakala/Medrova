/**
 * lib/cashfree.ts
 * Cashfree Payments server-side utilities.
 *
 * Security model:
 * - All secrets (CASHFREE_SECRET_KEY) stay server-side only.
 * - Webhook signature verified with HMAC-SHA256 + timing-safe compare.
 * - Order amount ALWAYS computed from DB — never trusted from client.
 */

import crypto from "node:crypto";

const CASHFREE_BASE_URL =
  process.env.CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const API_VERSION = "2023-08-01";

function getCashfreeHeaders() {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    throw new Error("CASHFREE_APP_ID or CASHFREE_SECRET_KEY is not configured.");
  }

  return {
    "x-api-version": API_VERSION,
    "x-client-id": appId,
    "x-client-secret": secretKey,
    "Content-Type": "application/json",
  };
}

// ─────────────────────────────────────────────────────────
// Create a Cashfree Payment Order
// ─────────────────────────────────────────────────────────
export interface CashfreeOrderOptions {
  orderId: string;         // Our internal unique ID (shift_id based)
  orderAmount: number;     // Amount in INR (integer, not paise)
  customerEmail: string;
  customerPhone: string;
  customerId: string;
  returnUrl: string;       // Redirect after payment (success/failure)
}

export interface CashfreeOrderResult {
  cfOrderId: string;
  orderId: string;
  paymentSessionId: string;
}

export async function createCashfreeOrder(
  opts: CashfreeOrderOptions
): Promise<CashfreeOrderResult> {
  const response = await fetch(`${CASHFREE_BASE_URL}/orders`, {
    method: "POST",
    headers: getCashfreeHeaders(),
    body: JSON.stringify({
      order_id: opts.orderId,
      order_amount: opts.orderAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: opts.customerId,
        customer_email: opts.customerEmail,
        customer_phone: opts.customerPhone,
      },
      order_meta: {
        return_url: opts.returnUrl,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://medrova.vercel.app"}/api/payments/cashfree/webhook`,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Cashfree order creation failed: ${response.status} — ${body}`);
  }

  const data = await response.json() as {
    cf_order_id: string;
    order_id: string;
    payment_session_id: string;
  };

  return {
    cfOrderId: data.cf_order_id,
    orderId: data.order_id,
    paymentSessionId: data.payment_session_id,
  };
}

// ─────────────────────────────────────────────────────────
// Verify Cashfree Webhook Signature
//
// Cashfree signs webhooks as:
//   HMAC-SHA256(timestamp + rawBody, CASHFREE_SECRET_KEY)
//   then base64-encoded.
//
// Timing-safe comparison prevents timing attacks.
// ─────────────────────────────────────────────────────────
export function verifyCashfreeWebhook(
  rawBody: string,
  signature: string,
  timestamp: string
): boolean {
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!secret) return false;

  const signedPayload = `${timestamp}${rawBody}`;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("base64");

  // Timing-safe comparison — prevents timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSig),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────
// Fetch Order Status from Cashfree (server-side verification)
// Used as a secondary check after webhook fires.
// ─────────────────────────────────────────────────────────
export async function getCashfreeOrderStatus(
  orderId: string
): Promise<{ status: string; paymentId?: string }> {
  const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
    method: "GET",
    headers: getCashfreeHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Cashfree order fetch failed: ${response.status}`);
  }

  const data = await response.json() as {
    order_status: string;
    cf_order_id?: string;
  };

  return {
    status: data.order_status, // "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED"
    paymentId: data.cf_order_id,
  };
}
