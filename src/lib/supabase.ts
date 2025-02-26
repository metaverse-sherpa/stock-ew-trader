import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL in environment variables');
}

if (!supabaseAnonKey) {
  throw new Error('Missing Supabase Anon Key in environment variables');
}

try {
  new URL(supabaseUrl); // Validate the URL
} catch (error) {
  throw new Error(`Invalid Supabase URL: ${supabaseUrl}`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
