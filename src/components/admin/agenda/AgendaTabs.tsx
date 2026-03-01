"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AgendaTabsProps {
  recurringComponent: React.ReactNode;
  calendarComponent: React.ReactNode;
  pendingComponent: React.ReactNode;
  pendingCount?: number;
}

export default function AgendaTabs({
  recurringComponent,
  calendarComponent,
  pendingComponent,
  pendingCount = 0,
}: AgendaTabsProps) {
  const [activeTab, setActiveTab] = useState<"calendar" | "config" | "pending">("calendar");

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex p-1 space-x-1 bg-gray-100/80 rounded-xl w-fit border border-gray-200">
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
            <span className="material-symbols-outlined text-[18px]">
              calendar_month
            </span>
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
              <span className="bg-pink-600 text-white text-[10px] px-1.5 py-0.5 rounded-full ring-2 ring-gray-100">
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
            <span className="material-symbols-outlined text-[18px]">tune</span>
            Horarios Semanales
          </span>
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "calendar" ? calendarComponent :
            activeTab === "pending" ? pendingComponent :
              recurringComponent}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
