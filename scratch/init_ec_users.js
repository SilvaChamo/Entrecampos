const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createEcUsersTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS ec_users (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      username TEXT UNIQUE NOT NULL,
      first_name TEXT,
      last_name TEXT,
      email TEXT UNIQUE NOT NULL,
      role TEXT DEFAULT 'Subscritor',
      bio TEXT,
      website TEXT,
      avatar_url TEXT,
      articles_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    INSERT INTO ec_users (id, username, first_name, last_name, email, role, bio, website)
    VALUES (
      '88bf05fc-0de0-4286-bebf-1f71cb823e95', 
      'admin', 
      'Silva', 
      'Chamo', 
      'silva.chamo@gmail.com', 
      'Administrador', 
      'Administrador do site EntreCAMPOS.', 
      'https://entrecampos.co.mz'
    )
    ON CONFLICT (id) DO NOTHING;
  `;

  // We use the REST API via /rpc/exec_sql if available, or just use simple from().insert() logic
  // Since I don't know if exec_sql exists, I'll use a more robust way to create table if I can
  // Actually, Supabase doesn't allow DDL via JS client easily unless it's a specific function.
  // But wait, I can use the HTTP API directly to run SQL if I have the secret key? 
  // No, usually it's better to tell the user to run it or use a tool.
  
  // I will try to create the table using a standard query if possible, but JS client is limited.
  // Wait, I can use the `mcp_supabase-mcp-server_execute_sql` tool! 
  // Oh, wait, I don't have the token for MCP.
  
  // I'll try to use `postgres` library if installed, or just use the Supabase `from().upsert()` 
  // if the table already exists. If not, I'll ask the user to run the SQL.
  
  // Actually, I'll try to use a fetch to the SQL endpoint if I can.
  // But let's check if the project has a function to run SQL.
  
  console.log('Tentando criar tabela via upsert (falhará se não existir)...');
  const { error } = await supabase.from('ec_users').upsert({
    id: '88bf05fc-0de0-4286-bebf-1f71cb823e95',
    username: 'admin',
    first_name: 'Silva',
    last_name: 'Chamo',
    email: 'silva.chamo@gmail.com',
    role: 'Administrador'
  });

  if (error && error.code === 'PGRST116' || error?.message?.includes('relation "ec_users" does not exist')) {
    console.log('Tabela ec_users não existe. Vou tentar criá-la via API de gestão se possível (ou pedir ao user).');
  } else if (!error) {
    console.log('Tabela existe e admin inserido!');
  } else {
    console.error('Erro:', error.message);
  }
}

createEcUsersTable();
