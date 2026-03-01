# Guía: Configuración de Roles de Administrador

## 📋 Asignar Rol de Admin

Para que puedas acceder al Panel de Control (`/admin`), tu usuario debe tener el rol de `admin` en la base de datos Supabase.

### Paso a Paso

1. Ve a tu proyecto en **Supabase Dashboard**
2. Click en **"SQL Editor"** -> **"New query"**
3. Copia y pega el contenido de `supabase/migrations/002_admin_roles_and_schema.sql`
4. Click en **"Run"** para crear las tablas y columnas necesarias.

### Asignar Rol a tu Usuario

Una vez ejecutado el script anterior, ejecuta esta consulta SQL reemplazando con tu email:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'TU_EMAIL_AQUI'; -- Ej: usuario@gmail.com
```

### Verificación

Para confirmar que tienes acceso, intenta entrar a `/admin` en tu aplicación. Si eres redirigido al inicio, es que el rol no se aplicó correctamente.
