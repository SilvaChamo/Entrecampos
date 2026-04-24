import { createClient } from '@supabase/supabase-js';

// Só criar cliente no browser para evitar erros durante build
const isBrowser = typeof window !== 'undefined';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

// Criar cliente dummy para SSR/build
const createDummyClient = () => {
  return {
    from: () => ({
      select: () => ({ data: null, error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
      upsert: () => ({ data: null, error: null }),
    }),
    storage: {
      from: () => ({
        list: () => Promise.resolve({ data: [], error: null }),
        upload: () => Promise.resolve({ data: null, error: null }),
        remove: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  } as any;
};

export const supabase = isBrowser && supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : createDummyClient();
