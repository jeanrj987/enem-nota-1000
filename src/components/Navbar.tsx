'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  LayoutDashboard,
  PenTool,
  TrendingUp,
  Menu,
  X,
  GraduationCap,
  Lock,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DESTINO_PADRAO, urlDeLogin } from '@/lib/redirecionamento';
import { URL_SEM_ASSINATURA } from '@/lib/gates';
import { temAcessoAtivo } from '@/lib/assinatura';
import { sair } from '@/lib/auth';
import { useRouter } from 'next/navigation';

/**
 * Itens fixos do menu. `exigePlano` existe porque o menu mentia: listava
 * Dashboard e Histórico para todo mundo, e quem não tinha plano clicava, via
 * um spinner e reaparecia no topo da home — `RequerAssinatura` expulsava a
 * pessoa depois de a rota já ter começado a carregar. De fora isso é
 * indistinguível de um menu que não direciona para lugar nenhum, que foi como
 * o problema chegou em 21/09. Com a marcação, o item mostra o cadeado e leva
 * direto para a oferta, sem passar pela tela que vai recusá-lo.
 */
const NAV_LINKS = [
  { href: '/', label: 'Início', icon: Sparkles, exigePlano: false },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exigePlano: true },
  { href: '/nova-redacao', label: 'Nova Redação', icon: PenTool, exigePlano: false },
  { href: '/historico', label: 'Histórico & Evolução', icon: TrendingUp, exigePlano: true },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Guarda de quem é a resposta, e não só o booleano: trocar de conta na
  // mesma aba não pode herdar o resultado da sessão anterior. É também o que
  // dá o terceiro estado ("ainda não sei"), sem o qual o cadeado pisca em
  // quem tem plano no intervalo entre a montagem e a resposta.
  const [assinatura, setAssinatura] = useState<{ userId: string; ativa: boolean } | null>(null);

  useEffect(() => {
    if (!usuario) return;
    let ativo = true;
    temAcessoAtivo().then((ativaAgora) => {
      if (ativo) setAssinatura({ userId: usuario.id, ativa: ativaAgora });
    });
    return () => {
      ativo = false;
    };
  }, [usuario]);

  /**
   * Um item só é bloqueado para quem está logado e já sabemos não ter plano.
   * Visitante deslogado continua indo pela rota normal — lá o gate o manda
   * para o login levando o destino junto, que é o comportamento certo e
   * compreensível, ao contrário de aterrissar na home sem explicação.
   */
  const semPlanoConfirmado =
    !!usuario && assinatura?.userId === usuario.id && !assinatura.ativa;

  const estaBloqueado = (exigePlano: boolean) => exigePlano && semPlanoConfirmado;

  /** Destino real do item, já considerando o bloqueio. */
  const destinoDoLink = (href: string, exigePlano: boolean) =>
    estaBloqueado(exigePlano) ? URL_SEM_ASSINATURA : href;

  const handleSair = async () => {
    await sair();
    setMobileMenuOpen(false);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-regua/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-azul hover:brightness-110 flex items-center justify-center shadow-lg shadow-tinta/10 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6 text-folha" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-tinta flex items-center gap-1.5">
                Nota <span className="gradient-text">1000</span>
              </span>
              <span className="text-[10px] text-tinta-fraca block -mt-1 font-medium tracking-wider uppercase">
                Banca ENEM Especialista
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              const bloqueado = estaBloqueado(link.exigePlano);
              return (
                <Link
                  key={link.href}
                  href={destinoDoLink(link.href, link.exigePlano)}
                  title={bloqueado ? `${link.label} faz parte do plano — veja os planos` : undefined}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-azul-claro text-azul border border-azul shadow-sm'
                      : 'text-tinta-suave hover:text-tinta hover:bg-folha-2/60'
                  }`}
                >
                  {bloqueado ? (
                    <Lock className="w-4 h-4 text-tinta-fraca" />
                  ) : (
                    <Icon className={`w-4 h-4 ${isActive ? 'text-azul' : 'text-tinta-fraca'}`} />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {usuario ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-tinta-fraca max-w-[160px] truncate" title={usuario.email ?? ''}>
                  {usuario.email}
                </span>
                <button
                  onClick={handleSair}
                  className="flex items-center gap-1.5 text-sm font-medium text-tinta-suave hover:text-tinta px-3 py-2 rounded-xl hover:bg-folha-2/60 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            ) : (
              <Link
                href={urlDeLogin(pathname || DESTINO_PADRAO)}
                className="text-sm font-medium text-tinta-suave hover:text-tinta px-3 py-2 rounded-xl hover:bg-folha-2/60 transition-colors"
              >
                Entrar
              </Link>
            )}
            <Link
              href="/nova-redacao"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-azul hover:brightness-110 text-folha text-sm font-semibold shadow-lg shadow-tinta/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <PenTool className="w-4 h-4" />
              <span>Escrever Redação</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-tinta-fraca hover:text-tinta hover:bg-folha-2/60 focus:outline-none"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-regua bg-papel/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-2">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            const bloqueado = estaBloqueado(link.exigePlano);
            return (
              <Link
                key={link.href}
                href={destinoDoLink(link.href, link.exigePlano)}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium ${
                  isActive
                    ? 'bg-azul-claro text-azul border border-azul'
                    : 'text-tinta-suave hover:text-tinta hover:bg-folha-2/60'
                }`}
              >
                {bloqueado ? (
                  <Lock className="w-5 h-5 text-tinta-fraca" />
                ) : (
                  <Icon className="w-5 h-5 text-azul" />
                )}
                <span className="flex-1">{link.label}</span>
                {bloqueado && (
                  <span className="rounded-md bg-folha-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-tinta-fraca">
                    Plano
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-regua/60 flex flex-col gap-2">
            <Link
              href="/nova-redacao"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-azul text-folha text-sm font-medium shadow-md shadow-tinta/10"
            >
              <PenTool className="w-4 h-4" />
              Nova Redação
            </Link>
            {usuario ? (
              <button
                onClick={handleSair}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-folha text-tinta border border-regua text-sm font-medium cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sair ({usuario.email})
              </button>
            ) : (
              <Link
                href={urlDeLogin(pathname || DESTINO_PADRAO)}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-folha text-tinta border border-regua text-sm font-medium"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
