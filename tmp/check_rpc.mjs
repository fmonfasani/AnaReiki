import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

try {
  const { data, error } = await supabase.rpc("exec_sql", { sql: "SELECT 1" });
  console.log("exec_sql:", error ? `ERROR: ${error.message}` : `OK: ${JSON.stringify(data)}`);
} catch (e) {
  console.log("exec_sql not available:", e.message);
}
