import { describe, it, expect } from 'vitest';
import { validarCorrecaoIA, contarParagrafos, type CorrecaoIA } from '@/lib/correcao-schema';

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
    habilidades_c1: undefined as
      | { ortografia_e_acentuacao: boolean; concordancia_e_regencia: boolean; pontuacao_adequada: boolean; registro_formal_sem_oralidade: boolean }
      | undefined,
    habilidades_c3: undefined as
      | { tese_clara: boolean; argumentos_bem_selecionados: boolean; progressao_logica: boolean; conclusao_articulada: boolean }
      | undefined,
    habilidades_c4: undefined as
      | { conectivos_interparagrafos: boolean; conectivos_intraparagrafos_variados: boolean; ausencia_repeticao_excessiva: boolean; ausencia_marcadores_orais: boolean }
      | undefined,
    elementos_c5: undefined as
      | { agente: boolean; acao: boolean; meio: boolean; efeito: boolean; detalhamento: boolean }
      | undefined,
  };
}

function correcaoBase(notas: [number, number, number, number, number]) {
  return {
    anulada: false,
    motivo_anulacao: null as string | null,
    nota_geral: notas.reduce((a, b) => a + b, 0),
    competencias: [1, 2, 3, 4, 5].map((n, i) => competencia(n as 1, notas[i])),
    erros: [] as CorrecaoIA['erros'],
    versao_reescrita: 'x',
    feedback_pedagogico: 'x',
    pontos_positivos: [],
    proximos_passos: [],
  };
}

describe('validarCorrecaoIA — modo leve (segunda opinião só de nota)', () => {
  it('modo completo (padrão) recusa versao_reescrita vazia', () => {
    const data = { ...correcaoBase([120, 120, 120, 120, 120]), versao_reescrita: '' };
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(false);
  });

  it('modo completo recusa feedback_pedagogico vazio', () => {
    const data = { ...correcaoBase([120, 120, 120, 120, 120]), feedback_pedagogico: '' };
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(false);
  });

  it('modo leve aceita versao_reescrita e feedback_pedagogico vazios', () => {
    const data = {
      ...correcaoBase([120, 120, 120, 120, 120]),
      versao_reescrita: '',
      feedback_pedagogico: '',
    };
    const r = validarCorrecaoIA(data, textoComParagrafos, 'leve');
    expect(r.success).toBe(true);
  });

  it('modo leve não deixa de checar a matemática das notas — economizar texto não é economizar rigor', () => {
    const data = {
      ...correcaoBase([120, 120, 120, 120, 120]),
      versao_reescrita: '',
      feedback_pedagogico: '',
      nota_geral: 999,
    };
    const r = validarCorrecaoIA(data, textoComParagrafos, 'leve');
    expect(r.success).toBe(false);
  });
});

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
    data.erros = [
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
    data.erros = [
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

describe('validarCorrecaoIA — consistência dos elementos de C5', () => {
  it('rejeita 4 elementos declarados presentes com nota abaixo de 160 (bug real encontrado em teste manual)', () => {
    const data = correcaoBase([120, 120, 120, 120, 120]);
    data.competencias[4].elementos_c5 = { agente: true, acao: true, meio: true, efeito: true, detalhamento: false };
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(false);
  });

  it('aceita 4 elementos presentes com nota 160', () => {
    const data = correcaoBase([120, 120, 120, 120, 160]);
    data.competencias[4].elementos_c5 = { agente: true, acao: true, meio: true, efeito: true, detalhamento: false };
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(true);
  });

  it('rejeita 0 elementos presentes com nota diferente de 0', () => {
    const data = correcaoBase([120, 120, 120, 120, 120]);
    data.competencias[4].elementos_c5 = { agente: false, acao: false, meio: false, efeito: false, detalhamento: false };
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(false);
  });

  it('aceita 2-3 elementos presentes com nota 120 (faixa intermediária não travada)', () => {
    const data = correcaoBase([120, 120, 120, 120, 120]);
    data.competencias[4].elementos_c5 = { agente: true, acao: true, meio: false, efeito: true, detalhamento: false };
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(true);
  });

  it('não aplica a regra quando elementos_c5 não foi enviado (compatibilidade)', () => {
    const data = correcaoBase([120, 120, 120, 120, 120]);
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(true);
  });
});

describe('validarCorrecaoIA — consistência das habilidades de C1', () => {
  it('rejeita 4 habilidades presentes com nota abaixo de 160', () => {
    const data = correcaoBase([120, 120, 120, 120, 120]);
    data.competencias[0].habilidades_c1 = {
      ortografia_e_acentuacao: true,
      concordancia_e_regencia: true,
      pontuacao_adequada: true,
      registro_formal_sem_oralidade: true,
    };
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(false);
  });

  it('aceita 4 habilidades presentes com nota 160', () => {
    const data = correcaoBase([160, 120, 120, 120, 120]);
    data.competencias[0].habilidades_c1 = {
      ortografia_e_acentuacao: true,
      concordancia_e_regencia: true,
      pontuacao_adequada: true,
      registro_formal_sem_oralidade: true,
    };
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(true);
  });

  it('rejeita 0 habilidades presentes com nota acima de 80', () => {
    const data = correcaoBase([120, 120, 120, 120, 120]);
    data.competencias[0].habilidades_c1 = {
      ortografia_e_acentuacao: false,
      concordancia_e_regencia: false,
      pontuacao_adequada: false,
      registro_formal_sem_oralidade: false,
    };
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(false);
  });

  it('aceita 0 habilidades presentes com nota 80', () => {
    const data = correcaoBase([80, 120, 120, 120, 120]);
    data.competencias[0].habilidades_c1 = {
      ortografia_e_acentuacao: false,
      concordancia_e_regencia: false,
      pontuacao_adequada: false,
      registro_formal_sem_oralidade: false,
    };
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(true);
  });

  it('rejeita nota 200 em C1 quando há 2 ou mais erros grounded relacionados à Competência I', () => {
    const data = correcaoBase([200, 120, 120, 120, 120]);
    data.erros = [
      { id: 'e1', trecho: 'Parágrafo dois desenvolvendo', tipo: 'concordancia', correcao: 'x', explicacao: 'x', competencia_relacionada: 1 },
      { id: 'e2', trecho: 'Parágrafo três com outro', tipo: 'ortografia', correcao: 'x', explicacao: 'x', competencia_relacionada: 1 },
    ];
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(false);
  });

  it('aceita nota 200 em C1 com apenas 1 erro grounded relacionado à Competência I', () => {
    const data = correcaoBase([200, 120, 120, 120, 120]);
    data.erros = [
      { id: 'e1', trecho: 'Parágrafo dois desenvolvendo', tipo: 'concordancia', correcao: 'x', explicacao: 'x', competencia_relacionada: 1 },
    ];
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(true);
  });

  it('gera aviso (mas não rejeita) quando C1 recebe nota abaixo de 200 sem nenhum erro grounded vinculado', () => {
    const data = correcaoBase([160, 120, 120, 120, 120]);
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.avisos.some((a) => a.includes('Competência I recebeu nota 160'))).toBe(true);
    }
  });

  it('não gera esse aviso quando C1 recebe nota abaixo de 200 com um erro grounded vinculado', () => {
    const data = correcaoBase([160, 120, 120, 120, 120]);
    data.erros = [
      { id: 'e1', trecho: 'Parágrafo dois desenvolvendo', tipo: 'regencia', correcao: 'x', explicacao: 'x', competencia_relacionada: 1 },
    ];
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.avisos.some((a) => a.includes('dedução sem evidência concreta'))).toBe(false);
    }
  });
});

