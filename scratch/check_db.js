const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  console.log('--- Checking auth.users ---');
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) console.error('Auth Error:', authError.message);
  else console.log('Auth Users Count:', authUsers.users.length);

  console.log('\n--- Checking public tables ---');
  const { data: tables, error: tableError } = await supabase
    .from('news') // verify connection
    .select('count', { count: 'exact', head: true });
  
  if (tableError) console.error('Table Error (news):', tableError.message);
  else console.log('News connection OK');

  // Tentativa de ver se existe tabela profiles ou users
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('*').limit(5);
  if (profileError) console.log('Table "profiles" likely does not exist');
  else console.log('Profiles table exists:', profiles);
}

checkUsers();
