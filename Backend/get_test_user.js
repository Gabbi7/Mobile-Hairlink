const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres.vitvtysmorwrvyzjqbyr:fartexhhairlink@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
});
async function run() {
  await client.connect();
  const res = await client.query("SELECT id FROM public.users WHERE email = 'test@hairlink.ph'");
  console.log(res.rows[0].id);
  await client.end();
}
run();
