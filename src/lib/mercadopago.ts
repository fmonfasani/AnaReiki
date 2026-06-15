const MP_API_BASE = "https://api.mercadopago.com";

let cachedOauthToken: string | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedOauthToken) return cachedOauthToken;

  try {
    const { getMpCredentials } = await import("@/lib/mercadopago-oauth");
    const creds = await getMpCredentials();
    if (creds?.access_token) {
      cachedOauthToken = creds.access_token;
      return creds.access_token;
    }
  } catch {
    // Fallback a env var si OAuth no está disponible
  }

  return process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
}

type PreferenceItem = {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
};

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
  const accessToken = await getAccessToken();
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

export async function createPaymentPreference(input: {
  items: PreferenceItem[];
  payerEmail: string;
  backUrl: string;
  notificationUrl?: string;
  externalReference: string;
  autoReturn?: string;
}): Promise<{ id: string; init_point: string; sandbox_init_point?: string } | { error: string }> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { error: "Mercado Pago no configurado" };
  }

  try {
    const body: Record<string, unknown> = {
      items: input.items.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: item.currency_id || "ARS",
      })),
      payer: { email: input.payerEmail },
      back_urls: {
        success: `${input.backUrl}?status=success`,
        failure: `${input.backUrl}?status=failure`,
        pending: `${input.backUrl}?status=pending`,
      },
      external_reference: input.externalReference,
      auto_return: input.autoReturn || "approved",
      ...(input.notificationUrl ? { notification_url: input.notificationUrl } : {}),
    };

    const res = await fetch(`${MP_API_BASE}/checkout/preferences`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.message || "Error al crear preferencia de pago" };
    }

    return { id: data.id, init_point: data.init_point, sandbox_init_point: data.sandbox_init_point };
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
  const accessToken = await getAccessToken();
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
  const accessToken = await getAccessToken();
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

export async function cancelPreapproval(
  preapprovalId: string,
): Promise<{ success: true } | { error: string }> {
  const accessToken = await getAccessToken();
  if (!accessToken) return { error: "Mercado Pago no configurado" };

  try {
    const res = await fetch(`${MP_API_BASE}/preapproval/${preapprovalId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ status: "cancelled" }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.message || `Error al cancelar (${res.status})` };
    }

    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Error de conexión con Mercado Pago",
    };
  }
}

export type MpPaymentData = {
  id: number;
  status: string;
  status_detail: string;
  payer: {
    email: string;
    id?: number;
    identification?: { type?: string; number?: string };
    type?: string;
  };
  transaction_amount: number;
  transaction_amount_refunded: number;
  currency_id: string;
  payment_method_id: string;
  payment_type_id: string;
  external_reference: string | null;
  date_created: string | null;
  date_approved: string | null;
  installments: number;
  statement_descriptor: string | null;
  transaction_details: {
    net_received_amount: number;
    total_paid_amount: number;
    overpaid_amount: number;
    installment_amount: number;
    financial_institution: string | null;
    payment_method_reference_id: string | null;
  } | null;
  fee_details: Array<{
    type: string;
    amount: number;
    fee_payer: string;
  }> | null;
  card: {
    last_digits: string | null;
    cardholder: { name: string | null } | null;
  } | null;
} | { error: string };

export async function getPayment(paymentId: string): Promise<MpPaymentData> {
  const accessToken = await getAccessToken();
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
      id: data.id,
      status: data.status,
      status_detail: data.status_detail,
      payer: {
        email: data.payer?.email || "",
        id: data.payer?.id,
        identification: data.payer?.identification,
        type: data.payer?.type,
      },
      transaction_amount: data.transaction_amount,
      transaction_amount_refunded: data.transaction_amount_refunded || 0,
      currency_id: data.currency_id,
      payment_method_id: data.payment_method_id,
      payment_type_id: data.payment_type_id,
      external_reference: data.external_reference || null,
      date_created: data.date_created || null,
      date_approved: data.date_approved || null,
      installments: data.installments || 1,
      statement_descriptor: data.statement_descriptor || null,
      transaction_details: data.transaction_details ? {
        net_received_amount: data.transaction_details.net_received_amount || 0,
        total_paid_amount: data.transaction_details.total_paid_amount || 0,
        overpaid_amount: data.transaction_details.overpaid_amount || 0,
        installment_amount: data.transaction_details.installment_amount || 0,
        financial_institution: data.transaction_details.financial_institution || null,
        payment_method_reference_id: data.transaction_details.payment_method_reference_id || null,
      } : null,
      fee_details: data.fee_details || null,
      card: data.card ? {
        last_digits: data.card.last_digits || null,
        cardholder: data.card.cardholder ? { name: data.card.cardholder.name || null } : null,
      } : null,
    };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Error de conexión con Mercado Pago",
    };
  }
}
