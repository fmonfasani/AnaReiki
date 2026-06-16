"use client";

import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Appointment = {
  id: string;
  status: string;
  start_time: string;
  modality: string;
  price_cents: number | null;
  deposit_cents: number | null;
  balance_cents: number | null;
  payment_status: string | null;
  attendance_result: string | null;
  promotion_id: string | null;
  service_id: string | null;
  created_at: string;
  services: { id: string; name: string; slug: string } | null;
  promotions: { id: string; name: string } | null;
  profiles: { full_name: string | null; email: string | null } | null;
};

type MpPaymentLog = {
  id: string;
  mp_payment_id: number | null;
  appointment_id: string | null;
  user_id: string | null;
  payment_type: string;
  status: string;
  status_detail: string | null;
  transaction_amount: number | null;
  net_received_amount: number | null;
  currency_id: string | null;
  payer_email: string | null;
  payment_method_id: string | null;
  payment_type_id: string | null;
  installments: number;
  statement_descriptor: string | null;
  card_last_digits: string | null;
  cardholder_name: string | null;
  fee_details: Array<{ type: string; amount: number; fee_payer: string }> | null;
  mp_date_created: string | null;
  mp_date_approved: string | null;
  concept: string | null;
  created_at: string;
  profiles?: { full_name: string | null; email?: string | null } | null;
};

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
  mpPayments: MpPaymentLog[];
  appointments: Appointment[];
  totalRevenue: number;
  sessionRevenue: number;
  activeSubscriptions: number;
}

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-green-100 text-green-700 border-green-200",
  paid: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  pending_payment: "bg-amber-100 text-amber-700 border-amber-200",
  pending_confirmation: "bg-purple-100 text-purple-700 border-purple-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  refunded: "bg-gray-100 text-gray-500 border-gray-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
  active: "bg-green-100 text-green-700 border-green-200",
  canceled: "bg-gray-100 text-gray-500 border-gray-200",
  expired: "bg-red-100 text-red-700 border-red-200",
  past_due: "bg-orange-100 text-orange-700 border-orange-200",
  completed: "bg-green-100 text-green-700 border-green-200",
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  session: { label: "Sesión", color: "bg-blue-100 text-blue-700" },
  subscription: { label: "Suscripción", color: "bg-purple-100 text-purple-700" },
  promo_bundle: { label: "Promo", color: "bg-amber-100 text-amber-700" },
  offline_balance: { label: "Offline", color: "bg-gray-100 text-gray-700" },
};

