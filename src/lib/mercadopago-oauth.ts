const MP_API_BASE = "https://api.mercadopago.com";

interface MpTokenData {
  access_token: string;
  refresh_token: string;
  mp_user_id: number;
  token_expires_at: string;
}

let cachedToken: MpTokenData | null = null;
let tokenPromise: Promise<MpTokenData | null> | null = null;

export async function getMpCredentials(): Promise<MpTokenData | null> {
  if (cachedToken && new Date(cachedToken.token_expires_at) > new Date()) {
    return cachedToken;
  }

  if (tokenPromise) return tokenPromise;

  tokenPromise = (async () => {
    try {
      const { createServiceClient } = await import("@/lib/supabase/service");
      const svc = createServiceClient();

      const { data } = await svc
        .from("mp_credentials")
        .select("access_token, refresh_token, mp_user_id, token_expires_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!data) return null;

      const expiresAt = new Date(data.token_expires_at);

      if (expiresAt <= new Date()) {
        const refreshed = await refreshMpToken(data.refresh_token);
        if (refreshed) {
          await svc
            .from("mp_credentials")
            .update({
              access_token: refreshed.access_token,
              refresh_token: refreshed.refresh_token,
              token_expires_at: refreshed.token_expires_at,
              updated_at: new Date().toISOString(),
            })
            .eq("mp_user_id", data.mp_user_id);

          cachedToken = refreshed;
          return refreshed;
        }
        return null;
      }

      cachedToken = data as MpTokenData;
      return cachedToken;
    } catch (err) {
      console.error("Error getting MP credentials:", err);
      return null;
    } finally {
      tokenPromise = null;
    }
  })();

  return tokenPromise;
}

export async function saveMpCredentials(tokenData: {
  access_token: string;
  refresh_token: string;
  mp_user_id: number;
  expires_in: number;
  owner_id: string;
}) {
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

  const { createServiceClient } = await import("@/lib/supabase/service");
  const svc = createServiceClient();

  await svc.from("mp_credentials").insert({
    owner_id: tokenData.owner_id,
    mp_user_id: tokenData.mp_user_id,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    token_expires_at: expiresAt,
    is_active: true,
  });

  cachedToken = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    mp_user_id: tokenData.mp_user_id,
    token_expires_at: expiresAt,
  };
}

async function refreshMpToken(refreshToken: string): Promise<MpTokenData | null> {
  const clientId = process.env.MP_CLIENT_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("MP_CLIENT_ID or MP_CLIENT_SECRET not configured");
    return null;
  }

  try {
    const res = await fetch(`${MP_API_BASE}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Failed to refresh MP token:", data);
      return null;
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      mp_user_id: data.user_id,
      token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    };
  } catch (err) {
    console.error("Error refreshing MP token:", err);
    return null;
  }
}

export function getMpAuthUrl(): string {
  const clientId = process.env.MP_CLIENT_ID;
  if (!clientId) return "#";

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || "https://anamurat.online"}/api/mercadopago/oauth/callback`;

  return `https://auth.mercadopago.com.ar/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(redirectUri)}`;
}

export async function exchangeCodeForToken(code: string, ownerId: string): Promise<{ success: boolean; error?: string }> {
  const clientId = process.env.MP_CLIENT_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { success: false, error: "MP OAuth no configurado" };
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || "https://anamurat.online"}/api/mercadopago/oauth/callback`;

  try {
    const res = await fetch(`${MP_API_BASE}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.message || `Error MP (${res.status})` };
    }

    await saveMpCredentials({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      mp_user_id: data.user_id,
      expires_in: data.expires_in,
      owner_id: ownerId,
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error de conexión con MP",
    };
  }
}
