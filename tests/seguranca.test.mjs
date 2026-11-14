import test from 'node:test';
import assert from 'node:assert/strict';

process.env.AUTH_SECRET = 'segredo-de-teste-com-mais-de-32-caracteres';

const { signSession, verifySession } = await import('../src/lib/local-session.ts');
const { hasPermission, canAccessRoute } = await import('../src/lib/permissions.ts');
const { caminhoInterno } = await import('../src/lib/auth.ts');

const user = { id: '1', email: 'a@b.co', name: 'A', role: 'editor' };

test('sessão assinada é aceite', () => {
  assert.equal(verifySession(signSession(user))?.email, 'a@b.co');
});

test('sessão adulterada ou inválida é recusada', () => {
  const [data, sig] = signSession(user).split('.');
  const forged = Buffer.from(JSON.stringify({ ...user, role: 'admin', exp: 9999999999 })).toString('base64url');
  assert.equal(verifySession(`${forged}.${sig}`), null);
  assert.equal(verifySession(`${data}.x${sig.slice(1)}`), null);
  assert.equal(verifySession(undefined), null);
  assert.equal(verifySession('lixo'), null);
});

test('permissões por papel', () => {
  assert.equal(hasPermission('admin', 'acesso_total'), true);
  assert.equal(hasPermission('guest', 'publicar_artigos'), false);
  assert.equal(hasPermission('desconhecido', 'ler_artigos'), false);
});

test('rotas do painel respeitam o papel', () => {
  assert.equal(canAccessRoute('admin', '/admin/utilizadores'), true);
  assert.equal(canAccessRoute('guest', '/admin/utilizadores'), false);
});

test('o destino depois de entrar nunca sai deste site', () => {
  assert.equal(caminhoInterno('/admin/dashboard'), '/admin/dashboard');
  for (const mau of ['//evil.com', 'https://evil.com', '/\\evil.com', '/.//evil.com', 'javascript:alert(1)', null]) {
    assert.equal(caminhoInterno(mau), null, String(mau));
  }
});
