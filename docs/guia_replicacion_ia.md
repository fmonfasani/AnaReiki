# Guía de Replicación: Ecosistema Dev-IA de Alto Rendimiento 🚀

Este documento detalla los pasos para igualar la infraestructura de vanguardia implementada en el proyecto AnaReiki para cualquier nuevo repositorio.

## 1. Infraestructura de Sistema (CLIs y Herramientas) 🛠️

Para que los agentes tengan capacidad de ejecución real en Windows, se requiere instalar las siguientes herramientas mediante **Scoop**:

```powershell
# Instalar Scoop si no está presente
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Out-String | Invoke-Expression

# Motores de IA y Desarrollo
scoop install ollama      # Para IA local (ahorro de tokens)
scoop install supabase    # Sincronización de esquemas y tipos
scoop install git         # Control de versiones avanzado
```

### Configuración de IA Local (Ollama)
Bajar modelos optimizados para codificación:
- `ollama run qwen2.5-coder:7b` (Equilibrio potencia/memoria)
- `ollama run deepseek-coder:6.7b` (Especialista en programación)

---

## 2. Configuración del Agente (El Cerebro AI) 🧠

Crear la carpeta `.codex/` en la raíz del proyecto para definir el comportamiento de la IA.

### A. `.codex/config.toml` (Límites y Control)
```toml
[model]
name = "gpt-5.3-codex"
temperature = 0.2

[context]
max_files_limit = 50
ignore_patterns = ["node_modules/**", ".next/**", "dist/**", ".npm-cache/**"]
```

### B. `.codex/instructions.md` (Manual Maestro)
Este archivo es **fundamental** para reducir el consumo de tokens. Debe incluir:
- **Stack**: Next.js (App Router), Supabase, Framer Motion.
- **Seguridad**: RLS activado, validación en Server Actions.
- **Flujos**: Diferencia entre `/admin` (RBAC en metadata) y `/miembros` (Auth básica).

---

## 3. Flujo de Trabajo y Habilidades (Skills) ⚙️

### Auditoría Técnica Automática
Replicar el archivo `.agents/workflows/analyze.md` con los siguientes pasos:
1. Análisis de vulnerabilidades conocidas (CVEs).
2. Verificación de políticas RLS.
3. Validación de tipos de TypeScript vs Base de Datos.

### Sincronización de Tipos de Datos
Automatizar la generación de tipos para evitar errores de "Application Exception":
```powershell
supabase gen types typescript --project-id "ID_PROYECTO" > src/types/database.types.ts
```

---

## 4. Mejores Prácticas de Memoria (Knowledge Items) 💾

- **Changelog Vivo**: Mantener un archivo `docs/changelog_vX.md` que el agente actualice al final de cada tarea.
- **Auditoría de Seguridad**: Cada cambio en la base de datos debe ser auditado por un "Architect Agent" antes de subir a producción.
- **Limpieza de Deuda**: No dejar warnings de ESLint (como el uso de `<img>` en lugar de `<Image />`) para que la IA no pierda contexto analizando errores conocidos.

---
*Documento generado por el Agente de Ingeniería de AnaReiki v2.2.0*
