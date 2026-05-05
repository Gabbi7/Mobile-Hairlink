const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres.vitvtysmorwrvyzjqbyr:fartexhhairlink@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
});
async function run() {
  await client.connect();
  // Add missing columns to the existing notifications table
  await client.query(`ALTER TABLE public.notifications ALTER COLUMN id SET DEFAULT gen_random_uuid();`);
  await client.query(`ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID;`);
  await client.query(`ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title TEXT;`);
  await client.query(`ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT;`);
  await client.query(`ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;`);
  console.log('Notifications table updated.');

  // Re-grant
  await client.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;');
  await client.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;');
  console.log('Privileges granted.');

  await client.end();
}
run().catch(console.error);
