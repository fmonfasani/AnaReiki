import { createServiceClient } from "@/lib/supabase/service";
import type { MpPaymentData } from "@/lib/mercadopago";

type SavePaymentLogOpts = {
  mpPaymentId: number;
  appointmentId?: string | null;
  userId?: string | null;
  paymentType: "session" | "subscription" | "promo_bundle";
  externalRef?: Record<string, unknown> | null;
};

export async function saveMpPaymentLog(
  mpData: MpPaymentData,
  opts: SavePaymentLogOpts,
): Promise<void> {
  if ("error" in mpData) return;

  const svc = createServiceClient();

  await svc.from("mp_payment_logs").insert({
    mp_payment_id: mpData.id,
    appointment_id: opts.appointmentId || null,
    user_id: opts.userId || null,
    payment_type: opts.paymentType,
    status: mpData.status,
    status_detail: mpData.status_detail,
    transaction_amount: mpData.transaction_amount,
    currency_id: mpData.currency_id,
    external_reference: opts.externalRef || null,
    mp_date_created: mpData.date_created || null,
    mp_date_approved: mpData.date_approved || null,
    payment_method_id: mpData.payment_method_id,
    payment_type_id: mpData.payment_type_id,
    installments: mpData.installments,
    statement_descriptor: mpData.statement_descriptor,
    payer_email: mpData.payer.email,
    payer_id: mpData.payer.id || null,
    payer_identification_type: mpData.payer.identification?.type || null,
    payer_identification_number: mpData.payer.identification?.number || null,
    payer_type: mpData.payer.type || null,
    net_received_amount: mpData.transaction_details?.net_received_amount || null,
    total_paid_amount: mpData.transaction_details?.total_paid_amount || null,
    fee_details: mpData.fee_details || null,
    transaction_amount_refunded: mpData.transaction_amount_refunded,
    card_last_digits: mpData.card?.last_digits || null,
    cardholder_name: mpData.card?.cardholder?.name || null,
    raw_response: mpData as unknown as Record<string, unknown>,
  });
}
