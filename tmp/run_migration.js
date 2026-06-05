const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sqlFile = process.argv[2];

if (!url || !key) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

if (!sqlFile) {
  console.error("Usage: node run_migration.js <sql_file>");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sql = fs.readFileSync(sqlFile, "utf8");
// Split by semicolons and run each statement
const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith("--"));

async function main() {
  for (const stmt of statements) {
    try {
      const { error } = await supabase.rpc("exec_sql", { sql: stmt + ";" });
      if (error) {
        // exec_sql may not exist, try raw query
        console.error("RPC error:", error.message);
        // Fallback: use REST
        const { error: restError } = await supabase
          .from("_exec_sql")
          .select("*")
          .limit(0);
        if (restError) {
          console.log("Could not execute:", stmt.substring(0, 60));
          console.error(restError.message);
        }
      } else {
        console.log("OK:", stmt.substring(0, 60));
      }
    } catch (err) {
      console.error("Failed:", stmt.substring(0, 60), err.message);
    }
  }
}

main().catch(console.error);
