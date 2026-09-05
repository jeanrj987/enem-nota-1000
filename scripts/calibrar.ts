/**
 * Harness de calibração (R8): roda o corretor de IA contra o conjunto de
 * redações rotuladas em src/lib/calibracao/fixtures.ts e reporta erro médio
 * por competência e consistência entre execuções repetidas da mesma redação.
 *
 * Uso:
 *   npm run calibrar               (1 execução por redação)
 *   npm run calibrar -- --rep 5    (5 execuções por redação, mede consistência)
 *
 * Requer GEMINI_API_KEY e/ou OPENAI_API_KEY em .env.local — cada execução é
 * uma chamada real e paga ao provedor configurado.
 *
 * IMPORTANTE: este harness usa corrigirRedacaoComIA (correção única), de
 * propósito — é o que mede a variância "crua" do modelo entre execuções. Em
 * produção, /api/corrigir usa corrigirRedacaoComDuplaCorrecao (duas correções
 * reconciliadas, ver src/lib/reconciliacao.ts), que reduz mas não elimina essa
 * variância. Os números de consistência aqui são um limite superior da
 * variância real que o aluno recebe, não uma medição direta dela.
 */
import fs from 'fs';
import path from 'path';

function carregarEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const conteudo = fs.readFileSync(envPath, 'utf-8');
  for (const linha of conteudo.split('\n')) {
    const trimmed = linha.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const chave = trimmed.slice(0, idx).trim();
    const valor = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (!(chave in process.env)) process.env[chave] = valor;
  }
}

carregarEnvLocal();

async function main() {
  const { REDACOES_CALIBRACAO } = await import('../src/lib/calibracao/fixtures');
  const { calcularMetricas } = await import('../src/lib/calibracao/metricas');
  const { corrigirRedacaoComIA } = await import('../src/lib/openai');

  const repArg = process.argv.find((a) => a.startsWith('--rep'));
  const repeticoes = repArg ? parseInt(process.argv[process.argv.indexOf(repArg) + 1] || '1', 10) : 1;

  console.log(`\nCalibração — ${REDACOES_CALIBRACAO.length} redações × ${repeticoes} execução(ões) cada\n`);
  console.log(
    'AVISO: este é um conjunto de calibração de TETO (todas as redações são nota 1000).\n' +
    'Os números abaixo dizem se o corretor reconhece um texto excelente como excelente —\n' +
    'não medem acurácia em notas medianas ou baixas. Ver comentário em fixtures.ts.\n'
  );

  for (const redacao of REDACOES_CALIBRACAO) {
    const execucoes = [];
    for (let i = 1; i <= repeticoes; i++) {
      process.stdout.write(`  [${redacao.candidato}] execução ${i}/${repeticoes}... `);
      const inicio = Date.now();
      try {
        const correcao = await corrigirRedacaoComIA(redacao.texto, redacao.tema, redacao.candidato);
        execucoes.push({ redacaoId: redacao.id, execucao: i, correcao, erro: null, duracaoMs: Date.now() - inicio });
        console.log(`nota_geral=${correcao.nota_geral} (esperado ${redacao.notaOficial.geral})`);
      } catch (e: any) {
        execucoes.push({ redacaoId: redacao.id, execucao: i, correcao: null, erro: e.message, duracaoMs: Date.now() - inicio });
        console.log(`FALHOU: ${e.message}`);
      }
    }

    const m = calcularMetricas(redacao, execucoes);
    console.log(`\n  Resultado — ${m.candidato}`);
    console.log(`    Execuções OK: ${m.execucoesOk}/${repeticoes} (falhas: ${m.execucoesFalhas})`);
    console.log(`    Erro médio na nota geral: ${m.maeNotaGeral ?? 'n/d'}`);
    console.log(
      `    Erro médio por competência: ` +
        [1, 2, 3, 4, 5].map((n) => `C${n}=${m.maePorCompetencia[n as 1] ?? 'n/d'}`).join('  ')
    );
    console.log(
      `    Acerto exato por competência: ` +
        [1, 2, 3, 4, 5]
          .map((n) => {
            const v = m.acertoExatoPorCompetencia[n as 1];
            return `C${n}=${v === null ? 'n/d' : Math.round(v * 100) + '%'}`;
          })
          .join('  ')
    );
    if (repeticoes > 1) {
      console.log(`    Desvio padrão da nota geral entre execuções: ${m.desvioPadraoNotaGeral ?? 'n/d'}`);
    }
    console.log('');
  }
}

main().catch((e) => {
  console.error('Erro fatal no harness de calibração:', e);
  process.exit(1);
});
