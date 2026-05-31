import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createPreapproval } from "@/lib/mercadopago";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: "Plan requerido" },
        { status: 400 },
      );
    }

    const { data: plan } = await supabase
      .from("pricing_plans")
      .select("*")
      .eq("id", planId)
      .eq("is_active", true)
      .single();

    if (!plan) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 },
      );
    }

    const backUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://anamurat.online"}/consultantes/suscripciones`;

    const result = await createPreapproval({
      planId: plan.id,
      planName: plan.name,
      priceCents: plan.price_cents,
      interval: plan.interval,
      trialDays: plan.trial_days,
      backUrl,
      payerEmail: user.email || "",
      externalReference: JSON.stringify({
        userId: user.id,
        planId: plan.id,
      }),
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
