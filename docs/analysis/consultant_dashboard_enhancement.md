# Análisis: Mejora del Dashboard del Consultante (Ana Reiki)

## 🎯 Objetivo

Transformar el dashboard actual de una simple lista de enlaces a un **"Centro de Bienestar Personalizado"** que fomente la retención del consultante y su práctica diaria de Reiki/Yoga.

## 🔍 Estado Actual

- **Dashboard básico**: Saludo personalizado y navegación a Clases/Podcasts.
- **Limitación**: Falta de interactividad y seguimiento del progreso personal.
- **Oportunidad**: El consultante necesita sentir que la plataforma es un acompañamiento diario, no solo un repositorio de videos.

## 💡 Ideas de Valor Agregado

1. **Seguimiento de Intención Diaria**: Una sección para que el consultante registre cómo se siente hoy (Mood Tracker) y qué intención pone a su práctica.
2. **Historia de Consultas/Sesiones**: Un registro de las sesiones presenciales o virtuales tomadas con la profesora, con notas de evolución.
3. **Inspiración Aleatoria**: Un "Oráculo" o frase del día de Reiki/Yoga que cambie cada 24 horas.
4. **Reserva de Citas Integrada**: Ver la disponibilidad de la agenda de la profesora y reservar directamente desde el dashboard.
5. **Racha de Meditación**: Un contador de días seguidos usando la plataforma para gamificar la práctica.

## 🛠️ Requerimientos Técnicos Identificados

- **Base de Datos**: Nueva tabla `session_history` y `user_intentions`.
- **UI/UX**: Componentes de calendario interactivos y gráficas simples de "Bienestar".
- **API**: Endpoints para guardar estados de ánimo e intenciones diarias.

---

## 📈 Conclusión del Análisis

El dashboard debe pasar de ser **estático** a **dinámico**. La clave de la fidelización en este nicho es la **personalización** y el **seguimiento**. El consultante debe sentir que el sistema "sabe" quién es y cómo va su camino de sanación.
