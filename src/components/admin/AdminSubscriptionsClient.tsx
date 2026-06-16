"use client";

import React, { useState } from "react";

const ALL_FEATURES = [
  "Inicio",
  "Suscripciones",
  "Mis Cursos",
  "Mi Agenda",
  "Comunidad",
  "Mensajes",
  "Mi Perfil",
  "Biblioteca",
  "Clases",
  "Podcast",
  "Chat Buda",
  "Evolución",
];

const ALL_SERVICES = [
  { value: "reiki", label: "Reiki" },
  { value: "meditacion", label: "Meditación" },
  { value: "yoga", label: "Yoga" },
  { value: "clases_grabadas", label: "Clases grabadas" },
];

type Plan = {
  id: string;
  name: string;
  slug: string;
  tier_slug: string;
  interval_type: string;
  price_cents: number;
  description: string | null;
  features: string[];
  included_services: string[];
  badge_text: string | null;
  sort_order: number;
  is_active: boolean;
  subscription_promotions: Promo[];
};

type Promo = {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number;
  promo_code: string | null;
  max_uses: number | null;
  uses_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
};

const TIER_COLORS: Record<string, string> = {
  prana: "from-gray-50 to-gray-100 border-gray-200",
  shakti: "from-blue-50 to-blue-100 border-blue-200",
  ananda: "from-purple-50 to-pink-50 border-purple-200",
};

const TIER_TEXT: Record<string, string> = {
  prana: "text-gray-700",
  shakti: "text-blue-700",
  ananda: "text-purple-700",
};

const fmt = (cents: number) =>
  cents === 0 ? "Gratis" : `$${(cents / 100).toLocaleString("es-AR")}`;

