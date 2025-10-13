-- Supabase schema for FarmSmart
create extension if not exists pgcrypto;

create table projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text,
  location text,
  soil_type text,
  soil_ph numeric,
  rainfall_mm numeric,
  crop text,
  user_query text,
  ai_response text
);
