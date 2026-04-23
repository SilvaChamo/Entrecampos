import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ppgmtxzuaxqshipnvebl.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_tT_7Rv_M1mCYyYxEK7gUjw_5j_5PiJm';

export const supabase = createClient(supabaseUrl, supabaseKey);
