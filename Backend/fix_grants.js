const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres.vitvtysmorwrvyzjqbyr:fartexhhairlink@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
});
async function run() {
  await client.connect();
  // Re-grant privileges to all new tables
  await client.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;');
  await client.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;');
  console.log('Privileges granted.');

  // Check notifications table columns
  const notifCols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications';`);
  console.log('notifications columns:', notifCols.rows.map(r => r.column_name));

  // Check user_push_tokens table columns
  const tokenCols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_push_tokens';`);
  console.log('user_push_tokens columns:', tokenCols.rows.map(r => r.column_name));

  await client.end();
}
run().catch(console.error);
