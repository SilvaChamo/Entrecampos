/**
 * Cria ou actualiza o utilizador administrador no Supabase Auth.
 *
 * Uso:
 *   node scripts/ensure-admin.js
 *   ADMIN_EMAIL=admin@ecamposmz.com ADMIN_PASSWORD='SuaSenha' node scripts/ensure-admin.js
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

const email = process.env.ADMIN_EMAIL || 'admin@entrecampos.co.mz';
const password = process.env.ADMIN_PASSWORD || 'EntreCampos2026Admin';

if (!url || !serviceKey) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(target) {
  let page = 1;
  const perPage = 100;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = (data.users || []).find(
      (u) => (u.email || '').toLowerCase() === target.toLowerCase()
    );
    if (found) return found;
    if (!data.users || data.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  console.log(`A garantir admin: ${email}`);

  const existing = await findUserByEmail(email);

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: {
        ...(existing.user_metadata || {}),
        app: 'entrecampos',
        role: 'Administrador',
        full_name: existing.user_metadata?.full_name || 'Administrador',
        username: existing.user_metadata?.username || 'admin',
      },
    });
    if (error) throw error;
    console.log('Utilizador existente actualizado (password + role Administrador).');
  } else {
    const { error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        app: 'entrecampos',
        role: 'Administrador',
        full_name: 'Administrador',
        username: 'admin',
      },
    });
    if (error) throw error;
    console.log('Utilizador administrador criado.');
  }

  console.log('');
  console.log('Credenciais de acesso:');
  console.log(`  E-mail: ${email}`);
  console.log(`  Senha:  ${password}`);
  console.log('');
  console.log('Login: http://localhost:3004/login');
}

main().catch((err) => {
  console.error('Falha:', err.message || err);
  process.exit(1);
});
