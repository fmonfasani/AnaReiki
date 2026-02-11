import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Manual env parsing because dotenv might not be installed
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
  console.error("❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkAdminStatus() {
  const email = "fmonfasani@gmail.com";
  console.log(`Checking status for: ${email}`);

  // 1. Check Auth User
  const {
    data: { users },
    error: authError,
  } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error("Error listing users:", authError);
    return;
  }

  const user = users.find((u) => u.email === email);

  if (!user) {
    console.log("❌ User NOT FOUND in Auth (auth.users)");
    console.log("Available users:", users.map((u) => u.email).join(", "));
    return;
  }

  console.log(`✅ User FOUND in Auth: ${user.id}`);
  console.log(
    `   - Email confirmed: ${user.email_confirmed_at ? "Yes" : "No"}`,
  );
  console.log(`   - Metadata:`, user.user_metadata);

  // 2. Check Profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("❌ Error fetching profile:", profileError);
  } else if (!profile) {
    console.log("❌ Profile NOT FOUND in public.profiles");
  } else {
    console.log(`✅ Profile FOUND in public.profiles`);
    console.log(
      `   - Role: ${profile.role} ${profile.role === "admin" ? "👑" : "👤"}`,
    );
    console.log(`   - Is Premium: ${profile.is_premium}`);
    console.log(`   - Full Name: ${profile.full_name}`);
  }
}

checkAdminStatus();
