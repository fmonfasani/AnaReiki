import pkg from "pg";
const { Client } = pkg;
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");
config({ path: envPath, override: true });

const MIGRATIONS = [
  "001_initial_schema.sql",
  "009_fix_content_rls.sql",
  "010_crm_features.sql",
  "011_smart_agenda.sql",
  "012_content_library.sql",
  "013_community.sql",
  "014_payments.sql",
];

function parseConnString(raw) {
  let rest = raw;
  if (rest.startsWith("postgresql://")) rest = rest.slice("postgresql://".length);
  else if (rest.startsWith("postgres://")) rest = rest.slice("postgres://".length);

  const atIndex = rest.indexOf("@");
  if (atIndex === -1) return null;

  const userPass = rest.slice(0, atIndex);
  const hostPortDb = rest.slice(atIndex + 1);
  const colonIndex = userPass.indexOf(":");
  const user = colonIndex === -1 ? userPass : userPass.slice(0, colonIndex);
  const password = colonIndex === -1 ? "" : userPass.slice(colonIndex + 1);
  const slashIndex = hostPortDb.indexOf("/");
  const hostPort = slashIndex === -1 ? hostPortDb : hostPortDb.slice(0, slashIndex);
  const database = slashIndex === -1 ? "postgres" : hostPortDb.slice(slashIndex + 1);
  const portColon = hostPort.lastIndexOf(":");
  const host = portColon === -1 ? hostPort : hostPort.slice(0, portColon);
  const port = portColon === -1 ? 5432 : parseInt(hostPort.slice(portColon + 1));
  return { user, password, host, port, database };
}

async function tryConnect(opts, label) {
  const client = new Client({ ...opts, connectionTimeoutMillis: 8000 });
  try {
    await client.connect();
    console.log(`  ✓ ${label}`);
    return client;
  } catch (e) {
    return null;
  }
}

async function main() {
  let raw = process.env.DATABASE_URL;
  if (!raw) {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      if (line.startsWith("DATABASE_URL=")) {
        raw = line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
        break;
      }
    }
  }
  if (!raw) { console.error("Falta DATABASE_URL"); process.exit(1); }

  const parsed = parseConnString(raw);
  if (!parsed) { console.error("URL inválida"); process.exit(1); }

  const ref = parsed.host.replace("db.", "").replace(".supabase.co", "");

  const regions = [
    "us-east-1", "us-west-1", "eu-west-1", "eu-central-1",
    "sa-east-1", "ap-southeast-1", "ap-northeast-1",
    "ca-central-1", "eu-north-1", "ap-south-1",
  ];

  let client = await tryConnect(parsed, "directo");

  for (const region of regions) {
    if (client) break;
    client = await tryConnect({
      user: `postgres.${ref}`,
      password: parsed.password,
      host: `aws-0-${region}.pooler.supabase.com`,
      port: 6543,
      database: "postgres",
    }, `pooler ${region}`);
  }

  if (!client) {
    console.error("\n❌ No se pudo conectar. Verificá la contraseña en Supabase Dashboard.");
    console.error("   O andá al SQL Editor y pegá los archivos manualmente.");
    process.exit(1);
  }

  console.log("");

  for (const file of MIGRATIONS) {
    const filePath = join(root, "supabase", "migrations", file);
    const sql = readFileSync(filePath, "utf-8");
    console.log(`📄 ${file}...`);
    try {
      await client.query(sql);
      console.log(`  ✅ ${file}`);
    } catch (e) {
      const msg = e.message || "";
      if (msg.includes("already exists") || msg.includes("duplicate")) {
        console.log(`  ⏭️  ${file} - ya aplicada`);
      } else if (msg.includes("syntax error") || msg.includes("does not exist")) {
        console.log(`  ❌ ${msg.slice(0, 200)}`);
      } else {
        console.log(`  ❌ ${msg.slice(0, 200)}`);
      }
    }
  }

  await client.end();
  console.log("\n✅ Proceso completado!");
}

main().catch((err) => { console.error("Error:", err.message); process.exit(1); });
