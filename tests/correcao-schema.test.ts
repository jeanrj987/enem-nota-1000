import { describe, it, expect } from 'vitest';
import { validarCorrecaoIA, contarParagrafos } from '@/lib/correcao-schema';

const textoMonobloco =
  'A herança africana é muito importante para o Brasil, mas infelizmente as pessoas não valorizam ela como deveria. Desde os tempos da escravidão, os negros trouxeram muita coisa boa para o nosso país, como a comida, a música, o samba, a capoeira, o candomblé e várias outras coisas. Mas isso tudo é esquecido e desvalorizado pela sociedade brasileira.Na minha opinião, o problema é que o racismo ainda existe muito no Brasil.';

const textoComParagrafos =
  'Parágrafo um sobre o tema.\n\nParágrafo dois desenvolvendo o argumento.\n\nParágrafo três com outro argumento.\n\nParágrafo quatro com a conclusão e proposta.';

function competencia(numero: 1 | 2 | 3 | 4 | 5, nota: number) {
  return {
    numero,
    nome: `Competência ${numero}`,
    descricao_curta: 'x',
    nota,
    nivel: nota / 40,
    comentario: 'x',
  };
}

function correcaoBase(notas: [number, number, number, number, number]) {
  return {
    anulada: false,
    motivo_anulacao: null as string | null,
    nota_geral: notas.reduce((a, b) => a + b, 0),
    competencias: [1, 2, 3, 4, 5].map((n, i) => competencia(n as 1, notas[i])),
    erros: [],
    versao_reescrita: 'x',
    feedback_pedagogico: 'x',
    pontos_positivos: [],
    proximos_passos: [],
  };
}

describe('contarParagrafos', () => {
  it('conta 1 parágrafo em texto monobloco', () => {
    expect(contarParagrafos(textoMonobloco)).toBe(1);
  });

  it('conta 4 parágrafos separados por linha em branco', () => {
    expect(contarParagrafos(textoComParagrafos)).toBe(4);
  });
});

describe('validarCorrecaoIA — consistência matemática', () => {
  it('aceita quando a soma das competências bate com nota_geral', () => {
    const r = validarCorrecaoIA(correcaoBase([120, 120, 120, 120, 120]), textoComParagrafos);
    expect(r.success).toBe(true);
  });

  it('rejeita quando nota_geral não é a soma das competências', () => {
    const data = correcaoBase([120, 120, 120, 120, 120]);
    data.nota_geral = 999;
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(false);
  });

  it('rejeita quando nivel não corresponde a nota/40', () => {
    const data = correcaoBase([120, 120, 120, 120, 120]);
    data.competencias[0].nivel = 5;
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(false);
  });

  it('aceita nota_geral=0 legítima quando a soma das 5 competências também é 0', () => {
    const data = correcaoBase([0, 0, 0, 0, 0]);
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(true);
  });
});

describe('validarCorrecaoIA — regra de anulação total', () => {
  it('rejeita anulada=true com nota_geral diferente de 0 (bug real encontrado em teste manual)', () => {
    const data = correcaoBase([80, 0, 0, 80, 0]);
    data.anulada = true;
    data.motivo_anulacao = 'Fuga total ao tema proposto.';
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(false);
  });

  it('rejeita anulada=true sem motivo_anulacao preenchido', () => {
    const data = correcaoBase([0, 0, 0, 0, 0]);
    data.anulada = true;
    data.motivo_anulacao = '';
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(false);
  });

  it('aceita anulação correta (motivo preenchido e todas as notas zeradas)', () => {
    const data = correcaoBase([0, 0, 0, 0, 0]);
    data.anulada = true;
    data.motivo_anulacao = 'Fuga total ao tema proposto.';
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(true);
  });
});

describe('validarCorrecaoIA — teto de C2 em texto monobloco', () => {
  it('rejeita C2 > 80 em texto de 1 parágrafo (bug real encontrado em teste manual)', () => {
    const data = correcaoBase([120, 120, 120, 120, 120]);
    const r = validarCorrecaoIA(data, textoMonobloco);
    expect(r.success).toBe(false);
  });

  it('aceita C2 = 80 em texto de 1 parágrafo', () => {
    const data = correcaoBase([80, 80, 80, 80, 80]);
    const r = validarCorrecaoIA(data, textoMonobloco);
    expect(r.success).toBe(true);
  });

  it('não aplica o teto quando o texto tem múltiplos parágrafos', () => {
    const data = correcaoBase([160, 160, 160, 160, 160]);
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(true);
  });
});

describe('validarCorrecaoIA — descarte de trechos alucinados', () => {
  it('descarta erro cujo trecho não existe no texto original, sem invalidar a resposta inteira', () => {
    const data = correcaoBase([120, 120, 120, 120, 120]);
    (data as any).erros = [
      {
        id: 'e1',
        trecho: 'isso não está no texto original',
        tipo: 'gramatica',
        correcao: 'x',
        explicacao: 'x',
        competencia_relacionada: 1,
      },
    ];
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.erros).toHaveLength(0);
      expect(r.avisos.length).toBeGreaterThan(0);
    }
  });

  it('mantém erro cujo trecho existe literalmente no texto original', () => {
    const data = correcaoBase([120, 120, 120, 120, 120]);
    (data as any).erros = [
      {
        id: 'e1',
        trecho: 'Parágrafo dois desenvolvendo',
        tipo: 'gramatica',
        correcao: 'x',
        explicacao: 'x',
        competencia_relacionada: 1,
      },
    ];
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.erros).toHaveLength(1);
    }
  });
});
