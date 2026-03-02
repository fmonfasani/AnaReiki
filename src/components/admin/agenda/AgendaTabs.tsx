"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import PendingAppointments from "./PendingAppointments";
import ManageAllSessionsClient from "./ManageAllSessionsClient";

interface AgendaTabsProps {
  recurringComponent: React.ReactNode;
  calendarComponent: React.ReactNode;
  pendingCount?: number;
  appointments: any[];
}

export default function AgendaTabs({
  recurringComponent,
  calendarComponent,
  pendingCount = 0,
  appointments,
}: AgendaTabsProps) {
  const [activeTab, setActiveTab] = useState<"calendar" | "config" | "pending" | "history">("calendar");

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-gray-100/80 backdrop-blur-md rounded-xl border border-gray-200 w-fit">
        <button
          onClick={() => setActiveTab("calendar")}
          className={`
            relative px-6 py-2.5 text-sm font-bold rounded-lg transition-colors
            ${activeTab === "calendar" ? "text-pink-700" : "text-gray-500 hover:text-gray-700"}
          `}
        >
          {activeTab === "calendar" && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-white rounded-lg shadow-sm border border-gray-200/50"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            Vista Calendario
          </span>
        </button>

        <button
          onClick={() => setActiveTab("pending")}
          className={`
            relative px-6 py-2.5 text-sm font-bold rounded-lg transition-colors
            ${activeTab === "pending" ? "text-pink-700" : "text-gray-500 hover:text-gray-700"}
          `}
        >
          {activeTab === "pending" && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-white rounded-lg shadow-sm border border-gray-200/50"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            Solicitudes
            {pendingCount > 0 && (
              <span className="bg-pink-600 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {pendingCount}
              </span>
            )}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("config")}
          className={`
            relative px-6 py-2.5 text-sm font-bold rounded-lg transition-colors
            ${activeTab === "config" ? "text-pink-700" : "text-gray-500 hover:text-gray-700"}
          `}
        >
          {activeTab === "config" && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-white rounded-lg shadow-sm border border-gray-200/50"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">settings_backup_restore</span>
            Horarios Semanales
          </span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`
            relative px-6 py-2.5 text-sm font-bold rounded-lg transition-colors
            ${activeTab === "history" ? "text-pink-700" : "text-gray-500 hover:text-gray-700"}
          `}
        >
          {activeTab === "history" && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-white rounded-lg shadow-sm border border-gray-200/50"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">history</span>
            Gestión Global
          </span>
        </button>
      </div>

      {/* Content Area */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-[400px]"
      >
        {activeTab === "calendar" && calendarComponent}
        {activeTab === "config" && recurringComponent}
        {activeTab === "pending" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 font-display">Solicitudes Pendientes</h3>
            <PendingAppointments appointments={appointments} />
          </div>
        )}
        {activeTab === "history" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 font-display">Historial y Gestión Global</h3>
            <ManageAllSessionsClient initialAppointments={appointments} />
          </div>
        )}
      </motion.div>
    </div>
  );
}
