// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

// Create a singleton Supabase client for browser components
const supabaseBrowserClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default supabaseBrowserClient;