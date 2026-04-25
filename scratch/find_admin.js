const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findAdmin() {
  const { data: authUsers, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error(error);
    return;
  }
  const admin = authUsers.users.find(u => u.email === 'silva.chamo@gmail.com' || u.email === 'admin@ecamposmz.com');
  console.log('Admin found:', admin ? { id: admin.id, email: admin.email } : 'Not found');
}

findAdmin();
