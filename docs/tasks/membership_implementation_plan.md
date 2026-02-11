# Plan de Implementación: Área de Miembros

**Objetivo:** Crear un área exclusiva para suscriptores en AnaReiki con Podcasts y Clases.
**Método:** Integración fiable y sencilla mediante Vercel (Supabase & Cloudinary).

---

## Fase 1: Infraestructura y Configuración (Día 1-2)

### Día 1: Setup del Backend con Vercel Integrations

El objetivo de hoy es conectar tu proyecto de Next.js con Supabase y Cloudinary usando las integraciones nativas de Vercel. Esto configura automáticamente las variables de entorno, evitando errores manuales.

1.  **Integración de Supabase (Base de Datos & Auth):**
    - Ve al Dashboard de tu proyecto en **Vercel**.
    - Click en la pestaña **"Storage"**.
    - Click en **"Create Database"** -> Selecciona **"Supabase"** -> **"Continue"**.
    - Sigue los pasos para crear un nuevo proyecto (selecciona la región más cercana a tus usuarios, ej: `sa-east-1` si están en Sudamérica, o `us-east-1` por defecto).
    - Al finalizar, Vercel agregará automáticamente las variables: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
    - **En local:** Ejecuta `vc env pull .env.local` en tu terminal para descargar esas claves a tu entorno de desarrollo.

2.  **Integración de Cloudinary (Video Hosting):**
    - Ve a [Cloudinary.com](https://cloudinary.com/) y crea una cuenta gratuita si no tienes.
    - En Vercel, ve a **"Integrations"** (Marketplace) -> Busca **"Cloudinary"**.
    - Instala la integración y conéctala a tu cuenta de Cloudinary.
    - Esto configurará `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` y `CLOUDINARY_API_KEY`.
    - **En local:** Ejecuta nuevamente `vc env pull .env.local` si es necesario.

3.  **Instalación de Dependencias:**
    - En tu terminal, ejecuta:
      ```bash
      npm install @supabase/auth-helpers-nextjs @supabase/supabase-js next-cloudinary
      ```

### Día 2: Configuración de Base de Datos (Supabase Dashboard)

1.  **Crear Tabla de Perfiles (Profiles):**
    - Entra al dashboard de Supabase (desde el link en Vercel Storage).
    - Ve al "Table Editor" y crea una tabla `profiles`:
      - `id`: uuid (Primary Key, referencia a `auth.users`).
      - `email`: text.
      - `full_name`: text.
      - `is_premium`: boolean (default: false).
    - **Importante:** Habilita RLS (Row Level Security) y agrega una política para que cada usuario pueda ver/editar solo su propio perfil.

2.  **Crear Tabla de Contenido (Content):**
    - Crea una tabla `content`:
      - `id`: uuid (default `uuid_generate_v4()`).
      - `title`: text.
      - `description`: text.
      - `type`: text (valores: 'video' o 'podcast').
      - `external_id`: text (ID del video en Cloudinary o URL del episodio de Spotify).
      - `published_at`: timestamp.
      - `is_premium`: boolean (default: true).

---

## Fase 2: Autenticación y Seguridad (Día 3-4)

### Día 3: Páginas de Acceso

1.  **Página de Login (`/login`):**
    - Crea un formulario con Email y Password.
    - Usa `supabase.auth.signInWithPassword`.
    - Maneja errores (ej: "Usuario no encontrado").
2.  **Página de Registro (`/registro`):**
    - Formulario similar.
    - Usa `supabase.auth.signUp`.
    - (Opcional pero recomendado) Configura confirmación por email en Supabase Auth Settings (deshabilitar "Confirm email" para desarrollo rápido, habilitar para prod).

### Día 4: Protección de Rutas (Middleware)

1.  **Crear `middleware.ts` en la raíz:**
    - Este archivo interceptará todas las peticiones a `/miembros/*`.
    - Verificará si existe una sesión activa con Supabase.
    - Si no hay sesión -> Redirige a `/login`.
    - Si hay sesión -> Deja pasar.

---

## Fase 3: Desarrollo del Frontend (Día 5-7)

### Día 5: Layout y Dashboard

1.  **Layout de Miembros (`app/miembros/layout.tsx`):**
    - Crea un diseño distinto (ej: sidebar con navegación: "Inicio", "Clases", "Podcasts", "Perfil").
    - Agrega un botón de "Cerrar Sesión" (`supabase.auth.signOut()`).
2.  **Dashboard (`app/miembros/page.tsx`):**
    - Mensaje de bienvenida usando los datos del usuario.
    - Muestra "Lo último agregado" (query simple a la tabla `content` limit 3).

### Día 6: Módulo de Clases (Videos)

1.  **Componente `VideoPlayer`:**
    - Usa el componente `<CldVideoPlayer />` de `next-cloudinary` (o tag HTML5 standard si prefieres simplicidad máxima).
    - Recibe el `public_id` del video en Cloudinary.
2.  **Página de Clases (`app/miembros/clases/page.tsx`):**
    - Realiza un `fetch` a la tabla `content` filtrando por `type = 'video'`.
    - Renderiza una grilla de tarjetas. Al hacer click, lleva al detalle del video.

### Día 7: Módulo de Podcast (Audio)

1.  **Componente `PodcastPlayer`:**
    - Usa el `iframe` de Embed de Spotify.
    - Recibe la URL del episodio.
2.  **Página de Podcast (`app/miembros/podcast/page.tsx`):**
    - Realiza un `fetch` a la tabla `content` filtrando por `type = 'podcast'`.
    - Lista los episodios con su reproductor embebido.

---

## Fase 4: Carga de Contenido y Lanzamiento (Día 8)

### Día 8: Aprovisionamiento y Test

1.  **Subir Contenido:**
    - Sube tus videos a Cloudinary y copia sus `public_id`.
    - Copia los enlaces de tus episodios de Spotify.
    - Inserta manualmente los registros en la tabla `content` de Supabase (puedes hacerlo desde el Table Editor del dashboard, es como un Excel).
2.  **Prueba de Usuario:**
    - Registra un usuario nuevo en tu web.
    - Intenta entrar a `/miembros` sin loguearte (debe rebotar).
    - Loguéate y verifica que puedes ver los videos y escuchar los audios.

---

## Resumen de Tareas Técnicas (Checklist)

- [ ] **Configuración (Vercel)**
  - [ ] `vc env pull` (Sincronizar variables de entorno).
  - [ ] Instalar paquetes npm.
- [ ] **Supabase**
  - [ ] Crear tablas `profiles` y `content`.
  - [ ] Configurar Policies (RLS).
- [ ] **Frontend (Next.js)**
  - [ ] `middleware.ts` (Auth Guard).
  - [ ] `/login` & `/registro` Pages.
  - [ ] `/miembros` Layout & Dashboard.
  - [ ] Componente `VideoPlayer`.
  - [ ] Componente `PodcastPlayer`.
