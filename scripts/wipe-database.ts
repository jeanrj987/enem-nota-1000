/**
 * Apaga TODOS os dados do projeto: toda linha de redacoes/assinaturas/perfis
 * e toda conta de auth.users. Ação irreversível — só existe porque foi
 * pedida explicitamente para zerar o banco de testes antes de ir para
 * produção. Nunca rodar isso contra um banco com usuários reais sem
 * confirmação explícita.
 *
 * Uso: node --env-file=.env.local ./node_modules/tsx/dist/cli.mjs scripts/wipe-database.ts
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes em .env.local');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey);

async function limparTabela(tabela: string, colunaChave: string, valorImpossivel: string) {
  // .neq com um valor impossível funciona como "apague tudo" satisfazendo a
  // exigência do supabase-js de um filtro explícito no delete.
  const { error, count } = await admin
    .from(tabela)
    .delete({ count: 'exact' })
    .neq(colunaChave, valorImpossivel);
  if (error) throw new Error(`Falha ao limpar ${tabela}: ${error.message}`);
  console.log(`${tabela}: ${count ?? 0} linha(s) removida(s).`);
}

async function apagarTodosUsuarios() {
  let totalRemovidos = 0;
  // Paginação simples — apaga em lotes até não sobrar ninguém.
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw error;
    if (data.users.length === 0) break;

    for (const usuario of data.users) {
      const { error: erroDelete } = await admin.auth.admin.deleteUser(usuario.id);
      if (erroDelete) throw new Error(`Falha ao apagar usuário ${usuario.email}: ${erroDelete.message}`);
      totalRemovidos++;
    }
  }
  console.log(`auth.users: ${totalRemovidos} conta(s) removida(s).`);
}

async function main() {
  // Tabelas primeiro (perfis/assinaturas têm FK em cascade para auth.users,
  // mas limpar explicitamente evita depender só do ON DELETE CASCADE).
  await limparTabela('redacoes', 'id', '__nunca_vai_bater__');
  await limparTabela('assinaturas', 'id', '__nunca_vai_bater__');
  await limparTabela('perfis', 'user_id', '00000000-0000-0000-0000-000000000000');
  await apagarTodosUsuarios();
  console.log('Banco zerado.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
