import { config } from "dotenv";
config();

// For Node.js environment
export const supabaseUrl =
  process.env.SUPABASE_URL || "https://oofuntpwnzunmddfqffr.supabase.co";
export const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZnVudHB3bnp1bm1kZGZxZmZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTc4NzQzMSwiZXhwIjoyMDU1MzYzNDMxfQ.x01XYHH-ZrIGUUHbu-GLEJ6nYcNSY3idW65yugjXFZ0";
export const alphaVantageApiKey =
  process.env.ALPHA_VANTAGE_API_KEY || "CZ46DOK2SNE5PG5L";
