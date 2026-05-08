const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres.vitvtysmorwrvyzjqbyr:fartexhhairlink@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function check() {
  try {
    await client.connect();
    
    console.log('--- ALL TRIGGERS ---');
    const triggers = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table, action_statement
      FROM information_schema.triggers;
    `);
    console.table(triggers.rows);

    console.log('\n--- ALL CONSTRAINTS ---');
    const constraints = await client.query(`
      SELECT conname, contype, pg_get_constraintdef(c.oid) as definition
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'public';
    `);
    console.table(constraints.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
check();
