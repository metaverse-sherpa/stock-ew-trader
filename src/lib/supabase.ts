import { createClient } from "@supabase/supabase-js";

// Get Supabase configuration
const getSupabaseConfig = () => {
  // Check if we're in a browser environment
  if (typeof window !== "undefined") {
    return {
      url: import.meta.env.VITE_SUPABASE_URL,
      key: import.meta.env.VITE_SUPABASE_ANON_KEY,
    };
  }

  // Node.js environment - use hardcoded values from .env
  return {
    url: "https://oofuntpwnzunmddfqffr.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZnVudHB3bnp1bm1kZGZxZmZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTc4NzQzMSwiZXhwIjoyMDU1MzYzNDMxfQ.x01XYHH-ZrIGUUHbu-GLEJ6nYcNSY3idW65yugjXFZ0",
  };
};

const config = getSupabaseConfig();
export const supabase = createClient(config.url, config.key);
