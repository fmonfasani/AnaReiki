# Análisis y Estrategia: Área de Miembros (Podcast & Clases)

## Resumen Ejecutivo

Implementación de un área exclusiva para suscriptores en `AnaReiki`. Los usuarios registrados tendrán acceso a contenido premium: Podcasts (vía Spotify) y Clases Grabadas (vía Cloudinary). La gestión de usuarios y autenticación se realizará con Supabase (Free Tier).

---

## 1. Arquitectura Técnica

### A. Base de Datos y Autenticación (Supabase)

Utilizaremos **Supabase** como backend-as-a-service.

- **Auth:** Manejo de registro, login y sesiones de usuario (Email/Password + Google Auth opcional).
- **Database (PostgreSQL):**
  - `users`: Perfiles de usuario extendidos (si es necesario).
  - `subscriptions`: Estado de la suscripción (Free, Premium, etc.). _Inicialmente simple: registrado = acceso._
  - `content`: Tabla unificada o separada para gestionar qué videos/podcasts mostrar.
    - `id`, `title`, `description`, `type` (video/podcast), `external_url` (Cloudinary/Spotify), `published_at`.

### B. Almacenamiento de Medios

- **Videos (Clases):** **Cloudinary**.
  - Optimizado para streaming de video.
  - Permite transformación de formato y calidad automática.
  - Player personalizado o nativo de HTML5.
- **Audio (Podcast):** **Spotify**.
  - Seguimos con la estrategia híbrida.
  - Los episodios se traen vía API o RSS de Spotify.
  - _Nota:_ Si el podcast es público en Spotify, "protegerlo" en la web solo oculta el acceso _desde la web_. Si alguien busca en Spotify, lo encontrará. **Estrategia:** Usar la web para curar el contenido y dar una experiencia "Premium", o aceptar que el audio es público pero la web lo organiza mejor.

### C. Frontend (Next.js)

- **Rutas Protegidas:** Uso de Middleware de Next.js + Supabase Auth Helpers para proteger `/miembros`, `/miembros/podcast`, `/miembros/clases`.
- **UI:** Diseño coherente con el resto del sitio, pero con un menú lateral o superior específico para el área de miembros.

---

## 2. Estrategia de Implementación

1.  **Fase 1: Configuración (Foundation)**
    - Configurar proyecto en Supabase.
    - Configurar cuenta en Cloudinary.
    - Integrar SDKs en Next.js.

2.  **Fase 2: Autenticación (Gatekeeper)**
    - Crear páginas de Sign Up / Login.
    - Proteger rutas `/dashboard` o `/miembros`.

3.  **Fase 3: Desarrollo de Contenido (The Core)**
    - **Módulo de Clases:** Galería de videos obteniendo metadatos de Supabase y cargando player de Cloudinary.
    - **Módulo de Podcast:** Lista de episodios (fechados desde RSS/API) embebidos.

4.  **Fase 4: Administración (Backoffice)**
    - Forma sencilla de agregar nuevo contenido (puede ser directo en el dashboard de Supabase inicialmente para ahorrar tiempo de desarrollo, o un admin panel muy simple).

---

## 3. Tareas de Implementación

### Configuración e Infraestructura

- [ ] Crear proyecto en Supabase y obtener claves API.
- [ ] Configurar tablas en Supabase (`profiles`, `videos`, `podcasts`).
- [ ] Instalar dependencias: `@supabase/auth-helpers-nextjs`, `@supabase/supabase-js`, `next-cloudinary`.

### Autenticación

- [ ] Crear página `/login` y `/registro` con formularios estilizados.
- [ ] Implementar `middleware.ts` para proteger rutas `/miembros/*`.
- [ ] Crear contexto de autenticación o hook `useUser` para manejar estado en el cliente.

### Área de Miembros (Frontend)

- [ ] Crear Layout para miembros (Sidebar/Navbar distintivo).
- [ ] Diseñar Dashboard principal (Bienvenida + Resumen de contenido reciente).

### Módulo de Videos (Clases)

- [ ] Subir videos de prueba a Cloudinary.
- [ ] Crear componente `VideoPlayer` (usando `next-cloudinary` o `video` tag).
- [ ] Crear página `/miembros/clases` que liste los videos desde la DB.

### Módulo de Podcast

- [ ] Integrar lectura de RSS Feed de Spotify o usar URLs manuales en DB.
- [ ] Crear componente `PodcastCard` con reproductor embebido de Spotify.
- [ ] Crear página `/miembros/podcast`.

### Base de Datos (SQL Inicial)

```sql
-- Ejemplo de estructura simple
create table videos (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  cloudinary_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```
