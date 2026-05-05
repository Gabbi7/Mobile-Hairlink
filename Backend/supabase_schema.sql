-- Run this in the Supabase SQL Editor

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'Donor',
    country TEXT,
    region TEXT,
    postal_code TEXT,
    age INTEGER,
    gender TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    onesignal_id TEXT,
    profile_photo_path TEXT,
    bio TEXT,
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed test user
INSERT INTO public.users (name, first_name, last_name, email, password, role)
VALUES ('Test User', 'Test', 'User', 'test@hairlink.ph', '$2b$10$G2P0O4xivTEpLopLTK9bxePK.6xumAIUYJHLt0WQvJJDQWnUlhDjm', 'Donor')
ON CONFLICT (email) DO NOTHING;
-- (Note: Password is hashed 'password123' using bcrypt)

-- 2. Create Donations Table
CREATE TABLE IF NOT EXISTS public.donations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
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

-- 3. Create Monetary Donations Table
CREATE TABLE IF NOT EXISTS public.monetary_donations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
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

-- 4. Create Donations Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('donations', 'donations', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for public viewing (Required for mobile app to see images)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'donations');

-- Storage Policies for Service Role to insert/update
CREATE POLICY "Service Role Access"
ON storage.objects FOR ALL
USING (bucket_id = 'donations' AND auth.role() = 'service_role');
