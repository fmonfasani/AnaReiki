# Guía de Integración a Vercel

## 1️⃣ Supabase (Integración Nativa)

### Opción A: Crear nuevo proyecto desde Vercel (Recomendado)

1. Ve a tu proyecto en **Vercel Dashboard**
2. Click en **"Storage"** (en el menú lateral)
3. Click en **"Create Database"**
4. Selecciona **"Supabase"**
5. Click en **"Continue"**
6. Sigue el asistente:
   - Nombre del proyecto
   - Región (elige `South America (São Paulo)` si tus usuarios están en Argentina)
   - Contraseña de la base de datos
7. **Vercel configurará automáticamente** las variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (opcional, para operaciones admin)

### Opción B: Conectar proyecto existente de Supabase

Si ya creaste un proyecto en Supabase directamente:

1. Ve a **Vercel Dashboard** → Tu proyecto
2. **Settings** → **Environment Variables**
3. Agrega manualmente:
   - `NEXT_PUBLIC_SUPABASE_URL` = (copia desde Supabase Dashboard → Settings → API)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (copia desde Supabase Dashboard → Settings → API)
4. Marca todos los entornos: **Production**, **Preview**, **Development**

---

## 2️⃣ Cloudinary (Configuración Manual)

1. Ve a **Vercel Dashboard** → Tu proyecto
2. **Settings** → **Environment Variables**
3. Agrega estas 3 variables una por una:

   **Variable 1:**
   - Name: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - Value: `dgybdhxan` (o tu cloud name)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **Variable 2:**
   - Name: `CLOUDINARY_API_KEY`
   - Value: `775522394985398` (o tu API key)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **Variable 3:**
   - Name: `CLOUDINARY_API_SECRET`
   - Value: [tu API secret]
   - Environments: ✅ Production, ✅ Preview, ✅ Development

4. Click en **"Save"** después de cada variable

---

## 3️⃣ Sincronizar variables localmente

Después de configurar en Vercel, sincroniza a tu `.env.local`:

```bash
vc env pull .env.local
```

Esto descargará todas las variables de Vercel a tu archivo local.

---

## 4️⃣ Verificar que todo funciona

### En Vercel:

1. Ve a **Settings** → **Environment Variables**
2. Deberías ver todas las variables listadas

### En local:

```bash
cat .env.local
```

Deberías ver todas las variables (Resend, Cloudinary, Supabase).

---

## ✅ Checklist Final

- [ ] Supabase configurado en Vercel (Storage o manualmente)
- [ ] Cloudinary configurado en Vercel (Environment Variables)
- [ ] Ejecutado `vc env pull .env.local`
- [ ] Verificado que `.env.local` tiene todas las variables
- [ ] (Opcional) Hacer un deploy para probar: `vc --prod`

---

## 🚨 Importante

- **NO subas `.env.local` a GitHub** (ya está en `.gitignore`)
- Las variables con `NEXT_PUBLIC_` son visibles en el navegador
- Las variables sin ese prefijo solo están disponibles en el servidor
