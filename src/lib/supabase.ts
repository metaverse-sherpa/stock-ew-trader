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

  // Node.js environment - use environment variables
  return {
    url: process.env.SUPABASE_URL || "https://oofuntpwnzunmddfqffr.supabase.co",
    key:
      process.env.SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZnVudHB3bnp1bm1kZGZxZmZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTc4NzQzMSwiZXhwIjoyMDU1MzYzNDMxfQ.x01XYHH-ZrIGUUHbu-GLEJ6nYcNSY3idW65yugjXFZ0",
  };
};

// Check for custom Supabase config in localStorage
let url = "";
let key = "";

if (typeof window !== "undefined") {
  url = localStorage.getItem("custom_supabase_url") || "";
  key = localStorage.getItem("custom_supabase_key") || "";
}

// Use custom config if available, otherwise use default
const config = url && key ? { url, key } : getSupabaseConfig();
export const supabase = createClient(config.url, config.key);
