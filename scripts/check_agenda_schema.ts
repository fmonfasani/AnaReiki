import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Manual env parsing
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      content.split("\n").forEach((line) => {
        const [key, ...values] = line.split("=");
        if (key && values.length > 0) {
          let value = values.join("=").trim();
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      });
    }
  } catch (e) {
    console.error("Error loading .env.local", e);
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkSchema() {
  console.log("Checking availability table structure...");

  // Query information_schema to get column names
  const { data: columns, error } = await supabase
    .from("information_schema.columns")
    .select("column_name, data_type")
    .eq("table_name", "availability")
    .eq("table_schema", "public");

  if (error) {
    // If information_schema access is blocked, try a different approach
    // We try to insert a dummy row with a non-existent column to see the error,
    // or just assume standard schema if this fails.
    console.error("❌ Error accessing information_schema:", error);

    // Fallback: simple select
    const { data, error: selectError } = await supabase
      .from("availability")
      .select("*")
      .limit(1);
    if (selectError) console.error("Select error:", selectError);
    else console.log("Select successful (but no columns if empty):", data);
  } else {
    console.log("✅ Columns in availability table:", columns);
  }

  // Also check appointments
  const { data: appData, error: appError } = await supabase
    .from("appointments")
    .select("*")
    .limit(1);
  if (appError) {
    console.error("❌ Error accessing appointments table:", appError);
  } else {
    console.log("✅ Appointments table exists. Sample data:", appData);
  }
}

checkSchema();
