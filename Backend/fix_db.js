const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres.vitvtysmorwrvyzjqbyr:fartexhhairlink@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function fix() {
  try {
    await client.connect();
    
    console.log('Dropping broken auth trigger...');
    await client.query(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`);
    
    console.log('Trigger dropped successfully.');

  } catch (err) {
    console.error('Error dropping trigger:', err);
  } finally {
    await client.end();
  }
}
fix();
