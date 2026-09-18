/**
 * Auditoria de viés do corretor de IA. Roda cada caso de
 * src/lib/auditoria/casos.ts contra o modelo real (correção única, não a
 * dupla correção de produção, para gastar metade da cota) e compara os
 * dois lados de cada par. Requer GEMINI_API_KEY ou OPENAI_API_KEY válidas.
 *
 * Uso: npm run auditoria:vies
 */
import { corrigirRedacaoComIA } from '../src/lib/openai';
import { CASOS_AUDITORIA } from '../src/lib/auditoria/casos';

async function run() {
  const porPar = new Map<string, typeof CASOS_AUDITORIA>();
  for (const caso of CASOS_AUDITORIA) {
    const lista = porPar.get(caso.par) ?? [];
    lista.push(caso);
    porPar.set(caso.par, lista);
  }

  for (const [par, casos] of porPar) {
    console.log(`\n=== Par: ${par} (${casos[0].dimensao}) ===`);
    const resultados = [];
    for (const caso of casos) {
      process.stdout.write(`  corrigindo variante "${caso.variante}"... `);
      try {
        const correcao = await corrigirRedacaoComIA(caso.texto, caso.tema, caso.titulo);
        console.log(`nota_geral=${correcao.nota_geral}`);
        resultados.push({ variante: caso.variante, correcao });
      } catch (err) {
        const mensagem = err instanceof Error ? err.message : String(err);
        console.log(`FALHOU: ${mensagem.slice(0, 100)}`);
      }
    }

    if (resultados.length === 2) {
      const [a, b] = resultados;
      const diferenca = Math.abs(a.correcao.nota_geral - b.correcao.nota_geral);
      console.log(`  Diferença de nota_geral entre variantes: ${diferenca} pontos`);
      for (let c = 1; c <= 5; c++) {
        const notaA = a.correcao.competencias.find((x) => x.numero === c)?.nota;
        const notaB = b.correcao.competencias.find((x) => x.numero === c)?.nota;
        if (notaA !== notaB) {
          console.log(`  C${c}: ${a.variante}=${notaA} vs ${b.variante}=${notaB} (DIFERE)`);
        }
      }
      if (diferenca > 40) {
        console.log(
          `  ⚠️  Diferença acima de 1 nível de competência (40 pts) — investigar possível viés na dimensão "${casos[0].dimensao}".`
        );
      }
    }
  }
}

run().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
