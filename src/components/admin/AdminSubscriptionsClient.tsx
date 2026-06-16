"use client";

import React, { useState } from "react";

type Plan = {
  id: string;
  name: string;
  tier_slug: string;
  price_cents: number;
  annual_price_cents: number | null;
  monthly_equiv_cents: number | null;
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

const SERVICE_OPTIONS = [
  { value: "reiki", label: "Reiki" },
  { value: "meditacion", label: "Meditación" },
  { value: "yoga", label: "Yoga" },
  { value: "clases_grabadas", label: "Clases grabadas" },
];

const TIER_COLORS: Record<string, string> = {
  prana: "from-gray-100 to-gray-200 text-gray-700",
  shakti: "from-blue-100 to-blue-200 text-blue-700",
  ananda: "from-purple-100 to-pink-100 text-purple-700",
};

export default function AdminSubscriptionsClient({ initialPlans }: { initialPlans: Plan[] }) {
  const [plans, setPlans] = useState(initialPlans);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [showPromoForm, setShowPromoForm] = useState<string | null>(null);
  const [promoForm, setPromoForm] = useState({ title: "", description: "", discount_percent: 10, promo_code: "", max_uses: "", valid_until: "" });

  const [editForm, setEditForm] = useState({
    name: "",
    annual_price_cents: "",
    features: "",
    included_services: [] as string[],
    badge_text: "",
    is_active: true,
  });

  const startEdit = (plan: Plan) => {
    setEditingPlan(plan.id);
    setEditForm({
      name: plan.name,
      annual_price_cents: String(plan.annual_price_cents || 0),
      features: (plan.features || []).join("\n"),
      included_services: plan.included_services || [],
      badge_text: plan.badge_text || "",
      is_active: plan.is_active,
    });
  };

  const savePlan = async (planId: string) => {
    const annualCents = parseInt(editForm.annual_price_cents) || 0;
    const monthlyCents = Math.round(annualCents / 12);
    const res = await fetch("/api/admin/pricing-plans", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: planId,
        name: editForm.name,
        annual_price_cents: annualCents,
        monthly_equiv_cents: monthlyCents,
        features: editForm.features.split("\n").filter(Boolean),
        included_services: editForm.included_services,
        badge_text: editForm.badge_text || null,
        is_active: editForm.is_active,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, ...updated } : p)));
      setEditingPlan(null);
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
          p.id === planId ? { ...p, subscription_promotions: [...p.subscription_promotions, promo] } : p
        )
      );
      setPromoForm({ title: "", description: "", discount_percent: 10, promo_code: "", max_uses: "", valid_until: "" });
      setShowPromoForm(null);
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
            ? { ...p, subscription_promotions: p.subscription_promotions.map((pr) => pr.id === promoId ? { ...pr, is_active: !current } : pr) }
            : p
        )
      );
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toLocaleString("es-AR")}`;

  return (
    <div className="space-y-6">
      {plans.map((plan) => {
        const isEditing = editingPlan === plan.id;
        const monthlyEquiv = plan.annual_price_cents ? Math.round(plan.annual_price_cents / 12) : 0;

        return (
          <div key={plan.id} className={`bg-white rounded-2xl border border-gray-200 overflow-hidden`}>
            {/* Plan Header */}
            <div className={`p-6 bg-gradient-to-r ${TIER_COLORS[plan.tier_slug] || "from-gray-100 to-gray-200 text-gray-700"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="bg-white/80 border-0 rounded-lg text-lg font-bold px-2 py-1" />
                    ) : (
                      <h3 className="text-2xl font-bold">{plan.name}</h3>
                    )}
                    {plan.badge_text && <span className="text-xs bg-white/80 px-2 py-0.5 rounded-full font-medium">{plan.badge_text}</span>}
                    {!plan.is_active && <span className="text-xs bg-red-200 text-red-700 px-2 py-0.5 rounded-full font-bold">INACTIVO</span>}
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">$</span>
                        <input type="number" value={editForm.annual_price_cents} onChange={(e) => setEditForm({ ...editForm, annual_price_cents: e.target.value })} className="bg-white/80 border-0 rounded-lg text-2xl font-bold w-32 px-2 py-1" placeholder="0" />
                        <span className="text-sm">/año</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-3xl font-bold">{formatPrice(plan.annual_price_cents || 0)}</span>
                        <span className="text-sm opacity-80">/año</span>
                        {monthlyEquiv > 0 && (
                          <span className="text-sm opacity-60 ml-2">({formatPrice(monthlyEquiv)}/mes)</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button onClick={() => savePlan(plan.id)} className="bg-white text-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white/80">Guardar</button>
                      <button onClick={() => setEditingPlan(null)} className="bg-white/50 text-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white/70">Cancelar</button>
                    </>
                  ) : (
                    <button onClick={() => startEdit(plan)} className="bg-white/50 hover:bg-white/80 px-3 py-1.5 rounded-lg text-xs font-bold">Editar</button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Features */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2">Features incluidas</h4>
                {isEditing ? (
                  <textarea
                    value={editForm.features}
                    onChange={(e) => setEditForm({ ...editForm, features: e.target.value })}
                    className="w-full border-gray-200 rounded-lg text-sm h-24"
                    placeholder="Una feature por línea"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(plan.features || []).map((f, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{f}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Services */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2">Servicios incluidos</h4>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_OPTIONS.map((s) => (
                      <label key={s.value} className={`text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-all ${editForm.included_services.includes(s.value) ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        <input type="checkbox" className="hidden" checked={editForm.included_services.includes(s.value)} onChange={(e) => {
                          const newServices = e.target.checked
                            ? [...editForm.included_services, s.value]
                            : editForm.included_services.filter((sv) => sv !== s.value);
                          setEditForm({ ...editForm, included_services: newServices });
                        }} />
                        {s.label}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(plan.included_services || []).map((s) => (
                      <span key={s} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg capitalize">{s.replace("_", " ")}</span>
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
                  <input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} className="w-4 h-4 rounded text-pink-600" />
                  <span className="text-sm text-gray-700">Visible para consultantes</span>
                </label>
              )}

              {/* Promotions */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-700">Promociones</h4>
                  {plan.tier_slug !== "prana" && (
                    <button onClick={() => setShowPromoForm(showPromoForm === plan.id ? null : plan.id)} className="text-xs text-pink-600 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">add</span>Nueva Promo
                    </button>
                  )}
                </div>

                {showPromoForm === plan.id && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder="Título (ej: Black Friday)" value={promoForm.title} onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })} className="border-gray-200 rounded-lg text-sm" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">%</span>
                        <input type="number" min="1" max="90" value={promoForm.discount_percent} onChange={(e) => setPromoForm({ ...promoForm, discount_percent: parseInt(e.target.value) || 10 })} className="border-gray-200 rounded-lg text-sm w-20" />
                        <span className="text-sm text-gray-500">off</span>
                      </div>
                    </div>
                    <input placeholder="Descripción (opcional)" value={promoForm.description} onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })} className="w-full border-gray-200 rounded-lg text-sm" />
                    <div className="grid grid-cols-3 gap-3">
                      <input placeholder="Código (opcional)" value={promoForm.promo_code} onChange={(e) => setPromoForm({ ...promoForm, promo_code: e.target.value })} className="border-gray-200 rounded-lg text-sm" />
                      <input type="date" value={promoForm.valid_until} onChange={(e) => setPromoForm({ ...promoForm, valid_until: e.target.value })} className="border-gray-200 rounded-lg text-sm" title="Vence" />
                      <input type="number" placeholder="Usos máx." value={promoForm.max_uses} onChange={(e) => setPromoForm({ ...promoForm, max_uses: e.target.value })} className="border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => createPromo(plan.id)} disabled={!promoForm.title} className="bg-pink-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50">Crear Promo</button>
                      <button onClick={() => setShowPromoForm(null)} className="text-gray-400 text-xs">Cancelar</button>
                    </div>
                  </div>
                )}

                {plan.subscription_promotions.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Sin promociones activas</p>
                ) : (
                  <div className="space-y-2">
                    {plan.subscription_promotions.map((promo) => (
                      <div key={promo.id} className={`flex items-center justify-between p-3 rounded-xl text-sm ${promo.is_active ? "bg-green-50" : "bg-gray-50 opacity-60"}`}>
                        <div>
                          <span className="font-bold text-gray-900">{promo.title}</span>
                          <span className="ml-2 text-green-600 font-bold">-{promo.discount_percent}%</span>
                          {promo.promo_code && <span className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded">{promo.promo_code}</span>}
                          {promo.valid_until && <span className="ml-2 text-xs text-gray-400">hasta {new Date(promo.valid_until).toLocaleDateString("es-AR")}</span>}
                          <span className="ml-2 text-xs text-gray-400">{promo.uses_count}{promo.max_uses ? `/${promo.max_uses}` : ""} usos</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => togglePromoActive(promo.id, plan.id, promo.is_active)} className={`p-1 rounded ${promo.is_active ? "text-green-600 hover:bg-green-100" : "text-gray-400 hover:bg-gray-100"}`}>
                            <span className="material-symbols-outlined text-sm">{promo.is_active ? "toggle_on" : "toggle_off"}</span>
                          </button>
                          <button onClick={() => deletePromo(promo.id, plan.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
