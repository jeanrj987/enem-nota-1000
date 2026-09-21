import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { lerRespostaJson } from '@/lib/resposta-http';

/**
 * Regressão do erro reportado em 21/09 por quem tentou importar um arquivo:
 * a tela mostrou "The string did not match the expected pattern", que é a
 * mensagem crua do WebKit (Safari e qualquer navegador no iOS) quando
 * `JSON.parse` recebe algo que não é JSON.
 *
 * A origem era `await res.json()` chamado sem checar o que veio no corpo.
 * Quem responde nem sempre é a nossa rota: gateway, limite de corpo da
 * hospedagem e timeout devolvem HTML, e a mensagem do motor ia direto para o
 * aluno. Estes testes travam a tradução para uma frase que diz o que houve.
 */

function resposta(corpo: string, status: number) {
  return {
    status,
    url: 'http://localhost/api/upload',
    text: async () => corpo,
  } as unknown as Response;
}

beforeEach(() => {
  // O módulo registra o corpo não-JSON no console para que um relato futuro
  // seja diagnosticável. Silenciado aqui para não poluir a saída da suíte.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('lerRespostaJson', () => {
  it('devolve o corpo parseado quando é JSON válido', async () => {
    const data = await lerRespostaJson<{ text: string }>(
      resposta(JSON.stringify({ text: 'minha redação' }), 200)
    );
    expect(data.text).toBe('minha redação');
  });

  it('também parseia corpo de erro da nossa API, para a tela ler `error`', async () => {
    const data = await lerRespostaJson<{ error: string }>(
      resposta(JSON.stringify({ error: 'Formato não suportado.' }), 400)
    );
    expect(data.error).toBe('Formato não suportado.');
  });

  it('não deixa a mensagem do motor JS vazar quando o corpo é HTML', async () => {
    const html = '<!DOCTYPE html><html><body>Request Entity Too Large</body></html>';

    await expect(lerRespostaJson(resposta(html, 413))).rejects.toThrow(
      /arquivo é grande demais/i
    );
    // O ponto do teste: seja qual for a frase escolhida, ela não pode ser a
    // do motor — foi exatamente essa que chegou ao usuário.
    await expect(lerRespostaJson(resposta(html, 413))).rejects.not.toThrow(
      /did not match the expected pattern/i
    );
  });

  it('traduz o timeout do gateway em orientação prática', async () => {
    await expect(lerRespostaJson(resposta('An error occurred', 504))).rejects.toThrow(
      /demorou mais/i
    );
  });

  it('cai numa frase genérica para status sem tradução própria', async () => {
    await expect(lerRespostaJson(resposta('<html>oops</html>', 418))).rejects.toThrow(
      /Não conseguimos completar a operação/i
    );
  });

  it('corpo vazio é tratado como falha, não como objeto vazio', async () => {
    // `JSON.parse('')` lança. Sem este caminho, a tela seguiria adiante com
    // um valor indefinido e quebraria mais à frente, longe da causa.
    await expect(lerRespostaJson(resposta('', 502))).rejects.toThrow(/não respondeu/i);
  });

  it('registra o corpo inesperado para tornar o relato diagnosticável', async () => {
    await expect(lerRespostaJson(resposta('<html>erro</html>', 502))).rejects.toThrow();
    expect(console.error).toHaveBeenCalled();
  });
});
