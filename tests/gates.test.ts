import { describe, it, expect } from 'vitest';
import { decidirGateLogin, decidirGateAssinatura } from '@/lib/gates';
import type { Perfil } from '@/lib/perfil';

const perfilCompleto: Perfil = {
  nome_completo: 'Fulano de Tal',
  whatsapp: '+5511999999999',
  cidade_estado: 'São Paulo/SP',
  data_nascimento: '2005-01-01',
  curso_dos_sonhos: 'Medicina',
};

const perfilIncompleto: Perfil = {
  nome_completo: 'Fulano de Tal',
  whatsapp: null,
  cidade_estado: null,
  data_nascimento: null,
  curso_dos_sonhos: null,
};

describe('decidirGateLogin (RequerLogin — exige login + cadastro, não exige assinatura)', () => {
  it('sem usuário logado, manda para /auth preservando a página de origem', () => {
    const r = decidirGateLogin(false, null, '/correcao/abc123');
    expect(r).toEqual({ tipo: 'redirecionar', url: '/auth?redirect=%2Fcorrecao%2Fabc123' });
  });

  it('logado mas com perfil incompleto, manda para /completar-perfil preservando a origem', () => {
    const r = decidirGateLogin(true, perfilIncompleto, '/nova-redacao');
    expect(r).toEqual({
      tipo: 'redirecionar',
      url: '/completar-perfil?redirect=%2Fnova-redacao',
    });
  });

  it('logado sem perfil algum (null), também manda para /completar-perfil', () => {
    const r = decidirGateLogin(true, null, '/nova-redacao');
    expect(r.tipo).toBe('redirecionar');
    expect(r).toMatchObject({ url: expect.stringContaining('/completar-perfil') });
  });

  it('logado com perfil completo, libera — não exige assinatura', () => {
    const r = decidirGateLogin(true, perfilCompleto, '/nova-redacao');
    expect(r).toEqual({ tipo: 'liberado' });
  });
});

describe('decidirGateAssinatura (RequerAssinatura — exige login + cadastro + assinatura ativa)', () => {
  it('sem usuário logado, manda para /auth', () => {
    const r = decidirGateAssinatura(false, null, false, '/dashboard');
    expect(r).toEqual({ tipo: 'redirecionar', url: '/auth?redirect=%2Fdashboard' });
  });

  it('logado com perfil incompleto, manda para /completar-perfil ANTES de checar assinatura', () => {
    // mesmo com assinaturaAtiva=true, perfil incompleto vem primeiro — não
    // faz sentido liberar quem pagou mas não preencheu o cadastro.
    const r = decidirGateAssinatura(true, perfilIncompleto, true, '/dashboard');
    expect(r).toEqual({
      tipo: 'redirecionar',
      url: '/completar-perfil?redirect=%2Fdashboard',
    });
  });

  it('perfil completo mas sem assinatura ativa, manda para a home de vendas', () => {
    const r = decidirGateAssinatura(true, perfilCompleto, false, '/dashboard');
    expect(r).toEqual({ tipo: 'redirecionar', url: '/' });
  });

  it('perfil completo e assinatura ativa, libera', () => {
    const r = decidirGateAssinatura(true, perfilCompleto, true, '/dashboard');
    expect(r).toEqual({ tipo: 'liberado' });
  });

  it('rejeita tentativa de open redirect no pathname (não é caminho interno)', () => {
    const r = decidirGateAssinatura(false, null, false, 'https://site-falso.com');
    expect(r).toEqual({ tipo: 'redirecionar', url: '/auth' });
  });
});
