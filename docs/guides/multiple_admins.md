# Guía: Gestión de Múltiples Administradores

El sistema de roles (`admin` vs `user`) está diseñado para soportar **múltiples administradores** simultáneamente.

Esto es perfecto para tu caso de uso:

1. **Dueña de la Página (Ana)**: Para gestionar citas y subir contenido.
2. **Administrador Técnico (Tú)**: Para mantenimiento y soporte.

## ¿Cómo agregar otro Admin?

Simplemente repite el paso de asignación de rol para el email de la segunda persona.

1. La persona debe registrarse normalmente en `/registro`.
2. Ejecuta este comando SQL en Supabase:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'email_de_ana@ejemplo.com';
```

¡Listo! Ambos tendrán acceso completo al Panel de Control (`/admin`).
