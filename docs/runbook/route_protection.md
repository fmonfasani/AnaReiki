# Guía: Sistema de Protección de Rutas

## 📋 Resumen

El middleware de Next.js (`src/middleware.ts`) protege automáticamente las rutas del área de miembros y gestiona las redirecciones de autenticación.

---

## 🔒 Rutas Protegidas

### `/miembros/*` - Área de Miembros

- **Requiere**: Usuario autenticado
- **Si no autenticado**: Redirige a `/login`
- **Implementación**: Usa `updateSession()` de Supabase

### `/login` y `/registro` - Páginas de Autenticación

- **Requiere**: Usuario NO autenticado
- **Si ya autenticado**: Redirige a `/miembros`
- **Propósito**: Evitar que usuarios logueados vean páginas de login

---

## 🛠️ Cómo Funciona

### 1. Protección de `/miembros`

```typescript
if (request.nextUrl.pathname.startsWith("/miembros")) {
  return await updateSession(request);
}
```

- Verifica la sesión de Supabase
- Si no hay sesión válida → redirige a `/login`
- Si hay sesión válida → permite el acceso

### 2. Redirección desde páginas de Auth

```typescript
if (
  request.nextUrl.pathname.startsWith("/login") ||
  request.nextUrl.pathname.startsWith("/registro")
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return NextResponse.redirect(new URL("/miembros", request.url));
  }
}
```

- Verifica si el usuario ya está autenticado
- Si está logueado → redirige a `/miembros`
- Si no está logueado → permite acceso a login/registro

---

## 🎯 Flujo de Usuario

### Usuario No Autenticado

1. Intenta acceder a `/miembros` → Redirigido a `/login`
2. Completa login → Redirigido a `/miembros`
3. Intenta volver a `/login` → Redirigido a `/miembros` (ya está logueado)

### Usuario Autenticado

1. Accede a `/miembros` → ✅ Acceso permitido
2. Intenta acceder a `/login` → Redirigido a `/miembros`
3. Cierra sesión → Puede acceder a `/login` nuevamente

---

## 🔧 Configuración del Matcher

```typescript
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**Excluye del middleware:**

- Archivos estáticos (`_next/static`)
- Imágenes optimizadas (`_next/image`)
- Favicon
- Archivos de imagen (svg, png, jpg, etc.)

**Incluye:**

- Todas las demás rutas

---

## 🧪 Probar el Sistema

### Test 1: Protección de Rutas

1. Abre el navegador en modo incógnito
2. Ve a `http://localhost:3000/miembros`
3. **Resultado esperado**: Redirige a `/login`

### Test 2: Login Exitoso

1. En `/login`, ingresa credenciales válidas
2. **Resultado esperado**: Redirige a `/miembros`

### Test 3: Redirección de Usuarios Autenticados

1. Estando logueado, ve a `http://localhost:3000/login`
2. **Resultado esperado**: Redirige a `/miembros`

### Test 4: Logout

1. Estando en `/miembros`, haz click en "Cerrar Sesión"
2. **Resultado esperado**: Redirige a `/login`
3. Intenta acceder a `/miembros`
4. **Resultado esperado**: Redirige a `/login`

---

## 🚨 Troubleshooting

### Error: "Redirect loop"

- **Causa**: Middleware redirigiendo infinitamente
- **Solución**: Verifica que las rutas de login/registro estén excluidas de la protección

### Error: "Session not found"

- **Causa**: Variables de entorno de Supabase no configuradas
- **Solución**: Verifica `.env.local` tiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Usuario no redirige después de login

- **Causa**: `router.refresh()` no se ejecutó
- **Solución**: Asegúrate de llamar `router.refresh()` después del login

---

## 📝 Agregar Nuevas Rutas Protegidas

Para proteger una nueva ruta (ej: `/admin`):

```typescript
export async function middleware(request: NextRequest) {
  // Proteger rutas de miembros Y admin
  if (
    request.nextUrl.pathname.startsWith("/miembros") ||
    request.nextUrl.pathname.startsWith("/admin")
  ) {
    return await updateSession(request);
  }

  // ... resto del código
}
```
