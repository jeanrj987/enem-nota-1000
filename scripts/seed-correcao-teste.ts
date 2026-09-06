/**
 * Insere uma redação já "corrigida" (dados fictícios, claramente marcados
 * como teste) direto no Supabase para um usuário existente — sem chamar
 * Gemini/OpenAI. Existe só para testar a UI de paywall/blur em
 * /correcao/[id] quando a cota de IA está esgotada; nunca usar isso como
 * substituto de uma correção real para um usuário de verdade.
 *
 * Uso: node --env-file=.env.local ./node_modules/tsx/dist/cli.mjs scripts/seed-correcao-teste.ts <email-do-usuario>
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];

if (!supabaseUrl || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes em .env.local');
  process.exit(1);
}
if (!email) {
  console.error('Uso: seed-correcao-teste.ts <email-do-usuario-de-teste>');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  const { data: usuarios, error: erroLista } = await admin.auth.admin.listUsers();
  if (erroLista) throw erroLista;

  const usuario = usuarios.users.find((u) => u.email === email);
  if (!usuario) {
    console.error(`Nenhum usuário encontrado com e-mail ${email}. Cadastre-se em /auth primeiro.`);
    process.exit(1);
  }

  const redacaoId = `red_teste_${crypto.randomUUID()}`;
  const correcaoFake = {
    id: `cor_teste_${crypto.randomUUID()}`,
    redacao_id: redacaoId,
    anulada: false,
    motivo_anulacao: null,
    nota_geral: 840,
    competencias: [1, 2, 3, 4, 5].map((numero) => ({
      numero,
      nome: `Competência ${numero} (dado de teste)`,
      descricao_curta: 'Dado fictício gerado por scripts/seed-correcao-teste.ts',
      nota: 160,
      nivel: 4,
      comentario: 'Este é um comentário de teste — não veio de nenhuma IA real.',
      pontos_fortes: ['Ponto forte de teste'],
      pontos_melhoria: ['Ponto de melhoria de teste'],
    })),
    erros: [],
    versao_reescrita: '[TESTE] Versão reescrita fictícia, só para validar a UI de paywall.',
    feedback_pedagogico: '[TESTE] Feedback fictício.',
    pontos_positivos: ['[TESTE] Ponto positivo fictício.'],
    proximos_passos: ['[TESTE] Próximo passo fictício.'],
    created_at: new Date().toISOString(),
  };

  const { error: erroInsert } = await admin.from('redacoes').insert({
    id: redacaoId,
    user_id: usuario.id,
    titulo: '[TESTE] Redação para validar o paywall',
    tema: 'Tema de teste',
    texto: 'Texto de redação fictício, gerado só para popular o banco durante o desenvolvimento.',
    palavras_count: 12,
    linhas_count: 1,
    status: 'corrigida',
    correcao: correcaoFake,
    created_at: new Date().toISOString(),
  });

  if (erroInsert) throw erroInsert;

  console.log(`Redação de teste criada: ${redacaoId}`);
  console.log(`Abra: http://localhost:3000/correcao/${redacaoId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
