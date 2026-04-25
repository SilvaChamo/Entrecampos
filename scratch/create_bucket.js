const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createBucket() {
  const { data, error } = await supabase.storage.createBucket('avatars', {
    public: true
  });
  if (error) console.error('Error creating bucket:', error.message);
  else console.log('Bucket "avatars" created!');
}

createBucket();
