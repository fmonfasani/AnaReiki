import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getPayment, getPreapproval } from "@/lib/mercadopago";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    // Handle subscription preapproval notification
    if (body.type === "subscription_preapproval" || body.type === "preapproval") {
      const preapprovalId = body.data?.id;

      if (!preapprovalId) {
        return NextResponse.json({ received: true });
      }

      const preapproval = await getPreapproval(String(preapprovalId));

      if ("error" in preapproval) {
        console.error("Error fetching preapproval:", preapproval.error);
        return NextResponse.json({ received: true });
      }

      let refData: { userId?: string; planId?: string } = {};
      try {
        refData = JSON.parse(preapproval.external_reference || "{}");
      } catch {}

      if (refData.userId && refData.planId) {
        const planSlug = body.action === "created" || preapproval.status === "authorized" ? "shakti" : undefined;

        const { data: plan } = await supabase
          .from("pricing_plans")
          .select("*")
          .eq("id", refData.planId)
          .single();

        if (plan) {
          const planTier = plan.slug.startsWith("ananda") ? "ananda" : "shakti";

          if (preapproval.status === "authorized" || preapproval.status === "pending") {
            // Check if subscription already exists
            const { data: existing } = await supabase
              .from("subscriptions")
              .select("id")
              .eq("user_id", refData.userId)
              .eq("status", "active")
              .single();

            if (!existing) {
              await supabase.from("subscriptions").insert({
                user_id: refData.userId,
                plan_id: refData.planId,
                status: "active",
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(
                  Date.now() + (plan.interval === "year" ? 365 : 30) * 24 * 60 * 60 * 1000
                ).toISOString(),
                mp_subscription_id: String(preapprovalId),
                cancel_at_period_end: false,
              });

              await supabase
                .from("profiles")
                .update({ is_premium: true, plan_tier: planTier })
                .eq("id", refData.userId);

              console.log(`✅ Subscription created: user=${refData.userId}, plan=${plan.name}`);
            }
          }

          if (preapproval.status === "cancelled") {
            await supabase
              .from("subscriptions")
              .update({ status: "cancelled", cancel_at_period_end: true })
              .eq("mp_subscription_id", String(preapprovalId));
          }
        }
      }

      return NextResponse.json({ received: true });
    }

    // Handle payment notification (first charge after trial ends)
    if (body.type === "payment") {
      const paymentId = body.data?.id;

      if (!paymentId) {
        return NextResponse.json({ received: true });
      }

      const payment = await getPayment(String(paymentId));

      if ("error" in payment) {
        console.error("Error fetching payment:", payment.error);
        return NextResponse.json({ received: true });
      }

      if (payment.status === "approved") {
        // Try to get external reference from payment
        let refData: { userId?: string; planId?: string } = {};
        try {
          const res = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
              },
            }
          );
          const fullPayment = await res.json();
          refData = JSON.parse(fullPayment.external_reference || "{}");
        } catch {}

        if (!refData.userId || !refData.planId) {
          const { data: existingPayment } = await supabase
            .from("payments")
            .select("user_id, plan_id")
            .eq("mp_payment_id", String(paymentId))
            .single();

          if (existingPayment) {
            refData = {
              userId: existingPayment.user_id,
              planId: existingPayment.plan_id,
            };
          }
        }

        if (refData.userId && refData.planId) {
          await supabase.rpc("handle_payment_success", {
            p_user_id: refData.userId,
            p_plan_id: refData.planId,
            p_amount_cents: Math.round(payment.transaction_amount * 100),
            p_mp_payment_id: String(paymentId),
            p_mp_preference_id: "",
            p_payment_method: payment.payment_method_id,
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ received: true });
  }
}
