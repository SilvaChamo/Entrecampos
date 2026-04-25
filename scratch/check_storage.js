const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStorage() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) console.error(error);
  else console.log('Buckets:', buckets.map(b => b.name));
}

checkStorage();
