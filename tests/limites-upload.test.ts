import { describe, it, expect } from 'vitest';
import {
  ACCEPT_ARQUIVO,
  EXTENSOES_ACEITAS,
  MAX_TAMANHO_ARQUIVO_BYTES,
  maxTamanhoEmMB,
  validarArquivo,
} from '@/lib/limites-upload';

describe('validarArquivo — extensão', () => {
  it('aceita os três formatos com texto extraível', () => {
    for (const ext of EXTENSOES_ACEITAS) {
      expect(validarArquivo(`redacao${ext}`, 1024)).toEqual({ ok: true });
    }
  });

  it('aceita extensão em caixa alta, que é o que o celular costuma mandar', () => {
    expect(validarArquivo('REDACAO.PDF', 1024)).toEqual({ ok: true });
  });

  it('recusa formato sem texto extraível', () => {
    const r = validarArquivo('foto-da-redacao.jpg', 1024);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).toMatch(/Formato não suportado/);
  });

  it('não se deixa enganar por extensão no meio do nome', () => {
    // "trabalho.pdf.exe" não é PDF: só o fim do nome vale.
    expect(validarArquivo('trabalho.pdf.exe', 1024).ok).toBe(false);
  });
});

describe('validarArquivo — tamanho', () => {
  it('aceita arquivo exatamente no teto', () => {
    expect(validarArquivo('redacao.pdf', MAX_TAMANHO_ARQUIVO_BYTES)).toEqual({ ok: true });
  });

  it('recusa um byte acima do teto', () => {
    const r = validarArquivo('redacao.pdf', MAX_TAMANHO_ARQUIVO_BYTES + 1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).toContain(`${maxTamanhoEmMB()}MB`);
  });

  it('o teto cabe no limite de corpo da hospedagem', () => {
    // Funções serverless na Vercel recusam corpo acima de 4,5MB — e quem
    // responde nesse caso é a plataforma, com HTML, antes de a rota rodar.
    // Foi assim que o erro de parse chegou ao aluno. Se alguém subir este
    // valor sem conferir o ambiente, o bug volta por baixo.
    expect(MAX_TAMANHO_ARQUIVO_BYTES).toBeLessThan(4.5 * 1024 * 1024);
  });

  it('checa a extensão antes do tamanho, para o erro apontar a causa mais útil', () => {
    const r = validarArquivo('foto.jpg', MAX_TAMANHO_ARQUIVO_BYTES + 1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).toMatch(/Formato não suportado/);
  });
});

describe('ACCEPT_ARQUIVO', () => {
  it('descreve exatamente o que a validação aceita', () => {
    // A tela e a validação precisam concordar: um `accept` mais largo abre a
    // porta para um arquivo que só vai ser recusado depois do envio.
    expect(ACCEPT_ARQUIVO.split(',')).toEqual([...EXTENSOES_ACEITAS]);
  });
});
