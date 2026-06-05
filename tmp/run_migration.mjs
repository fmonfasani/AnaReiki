import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sqlFile = process.argv[2];

if (!url || !key) {
  console.error("Missing env vars");
  process.exit(1);
}
if (!sqlFile) {
  console.error("Usage: node run_migration.mjs <file>");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sql = readFileSync(sqlFile, "utf8");
const statements = sql
  .split(";")
  .map(s => s.trim())
  .filter(s => s && !s.startsWith("--"));

for (const stmt of statements) {
  try {
    const { error } = await supabase.rpc("exec_sql", { query_text: stmt + ";" });
    if (error) {
      // Try different parameter names
      const { error: error2 } = await supabase.rpc("exec_sql", { sql: stmt + ";" });
      if (error2) {
        // Try pg_query
        const { error: error3 } = await supabase.rpc("pg_query", { query: stmt + ";" });
        if (error3) {
          console.log("FAIL:", stmt.substring(0, 60));
          console.log("  ", error3.message);
        } else {
          console.log("OK (pg_query):", stmt.substring(0, 60));
        }
      } else {
        console.log("OK (sql):", stmt.substring(0, 60));
      }
    } else {
      console.log("OK (query_text):", stmt.substring(0, 60));
    }
  } catch (e) {
    console.log("ERROR:", stmt.substring(0, 60), e.message);
  }
}
