import { describe, it, expect } from 'vitest';
import { reconciliarCorrecoes, LIMIAR_DIVERGENCIA } from '@/lib/reconciliacao';
import { Correcao } from '@/types';

function correcao(notaGeral: number, anulada = false, sufixo = '', leve = false): Correcao {
  const notaPorCompetencia = notaGeral / 5;
  return {
    id: 'cor_teste' + sufixo,
    redacao_id: 'red_teste' + sufixo,
    anulada,
    motivo_anulacao: anulada ? 'Motivo de teste' : null,
    nota_geral: notaGeral,
    competencias: [1, 2, 3, 4, 5].map((numero) => ({
      numero: numero as 1 | 2 | 3 | 4 | 5,
      nome: `Competência ${numero}`,
      descricao_curta: 'x',
      nota: notaPorCompetencia,
      nivel: notaPorCompetencia / 40,
      comentario: 'comentário ' + sufixo,
    })),
    erros: [],
    // Uma correção "leve" (segunda opinião só de nota, ver openai.ts) devolve
    // esses campos vazios de propósito.
    versao_reescrita: leve ? '' : 'versão ' + sufixo,
    feedback_pedagogico: leve ? '' : 'feedback ' + sufixo,
    pontos_positivos: leve ? [] : ['ponto ' + sufixo],
    proximos_passos: leve ? [] : ['passo ' + sufixo],
    created_at: new Date().toISOString(),
  };
}

describe('reconciliarCorrecoes', () => {
  it('com 1 correção só, marca correcaoUnica=true e não mexe na nota', () => {
    const r = reconciliarCorrecoes([correcao(600)]);
    expect(r.nota_geral).toBe(600);
    expect(r.reconciliacao?.correcaoUnica).toBe(true);
  });

  it('com 2 correções dentro do limiar, tira a média da nota geral', () => {
    const r = reconciliarCorrecoes([correcao(600, false, 'a'), correcao(680, false, 'b')]);
    expect(r.nota_geral).toBe(640); // média de 600 e 680
    expect(r.reconciliacao?.divergencia).toBe(80);
    expect(r.reconciliacao?.terceiraCorrecaoAcionada).toBe(false);
  });

  it('reproduz o caso real medido: 600 vs 720 (divergência de 120, acima do limiar)', () => {
    const divergencia = Math.abs(600 - 720);
    expect(divergencia).toBeGreaterThan(LIMIAR_DIVERGENCIA);
    const r = reconciliarCorrecoes([correcao(600, false, 'a'), correcao(720, false, 'b')]);
    expect(r.nota_geral).toBe(660); // média de 600 e 720
    expect(r.reconciliacao?.divergencia).toBe(120);
  });

  it('com 3 correções (terceira de arbitragem), usa o PAR mais próximo entre si', () => {
    // c1=600, c2=900 (divergência 300, aciona 3ª), c3=620 → par mais próximo é c1+c3 (divergência 20)
    const r = reconciliarCorrecoes([correcao(600, false, 'a'), correcao(900, false, 'b'), correcao(620, false, 'c')]);
    expect(r.nota_geral).toBe(610); // média de 600 e 620, não de 900
    expect(r.reconciliacao?.divergencia).toBe(20);
    expect(r.reconciliacao?.terceiraCorrecaoAcionada).toBe(true);
    expect(r.reconciliacao?.notasIndividuais).toEqual([600, 900, 620]);
  });

  it('quando as duas correções mais próximas discordam sobre anulação, não tira média — usa a nota mais alta', () => {
    const r = reconciliarCorrecoes([correcao(0, true, 'a'), correcao(600, false, 'b')]);
    expect(r.nota_geral).toBe(600);
    expect(r.anulada).toBe(false);
    expect(r.reconciliacao?.divergenciaDeAnulacao).toBe(true);
  });

  it('quando as duas correções concordam que é anulada, mantém anulada e nota 0', () => {
    const r = reconciliarCorrecoes([correcao(0, true, 'a'), correcao(0, true, 'b')]);
    expect(r.nota_geral).toBe(0);
    expect(r.anulada).toBe(true);
  });

  it('a nota de cada competência também é a média das duas correções', () => {
    const r = reconciliarCorrecoes([correcao(600, false, 'a'), correcao(800, false, 'b')]);
    // 600/5=120 por competência na correção A; 800/5=160 na correção B; média = 140
    r.competencias.forEach((c) => expect(c.nota).toBe(140));
  });

  describe('narrativa emprestada de uma correção "leve" (economia de tokens)', () => {
    // A segunda correção de um par nasce sem versao_reescrita/feedback de
    // propósito (não seriam exibidos de qualquer forma) — mas se ELA acabar
    // sendo a "representativa" (a mais próxima da nota média), a reescrita
    // não pode sumir da resposta final: precisa vir emprestada da outra.
    it('quando a correção mais próxima da média é a leve, empresta a narrativa da completa', () => {
      // média = 650; leve(660) fica mais perto da média que completa(640).
      const completa = correcao(640, false, 'completa');
      const leve = correcao(660, false, 'leve', true);
      const r = reconciliarCorrecoes([completa, leve]);

      expect(r.nota_geral).toBe(650);
      expect(r.versao_reescrita).toBe('versão completa');
      expect(r.feedback_pedagogico).toBe('feedback completa');
      expect(r.pontos_positivos).toEqual(['ponto completa']);
      expect(r.proximos_passos).toEqual(['passo completa']);
    });

    it('quando a correção mais próxima da média já é a completa, não muda nada', () => {
      // média = 650; completa(640) fica mais perto da média que leve(700).
      const completa = correcao(640, false, 'completa');
      const leve = correcao(700, false, 'leve', true);
      const r = reconciliarCorrecoes([completa, leve]);

      expect(r.versao_reescrita).toBe('versão completa');
    });

    it('a média de nota por competência continua correta mesmo emprestando narrativa', () => {
      // Garante que emprestar a narrativa não corrompeu o cálculo de médias,
      // que precisa continuar comparando as DUAS correções reais.
      const completa = correcao(600, false, 'completa'); // 120 por competência
      const leve = correcao(700, false, 'leve', true); // 140 por competência
      const r = reconciliarCorrecoes([completa, leve]);
      r.competencias.forEach((c) => expect(c.nota).toBe(130));
    });

    it('na divergência de anulação, também empresta a narrativa quando a escolhida é a leve', () => {
      // A leve(600, não anulada) vence por ter nota mais alta que a
      // completa(0, anulada) — mas precisa herdar a narrativa da completa.
      const completaAnulada = correcao(0, true, 'completa');
      const leveNaoAnulada = correcao(600, false, 'leve', true);
      const r = reconciliarCorrecoes([completaAnulada, leveNaoAnulada]);

      expect(r.anulada).toBe(false);
      expect(r.nota_geral).toBe(600);
      expect(r.versao_reescrita).toBe('versão completa');
    });
  });
});
