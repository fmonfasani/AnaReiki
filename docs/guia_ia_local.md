# 🦙 Guía: Usando AnaReiki con IA Local (Sin Límites)

Como alcanzaste el límite de OpenAI/Codex, ahora vamos a activar tu **Cerebro Local**. Esto te permite seguir programando gratis y sin que nadie te diga "pará un poco".

## 1. Motores Instalados
Ya instalamos **Ollama** en tu máquina. Actualmente se están descargando estos modelos:
- **`qwen2.5-coder:7b`**: El modelo más potente para programar fuera de OpenAI. Excelente para entender lógica compleja de React/Next.js. (4.7 GB)
- **`qwen2.5-coder:1.5b`**: Un modelo ligero y súper rápido para correcciones rápidas de estilo CSS o pequeños bugs. (1 GB)

## 2. Cómo usarlo en tu editor (VS Code)

Para "conectar" este cerebro local a tu código, te recomiendo instalar la extensión **"Continue"** en VS Code.

### Configuración de Continue con Ollama:
1. Instalá la extensión **Continue** desde el Marketplace.
2. Abrí el archivo de configuración de Continue (`config.json`).
3. Agregá este bloque en `models`:

```json
{
  "models": [
    {
      "title": "AnaReiki Local (Power)",
      "provider": "ollama",
      "model": "qwen2.5-coder:7b"
    },
    {
      "title": "AnaReiki Local (Fast)",
      "provider": "ollama",
      "model": "qwen2.5-coder:1.5b"
    }
  ]
}
```

## 3. Comandos útiles en tu terminal (PowerShell)

Si querés ver el estado de tus IAs locales, usá estos comandos:

```powershell
# Ver qué modelos tenés listos para usar
ollama list

# Ver si el servidor local está "vivo"
# Si falla, ejecutá: ollama serve
curl http://localhost:11434

# Preguntarle algo directamente a la IA (Solo texto)
ollama run qwen2.5-coder:7b "Cómo centro un div en Tailwind?"
```

## 4. Ventajas de este "Plan B":
- **Privacidad total**: Tu código nunca sale de tu computadora.
- **Sin límites**: No hay "Usage Limits" ni esperas hasta el 7 de marzo.
- **Offline**: Podés programar en la playa o sin internet y la IA te va a seguir ayudando.

---
**Nota**: El modelo de 7GB puede tardar unos minutos en descargar dependiendo de tu internet. Una vez que `ollama list` lo muestre, ¡ya podés desconectarte de OpenAI!
