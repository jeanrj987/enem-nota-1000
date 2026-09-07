import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DESTINO_PADRAO,
  destinoSeguro,
  urlDeLogin,
  guardarDestino,
  resgatarDestino,
} from '@/lib/redirecionamento';

describe('destinoSeguro — barreira contra open redirect', () => {
  it('aceita caminho interno', () => {
    expect(destinoSeguro('/vendas')).toBe('/vendas');
    expect(destinoSeguro('/correcao/red_123')).toBe('/correcao/red_123');
    expect(destinoSeguro('/vendas?plano=anual')).toBe('/vendas?plano=anual');
  });

  it('recusa URL absoluta para outro site', () => {
    expect(destinoSeguro('https://site-falso.com')).toBe(DESTINO_PADRAO);
    expect(destinoSeguro('http://site-falso.com/login')).toBe(DESTINO_PADRAO);
  });

  // `//host` é uma URL de protocolo relativo: o navegador resolve como site
  // externo, mesmo começando com barra. É o desvio clássico de uma checagem
  // ingênua que só testa startsWith('/').
  it('recusa protocolo relativo', () => {
    expect(destinoSeguro('//site-falso.com')).toBe(DESTINO_PADRAO);
    expect(destinoSeguro('/\\site-falso.com')).toBe(DESTINO_PADRAO);
  });

  it('recusa esquemas perigosos', () => {
    expect(destinoSeguro('javascript:alert(1)')).toBe(DESTINO_PADRAO);
    expect(destinoSeguro('data:text/html,<script>')).toBe(DESTINO_PADRAO);
  });

  it('cai no padrão quando não há destino', () => {
    expect(destinoSeguro(null)).toBe(DESTINO_PADRAO);
    expect(destinoSeguro(undefined)).toBe(DESTINO_PADRAO);
    expect(destinoSeguro('')).toBe(DESTINO_PADRAO);
  });
});

describe('urlDeLogin', () => {
  it('não polui a URL quando o destino é o próprio padrão', () => {
    expect(urlDeLogin(DESTINO_PADRAO)).toBe('/auth');
  });

  it('codifica o destino como parâmetro', () => {
    expect(urlDeLogin('/vendas')).toBe('/auth?redirect=%2Fvendas');
  });

  it('não propaga destino externo', () => {
    expect(urlDeLogin('https://site-falso.com')).toBe('/auth');
  });
});

describe('guardarDestino / resgatarDestino (viagem pelo Google)', () => {
  beforeEach(() => {
    const armazem = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: (k: string) => armazem.get(k) ?? null,
      setItem: (k: string, v: string) => void armazem.set(k, v),
      removeItem: (k: string) => void armazem.delete(k),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('devolve o destino guardado antes de sair para o provedor', () => {
    guardarDestino('/vendas');
    expect(resgatarDestino()).toBe('/vendas');
  });

  it('consome o destino: um segundo login não herda o anterior', () => {
    guardarDestino('/vendas');
    resgatarDestino();
    expect(resgatarDestino()).toBe(DESTINO_PADRAO);
  });

  it('não guarda destino externo nem que o storage aceite', () => {
    guardarDestino('https://site-falso.com');
    expect(resgatarDestino()).toBe(DESTINO_PADRAO);
  });

  it('não quebra quando o storage está bloqueado (aba anônima)', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
      removeItem: () => {},
    });
    expect(() => guardarDestino('/vendas')).not.toThrow();
    expect(resgatarDestino()).toBe(DESTINO_PADRAO);
  });
});
