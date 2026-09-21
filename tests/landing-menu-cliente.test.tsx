// @vitest-environment jsdom
/**
 * A landing é a página que converte, e a decisão de produto é que ela tem
 * navegação deliberadamente pobre: cada saída extra é uma chance a mais de
 * a pessoa abandonar o argumento no meio (ADR 043).
 *
 * O menu de cliente aberto no ADR 047 é a única exceção, e ela só se sustenta
 * enquanto for mesmo restrita a quem já comprou. Estes testes existem para
 * essa garantia — o caso que precisa nunca mais mudar sem alguém perceber é
 * o do visitante sem plano, não o do cliente.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const estado = {
  usuario: null as { id: string; email?: string } | null,
  temAcesso: false,
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/',
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ usuario: estado.usuario, carregando: false }),
}));

vi.mock('@/lib/assinatura', () => ({
  temAcessoAtivo: async () => estado.temAcesso,
}));

vi.mock('@/lib/auth', () => ({ sair: async () => {} }));

vi.mock('@/lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

vi.mock('@/lib/analytics/eventos-cliente', () => ({
  rastrearVisitaVendas: () => {},
  rastrearInicioCheckout: () => {},
  rastrearPrimeiraCorrecao: () => {},
}));

vi.mock('@/lib/analytics/atribuicao', () => ({
  lerAtribuicao: () => null,
  guardarAtribuicao: async () => {},
}));

const { default: PaginaInicial } = await import('@/app/page');

/** Link de navegação para a área logada, em qualquer um dos dois layouts. */
function linkPara(href: string) {
  return screen.queryAllByRole('link').find((el) => el.getAttribute('href') === href);
}

beforeEach(() => {
  estado.usuario = null;
  estado.temAcesso = false;
  window.history.replaceState(null, '', '/');
});

describe('Landing — visitante sem conta', () => {
  it('não ganha menu nenhum: nenhum botão de abrir menu na página', () => {
    render(<PaginaInicial />);

    expect(screen.queryByRole('button', { name: /menu/i })).not.toBeInTheDocument();
  });

  it('mantém as âncoras de venda, que são a navegação que a página quer', () => {
    render(<PaginaInicial />);

    expect(linkPara('#planos')).toBeDefined();
    expect(linkPara('#exemplo')).toBeDefined();
  });

  it('não oferece atalho para a área logada', () => {
    render(<PaginaInicial />);

    expect(linkPara('/dashboard')).toBeUndefined();
    expect(linkPara('/historico')).toBeUndefined();
  });
});

describe('Landing — conta criada, sem plano', () => {
  beforeEach(() => {
    estado.usuario = { id: 'user-1', email: 'aluno@exemplo.com' };
    estado.temAcesso = false;
  });

  it('continua sem menu — é o caso que o funil não pode perder', async () => {
    render(<PaginaInicial />);

    // Espera a assinatura resolver antes de afirmar a ausência: sem isso o
    // teste passaria só por chegar antes da resposta, e continuaria passando
    // se alguém ligasse o menu para quem não tem plano.
    await waitFor(() => expect(linkPara('#planos')).toBeDefined());
    expect(screen.queryByRole('button', { name: /menu/i })).not.toBeInTheDocument();
    expect(linkPara('/dashboard')).toBeUndefined();
  });

  it('ainda vê o CTA da correção gratuita, que é o que ele tem a ganhar', async () => {
    render(<PaginaInicial />);

    await waitFor(() => expect(screen.getAllByText(/Corrigir de graça/i).length).toBeGreaterThan(0));
  });
});

describe('Landing — cliente pagante', () => {
  beforeEach(() => {
    estado.usuario = { id: 'user-2', email: 'cliente@exemplo.com' };
    estado.temAcesso = true;
  });

  it('troca as âncoras de venda pelos destinos do app', async () => {
    render(<PaginaInicial />);

    await waitFor(() => expect(linkPara('/dashboard')).toBeDefined());
    expect(linkPara('/historico')).toBeDefined();
  });

  it('ganha o botão de menu no celular', async () => {
    render(<PaginaInicial />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
    );
  });

  it('para de dizer "de graça" a quem paga', async () => {
    render(<PaginaInicial />);

    await waitFor(() => expect(linkPara('/dashboard')).toBeDefined());
    // O CTA do topo. A frase ainda existe no corpo da página, que continua
    // descrevendo a oferta — o que não pode é o botão dele prometer grátis
    // aquilo que ele está pagando.
    const cabecalho = screen.getAllByRole('banner')[0];
    expect(cabecalho.textContent).not.toMatch(/de graça/i);
    expect(cabecalho.textContent).toMatch(/Escrever redação/i);
  });
});
