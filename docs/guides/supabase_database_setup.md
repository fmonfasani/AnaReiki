# Guía: Configuración de Base de Datos en Supabase

## 📋 Paso a Paso

### 1. Acceder al SQL Editor de Supabase

1. Ve a tu proyecto en **Supabase Dashboard**
2. En el menú lateral, click en **"SQL Editor"**
3. Click en **"New query"**

### 2. Ejecutar el Script de Migración

1. Abre el archivo `supabase/migrations/001_initial_schema.sql`
2. **Copia todo el contenido** del archivo
3. **Pégalo** en el SQL Editor de Supabase
4. Click en **"Run"** (o presiona `Ctrl + Enter`)

### 3. Verificar que se crearon las tablas

1. En el menú lateral, click en **"Table Editor"**
2. Deberías ver dos tablas nuevas:
   - ✅ `profiles`
   - ✅ `content`

### 4. Verificar las políticas de seguridad (RLS)

1. Click en la tabla `profiles`
2. Ve a la pestaña **"Policies"**
3. Deberías ver 3 políticas:
   - Users can view own profile
   - Users can update own profile
   - Users can insert own profile

4. Click en la tabla `content`
5. Deberías ver 4 políticas:
   - Authenticated users can view content
   - Service role can insert content
   - Service role can update content
   - Service role can delete content

---

## 🎯 ¿Qué hace este script?

### Tabla `profiles`

- Almacena información extendida de usuarios
- Se crea automáticamente cuando un usuario se registra
- Cada usuario solo puede ver/editar su propio perfil
- Campo `is_premium` para futuras funcionalidades de suscripción

### Tabla `content`

- Almacena videos (Cloudinary) y podcasts (Spotify)
- Todos los usuarios autenticados pueden ver el contenido
- Solo administradores pueden agregar/editar/eliminar contenido
- Campo `type` para diferenciar entre 'video' y 'podcast'

### Seguridad (RLS - Row Level Security)

- Los usuarios solo pueden acceder a su propio perfil
- El contenido es visible para todos los usuarios autenticados
- Solo el rol de servicio (admin) puede gestionar el contenido

---

## ✅ Checklist

- [ ] Script ejecutado en Supabase SQL Editor
- [ ] Tabla `profiles` creada
- [ ] Tabla `content` creada
- [ ] Políticas RLS verificadas
- [ ] (Opcional) Datos de prueba insertados

---

## 🧪 Probar que funciona

### Opción 1: Desde el Table Editor

1. Ve a la tabla `content`
2. Click en **"Insert row"**
3. Agrega un registro de prueba:
   - title: "Video de Prueba"
   - description: "Descripción de prueba"
   - type: "video"
   - external_id: "test_video_123"
   - is_premium: true

### Opción 2: Desde SQL Editor

```sql
-- Insertar contenido de prueba
INSERT INTO public.content (title, description, type, external_id)
VALUES ('Mi Primer Video', 'Video de prueba', 'video', 'cloudinary_id_123');

-- Ver todo el contenido
SELECT * FROM public.content;
```

---

## 🚨 Troubleshooting

### Error: "relation already exists"

- Las tablas ya fueron creadas. Puedes ignorar este error o eliminar las tablas existentes primero.

### Error: "permission denied"

- Asegúrate de estar usando el SQL Editor con permisos de administrador.

### No veo las tablas en Table Editor

- Refresca la página del navegador
- Verifica que el script se ejecutó sin errores
