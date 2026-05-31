// Run migration 016 with direct PostgreSQL connection
// Uses pg module from project

import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:%24Karaoke27570@db.wbiicoasyknowhbrnpvb.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

async function main() {
  await client.connect();
  console.log('Connected to database');

  const sql = `
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_tier text NOT NULL DEFAULT 'prana' CHECK (plan_tier IN ('prana', 'shakti', 'ananda'));
ALTER TABLE public.pricing_plans DROP CONSTRAINT IF EXISTS pricing_plans_interval_check;
ALTER TABLE public.pricing_plans ADD CONSTRAINT pricing_plans_interval_check CHECK (interval IN ('free', 'month', 'year'));
INSERT INTO public.pricing_plans (name, slug, description, price_cents, currency, interval, trial_days, is_active, sort_order)
SELECT 'Prana', 'prana', 'Energía vital — agendá tus citas con Ana', 0, 'ARS', 'free', 0, TRUE, 1
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_plans WHERE slug = 'prana');
UPDATE public.profiles SET plan_tier = 'ananda' WHERE is_premium = TRUE;
`;

  await client.query(sql);
  console.log('Migration 016 applied successfully!');
  await client.end();
  process.exit(0);
}

main().catch(e => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
