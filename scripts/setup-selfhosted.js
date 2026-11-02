/**
 * Setup EntreCAMPOS no Supabase self-hosted (supabase.visualdesignmoz.com)
 *
 * Requisitos no .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=https://supabase.visualdesignmoz.com
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=...   (ou PUBLISHABLE)
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *   ADMIN_EMAIL=admin@entrecampos.co.mz
 *   ADMIN_PASSWORD=...
 *
 * Uso:
 *   node scripts/setup-selfhosted.js
 *   node scripts/setup-selfhosted.js --sql   # imprime SQL para colar no Studio
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const service =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

const adminEmail = (process.env.ADMIN_EMAIL || 'admin@entrecampos.co.mz').trim();
const adminPassword = process.env.ADMIN_PASSWORD || 'EntreCampos2026Admin';
const bucket = process.env.STORAGE_BUCKET || 'entrecampos-media';

if (process.argv.includes('--sql')) {
  const sqlPath = path.join(__dirname, '..', 'sql', 'entrecampos-selfhosted.sql');
  console.log(fs.readFileSync(sqlPath, 'utf8'));
  process.exit(0);
}

if (!url || !service) {
  console.error('Falta NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ping() {
  console.log('URL:', url);
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (error) throw new Error(`Auth admin falhou: ${error.message}`);
  console.log('✓ Ligação Auth OK (users na página 1:', (data.users || []).length, ')');
}

async function ensureBucket() {
  const { data: buckets, error } = await admin.storage.listBuckets();
  if (error) throw new Error(`Storage listBuckets: ${error.message}`);
  const exists = (buckets || []).some((b) => b.name === bucket || b.id === bucket);
  if (exists) {
    console.log(`✓ Bucket "${bucket}" já existe`);
    return;
  }
  const { error: createErr } = await admin.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: 50 * 1024 * 1024,
  });
  if (createErr) throw new Error(`createBucket: ${createErr.message}`);
  console.log(`✓ Bucket "${bucket}" criado (público)`);
}

async function ensureSiteRow() {
  const { error } = await admin.from('sites').upsert({
    id: 'entrecampos',
    name: 'EntreCAMPOS',
    domain: 'entrecampos.co.mz',
    storage_bucket: bucket,
    storage_driver: process.env.STORAGE_DRIVER || 'supabase',
    s3_public_base_url: process.env.S3_PUBLIC_BASE_URL || null,
    is_active: true,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.warn('! Tabela sites ainda não existe ou RLS bloqueou:', error.message);
    console.warn('  → Corre o SQL: node scripts/setup-selfhosted.js --sql');
    console.warn('    e cola no SQL Editor do Studio.');
    return false;
  }
  console.log('✓ Linha sites.entrecampos OK');
  return true;
}

async function findUser(email) {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const found = (data.users || []).find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (!data.users || data.users.length < 100) return null;
    page += 1;
  }
}

async function ensureAdmin() {
  const existing = await findUser(adminEmail);
  const meta = {
    app: 'entrecampos',
    role: 'Administrador',
    full_name: process.env.ADMIN_NAME || 'Administrador',
    username: 'admin',
    site_id: 'entrecampos',
  };

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: adminPassword,
      email_confirm: true,
      user_metadata: { ...(existing.user_metadata || {}), ...meta },
    });
    if (error) throw error;
    console.log('✓ Admin actualizado:', adminEmail);
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: meta,
  });
  if (error) throw error;
  console.log('✓ Admin criado:', adminEmail);
  return data.user.id;
}

async function ensureEcUser(userId) {
  const { error } = await admin.from('ec_users').upsert({
    id: userId,
    username: 'admin',
    first_name: 'Admin',
    last_name: 'EntreCAMPOS',
    email: adminEmail,
    role: 'Administrador',
    site_id: 'entrecampos',
  });
  if (error) {
    console.warn('! ec_users:', error.message);
    return;
  }
  console.log('✓ Perfil ec_users OK');
}

async function testClientLogin() {
  if (!anon) {
    console.warn('! Sem ANON key — skip teste de login client');
    return;
  }
  const client = createClient(url, anon);
  const { data, error } = await client.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (error) throw new Error(`Login client falhou: ${error.message}`);
  console.log('✓ Login real OK (session:', !!data.session, ')');
  await client.auth.signOut();
}

async function main() {
  console.log('=== EntreCAMPOS → self-hosted setup ===\n');
  await ping();
  await ensureBucket();
  const sitesOk = await ensureSiteRow();
  const userId = await ensureAdmin();
  if (sitesOk) await ensureEcUser(userId);
  await testClientLogin();
  console.log('\nCredenciais:');
  console.log('  E-mail:', adminEmail);
  console.log('  Senha: ', adminPassword);
  console.log('  Login: http://localhost:3004/login');
  console.log('\nSe a tabela sites falhou, aplica o SQL no Studio e volta a correr este script.');
}

main().catch((err) => {
  console.error('\nFalha:', err.message || err);
  console.error('\nAs chaves no .env.local têm de ser as do SERVIDOR actual');
  console.error('(ficheiro .env do docker em supabase.visualdesignmoz.com).');
  process.exit(1);
});
