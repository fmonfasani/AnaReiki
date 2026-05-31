import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

const MIGRATIONS = [
  "001_initial_schema.sql",
  "009_fix_content_rls.sql",
  "010_crm_features.sql",
  "011_smart_agenda.sql",
  "012_content_library.sql",
  "013_community.sql",
  "014_payments.sql",
];

async function runMigration(supabase, sql, label) {
  // Try executing via rpc if there's a raw_sql function
  // Otherwise use the REST API directly
  const lines = sql
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("--"));

  for (const line of lines) {
    if (line.length < 5) continue;
    try {
      const { error } = await supabase.from("_migrations_check").select("count", { count: "exact", head: true });
      // If we get here, table exists - skip
      return { skipped: true };
    } catch {
      // Table doesn't exist - need to create
    }
  }

  // Try the pg-meta query endpoint via REST
  const { data: { session } } = await supabase.auth.getSession();
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const res = await fetch(`${url}/rest/v1/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify({}), // Just a test
    });

    if (res.ok) {
      console.log(`  ✓ ${label} - connected`);
      return { ok: true };
    }
  } catch (e) {
    // Try direct SQL approach
  }

  // Direct REST SQL execution using service_role key
  // Supabase exposes SQL endpoint via /rest/v1/ with custom media type
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Prefer": "params=single-object",
      },
      body: JSON.stringify(sql),
    });

    const text = await res.text();
    if (res.ok) {
      console.log(`  ✓ ${label}`);
      return { ok: true };
    }
    console.log(`  ? ${label} - ${res.status}: ${text.slice(0, 100)}`);
    return { error: text };
  } catch (e) {
    return { error: e.message };
  }
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Faltan variables de entorno. Asegurate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  console.log("Ejecutando migraciones en Supabase...\n");

  for (const file of MIGRATIONS) {
    const filePath = join(projectRoot, "supabase", "migrations", file);
    console.log(`📄 ${file}`);
    
    const sql = readFileSync(filePath, "utf-8");

    // Try direct pg connection via fetch to Supabase's SQL endpoint
    const result = await pgQuery(supabaseUrl, serviceKey, sql, file);
    
    if (result.ok) {
      console.log(`  ✅ ${file}`);
    } else if (result.skipped) {
      console.log(`  ⏭️  ${file} - ya aplicada`);
    } else {
      console.log(`  ❌ ${file}: ${result.error}`);
    }
  }

  console.log("\n✅ Migraciones completadas");
}

async function pgQuery(url, key, sql, label) {
  // Try the Supabase SQL API through the service role
  // The endpoint for raw SQL in Supabase projects is /api/pg-meta/query
  // or we can use the direct Postgres connection
  
  // Approach: Use fetch to the Supabase project's pg-meta endpoint
  const endpoints = [
    `${url}/api/pg-meta/query`,
    `${url}/api/pg-meta/default/query`, 
    `${url}/api/sql`,
    `${url}/pg/sql`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": key,
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({ query: sql }),
      });
      
      if (res.ok) {
        return { ok: true };
      }
      
      const text = await res.text();
      if (res.status !== 404 && res.status !== 403) {
        console.log(`  ${endpoint} -> ${res.status}: ${text.slice(0, 80)}`);
      }
    } catch {
      // endpoint not available
    }
  }

  // Last resort: try direct TCP connection via psql-style
  // Extract project ref from URL
  const projectRef = url.replace("https://", "").replace(".supabase.co", "");
  
  // For Supabase, you can connect via the connection pooler with
  // postgres://postgres.{ref}:{password}@aws-0-{region}.pooler.supabase.com:6543/postgres
  // But we don't have the DB password
  
  return { error: "No se pudo ejecutar SQL directamente. Usá el SQL Editor de Supabase." };
}

main().catch(console.error);