describe('validarCorrecaoIA — consistência das habilidades de C3', () => {
  it('rejeita 4 habilidades presentes com nota abaixo de 160', () => {
    const data = correcaoBase([120, 120, 120, 120, 120]);
    data.competencias[2].habilidades_c3 = {
      tese_clara: true,
      argumentos_bem_selecionados: true,
      progressao_logica: true,
      conclusao_articulada: true,
    };
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(false);
  });

  it('rejeita 0 habilidades presentes com nota acima de 80', () => {
    const data = correcaoBase([120, 120, 120, 120, 120]);
    data.competencias[2].habilidades_c3 = {
      tese_clara: false,
      argumentos_bem_selecionados: false,
      progressao_logica: false,
      conclusao_articulada: false,
    };
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(false);
  });

  it('aceita 2-3 habilidades presentes na faixa intermediária', () => {
    const data = correcaoBase([120, 120, 120, 120, 120]);
    data.competencias[2].habilidades_c3 = {
      tese_clara: true,
      argumentos_bem_selecionados: true,
      progressao_logica: false,
      conclusao_articulada: false,
    };
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(true);
  });
});

describe('validarCorrecaoIA — consistência das habilidades de C4', () => {
  it('rejeita 4 habilidades presentes com nota abaixo de 160', () => {
    const data = correcaoBase([120, 120, 120, 120, 120]);
    data.competencias[3].habilidades_c4 = {
      conectivos_interparagrafos: true,
      conectivos_intraparagrafos_variados: true,
      ausencia_repeticao_excessiva: true,
      ausencia_marcadores_orais: true,
    };
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(false);
  });

  it('rejeita 0 habilidades presentes com nota acima de 80', () => {
    const data = correcaoBase([120, 120, 120, 120, 120]);
    data.competencias[3].habilidades_c4 = {
      conectivos_interparagrafos: false,
      conectivos_intraparagrafos_variados: false,
      ausencia_repeticao_excessiva: false,
      ausencia_marcadores_orais: false,
    };
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(false);
  });

  it('não aplica a regra quando habilidades_c4 não foi enviado (compatibilidade)', () => {
    const data = correcaoBase([120, 120, 120, 120, 120]);
    const r = validarCorrecaoIA(data, textoComParagrafos);
    expect(r.success).toBe(true);
  });
});
