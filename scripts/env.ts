import { config } from "dotenv";
config();

// For Node.js environment
export const supabaseUrl =
  process.env.SUPABASE_URL || "https://oofuntpwnzunmddfqffr.supabase.co";
export const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZnVudHB3bnp1bm1kZGZxZmZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4NzAyNjcsImV4cCI6MTcwOTg3MDI2N30.dummy";
export const alphaVantageApiKey =
  process.env.ALPHA_VANTAGE_API_KEY || "CZ46DOK2SNE5PG5L";
