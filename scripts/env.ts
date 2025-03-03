import { config } from "dotenv";
config();

// For Node.js environment
export const supabaseUrl =
  process.env.SUPABASE_URL || "https://fobbjcbpyvyxswrrngoh.supabase.co";
export const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvYmJqY2JweXZ5eHN3cnJuZ29oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDQxODYyMiwiZXhwIjoyMDU1OTk0NjIyfQ.3HrHnqCBBqn_FTXvPPp5fg4cHslq0LGyprNGlQdlM68";
export const alphaVantageApiKey =
  process.env.ALPHA_VANTAGE_API_KEY || "CZ46DOK2SNE5PG5L";