export default function AdminPayments({
  payments,
  subscriptions,
  plans,
  mpPayments,
  appointments,
  totalRevenue,
  sessionRevenue,
  activeSubscriptions,
}: AdminPaymentsProps) {
  const [tab, setTab] = useState<"overview" | "all" | "services" | "subscriptions" | "cashflow">("overview");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
  };

  const formatPriceRaw = (amount: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };

  // Combined payment history from mp_payment_logs
  const allMpPayments = useMemo(() => {
    return mpPayments
      .filter((p) => typeFilter === "all" || p.payment_type === typeFilter)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [mpPayments, typeFilter]);

  // Revenue by type
  const revenueByType = useMemo(() => {
    const result: Record<string, number> = { session: 0, subscription: 0, promo_bundle: 0, offline_balance: 0 };
    mpPayments.forEach((p) => {
      if (p.status === "approved" && p.payment_type && result[p.payment_type] !== undefined) {
        result[p.payment_type] += Number(p.transaction_amount) || 0;
      }
    });
    return result;
  }, [mpPayments]);

  // Service analytics from appointments
  const serviceAnalytics = useMemo(() => {
    const serviceCount: Record<string, { name: string; count: number; revenue: number; modality: Record<string, number> }> = {};

    appointments.forEach((a) => {
      const serviceName = a.services?.name || "Sin servicio";
      const serviceId = a.services?.id || "unknown";
      if (!serviceCount[serviceId]) {
        serviceCount[serviceId] = { name: serviceName, count: 0, revenue: 0, modality: {} };
      }
      serviceCount[serviceId].count++;
      serviceCount[serviceId].revenue += (a.deposit_cents || 0) / 100;
      const mod = a.modality || "unknown";
      serviceCount[serviceId].modality[mod] = (serviceCount[serviceId].modality[mod] || 0) + 1;
    });

    return Object.values(serviceCount).sort((a, b) => b.count - a.count);
  }, [appointments]);

  // Promo analytics
  const promoAnalytics = useMemo(() => {
    const promoCount: Record<string, { name: string; count: number; services: string[]; revenue: number }> = {};

    appointments.forEach((a) => {
      if (a.promotions) {
        const promoId = a.promotions.id;
        const promoName = a.promotions.name;
        if (!promoCount[promoId]) {
          promoCount[promoId] = { name: promoName, count: 0, services: [], revenue: 0 };
        }
        promoCount[promoId].count++;
        promoCount[promoId].revenue += (a.deposit_cents || 0) / 100;
        const svcName = a.services?.name || "Sin servicio";
        if (!promoCount[promoId].services.includes(svcName)) {
          promoCount[promoId].services.push(svcName);
        }
      }
    });

    return Object.values(promoCount).sort((a, b) => b.count - a.count);
  }, [appointments]);

  // Offline balance payments
  const offlinePayments = useMemo(() => {
    return mpPayments
      .filter((p) => p.payment_type === "offline_balance")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [mpPayments]);

  const totalMpRevenue = revenueByType.session + revenueByType.subscription + revenueByType.promo_bundle;
  const totalOfflineRevenue = revenueByType.offline_balance;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 font-display">
          Pagos y Analytics
        </h1>
        <p className="text-gray-500">
          Historial de pagos MP, offline, suscripciones y analytics de servicios.
        </p>
      </header>

      {/* Revenue Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Ingresos totales</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatPriceRaw(totalMpRevenue + totalOfflineRevenue)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">MP Sesiones</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatPriceRaw(revenueByType.session)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">MP Suscripciones</p>
          <p className="text-2xl font-bold text-purple-600">
            {formatPriceRaw(revenueByType.subscription)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">MP Promos</p>
          <p className="text-2xl font-bold text-amber-600">
            {formatPriceRaw(revenueByType.promo_bundle)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Offline (transferencia/efectivo)</p>
          <p className="text-2xl font-bold text-gray-600">
            {formatPriceRaw(totalOfflineRevenue)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "overview", label: "Resumen", icon: "dashboard" },
          { key: "all", label: "Todos los pagos", icon: "payments", count: mpPayments.length },
          { key: "services", label: "Servicios y Promos", icon: "analytics" },
          { key: "subscriptions", label: "Suscripciones", icon: "subscriptions", count: subscriptions.length },
          { key: "cashflow", label: "Cash Flow", icon: "account_balance" },
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
            {t.count !== undefined && t.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                tab === t.key ? "bg-white text-pink-600" : "bg-pink-100 text-pink-600"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Revenue by type chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Ingresos por tipo</h3>
            <div className="space-y-3">
              {[
                { label: "Sesiones individuales (MP)", amount: revenueByType.session, color: "bg-blue-500" },
                { label: "Suscripciones (MP)", amount: revenueByType.subscription, color: "bg-purple-500" },
                { label: "Promos (MP)", amount: revenueByType.promo_bundle, color: "bg-amber-500" },
                { label: "Saldos offline", amount: revenueByType.offline_balance, color: "bg-gray-400" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                  <span className="text-sm font-bold text-gray-900">{formatPriceRaw(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent payments */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Últimos 5 pagos</h3>
            <div className="space-y-2">
              {mpPayments.slice(0, 5).map((p) => {
                const typeInfo = TYPE_LABELS[p.payment_type] || { label: p.payment_type, color: "bg-gray-100 text-gray-700" };
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      <span className="text-sm text-gray-700">
                        {p.profiles?.full_name || p.payer_email || "—"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {p.transaction_amount != null ? `$${Number(p.transaction_amount).toFixed(2)}` : "—"}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        {format(new Date(p.created_at), "dd/MM/yy", { locale: es })}
                      </span>
                    </div>
                  </div>
                );
              })}
              {mpPayments.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Sin pagos registrados.</p>
              )}
            </div>
          </div>

          {/* Suscripciones activas */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Suscripciones activas</h3>
            {subscriptions.filter((s) => s.status === "active").length > 0 ? (
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

      {/* All Payments Tab */}
      {tab === "all" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "all", label: "Todos" },
              { key: "session", label: "Sesiones" },
              { key: "subscription", label: "Suscripciones" },
              { key: "promo_bundle", label: "Promos" },
              { key: "offline_balance", label: "Offline" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  typeFilter === f.key
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Consultante</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Concepto</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Monto</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Neto</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Comisión</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Método</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allMpPayments.map((p) => {
                    const feeTotal = p.fee_details?.reduce((sum, f) => sum + (f.amount || 0), 0) || 0;
                    const typeInfo = TYPE_LABELS[p.payment_type] || { label: p.payment_type, color: "bg-gray-100 text-gray-700" };
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {p.mp_date_created
                            ? format(new Date(p.mp_date_created), "dd/MM/yy HH:mm", { locale: es })
                            : format(new Date(p.created_at), "dd/MM/yy HH:mm", { locale: es })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {p.profiles?.full_name || p.payer_email || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">
                          {p.concept || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {p.transaction_amount != null ? `$${Number(p.transaction_amount).toFixed(2)}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-green-600">
                          {p.net_received_amount != null ? `$${Number(p.net_received_amount).toFixed(2)}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-500">
                          {feeTotal > 0 ? `-$${feeTotal.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {p.payment_method_id === "offline" ? "💵 Offline" : p.payment_method_id || "—"}
                          {p.card_last_digits && ` •••${p.card_last_digits}`}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${STATUS_STYLES[p.status] || "bg-gray-100 text-gray-500"}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                          {p.mp_payment_id || "offline"}
                        </td>
                      </tr>
                    );
                  })}
                  {allMpPayments.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-gray-400">
                        No hay pagos de este tipo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Services Analytics Tab */}
      {tab === "services" && (
        <div className="space-y-6">
          {/* Service ranking */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Servicios más pedidos</h3>
            {serviceAnalytics.length > 0 ? (
              <div className="space-y-3">
                {serviceAnalytics.map((svc, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    <span className="text-lg font-bold text-gray-300 w-6 text-center">{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{svc.name}</p>
                      <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                        {Object.entries(svc.modality).map(([mod, count]) => (
                          <span key={mod}>
                            {mod === "online" ? "💻" : "🏠"} {mod} ({count})
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{svc.count} turnos</p>
                      <p className="text-xs text-green-600">${svc.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sin datos de servicios aún.</p>
            )}
          </div>

          {/* Promo analytics */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Promos más vendidas</h3>
            {promoAnalytics.length > 0 ? (
              <div className="space-y-3">
                {promoAnalytics.map((promo, i) => (
                  <div key={i} className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-amber-300">{i + 1}</span>
                        <span className="font-bold text-gray-900">{promo.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">{promo.count} vendidas</span>
                        <span className="text-xs text-green-600 ml-2">${promo.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {promo.services.map((svcName, j) => (
                        <span key={j} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white border border-amber-200 text-amber-700">
                          {svcName}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sin datos de promos aún.</p>
            )}
          </div>

          {/* Modality breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Desglose por modalidad</h3>
            <div className="grid grid-cols-2 gap-4">
              {(() => {
                const online = appointments.filter((a) => a.modality === "online").length;
                const presencial = appointments.filter((a) => a.modality === "presencial").length;
                const total = online + presencial;
                return (
                  <>
                    <div className="p-4 bg-blue-50 rounded-xl text-center">
                      <p className="text-2xl font-bold text-blue-700">{online}</p>
                      <p className="text-xs text-blue-600">💻 Online ({total > 0 ? Math.round(online / total * 100) : 0}%)</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-xl text-center">
                      <p className="text-2xl font-bold text-orange-700">{presencial}</p>
                      <p className="text-xs text-orange-600">🏠 Presencial ({total > 0 ? Math.round(presencial / total * 100) : 0}%)</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions Tab */}
      {tab === "subscriptions" && (
        <div className="space-y-6">
          {/* Plans */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Planes</h3>
            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">{plan.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatPrice(plan.price_cents)}/{plan.interval === "month" ? "mes" : "año"}
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

          {/* Subscription list */}
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
        </div>
      )}
      {/* Cash Flow Tab */}
      {tab === "cashflow" && (() => {
        const MP_FEE_RATE = 0.05;
        const MP_COLLECTION_DAYS = 18;

        type CashFlowItem = {
          id: string;
          date: Date;
          collectionDate: Date;
          source: "session" | "subscription" | "promo_bundle" | "offline_balance";
          label: string;
          gross: number;
          fee: number;
          net: number;
          isOffline: boolean;
        };

        const items: CashFlowItem[] = mpPayments
          .filter((p) => p.status === "approved" && p.transaction_amount)
          .map((p) => {
            const gross = Number(p.transaction_amount) || 0;
            const isOffline = p.payment_type === "offline_balance";
            const fee = isOffline ? 0 : gross * MP_FEE_RATE;
            const net = gross - fee;
            const payDate = new Date(p.mp_date_created || p.created_at);
            const collectionDate = new Date(payDate);
            if (!isOffline) {
              collectionDate.setDate(collectionDate.getDate() + MP_COLLECTION_DAYS);
            }
            const typeInfo = TYPE_LABELS[p.payment_type] || { label: p.payment_type };
            return {
              id: p.id,
              date: payDate,
              collectionDate,
              source: p.payment_type as CashFlowItem["source"],
              label: typeInfo.label,
              gross,
              fee,
              net,
              isOffline,
            };
          })
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        const totalGross = items.reduce((s, i) => s + i.gross, 0);
        const totalFees = items.reduce((s, i) => s + i.fee, 0);
        const totalNet = items.reduce((s, i) => s + i.net, 0);

        const totalCollected = items.reduce((s, i) => s + i.net, 0);
        const pendingCollection = items
          .filter((i) => !i.isOffline && i.collectionDate > new Date())
          .reduce((s, i) => s + i.net, 0);
        const alreadyCollected = totalCollected - pendingCollection;

        const bySource = ["session", "subscription", "promo_bundle", "offline_balance"] as const;
        const sourceStats = bySource.map((src) => {
          const srcItems = items.filter((i) => i.source === src);
          const gross = srcItems.reduce((s, i) => s + i.gross, 0);
          const fee = srcItems.reduce((s, i) => s + i.fee, 0);
          const net = srcItems.reduce((s, i) => s + i.net, 0);
          return { src, label: TYPE_LABELS[src]?.label || src, count: srcItems.length, gross, fee, net };
        }).filter((s) => s.count > 0);

        const monthlyMap: Record<string, { executed: number; collected: number; fees: number }> = {};
        items.forEach((i) => {
          const execKey = `${i.date.getFullYear()}-${String(i.date.getMonth() + 1).padStart(2, "0")}`;
          const collKey = `${i.collectionDate.getFullYear()}-${String(i.collectionDate.getMonth() + 1).padStart(2, "0")}`;
          if (!monthlyMap[execKey]) monthlyMap[execKey] = { executed: 0, collected: 0, fees: 0 };
          monthlyMap[execKey].executed += i.gross;
          monthlyMap[execKey].fees += i.fee;
          if (!monthlyMap[collKey]) monthlyMap[collKey] = { executed: 0, collected: 0, fees: 0 };
          monthlyMap[collKey].collected += i.net;
        });

        const months = Object.keys(monthlyMap).sort();

        const maxExec = Math.max(...months.map((m) => monthlyMap[m].executed), 1);

        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Bruto total</p>
                <p className="text-2xl font-bold text-gray-900">{formatPriceRaw(totalGross)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Comisión MP (~5%)</p>
                <p className="text-2xl font-bold text-red-500">-{formatPriceRaw(totalFees)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Neto total</p>
                <p className="text-2xl font-bold text-green-600">{formatPriceRaw(totalNet)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Ya cobrado</p>
                <p className="text-2xl font-bold text-blue-600">{formatPriceRaw(alreadyCollected)}</p>
              </div>
            </div>

            {/* Pending collection alert */}
            {pendingCollection > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-600">schedule</span>
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Pendiente de cobro MP: {formatPriceRaw(pendingCollection)}
                  </p>
                  <p className="text-xs text-amber-600">
                    MP deposita ~{MP_COLLECTION_DAYS} días después de la transacción
                  </p>
                </div>
              </div>
            )}

            {/* By Source breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Ingresos por fuente</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-3 text-xs font-bold text-gray-500 uppercase">Fuente</th>
                      <th className="pb-3 text-xs font-bold text-gray-500 uppercase text-right">Cant.</th>
                      <th className="pb-3 text-xs font-bold text-gray-500 uppercase text-right">Bruto</th>
                      <th className="pb-3 text-xs font-bold text-gray-500 uppercase text-right">Comisión</th>
                      <th className="pb-3 text-xs font-bold text-gray-500 uppercase text-right">Neto</th>
                      <th className="pb-3 text-xs font-bold text-gray-500 uppercase text-right">% del total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sourceStats.map((s) => (
                      <tr key={s.src}>
                        <td className="py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_LABELS[s.src]?.color || "bg-gray-100"}`}>
                            {s.label}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-gray-700 text-right">{s.count}</td>
                        <td className="py-3 text-sm font-medium text-gray-900 text-right">{formatPriceRaw(s.gross)}</td>
                        <td className="py-3 text-sm text-red-500 text-right">-{formatPriceRaw(s.fee)}</td>
                        <td className="py-3 text-sm font-bold text-green-600 text-right">{formatPriceRaw(s.net)}</td>
                        <td className="py-3 text-sm text-gray-500 text-right">
                          {totalGross > 0 ? `${Math.round((s.gross / totalGross) * 100)}%` : "—"}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t-2 border-gray-200">
                      <td className="pt-3 text-sm text-gray-900">Total</td>
                      <td className="pt-3 text-sm text-gray-900 text-right">{items.length}</td>
                      <td className="pt-3 text-sm text-gray-900 text-right">{formatPriceRaw(totalGross)}</td>
                      <td className="pt-3 text-sm text-red-500 text-right">-{formatPriceRaw(totalFees)}</td>
                      <td className="pt-3 text-sm text-green-600 text-right">{formatPriceRaw(totalNet)}</td>
                      <td className="pt-3 text-sm text-gray-900 text-right">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monthly Cash Flow */}
            {months.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-2">Flujo mensual</h3>
                <p className="text-xs text-gray-400 mb-4">Ejecutado = cuando se pagó | Cobrado = cuando MP deposita (+{MP_COLLECTION_DAYS} días)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-3 text-xs font-bold text-gray-500 uppercase">Mes</th>
                        <th className="pb-3 text-xs font-bold text-gray-500 uppercase text-right">Ejecutado (bruto)</th>
                        <th className="pb-3 text-xs font-bold text-gray-500 uppercase text-right">Comisión MP</th>
                        <th className="pb-3 text-xs font-bold text-gray-500 uppercase text-right">Cobrado (neto)</th>
                        <th className="pb-3 text-xs font-bold text-gray-500 uppercase">Visual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {months.map((m) => {
                        const d = monthlyMap[m];
                        const barWidth = maxExec > 0 ? (d.executed / maxExec) * 100 : 0;
                        return (
                          <tr key={m}>
                            <td className="py-3 text-sm font-medium text-gray-900">
                              {format(new Date(m + "-01"), "MMMM yyyy", { locale: es })}
                            </td>
                            <td className="py-3 text-sm font-medium text-gray-900 text-right">{formatPriceRaw(d.executed)}</td>
                            <td className="py-3 text-sm text-red-500 text-right">-{formatPriceRaw(d.fees)}</td>
                            <td className="py-3 text-sm font-bold text-green-600 text-right">{formatPriceRaw(d.collected)}</td>
                            <td className="py-3 w-48">
                              <div className="h-4 bg-gray-100 rounded-full overflow-hidden relative">
                                <div
                                  className="h-full bg-blue-400 rounded-full"
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Detailed timeline */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Detalle de cobros</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-3 text-xs font-bold text-gray-500 uppercase">Pago</th>
                      <th className="pb-3 text-xs font-bold text-gray-500 uppercase">Fecha pago</th>
                      <th className="pb-3 text-xs font-bold text-gray-500 uppercase">Fecha cobro</th>
                      <th className="pb-3 text-xs font-bold text-gray-500 uppercase text-right">Bruto</th>
                      <th className="pb-3 text-xs font-bold text-gray-500 uppercase text-right">Comisión</th>
                      <th className="pb-3 text-xs font-bold text-gray-500 uppercase text-right">Neto</th>
                      <th className="pb-3 text-xs font-bold text-gray-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((i) => {
                      const now = new Date();
                      const collected = i.isOffline || i.collectionDate <= now;
                      return (
                        <tr key={i.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_LABELS[i.source]?.color || "bg-gray-100"}`}>
                              {i.label}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-gray-700">
                            {format(i.date, "dd/MM/yy")}
                          </td>
                          <td className="py-3 text-sm text-gray-700">
                            {i.isOffline ? "Inmediato" : format(i.collectionDate, "dd/MM/yy")}
                          </td>
                          <td className="py-3 text-sm font-medium text-gray-900 text-right">{formatPriceRaw(i.gross)}</td>
                          <td className="py-3 text-sm text-red-500 text-right">
                            {i.fee > 0 ? `-${formatPriceRaw(i.fee)}` : "—"}
                          </td>
                          <td className="py-3 text-sm font-bold text-green-600 text-right">{formatPriceRaw(i.net)}</td>
                          <td className="py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              collected
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {collected ? "Cobrado" : "Pendiente"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                          Sin pagos aprobados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
