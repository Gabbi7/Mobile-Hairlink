const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres.vitvtysmorwrvyzjqbyr:fartexhhairlink@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function check() {
  try {
    await client.connect();
    
    console.log('--- FUNCTION DEFINITION ---');
    const result = await client.query(`
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'handle_new_user';
    `);
    if (result.rows.length > 0) {
      console.log(result.rows[0].prosrc);
    } else {
      console.log('Function handle_new_user not found');
    }

    console.log('\n--- TRIGGER DETAILS ---');
    const trigger = await client.query(`
      SELECT event_object_schema, event_object_table, trigger_name 
      FROM information_schema.triggers 
      WHERE trigger_name = 'on_auth_user_created';
    `);
    console.table(trigger.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
check();
