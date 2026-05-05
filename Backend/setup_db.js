const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres.vitvtysmorwrvyzjqbyr:fartexhhairlink@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
});
async function run() {
  try {
    await client.connect();
    
    // Add password column
    await client.query('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT;');

    // Drop foreign key if it exists to allow standalone inserts for the Express backend
    await client.query('ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey CASCADE;');
    
    // Drop tables if they were created with INTEGER user_id or old schemas
    await client.query('DROP TABLE IF EXISTS public.donations CASCADE;');
    await client.query('DROP TABLE IF EXISTS public.monetary_donations CASCADE;');
    await client.query('DROP TABLE IF EXISTS public.notifications CASCADE;');
    await client.query('DROP TABLE IF EXISTS public.user_push_tokens CASCADE;');
    await client.query('DROP TABLE IF EXISTS public.hair_requests CASCADE;');

    // Create donations table
    await client.query(`
      CREATE TABLE public.donations (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        reference TEXT UNIQUE,
        hair_length TEXT,
        hair_color TEXT,
        treated_hair BOOLEAN DEFAULT FALSE,
        address TEXT,
        reason TEXT,
        dropoff_location TEXT,
        appointment_at TIMESTAMPTZ,
        status TEXT DEFAULT 'Submitted',
        certificate_no TEXT,
        received_wig_at TIMESTAMPTZ,
        photo_front TEXT,
        photo_side TEXT,
        donor_delivery_link TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create monetary_donations table
    await client.query(`
      CREATE TABLE public.monetary_donations (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        name TEXT,
        email TEXT,
        amount NUMERIC,
        currency TEXT DEFAULT 'PHP',
        payment_method TEXT,
        reference_number TEXT UNIQUE,
        proof_path TEXT,
        status TEXT DEFAULT 'Submitted',
        remarks TEXT,
        anonymous BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.notifications (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT,
        type TEXT DEFAULT 'general',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create user_push_tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.user_push_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        expo_push_token TEXT UNIQUE NOT NULL,
        platform TEXT DEFAULT 'unknown',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create hair_requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.hair_requests (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        reference TEXT UNIQUE,
        story TEXT,
        wig_length TEXT,
        wig_color TEXT,
        medical_certificate TEXT,
        additional_photo TEXT,
        notes TEXT,
        status TEXT DEFAULT 'Submitted',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Add test user
    await client.query(`
      INSERT INTO public.users (id, name, first_name, last_name, email, password, role, created_at, updated_at)
      VALUES (gen_random_uuid(), 'Test User', 'Test', 'User', 'test@hairlink.ph', '$2b$10$G2P0O4xivTEpLopLTK9bxePK.6xumAIUYJHLt0WQvJJDQWnUlhDjm', 'donor', NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET password = '$2b$10$G2P0O4xivTEpLopLTK9bxePK.6xumAIUYJHLt0WQvJJDQWnUlhDjm', updated_at = NOW();
    `);

    // Storage buckets
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('donations', 'donations', true), ('hair_requests', 'hair_requests', true)
      ON CONFLICT (id) DO NOTHING;
    `);
    
    await client.query(`
      DROP POLICY IF EXISTS "Public Access" ON storage.objects;
      CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('donations', 'hair_requests'));
      DROP POLICY IF EXISTS "Service Role Access" ON storage.objects;
      CREATE POLICY "Service Role Access" ON storage.objects FOR ALL USING (bucket_id IN ('donations', 'hair_requests') AND auth.role() = 'service_role');
    `);

    console.log('Database successfully prepared!');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}
run();
