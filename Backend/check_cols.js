const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres.vitvtysmorwrvyzjqbyr:fartexhhairlink@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function check() {
  try {
    await client.connect();
    
    console.log('--- USERS TABLE COLUMNS ---');
    const cols = await client.query(`
      SELECT column_name, is_nullable, column_default, data_type
      FROM information_schema.columns
      WHERE table_name = 'users' AND table_schema = 'public';
    `);
    console.table(cols.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
check();
