// @vitest-environment jsdom
/**
 * O menu do app renderizado de verdade, nos três estados que importam:
 * deslogado, logado sem plano e cliente pagante.
 *
 * Testar isso pela lógica pura não serviria — o que quebrou em 21/09 não foi
 * uma decisão errada, foi o menu **oferecer** um destino que o gate ia
 * recusar. O defeito só existe no que é renderizado: o `href` do item e o
 * conjunto de itens visíveis. Ver ADR 045 e ADR 047.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const estado = {
  pathname: '/nova-redacao',
  usuario: null as { id: string } | null,
  temAcesso: false,
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => estado.pathname,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ usuario: estado.usuario, carregando: false }),
}));

vi.mock('@/lib/assinatura', () => ({
  temAcessoAtivo: async () => estado.temAcesso,
}));

vi.mock('@/lib/auth', () => ({
  sair: async () => {},
}));

const { Navbar } = await import('@/components/Navbar');

/** O item de menu, em qualquer um dos dois layouts (desktop ou drawer). */
function linkDoMenu(rotulo: string | RegExp) {
  return screen.queryAllByRole('link', { name: rotulo })[0];
}

beforeEach(() => {
  estado.pathname = '/nova-redacao';
  estado.usuario = null;
  estado.temAcesso = false;
});

describe('Navbar — visitante deslogado', () => {
  it('mostra "Início" e aponta os destinos do app para as rotas reais', async () => {
    render(<Navbar />);

    expect(linkDoMenu('Início')).toBeInTheDocument();
    // Sem sessão o item não é bloqueado de propósito: o gate manda para o
    // login levando o destino junto, que é um resultado compreensível — ao
    // contrário de aterrissar na home sem explicação.
    expect(linkDoMenu('Dashboard')).toHaveAttribute('href', '/dashboard');
  });
});

describe('Navbar — logado sem plano', () => {
  beforeEach(() => {
    estado.usuario = { id: 'user-1' };
    estado.temAcesso = false;
  });

  it('desvia os itens de plano para a oferta, em vez da rota que vai recusá-lo', async () => {
    render(<Navbar />);

    await waitFor(() =>
      expect(linkDoMenu('Dashboard')).toHaveAttribute('href', '/?bloqueio=assinatura')
    );
    expect(linkDoMenu(/Histórico/)).toHaveAttribute('href', '/?bloqueio=assinatura');
  });

  it('não bloqueia o que não exige plano — a correção gratuita segue aberta', async () => {
    render(<Navbar />);

    await waitFor(() => expect(linkDoMenu('Dashboard')).toHaveAttribute('href', '/?bloqueio=assinatura'));
    expect(linkDoMenu(/Nova Redação/)).toHaveAttribute('href', '/nova-redacao');
  });

  it('mantém "Início": para quem ainda não comprou, a página de vendas é destino legítimo', async () => {
    render(<Navbar />);

    await waitFor(() => expect(linkDoMenu('Dashboard')).toHaveAttribute('href', '/?bloqueio=assinatura'));
    expect(linkDoMenu('Início')).toHaveAttribute('href', '/');
  });
});

describe('Navbar — cliente pagante', () => {
  beforeEach(() => {
    estado.usuario = { id: 'user-2' };
    estado.temAcesso = true;
  });

  it('remove "Início": mandar quem já pagou para a página de vendas é um desvio', async () => {
    render(<Navbar />);

    await waitFor(() => expect(linkDoMenu('Início')).toBeUndefined());
  });

  it('entrega os destinos do app sem cadeado nem desvio', async () => {
    render(<Navbar />);

    await waitFor(() => expect(linkDoMenu('Dashboard')).toHaveAttribute('href', '/dashboard'));
    expect(linkDoMenu(/Histórico/)).toHaveAttribute('href', '/historico');
    expect(linkDoMenu(/Nova Redação/)).toHaveAttribute('href', '/nova-redacao');
  });

  it('não pisca: antes da resposta da assinatura, nada é bloqueado nem removido', () => {
    // Render síncrono, antes de a promessa de `temAcessoAtivo` resolver. O
    // estado "ainda não sei" precisa ser indistinguível do normal — se ele
    // fosse tratado como "sem plano", o cadeado apareceria por um instante
    // em quem paga, a cada montagem de página.
    render(<Navbar />);

    expect(linkDoMenu('Início')).toBeInTheDocument();
    expect(linkDoMenu('Dashboard')).toHaveAttribute('href', '/dashboard');
  });
});
