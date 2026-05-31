const MP_API_BASE = "https://api.mercadopago.com";

function getAccessToken(): string {
  return process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
}

export async function createPreference(input: {
  planId: string;
  planName: string;
  priceCents: number;
  description: string;
  backUrl: string;
  notificationUrl: string;
  payerEmail: string;
  externalReference: string;
}): Promise<{ id: string; init_point: string } | { error: string }> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return { error: "Mercado Pago no configurado" };
  }

  try {
    const res = await fetch(`${MP_API_BASE}/checkout/preferences`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            id: input.planId,
            title: input.planName,
            description: input.description,
            quantity: 1,
            unit_price: input.priceCents / 100,
            currency_id: "ARS",
          },
        ],
        payer: { email: input.payerEmail },
        back_urls: {
          success: `${input.backUrl}?status=success`,
          failure: `${input.backUrl}?status=failure`,
          pending: `${input.backUrl}?status=pending`,
        },
        notification_url: input.notificationUrl,
        external_reference: input.externalReference,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.message || "Error al crear preferencia" };
    }

    return { id: data.id, init_point: data.init_point };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Error de conexión con Mercado Pago",
    };
  }
}

export async function createPreapproval(input: {
  planId: string;
  planName: string;
  priceCents: number;
  interval: string;
  trialDays: number;
  payerEmail: string;
  externalReference: string;
  backUrl: string;
}): Promise<{ id: string; init_point: string } | { error: string }> {
  const accessToken = getAccessToken();
  if (!accessToken) return { error: "Mercado Pago no configurado" };

  if (!input.payerEmail) {
    return { error: "Email del pagador requerido" };
  }

  const amount = input.priceCents / 100;
  if (amount <= 0) {
    return { error: "Monto inválido" };
  }

  try {
    const body: Record<string, unknown> = {
      payer_email: input.payerEmail,
      reason: input.planName,
      external_reference: input.externalReference,
      back_url: input.backUrl,
      status: "pending",
      auto_recurring: {
        frequency: input.interval === "year" ? 12 : 1,
        frequency_type: "months",
        transaction_amount: amount,
        currency_id: "ARS",
      },
    };

    // if (input.trialDays > 0) {
    //   (body.auto_recurring as Record<string, unknown>).free_trial = {
    //     frequency: input.trialDays,
    //     frequency_type: "days",
    //   };
    // }

    const res = await fetch(`${MP_API_BASE}/preapproval`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("MP preapproval error:", JSON.stringify(data));
      return {
        error: data.message || data.cause?.[0]?.description || `Error MP (${res.status})`,
      };
    }

    return { id: data.id, init_point: data.init_point };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Error de conexión con Mercado Pago",
    };
  }
}

export async function getPreapproval(preapprovalId: string): Promise<{
  id: string;
  status: string;
  payer: { email: string };
  reason: string;
  external_reference: string;
  auto_recurring: {
    transaction_amount: number;
    frequency: number;
    frequency_type: string;
  };
} | { error: string }> {
  const accessToken = getAccessToken();
  if (!accessToken) return { error: "No configurado" };

  try {
    const res = await fetch(`${MP_API_BASE}/preapproval/${preapprovalId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.message || "Error al obtener suscripción" };
    }

    return data;
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error de conexión con Mercado Pago",
    };
  }
}

export async function getPayment(paymentId: string): Promise<{
  status: string;
  status_detail: string;
  payer: { email: string };
  transaction_amount: number;
  payment_method_id: string;
} | { error: string }> {
  const accessToken = getAccessToken();
  if (!accessToken) return { error: "No configurado" };

  try {
    const res = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.message || "Error al obtener pago" };
    }

    return {
      status: data.status,
      status_detail: data.status_detail,
      payer: { email: data.payer?.email || "" },
      transaction_amount: data.transaction_amount,
      payment_method_id: data.payment_method_id,
    };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Error de conexión con Mercado Pago",
    };
  }
}
