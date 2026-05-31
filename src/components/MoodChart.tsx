"use client";

import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MoodEntry {
  mood_score: number;
  created_at: string;
  intention?: string | null;
}

interface MoodChartProps {
  data: MoodEntry[];
}

const MOOD_COLORS = [
  "bg-red-400",
  "bg-orange-400",
  "bg-yellow-400",
  "bg-lime-400",
  "bg-green-400",
];

const MOOD_LABELS = ["", "Difícil", "Bajo", "Neutral", "Bien", "Excelente"];

export default function MoodChart({ data }: MoodChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No hay datos de ánimo para mostrar. ¡Registrá tu estado cada día!
      </div>
    );
  }

  const maxScore = 5;
  const sorted = [...data].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const chartHeight = 200;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-gray-900 text-sm">Evolución de Ánimo</h4>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((score) => (
            <div key={score} className="flex items-center gap-1">
              <div
                className={`w-2.5 h-2.5 rounded-full ${MOOD_COLORS[score - 1]}`}
              />
              <span className="text-[10px] text-gray-400">{score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative" style={{ height: chartHeight }}>
        <svg
          viewBox={`0 0 ${sorted.length * 60} ${chartHeight}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#db2777" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#db2777" stopOpacity={0} />
            </linearGradient>
          </defs>

          <polygon
            points={sorted
              .map((entry, i) => {
                const x = i * 60 + 30;
                const y =
                  chartHeight -
                  (entry.mood_score / maxScore) * (chartHeight - 20) -
                  10;
                return `${x},${y}`;
              })
              .join(" ") + ` ${sorted.length * 60 - 30},${chartHeight} 30,${chartHeight}`}
            fill="url(#moodGradient)"
          />

          <polyline
            points={sorted
              .map((entry, i) => {
                const x = i * 60 + 30;
                const y =
                  chartHeight -
                  (entry.mood_score / maxScore) * (chartHeight - 20) -
                  10;
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="#db2777"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {sorted.map((entry, i) => {
            const x = i * 60 + 30;
            const y =
              chartHeight -
              (entry.mood_score / maxScore) * (chartHeight - 20) -
              10;
            return (
              <g key={entry.created_at}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="white"
                  stroke={MOOD_COLORS[entry.mood_score - 1].replace("bg-", "#")}
                  strokeWidth="2"
                  className="hover:r-8 transition-all cursor-pointer"
                />
              </g>
            );
          })}
        </svg>

        <div className="flex justify-between mt-2">
          {sorted
            .filter((_, i) => i === 0 || i === sorted.length - 1 || i % 7 === 0)
            .map((entry) => (
              <span key={entry.created_at} className="text-[10px] text-gray-400">
                {format(new Date(entry.created_at), "d MMM", { locale: es })}
              </span>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {sorted.slice(-5).reverse().map((entry) => (
          <div
            key={entry.created_at}
            className="text-center p-2 bg-gray-50 rounded-xl"
          >
            <div className="text-lg">
              {["", "😫", "😕", "😐", "🙂", "🤩"][entry.mood_score]}
            </div>
            <div className="text-[10px] text-gray-400">
              {format(new Date(entry.created_at), "EEE", { locale: es })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
