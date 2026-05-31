import OpenAI from "openai";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY no configurada");
    client = new OpenAI({ apiKey: key });
  }
  return client;
}

const SYSTEM_PROMPT = `Sos Ana, una terapeuta holística especializada en Reiki, meditación y bienestar emocional.
Respondé en español argentino, con calidez, empatía y un tono cercano pero profesional.
Tu objetivo es acompañar al consultante en su proceso de sanación.

Usá el contexto de su historial de ánimo y notas de sesión para personalizar tus respuestas.
Datos de ejemplo que recibís:
- Registros de ánimo (mood_score 1-5 con intenciones)
- Notas de sesiones anteriores
- Estado actual del consultante

NO sos un reemplazo de atención médica ni terapia psicológica profesional.
Si detectás señales de crisis, recomendá contactar a un profesional de salud mental.
Sé breve y concisa en tus respuestas (máximo 3 párrafos). Hacé preguntas abiertas para fomentar la reflexión.`;

export async function generateChatResponse(
  messages: { role: "user" | "assistant"; content: string }[],
  userContext?: {
    recentMoods?: { score: number; intention: string | null; date: string }[];
    notes?: string[];
  }
): Promise<string> {
  const openai = getClient();

  const contextBlock = userContext
    ? `\n\nContexto del consultante:\n${
        userContext.recentMoods?.length
          ? `Ánimos recientes: ${userContext.recentMoods.map((m) => `[${m.date}] score:${m.score} "${m.intention || ""}"`).join(" | ")}`
          : "Sin registros de ánimo aún."
      }\n${
        userContext.notes?.length
          ? `Notas de sesión: ${userContext.notes.join(" | ")}`
          : "Sin notas de sesión."
      }`
    : "";

  const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT + contextBlock },
    ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: apiMessages,
    temperature: 0.7,
    max_tokens: 500,
  });

  return res.choices[0]?.message?.content || "No pude procesar tu mensaje. ¿Podrías repetirlo?";
}

export async function generateInsights(params: {
  moods: { score: number; intention: string | null; date: string }[];
  notesCount: number;
  appointmentsCount: number;
}): Promise<{
  summary: string;
  trend: string;
  suggestion: string;
}> {
  const openai = getClient();

  const moodData = params.moods.map((m) => `[${m.date}] ${m.score}/5 "${m.intention || ""}"`).join("\n");

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Sos una terapeuta analizando la evolución emocional de un consultante.
Generá un análisis en español argentino con tres campos:
- summary: Resumen del estado general del consultante (1-2 oraciones)
- trend: Tendencia detectada (mejorando, estable, variable, decreciente)
- suggestion: Una sugerencia terapéutica personalizada (1-2 oraciones)

Respondé SOLO con JSON válido: { "summary": "...", "trend": "...", "suggestion": "..." }`,
      },
      {
        role: "user",
        content: `Datos de los últimos 30 días:\n${moodData}\nNotas de sesión: ${params.notesCount} registros.\nCitas: ${params.appointmentsCount} sesiones.`,
      },
    ],
    temperature: 0.5,
    max_tokens: 300,
    response_format: { type: "json_object" },
  });

  try {
    return JSON.parse(res.choices[0]?.message?.content || "{}");
  } catch {
    return {
      summary: "No pudimos generar el análisis en este momento.",
      trend: "unknown",
      suggestion: "Seguí registrando tu ánimo para obtener insights más precisos.",
    };
  }
}

export async function generateRecommendations(params: {
  moods: { score: number; intention: string | null }[];
  availableContent: { id: string; title: string; description: string | null; type: string; category?: string }[];
}): Promise<{ id: string; reason: string }[]> {
  const openai = getClient();

  const moodSummary = params.moods
    .slice(0, 10)
    .map((m) => `score:${m.score} "${m.intention || ""}"`)
    .join(", ");

  const contentList = params.availableContent.map((c) => `${c.id}|${c.title}|${c.description || ""}|${c.type}|${c.category || ""}`).join("\n");

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Sos una asistente de bienestar que recomienda contenido terapéutico.
Basándote en el estado de ánimo del consultante, seleccioná 1-3 contenidos de la lista.
Respondé SOLO con JSON: { "recommendations": [{ "id": "...", "reason": "..." }] }
La reason debe ser breve (max 15 palabras) y en español argentino.`,
      },
      {
        role: "user",
        content: `Estado de ánimo reciente: ${moodSummary}\n\nContenido disponible:\n${contentList}`,
      },
    ],
    temperature: 0.4,
    max_tokens: 300,
    response_format: { type: "json_object" },
  });

  try {
    const data = JSON.parse(res.choices[0]?.message?.content || "{}");
    return data.recommendations || [];
  } catch {
    return [];
  }
}
