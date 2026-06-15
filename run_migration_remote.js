const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const svc = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // Find owner user
  const { data: users, error: userErr } = await svc
    .from('profiles')
    .select('id')
    .eq('email', 'fmonfasani@gmail.com')
    .single();

  if (userErr || !users) {
    console.error('Owner not found:', userErr?.message);
    process.exit(1);
  }

  const ownerId = users.id;

  // Check if Sunday rule already exists
  const { data: existing } = await svc
    .from('availability_rules_v2')
    .select('id')
    .eq('day_of_week', 0)
    .maybeSingle();

  if (existing) {
    console.log('Sunday rule already exists');
    return;
  }

  // Insert Sunday rule
  const { error: insertErr } = await svc
    .from('availability_rules_v2')
    .insert({
      day_of_week: 0,
      start_time: '09:00',
      end_time: '23:00',
      duration_minutes: 30,
      modality: 'both',
      created_by: ownerId,
    });

  if (insertErr) {
    console.error('Insert failed:', insertErr.message);
    process.exit(1);
  }

  console.log('Sunday rule created successfully');
}

main().catch(console.error);
