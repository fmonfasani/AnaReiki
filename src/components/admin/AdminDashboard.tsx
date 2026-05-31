"use client";

import React from "react";
import Link from "next/link";

interface KPIs {
  totalUsers: number;
  premiumUsers: number;
  pendingAppointments: number;
  activeThisMonth: number;
  appointmentsThisMonth: number;
  recentSignups: number;
  avgMood: number | null;
}

export default function AdminDashboard({ kpis }: { kpis: KPIs }) {
  const premiumRate =
    kpis.totalUsers > 0
      ? ((kpis.premiumUsers / kpis.totalUsers) * 100).toFixed(1)
      : "0";

  const cards = [
    {
      label: "Consultantes Totales",
      value: kpis.totalUsers,
      sub: `${kpis.recentSignups} nuevos este mes`,
      icon: "group",
      color: "purple",
    },
    {
      label: "Premium",
      value: kpis.premiumUsers,
      sub: `${premiumRate}% conversión`,
      icon: "diamond",
      color: "pink",
    },
    {
      label: "Activos este Mes",
      value: kpis.activeThisMonth,
      sub: `${kpis.totalUsers > 0 ? ((kpis.activeThisMonth / kpis.totalUsers) * 100).toFixed(0) : 0}% engagement`,
      icon: "monitoring",
      color: "teal",
    },
    {
      label: "Citas Pendientes",
      value: kpis.pendingAppointments,
      sub: `${kpis.appointmentsThisMonth} este mes`,
      icon: "event",
      color: "orange",
    },
    {
      label: "Ánimo Promedio",
      value: kpis.avgMood ?? "—",
      sub: "de 5 en la última semana",
      icon: "spa",
      color: "green",
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 font-display">
          Panel de Control 🛠️
        </h1>
        <p className="text-gray-500">
          KPIs, métricas de engagement y acceso rápido a la gestión.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {card.label}
              </span>
              <span
                className={`material-symbols-outlined text-${card.color}-600 bg-${card.color}-50 p-1.5 rounded-lg text-sm`}
              >
                {card.icon}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/consultantes"
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-pink-200 transition-all group"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-pink-600 bg-pink-50 p-2 rounded-xl text-2xl">
              groups
            </span>
            <div>
              <h3 className="font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
                Directorio de Consultantes
              </h3>
              <p className="text-sm text-gray-500">
                {kpis.totalUsers} consultantes — gestioná perfiles, premium y más
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/agenda"
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-pink-200 transition-all group"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-purple-600 bg-purple-50 p-2 rounded-xl text-2xl">
              calendar_month
            </span>
            <div>
              <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                Agenda y Disponibilidad
              </h3>
              <p className="text-sm text-gray-500">
                {kpis.pendingAppointments} citas pendientes de confirmar
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/contenido"
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-pink-200 transition-all group"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-teal-600 bg-teal-50 p-2 rounded-xl text-2xl">
              video_library
            </span>
            <div>
              <h3 className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                Centro de Contenido
              </h3>
              <p className="text-sm text-gray-500">
                Subí nuevas clases y episodios de podcast
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/email-marketing"
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-pink-200 transition-all group"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-amber-600 bg-amber-50 p-2 rounded-xl text-2xl">
              mail
            </span>
            <div>
              <h3 className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                Email Marketing
              </h3>
              <p className="text-sm text-gray-500">
                Enviá comunicaciones a consultantes y segmentos
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
