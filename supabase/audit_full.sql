-- ===============================================
-- AUDITORÍA COMPLETA DE BASE DE DATOS
-- Correr en SQL Editor de Supabase
-- ===============================================
-- 1. TABLAS Y COLUMNAS
-- ===============================================
SELECT 
    t.table_name,
    COUNT(c.column_name) AS column_count,
    string_agg(c.column_name || ' ' || c.data_type || CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END, ', ' ORDER BY c.ordinal_position) AS columns
FROM information_schema.tables t
JOIN information_schema.columns c ON c.table_name = t.table_name AND c.table_schema = t.table_schema
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;

-- ===============================================
-- 2. FOREIGN KEYS
-- ===============================================
SELECT
    tc.table_name AS source_table,
    kcu.column_name AS source_column,
    ccu.table_name AS target_table,
    ccu.column_name AS target_column,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ===============================================
-- 3. TODAS LAS POLICIES RLS (TODAS las tablas)
-- ===============================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ===============================================
-- 4. TABLAS CON RLS HABILITADO/DESHABILITADO
-- ===============================================
SELECT relname AS table_name, relrowsecurity AS rls_enabled, relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
ORDER BY relname;

-- ===============================================
-- 5. TODAS LAS FUNCTIONS
-- ===============================================
SELECT 
    proname AS function_name,
    pg_get_function_arguments(oid) AS arguments,
    pg_get_function_result(oid) AS return_type,
    CASE WHEN prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security,
    CASE WHEN provolatile = 'i' THEN 'IMMUTABLE' WHEN provolatile = 's' THEN 'STABLE' ELSE 'VOLATILE' END AS volatility,
    prosrc AS source
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname NOT LIKE '%pg_%'
AND proname NOT LIKE '%fts_%'
ORDER BY proname;

-- ===============================================
-- 6. TRIGGERS
-- ===============================================
SELECT 
    tgname AS trigger_name,
    relname AS table_name,
    pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relnamespace = 'public'::regnamespace
AND NOT tgisinternal
ORDER BY tgname;

-- ===============================================
-- 7. INDEXES (excluyendo PKs automáticas)
-- ===============================================
SELECT
    tablename AS table_name,
    indexname AS index_name,
    indexdef AS index_definition
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname NOT LIKE '%pkey'
ORDER BY tablename, indexname;

-- ===============================================
-- 8. VALORES DISTINTOS EN COLUMNAS TIPO ENUM
-- ===============================================
SELECT 'profiles.role' AS column_name, role AS value, COUNT(*) AS count FROM public.profiles GROUP BY role ORDER BY role;

SELECT 'profiles.plan_tier' AS column_name, plan_tier AS value, COUNT(*) AS count FROM public.profiles GROUP BY plan_tier ORDER BY plan_tier;

SELECT 'content.type' AS column_name, type AS value, COUNT(*) AS count FROM public.content GROUP BY type ORDER BY type;

SELECT 'pricing_plans.interval' AS column_name, "interval" AS value, COUNT(*) AS count FROM public.pricing_plans GROUP BY "interval" ORDER BY "interval";

-- ===============================================
-- 9. POLICIES RECURSIVAS DETECTADAS
--    (las que referencian profiles DENTRO de profiles)
-- ===============================================
SELECT schemaname, tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles'
AND (qual::text LIKE '%profiles%' OR with_check::text LIKE '%profiles%')
AND qual::text NOT LIKE '%is_admin_user%'
ORDER BY policyname;

-- ===============================================
-- 10. POLICIES EN TABLAS QUE NO SEAN profiles
--     PERO QUE REFERENCIEN profiles (posible recursión)
-- ===============================================
SELECT schemaname, tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename != 'profiles'
AND (qual::text LIKE '%profiles%' OR with_check::text LIKE '%profiles%')
ORDER BY tablename, policyname;

-- ===============================================
-- 11. MIGRATIONS APLICADAS
--     (si existe tabla _migrations o similar)
-- ===============================================
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%migration%' OR table_name LIKE '%schema%' OR table_name LIKE '%version%'
ORDER BY table_name;

-- ===============================================
-- 12. CANTIDAD DE REGISTROS POR TABLA
-- ===============================================
SELECT 'public.' || relname AS table_name, n_live_tup AS estimated_count
FROM pg_stat_all_tables
WHERE schemaname = 'public'
ORDER BY relname;
