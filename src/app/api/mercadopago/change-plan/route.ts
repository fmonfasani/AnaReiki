import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { createPreapproval, cancelPreapproval } from "@/lib/mercadopago";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { planId, action } = await request.json();

    if (!action) {
      return NextResponse.json({ error: "Acción requerida" }, { status: 400 });
    }

    const svc = createServiceClient();

    if (action === "downgrade") {
      if (!planId) {
        return NextResponse.json({ error: "Plan requerido" }, { status: 400 });
      }

      const { data: targetPlan } = await svc
        .from("pricing_plans")
        .select("*")
        .eq("id", planId)
        .eq("is_active", true)
        .single();

      if (!targetPlan) {
        return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
      }

      const { data: activeSub } = await svc
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (activeSub?.mp_preapproval_id) {
        await cancelPreapproval(activeSub.mp_preapproval_id);
      }

      if (activeSub) {
        await svc
          .from("subscriptions")
          .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
          })
          .eq("id", activeSub.id);
      }

      const isPremium = targetPlan.slug !== "prana";

      if (isPremium) {
        // Downgrade to a lower paid plan (e.g., Ananda -> Shakti) — new flow
        const backUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://anamurat.online"}/consultantes/suscripciones`;
        const result = await createPreapproval({
          planId: targetPlan.id,
          planName: targetPlan.name,
          priceCents: targetPlan.price_cents,
          interval: targetPlan.interval,
          trialDays: 0,
          payerEmail: user.email || "",
          backUrl,
          externalReference: JSON.stringify({
            userId: user.id,
            planId: targetPlan.id,
            action: "downgrade",
          }),
        });

        if ("error" in result) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json(result);
      }

      await svc
        .from("profiles")
        .update({
          plan_tier: targetPlan.slug.replace(/-.*$/, ""),
          is_premium: false,
        })
        .eq("id", user.id);

      return NextResponse.json({
        success: true,
        message: "Suscripción cancelada. Volviste al plan gratuito.",
      });
    }

    if (action === "cancel") {
      const { data: activeSub } = await svc
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (!activeSub) {
        return NextResponse.json(
          { error: "No hay suscripción activa" },
          { status: 400 },
        );
      }

      if (activeSub.mp_preapproval_id) {
        await cancelPreapproval(activeSub.mp_preapproval_id);
      }

      await svc
        .from("subscriptions")
        .update({
          status: "canceled",
          canceled_at: new Date().toISOString(),
        })
        .eq("id", activeSub.id);

      await svc
        .from("profiles")
        .update({
          plan_tier: "prana",
          is_premium: false,
        })
        .eq("id", user.id);

      return NextResponse.json({
        success: true,
        message: "Suscripción cancelada. Volviste al plan gratuito.",
      });
    }

    if (action === "upgrade") {
      if (!planId) {
        return NextResponse.json({ error: "Plan requerido" }, { status: 400 });
      }

      const { data: targetPlan } = await svc
        .from("pricing_plans")
        .select("*")
        .eq("id", planId)
        .eq("is_active", true)
        .single();

      if (!targetPlan) {
        return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
      }

      const { data: activeSub } = await svc
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (activeSub?.mp_preapproval_id) {
        await cancelPreapproval(activeSub.mp_preapproval_id);
      }

      if (activeSub) {
        await svc
          .from("subscriptions")
          .update({ status: "canceled", canceled_at: new Date().toISOString() })
          .eq("id", activeSub.id);
      }

      const backUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://anamurat.online"}/consultantes/suscripciones`;

      const result = await createPreapproval({
        planId: targetPlan.id,
        planName: targetPlan.name,
        priceCents: targetPlan.price_cents,
        interval: targetPlan.interval,
        trialDays: targetPlan.trial_days,
        payerEmail: user.email || "",
        backUrl,
        externalReference: JSON.stringify({
          userId: user.id,
          planId: targetPlan.id,
          action: "upgrade",
        }),
      });

      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
