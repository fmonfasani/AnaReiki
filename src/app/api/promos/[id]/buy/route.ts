import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const svc = createServiceClient();
  const { data: promo } = await svc
    .from("promotions")
    .select("id, name, bundle_price_cents, max_sessions, is_active, expires_at")
    .eq("id", id)
    .single();

  if (!promo) return NextResponse.json({ error: "Promo no encontrada" }, { status: 404 });
  if (!promo.is_active) return NextResponse.json({ error: "Promo inactiva" }, { status: 400 });
  if (!promo.bundle_price_cents || promo.bundle_price_cents <= 0) {
    return NextResponse.json({ error: "Esta promo no tiene precio de bundle configurado" }, { status: 400 });
  }
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return NextResponse.json({ error: "Promo vencida" }, { status: 400 });
  }

  const { data: existing } = await svc
    .from("promo_purchases")
    .select("id, sessions_remaining")
    .eq("promotion_id", id)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Ya tenés esta promo activa. Usala antes de comprar otra." }, { status: 400 });
  }

  const amount = promo.bundle_price_cents / 100;

  const { createPaymentPreference } = await import("@/lib/mercadopago");
  const result = await createPaymentPreference({
    items: [{
      title: promo.name,
      quantity: 1,
      unit_price: amount,
      currency_id: "ARS",
    }],
    payerEmail: user.email || "",
    backUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://anamurat.online"}/consultantes/reservar`,
    notificationUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://anamurat.online"}/api/mercadopago/webhook`,
    externalReference: JSON.stringify({ userId: user.id, promoId: id, type: "promo_bundle" }),
    autoReturn: "approved",
  });

  if ("error" in result) {
    console.error("MP preference error (promo bundle)", result.error);
    return NextResponse.json({ error: "Error al crear el pago" }, { status: 500 });
  }

  const { error: insertError } = await svc.from("promo_purchases").insert({
    promotion_id: id,
    user_id: user.id,
    mp_preference_id: result.id,
    amount_paid: amount,
    status: "pending",
    sessions_remaining: promo.max_sessions,
  });

  if (insertError) {
    console.error("Insert promo_purchase error", insertError.message);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    mp_init_point: result.init_point || result.sandbox_init_point,
  }, { status: 201 });
}
