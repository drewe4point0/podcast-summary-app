import { createBrowserClient } from '@supabase/ssr';

/**
 * Create a Supabase client for use in browser/client components
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
