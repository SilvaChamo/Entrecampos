import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

let browserClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (typeof window === 'undefined') {
    return createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }

  if (!browserClient) {
    if (!supabaseUrl || !supabaseKey) {
      console.error('[supabase] NEXT_PUBLIC_SUPABASE_URL / ANON_KEY em falta');
    }
    browserClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        flowType: 'pkce',
      },
    });
  }

  return browserClient;
}

/** Compat: proxy que cria o cliente só quando usado no browser */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabase();
    const value = Reflect.get(client, prop, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';
export const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_STORAGE_BUCKET ||
  process.env.STORAGE_BUCKET ||
  'entrecampos-media';
