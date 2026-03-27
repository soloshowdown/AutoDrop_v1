import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.warn("SUPABASE_SERVICE_ROLE_KEY is missing! Server-side DB writes will fail RLS.");
}

/**
 * Server-only Supabase client using the service role key.
 * This bypasses RLS — only use in API routes / server actions, never expose to the browser.
 */
export const supabaseAdmin = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  serviceRoleKey || "placeholder-service-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
