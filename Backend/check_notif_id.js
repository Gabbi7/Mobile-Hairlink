const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres.vitvtysmorwrvyzjqbyr:fartexhhairlink@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
});
async function run() {
  await client.connect();
  const res = await client.query(`SELECT column_name, column_default, is_nullable, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'id';`);
  console.log(JSON.stringify(res.rows[0], null, 2));
  await client.end();
}
run();
