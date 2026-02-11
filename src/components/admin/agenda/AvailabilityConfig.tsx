"use client";

import { useState } from "react";
import { saveAvailability } from "@/actions/agenda";
import { motion } from "framer-motion";

const DAYS = [
  { id: 1, label: "Lunes" },
  { id: 2, label: "Martes" },
  { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" },
  { id: 5, label: "Viernes" },
  { id: 6, label: "Sábado" },
  { id: 0, label: "Domingo" },
];

interface AvailabilityConfigProps {
  initialData: any[];
  sessionDuration: number;
  bufferTime: number;
}

export default function AvailabilityConfig({
  initialData,
  sessionDuration = 60,
  bufferTime = 0,
}: AvailabilityConfigProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [duration, setDuration] = useState(sessionDuration);
  const [buffer, setBuffer] = useState(bufferTime);

  const [schedule, setSchedule] = useState(() => {
    // ... (rest of init)
    // Initialize schedule based on initialData
    return DAYS.map((day) => {
      const existing = initialData.find((d) => d.day_of_week === day.id);
      return {
        ...day,
        active: !!existing,
        startTime: existing?.start_time || "09:00",
        endTime: existing?.end_time || "17:00",
      };
    });
  });

  const handleToggleDay = (id: number) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.id === id ? { ...day, active: !day.active } : day,
      ),
    );
  };

  const handleChangeTime = (
    id: number,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setSchedule((prev) =>
      prev.map((day) => (day.id === id ? { ...day, [field]: value } : day)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const activeDays = schedule.filter((day) => day.active);
      const formData = new FormData();
      formData.append("availability", JSON.stringify(activeDays));
      formData.append("sessionDuration", duration.toString());
      formData.append("bufferTime", buffer.toString());

      const result = await saveAvailability(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("Error inesperado al guardar.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-display font-bold text-gray-900">
            Configuración de Disponibilidad
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Define tus horarios semanales para que los clientes puedan reservar.
          </p>
        </div>

        <div className="flex items-center gap-6">
          {/* Session Duration */}
          <div className="flex items-center gap-2 bg-pink-50 px-4 py-2 rounded-lg border border-pink-100">
            <span className="material-symbols-outlined text-pink-600">
              timer
            </span>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-pink-700 uppercase tracking-wider">
                Duración
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="15"
                  max="180"
                  step="15"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="bg-transparent border-none p-0 text-pink-900 font-bold w-12 focus:ring-0 text-sm"
                />
                <span className="text-xs text-pink-700">min</span>
              </div>
            </div>
          </div>

          {/* Buffer Time */}
          <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg border border-purple-100">
            <span className="material-symbols-outlined text-purple-600">
              hourglass_empty
            </span>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                Espera (Buffer)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="60"
                  step="5"
                  value={buffer}
                  onChange={(e) => setBuffer(parseInt(e.target.value))}
                  className="bg-transparent border-none p-0 text-purple-900 font-bold w-12 focus:ring-0 text-sm"
                />
                <span className="text-xs text-purple-700">min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {schedule.map((day) => (
            <motion.div
              layout
              key={day.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                day.active
                  ? "bg-white border-gray-200 shadow-sm"
                  : "bg-gray-50 border-transparent opacity-60"
              }`}
            >
              <div className="flex items-center gap-3 w-40">
                <input
                  type="checkbox"
                  checked={day.active}
                  onChange={() => handleToggleDay(day.id)}
                  className="w-5 h-5 rounded text-pink-600 focus:ring-pink-500 border-gray-300 transition"
                />
                <span
                  className={`font-medium ${day.active ? "text-gray-900" : "text-gray-500"}`}
                >
                  {day.label}
                </span>
              </div>

              {day.active && (
                <div className="flex items-center gap-4 flex-1 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                      De
                    </span>
                    <input
                      type="time"
                      value={day.startTime}
                      onChange={(e) =>
                        handleChangeTime(day.id, "startTime", e.target.value)
                      }
                      className="form-input rounded-lg border-gray-300 text-sm focus:border-pink-500 focus:ring-pink-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                      Hasta
                    </span>
                    <input
                      type="time"
                      value={day.endTime}
                      onChange={(e) =>
                        handleChangeTime(day.id, "endTime", e.target.value)
                      }
                      className="form-input rounded-lg border-gray-300 text-sm focus:border-pink-500 focus:ring-pink-500"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
          {success && (
            <span className="text-green-600 text-sm font-medium flex items-center gap-1 animate-in fade-in">
              <span className="material-symbols-outlined text-lg">
                check_circle
              </span>
              Cambios guardados
            </span>
          )}
          {error && (
            <span className="text-red-600 text-sm font-medium flex items-center gap-1 animate-in fade-in">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </span>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">save</span>
                Guardar Horarios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