export default function AdminSubscriptionsClient({
  initialPlans,
}: {
  initialPlans: Plan[];
}) {
  const [plans, setPlans] = useState(initialPlans);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPromoFor, setShowPromoFor] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    price_cents: "",
    features: [] as string[],
    included_services: [] as string[],
    badge_text: "",
    is_active: true,
  });

  const [promoForm, setPromoForm] = useState({
    title: "",
    description: "",
    discount_percent: 10,
    promo_code: "",
    max_uses: "",
    valid_until: "",
  });

  const startEdit = (plan: Plan) => {
    setEditingId(plan.id);
    setEditForm({
      name: plan.name,
      price_cents: String(plan.price_cents || 0),
      features: plan.features || [],
      included_services: plan.included_services || [],
      badge_text: plan.badge_text || "",
      is_active: plan.is_active,
    });
  };

  const savePlan = async (planId: string) => {
    const res = await fetch("/api/admin/pricing-plans", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: planId,
        name: editForm.name,
        price_cents: parseInt(editForm.price_cents) || 0,
        features: editForm.features,
        included_services: editForm.included_services,
        badge_text: editForm.badge_text || null,
        is_active: editForm.is_active,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, ...updated } : p))
      );
      setEditingId(null);
    }
  };

  const createPromo = async (planId: string) => {
    const res = await fetch("/api/admin/subscription-promos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan_id: planId,
        title: promoForm.title,
        description: promoForm.description || null,
        discount_percent: promoForm.discount_percent,
        promo_code: promoForm.promo_code || null,
        max_uses: promoForm.max_uses ? parseInt(promoForm.max_uses) : null,
        valid_until: promoForm.valid_until || null,
      }),
    });
    if (res.ok) {
      const promo = await res.json();
      setPlans((prev) =>
        prev.map((p) =>
          p.id === planId
            ? { ...p, subscription_promotions: [...p.subscription_promotions, promo] }
            : p
        )
      );
      setPromoForm({ title: "", description: "", discount_percent: 10, promo_code: "", max_uses: "", valid_until: "" });
      setShowPromoFor(null);
    }
  };

  const deletePromo = async (promoId: string, planId: string) => {
    if (!confirm("¿Eliminar esta promoción?")) return;
    const res = await fetch(`/api/admin/subscription-promos?id=${promoId}`, { method: "DELETE" });
    if (res.ok) {
      setPlans((prev) =>
        prev.map((p) =>
          p.id === planId
            ? { ...p, subscription_promotions: p.subscription_promotions.filter((pr) => pr.id !== promoId) }
            : p
        )
      );
    }
  };

  const togglePromoActive = async (promoId: string, planId: string, current: boolean) => {
    const res = await fetch("/api/admin/subscription-promos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: promoId, is_active: !current }),
    });
    if (res.ok) {
      setPlans((prev) =>
        prev.map((p) =>
          p.id === planId
            ? { ...p, subscription_promotions: p.subscription_promotions.map((pr) => (pr.id === promoId ? { ...pr, is_active: !current } : pr)) }
            : p
        )
      );
    }
  };

  const toggleFeature = (feat: string) => {
    setEditForm((prev) => ({
      ...prev,
      features: prev.features.includes(feat)
        ? prev.features.filter((f) => f !== feat)
        : [...prev.features, feat],
    }));
  };

  const toggleService = (svc: string) => {
    setEditForm((prev) => ({
      ...prev,
      included_services: prev.included_services.includes(svc)
        ? prev.included_services.filter((s) => s !== svc)
        : [...prev.included_services, svc],
    }));
  };

  const sorted = [...plans].sort((a, b) => {
    const tierOrder: Record<string, number> = { prana: 0, shakti: 1, ananda: 2 };
    const intOrder = a.interval_type === "monthly" ? 0 : 1;
    const intOrderB = b.interval_type === "monthly" ? 0 : 1;
    return (tierOrder[a.tier_slug] || 0) - (tierOrder[b.tier_slug] || 0) || intOrder - intOrderB;
  });

  return (
    <div className="space-y-8">
      {sorted.map((plan) => {
        const isEditing = editingId === plan.id;
        const tier = plan.tier_slug || "prana";
        const isYearly = plan.interval_type === "yearly";

        return (
          <div key={plan.id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm`}>
            {/* Header */}
            <div className={`p-5 bg-gradient-to-r ${TIER_COLORS[tier] || "from-gray-50 to-gray-100 border-gray-200"}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {isEditing ? (
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="bg-white/80 border-0 rounded-lg text-lg font-bold px-2 py-1"
                      />
                    ) : (
                      <h3 className={`text-xl font-bold ${TIER_TEXT[tier]}`}>{plan.name}</h3>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isYearly ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                      {isYearly ? "Anual" : "Mensual"}
                    </span>
                    {plan.badge_text && !isEditing && (
                      <span className="text-xs bg-white/80 px-2 py-0.5 rounded-full font-medium text-gray-600">{plan.badge_text}</span>
                    )}
                    {!plan.is_active && <span className="text-xs bg-red-200 text-red-700 px-2 py-0.5 rounded-full font-bold">INACTIVO</span>}
                  </div>
                  {plan.description && <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>}
                  <div className="mt-2 flex items-baseline gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500">$</span>
                        <input
                          type="number"
                          value={editForm.price_cents}
                          onChange={(e) => setEditForm({ ...editForm, price_cents: e.target.value })}
                          className="bg-white/80 border-0 rounded-lg text-2xl font-bold w-28 px-2 py-1"
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-400">{isYearly ? "/año" : "/mes"}</span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold text-gray-900">{fmt(plan.price_cents)}</span>
                    )}
                    {!isEditing && plan.price_cents > 0 && (
                      <span className="text-xs text-gray-400">{isYearly ? "/año" : "/mes"}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button onClick={() => savePlan(plan.id)} className="bg-white text-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white/80 border border-gray-200">Guardar</button>
                      <button onClick={() => setEditingId(null)} className="bg-white/50 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white/70">Cancelar</button>
                    </>
                  ) : (
                    <button onClick={() => startEdit(plan)} className="bg-white/50 hover:bg-white/80 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600">Editar</button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Features — checkboxes */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Features</h4>
                {isEditing ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {ALL_FEATURES.map((feat) => {
                      const checked = editForm.features.includes(feat);
                      return (
                        <button
                          key={feat}
                          type="button"
                          onClick={() => toggleFeature(feat)}
                          className={`text-xs px-3 py-2 rounded-lg font-medium transition-all border ${
                            checked
                              ? "bg-green-500 text-white border-green-500"
                              : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {checked ? "✓ " : ""}{feat}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {(plan.features || []).map((f, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{f}</span>
                    ))}
                    {(!plan.features || plan.features.length === 0) && (
                      <span className="text-xs text-gray-400 italic">Sin features</span>
                    )}
                  </div>
                )}
              </div>

              {/* Services — checkboxes */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Servicios incluidos</h4>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {ALL_SERVICES.map((svc) => {
                      const checked = editForm.included_services.includes(svc.value);
                      return (
                        <button
                          key={svc.value}
                          type="button"
                          onClick={() => toggleService(svc.value)}
                          className={`text-xs px-3 py-2 rounded-lg font-medium transition-all border ${
                            checked
                              ? "bg-pink-500 text-white border-pink-500"
                              : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {checked ? "✓ " : ""}{svc.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {(plan.included_services || []).map((s) => (
                      <span key={s} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg border border-green-200 capitalize">
                        {ALL_SERVICES.find((sv) => sv.value === s)?.label || s}
                      </span>
                    ))}
                    {(!plan.included_services || plan.included_services.length === 0) && (
                      <span className="text-xs text-gray-400 italic">Solo contenido general</span>
                    )}
                  </div>
                )}
              </div>

              {/* Active toggle */}
              {isEditing && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-pink-600"
                  />
                  <span className="text-sm text-gray-700">Visible para consultantes</span>
                </label>
              )}

              {/* Promos */}
              {tier !== "prana" && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Promociones</h4>
                    <button
                      onClick={() => setShowPromoFor(showPromoFor === plan.id ? null : plan.id)}
                      className="text-xs text-pink-600 font-bold flex items-center gap-1 hover:text-pink-700"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>Nueva Promo
                    </button>
                  </div>

                  {showPromoFor === plan.id && (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-3 border border-gray-200">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          placeholder="Título (ej: Black Friday)"
                          value={promoForm.title}
                          onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                          className="border-gray-200 rounded-lg text-sm"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">-</span>
                          <input
                            type="number"
                            min="1"
                            max="90"
                            value={promoForm.discount_percent}
                            onChange={(e) => setPromoForm({ ...promoForm, discount_percent: parseInt(e.target.value) || 10 })}
                            className="border-gray-200 rounded-lg text-sm w-16"
                          />
                          <span className="text-sm text-gray-500">% off</span>
                        </div>
                      </div>
                      <input
                        placeholder="Descripción (opcional)"
                        value={promoForm.description}
                        onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                        className="w-full border-gray-200 rounded-lg text-sm"
                      />
                      <div className="grid grid-cols-3 gap-3">
                        <input
                          placeholder="Código (opcional)"
                          value={promoForm.promo_code}
                          onChange={(e) => setPromoForm({ ...promoForm, promo_code: e.target.value })}
                          className="border-gray-200 rounded-lg text-sm"
                        />
                        <input
                          type="date"
                          value={promoForm.valid_until}
                          onChange={(e) => setPromoForm({ ...promoForm, valid_until: e.target.value })}
                          className="border-gray-200 rounded-lg text-sm"
                          title="Vence"
                        />
                        <input
                          type="number"
                          placeholder="Usos máx."
                          value={promoForm.max_uses}
                          onChange={(e) => setPromoForm({ ...promoForm, max_uses: e.target.value })}
                          className="border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => createPromo(plan.id)}
                          disabled={!promoForm.title}
                          className="bg-pink-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-pink-700"
                        >
                          Crear Promo
                        </button>
                        <button onClick={() => setShowPromoFor(null)} className="text-gray-400 text-xs hover:text-gray-600">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {(plan.subscription_promotions || []).length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Sin promociones</p>
                  ) : (
                    <div className="space-y-2">
                      {plan.subscription_promotions.map((promo) => {
                        const discountedPrice = Math.round(plan.price_cents * (1 - promo.discount_percent / 100));
                        return (
                          <div
                            key={promo.id}
                            className={`flex items-center justify-between p-3 rounded-xl text-sm border ${
                              promo.is_active ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200 opacity-60"
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900">{promo.title}</span>
                                <span className="text-green-600 font-bold text-xs">-{promo.discount_percent}%</span>
                                {promo.promo_code && (
                                  <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{promo.promo_code}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                <span>Precio: <span className="line-through">{fmt(plan.price_cents)}</span> → <span className="text-green-600 font-bold">{fmt(discountedPrice)}</span></span>
                                {promo.valid_until && <span>vence {new Date(promo.valid_until).toLocaleDateString("es-AR")}</span>}
                                <span>{promo.uses_count}{promo.max_uses ? `/${promo.max_uses}` : ""} usos</span>
                              </div>
                            </div>
                            <div className="flex gap-1 ml-3">
                              <button
                                onClick={() => togglePromoActive(promo.id, plan.id, promo.is_active)}
                                className={`p-1 rounded ${promo.is_active ? "text-green-600 hover:bg-green-100" : "text-gray-400 hover:bg-gray-100"}`}
                              >
                                <span className="material-symbols-outlined text-sm">{promo.is_active ? "toggle_on" : "toggle_off"}</span>
                              </button>
                              <button
                                onClick={() => deletePromo(promo.id, plan.id)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
