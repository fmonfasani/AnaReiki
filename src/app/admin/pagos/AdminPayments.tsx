"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Payment = {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  mp_payment_id: string | null;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
  profiles?: { full_name: string | null; email?: string | null } | null;
  pricing_plans?: { name: string } | null;
};

type Subscription = {
  id: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  profiles?: { full_name: string | null; email?: string | null } | null;
  pricing_plans?: { name: string } | null;
};

type Plan = {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  currency: string;
  interval: string;
  is_active: boolean;
};

interface AdminPaymentsProps {
  payments: Payment[];
  subscriptions: Subscription[];
  plans: Plan[];
  totalRevenue: number;
  activeSubscriptions: number;
}

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  refunded: "bg-gray-100 text-gray-500 border-gray-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
  active: "bg-green-100 text-green-700 border-green-200",
  canceled: "bg-gray-100 text-gray-500 border-gray-200",
  expired: "bg-red-100 text-red-700 border-red-200",
  past_due: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function AdminPayments({
  payments,
  subscriptions,
  plans,
  totalRevenue,
  activeSubscriptions,
}: AdminPaymentsProps) {
  const [tab, setTab] = useState<"overview" | "payments" | "subscriptions">("overview");
  const [mpConnected, setMpConnected] = useState(false);
  const [mpLoading, setMpLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mercadopago/oauth/status")
      .then((r) => r.json())
      .then((data) => {
        setMpConnected(data.connected);
        setMpLoading(false);
      })
      .catch(() => setMpLoading(false));
  }, []);

  const formatPrice = (cents: number, currency: string) => {
    const amount = cents / 100;
    if (currency === "ARS") return `$${amount.toLocaleString("es-AR")}`;
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 font-display">
          Pagos 💳
        </h1>
        <p className="text-gray-500">
          Gestioná suscripciones y revisá el historial de pagos.
        </p>
        {!mpLoading && (
          <div className={`p-4 rounded-xl border ${mpConnected ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">Mercado Pago</p>
                <p className="text-xs text-gray-500">
                  {mpConnected ? "Conectado correctamente" : "No conectado — vinculá tu cuenta de MP para cobrar"}
                </p>
              </div>
              {!mpConnected && (
                <a
                  href="/api/mercadopago/oauth/link"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors inline-block"
                >
                  Conectar Mercado Pago
                </a>
              )}
            </div>
          </div>
        )}

      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Ingresos totales</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatPrice(totalRevenue, "ARS")}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Suscripciones activas</p>
          <p className="text-2xl font-bold text-gray-900">{activeSubscriptions}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Pagos totales</p>
          <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "overview", label: "Resumen", icon: "dashboard" },
          { key: "payments", label: "Pagos", icon: "payments", count: payments.length },
          { key: "subscriptions", label: "Suscripciones", icon: "subscriptions", count: subscriptions.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
              tab === t.key
                ? "bg-pink-600 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label}
            {(t as any).count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                tab === t.key ? "bg-white text-pink-600" : "bg-pink-100 text-pink-600"
              }`}>
                {(t as any).count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Planes activos</h3>
            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">{plan.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatPrice(plan.price_cents, plan.currency)}/{plan.interval === "month" ? "mes" : "año"}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    plan.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {plan.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Suscripciones activas recientes</h3>
            {subscriptions.filter((s) => s.status === "active").slice(0, 5).length > 0 ? (
              <div className="space-y-2">
                {subscriptions.filter((s) => s.status === "active").slice(0, 5).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                    <span className="text-sm font-medium text-gray-900">
                      {sub.profiles?.full_name || sub.profiles?.email || "Miembro"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {sub.pricing_plans?.name || "Premium"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sin suscripciones activas.</p>
            )}
          </div>
        </div>
      )}

      {tab === "payments" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Miembro</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Plan</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Monto</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Método</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {format(new Date(p.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {p.profiles?.full_name || p.profiles?.email || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {p.pricing_plans?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatPrice(p.amount_cents, p.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${STATUS_STYLES[p.status] || "bg-gray-100 text-gray-500"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {p.payment_method || "—"}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      No hay pagos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "subscriptions" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Miembro</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Plan</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Vence</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Creada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {sub.profiles?.full_name || sub.profiles?.email || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {sub.pricing_plans?.name || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${STATUS_STYLES[sub.status] || "bg-gray-100 text-gray-500"}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(sub.current_period_end), "dd/MM/yyyy", { locale: es })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(sub.created_at), "dd/MM/yyyy", { locale: es })}
                    </td>
                  </tr>
                ))}
                {subscriptions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      Sin suscripciones registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
