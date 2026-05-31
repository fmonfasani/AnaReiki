-- ===============================================
-- SUPER AUDIT — run quarterly or after any migration
-- ===============================================
-- 1/7: TABLAS SIN RLS (security hole)
-- ===============================================
SELECT 'TABLAS SIN RLS' AS check_name, relname AS table_name
FROM pg_class
WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
AND relrowsecurity = false
ORDER BY relname;

-- ===============================================
-- 2/7: POLICIES RECURSIVAS (referencian su propia tabla)
-- ===============================================
SELECT 'POLICIES RECURSIVAS' AS check_name,
       tablename, policyname, cmd,
       substring(qual::text, 1, 120) AS qual
FROM pg_policies
WHERE schemaname = 'public'
AND qual::text LIKE '%FROM ' || upper(tablename) || '%'
   OR qual::text LIKE '%FROM public.' || tablename || '%'
ORDER BY tablename, policyname;

-- ===============================================
-- 3/7: POLICIES QUE REFERENCIAN profiles SIN is_admin_user
--      (candidate a recursión indirecta)
-- ===============================================
SELECT 'POLICIES -> profiles SIN is_admin_user' AS check_name,
       tablename, policyname, cmd,
       substring(qual::text, 1, 120) AS qual
FROM pg_policies
WHERE schemaname = 'public'
AND (qual::text LIKE '%profiles%' OR with_check::text LIKE '%profiles%')
AND qual::text NOT LIKE '%is_admin_user%'
ORDER BY tablename, policyname;

-- ===============================================
-- 4/7: FUNCIONES SECURITY DEFINER SIN gestor de borde
--      (pueden escalar privilegios)
-- ===============================================
SELECT 'SECURITY DEFINER REVIEW' AS check_name,
       proname, pg_get_function_arguments(oid) AS args,
       prosecdef AS is_security_definer
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND prosecdef = true
AND proname NOT LIKE 'gbt_%'
ORDER BY proname;

-- ===============================================
-- 5/7: FOREIGN KEYS ESPERADAS vs REALES
-- ===============================================
WITH expected_fks AS (
    SELECT 'appointments' AS table_name, ARRAY['consultant_id', 'client_id', 'confirmed_by', 'cancelled_by'] AS fk_cols
    UNION ALL SELECT 'availability_exceptions', ARRAY['consultant_id']
    UNION ALL SELECT 'availability_rules', ARRAY['consultant_id']
    UNION ALL SELECT 'content_comments', ARRAY['user_id']
    UNION ALL SELECT 'content_favorites', ARRAY['user_id']
    UNION ALL SELECT 'content_progress', ARRAY['user_id']
    UNION ALL SELECT 'direct_messages', ARRAY['sender_id', 'receiver_id']
    UNION ALL SELECT 'discussion_replies', ARRAY['author_id']
    UNION ALL SELECT 'discussion_topics', ARRAY['author_id']
    UNION ALL SELECT 'payments', ARRAY['user_id']
    UNION ALL SELECT 'recurring_templates', ARRAY['client_id', 'consultant_id']
    UNION ALL SELECT 'session_notes', ARRAY['user_id']
    UNION ALL SELECT 'subscriptions', ARRAY['user_id']
    UNION ALL SELECT 'waitlist', ARRAY['client_id', 'consultant_id']
),
actual_fks AS (
    SELECT kcu.table_name, array_agg(kcu.column_name ORDER BY kcu.column_name) AS fk_cols
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    GROUP BY kcu.table_name
)
SELECT 'FK FALTANTES' AS check_name,
       e.table_name, e.fk_cols AS expected_columns,
       COALESCE(a.fk_cols, ARRAY[]::text[]) AS actual_columns,
       array(
           SELECT unnest(e.fk_cols)
           EXCEPT
           SELECT unnest(COALESCE(a.fk_cols, ARRAY[]::text[]))
       ) AS missing_fks
FROM expected_fks e
LEFT JOIN actual_fks a ON a.table_name = e.table_name
WHERE EXISTS (
    SELECT 1 FROM unnest(e.fk_cols) AS c
    EXCEPT
    SELECT 1 FROM unnest(COALESCE(a.fk_cols, ARRAY[]::text[]))
)
ORDER BY e.table_name;

-- ===============================================
-- 6/7: POLICIES DUPLICADAS (misma tabla, mismo cmd, mismo qual)
-- ===============================================
SELECT 'POLICIES DUPLICADAS' AS check_name,
       p1.tablename, p1.policyname AS policy1, p2.policyname AS policy2, p1.cmd
FROM pg_policies p1
JOIN pg_policies p2 ON p2.tablename = p1.tablename
    AND p2.schemaname = p1.schemaname
    AND p2.oid > p1.oid
    AND p2.cmd = p1.cmd
    AND COALESCE(p2.qual::text, '') = COALESCE(p1.qual::text, '')
    AND COALESCE(p2.with_check::text, '') = COALESCE(p1.with_check::text, '')
WHERE p1.schemaname = 'public'
ORDER BY p1.tablename, p1.policyname;

-- ===============================================
-- 7/7: TABLAS SIN INDEX (performance risk)
-- ===============================================
SELECT 'TABLAS SIN INDEX' AS check_name, c.relname AS table_name
FROM pg_class c
LEFT JOIN pg_index i ON i.indrelid = c.oid AND i.indisprimary = false
WHERE c.relnamespace = 'public'::regnamespace
AND c.relkind = 'r'
AND i.indrelid IS NULL
ORDER BY c.relname;

-- ===============================================
-- RESULT SUMMARY
-- ===============================================
SELECT 'AUDIT COMPLETE - review each section above for issues';
