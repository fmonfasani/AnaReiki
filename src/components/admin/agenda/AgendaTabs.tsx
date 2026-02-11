"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AgendaTabsProps {
  recurringComponent: React.ReactNode;
  calendarComponent: React.ReactNode;
}

export default function AgendaTabs({
  recurringComponent,
  calendarComponent,
}: AgendaTabsProps) {
  const [activeTab, setActiveTab] = useState<"calendar" | "config">("calendar");

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
            Calendario Visual
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
            Configuración Semanal
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
          {activeTab === "calendar" ? calendarComponent : recurringComponent}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
