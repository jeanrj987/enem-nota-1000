/**
 * Confere, contra o banco de verdade, se a migração do paywall
 * (supabase/schema-paywall.sql) está de fato aplicada. Não altera nada.
 *
 * Uso: node --env-file=.env.local ./node_modules/tsx/dist/cli.mjs scripts/verificar-paywall.ts
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em .env.local');
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

// Erro 42703 = coluna inexistente; 42P01 = tabela inexistente.
async function checar(rotulo: string, tabela: string, colunas: string) {
  const { error } = await db.from(tabela).select(colunas).limit(1);
  if (!error) return console.log(`  OK    ${rotulo}`);
  if (error.code === '42703' || error.code === '42P01') {
    return console.log(`  FALTA ${rotulo} -> ${error.message}`);
  }
  console.log(`  ????  ${rotulo} -> [${error.code}] ${error.message}`);
}

async function main() {
  console.log('\nEstado da migração do paywall:\n');
  await checar('tabela correcoes existe', 'correcoes', 'redacao_id,user_id,dados');
  await checar('redacoes.total_erros existe', 'redacoes', 'id,total_erros');
  await checar('redacoes.anulada existe', 'redacoes', 'id,anulada');

  const { error } = await db.from('redacoes').select('correcao').limit(1);
  if (error && error.code === '42703') {
    console.log('  OK    coluna antiga redacoes.correcao foi removida');
  } else if (!error) {
    console.log('  FALTA coluna antiga redacoes.correcao AINDA EXISTE (migração não concluiu)');
  } else {
    console.log(`  ????  redacoes.correcao -> [${error.code}] ${error.message}`);
  }

  const { count } = await db.from('correcoes').select('*', { count: 'exact', head: true });
  console.log(`\n  correções gravadas hoje: ${count ?? 0}`);
  console.log(
    '\nObs.: a chave de serviço ignora RLS de propósito, então este script confirma\n' +
      'o formato do schema, não a trava de assinatura. A trava só se prova com um\n' +
      'login real sem plano ativo.\n'
  );
}

main();
