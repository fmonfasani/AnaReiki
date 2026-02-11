"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database.types";

type Availability = Database["public"]["Tables"]["availability"]["Row"];
type AvailabilityInsert =
  Database["public"]["Tables"]["availability"]["Insert"];

const DAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export default function AgendaPage() {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSlot, setNewSlot] = useState<AvailabilityInsert>({
    day_of_week: 1, // Lunes
    start_time: "09:00",
    end_time: "18:00",
    is_active: true,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("availability")
      .select("*")
      .order("day_of_week")
      .order("start_time");

    if (data) setAvailability(data);
    setLoading(false);
  };

  const addSlot = async () => {
    const { error } = await supabase.from("availability").insert([newSlot]);
    if (!error) {
      fetchAvailability();
      alert("Horario agregado con éxito ✨");
    } else {
      alert("Error al agregar horario: " + error.message);
    }
  };

  const deleteSlot = async (id: string) => {
    if (confirm("¿Estás segura de eliminar este horario?")) {
      await supabase.from("availability").delete().eq("id", id);
      fetchAvailability();
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 font-display">
          Gestión de Agenda
        </h1>
        <p className="text-gray-500">
          Configura tus horarios disponibles para que tus consultantes puedan
          reservar.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Nuevo Horario */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
          <h3 className="font-bold text-lg mb-4 text-gray-800">
            Agregar Disponibilidad
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Día de la Semana
              </label>
              <select
                className="w-full border-gray-200 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                value={newSlot.day_of_week}
                onChange={(e) =>
                  setNewSlot({
                    ...newSlot,
                    day_of_week: parseInt(e.target.value),
                  })
                }
              >
                {DAYS.map((day, index) => (
                  <option key={index} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Desde
                </label>
                <input
                  type="time"
                  className="w-full border-gray-200 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                  value={newSlot.start_time}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, start_time: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hasta
                </label>
                <input
                  type="time"
                  className="w-full border-gray-200 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                  value={newSlot.end_time}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, end_time: e.target.value })
                  }
                />
              </div>
            </div>

            <button
              onClick={addSlot}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-pink-200 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Agregar Horario
            </button>
          </div>
        </div>

        {/* Lista de Horarios Activos */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg text-gray-800 px-2">
            Horarios Semanales Activos
          </h3>

          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
              {availability.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No has configurado ningún horario todavía.
                </div>
              ) : (
                availability.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
                        {DAYS[slot.day_of_week].substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {DAYS[slot.day_of_week]}
                        </p>
                        <p className="text-sm text-gray-500 font-mono">
                          {slot.start_time.substring(0, 5)} -{" "}
                          {slot.end_time.substring(0, 5)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteSlot(slot.id)}
                      className="text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                      title="Eliminar horario"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
