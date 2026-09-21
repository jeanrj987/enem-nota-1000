// @vitest-environment jsdom
/**
 * Teste de fluxo: RequerLogin/RequerAssinatura renderizados de verdade
 * (React + jsdom), não só a lógica pura de decisão já coberta em
 * gates.test.ts. Aqui importa que o componente realmente chame
 * router.replace() com a URL certa, ou realmente renderize os filhos —
 * o que gates.test.ts não consegue garantir sozinho, porque testa
 * decidirGateLogin/decidirGateAssinatura isolados da árvore React.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { Perfil } from '@/lib/perfil';

const routerReplace = vi.fn();
const estado = {
  pathname: '/nova-redacao',
  usuario: null as { id: string } | null,
  carregando: false,
  perfil: null as Perfil | null,
  temAcesso: false,
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: routerReplace }),
  usePathname: () => estado.pathname,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ usuario: estado.usuario, carregando: estado.carregando }),
}));

vi.mock('@/lib/perfil', () => ({
  buscarPerfil: async (_userId: string) => estado.perfil,
  perfilCompleto: (perfil: Perfil | null) =>
    !!perfil &&
    !!perfil.nome_completo &&
    !!perfil.whatsapp &&
    !!perfil.cidade_estado &&
    !!perfil.data_nascimento &&
    !!perfil.curso_dos_sonhos,
}));

vi.mock('@/lib/assinatura', () => ({
  temAcessoAtivo: async () => estado.temAcesso,
}));

const { RequerLogin } = await import('@/components/RequerLogin');
const { RequerAssinatura } = await import('@/components/RequerAssinatura');

const perfilCompletoFixture: Perfil = {
  nome_completo: 'Fulano de Tal',
  whatsapp: '+5511999999999',
  cidade_estado: 'São Paulo/SP',
  data_nascimento: '2005-01-01',
  curso_dos_sonhos: 'Medicina',
};

beforeEach(() => {
  routerReplace.mockClear();
  // Pathname de uma correção específica (não o destino padrão de login) —
  // exercita o caso em que o `?redirect=` precisa mesmo ser preservado, não
  // o atalho em que urlDeLogin omite a query por já ser o destino padrão.
  estado.pathname = '/correcao/abc123';
  estado.usuario = null;
  estado.carregando = false;
  estado.perfil = null;
  estado.temAcesso = false;
});

describe('RequerLogin — navegação real', () => {
  it('sem sessão, redireciona para /auth com o destino preservado, sem renderizar os filhos', async () => {
    render(
      <RequerLogin>
        <p>Conteúdo protegido</p>
      </RequerLogin>
    );

    await waitFor(() => expect(routerReplace).toHaveBeenCalledWith('/auth?redirect=%2Fcorrecao%2Fabc123'));
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument();
  });

  it('logado com perfil incompleto, redireciona para /completar-perfil', async () => {
    estado.usuario = { id: 'user-1' };
    estado.perfil = null;

    render(
      <RequerLogin>
        <p>Conteúdo protegido</p>
      </RequerLogin>
    );

    await waitFor(() => expect(routerReplace).toHaveBeenCalledWith('/completar-perfil?redirect=%2Fcorrecao%2Fabc123'));
  });

  it('logado com perfil completo, libera e renderiza os filhos sem redirecionar', async () => {
    estado.usuario = { id: 'user-1' };
    estado.perfil = perfilCompletoFixture;

    render(
      <RequerLogin>
        <p>Conteúdo protegido</p>
      </RequerLogin>
    );

    await waitFor(() => expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument());
    expect(routerReplace).not.toHaveBeenCalled();
  });
});

describe('RequerAssinatura — navegação real', () => {
  it('sem sessão, redireciona para /auth', async () => {
    estado.pathname = '/dashboard';

    render(
      <RequerAssinatura>
        <p>Dashboard</p>
      </RequerAssinatura>
    );

    await waitFor(() => expect(routerReplace).toHaveBeenCalledWith('/auth?redirect=%2Fdashboard'));
  });

  it('logado, perfil completo, sem assinatura ativa, redireciona para a home', async () => {
    estado.usuario = { id: 'user-1' };
    estado.perfil = perfilCompletoFixture;
    estado.temAcesso = false;

    render(
      <RequerAssinatura>
        <p>Dashboard</p>
      </RequerAssinatura>
    );

    await waitFor(() => expect(routerReplace).toHaveBeenCalledWith('/?bloqueio=assinatura'));
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('logado, perfil completo, com assinatura ativa, libera e renderiza os filhos', async () => {
    estado.usuario = { id: 'user-1' };
    estado.perfil = perfilCompletoFixture;
    estado.temAcesso = true;

    render(
      <RequerAssinatura>
        <p>Dashboard</p>
      </RequerAssinatura>
    );

    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument());
    expect(routerReplace).not.toHaveBeenCalled();
  });
});
