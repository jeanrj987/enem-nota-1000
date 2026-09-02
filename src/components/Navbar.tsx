'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CheckCircle2,
  PenTool,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  Award,
  CreditCard,
  Layers,
  Flame,
  User,
  GraduationCap,
  LogOut,
} from 'lucide-react';
import { BannerUrgencia } from '@/components/BannerUrgencia';
import { getUsuarioAtual, isUsuarioMaster, calcularStreakEstudos, isPlanoPago, logoutUsuario, UsuarioSessao } from '@/lib/storage';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);
  const [streak, setStreak] = useState(0);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    setUsuario(getUsuarioAtual());
    setStreak(calcularStreakEstudos());
    setIsPro(isPlanoPago());
  }, [pathname]);

  const isMaster = isUsuarioMaster(usuario?.email);

  const navLinks = [
    { href: '/', label: 'Início' },
    { href: '/#como-funciona', label: 'Como Funciona' },
    { href: '/nova-redacao', label: 'Estúdio' },
    { href: '/dashboard', label: 'Desempenho' },
    { href: '/#planos', label: 'Planos' },
    ...(isMaster ? [{ href: '/admin/leads', label: '👑 Leads (X1)' }] : []),
  ];

  return (
    <div className="w-full flex flex-col z-50">
      {/* Banner de Urgência ENEM 2026 */}
      <BannerUrgencia />

      <header className="w-full px-3 sm:px-4 lg:px-6 pt-3 pb-2 transition-all">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#050914]/90 backdrop-blur-2xl border border-cyan-500/25 rounded-2xl px-3 sm:px-5 py-2.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] flex items-center justify-between gap-2 sm:gap-4 relative">
            
            {/* Top highlight bar */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-600 p-[1px] shadow-md shadow-cyan-500/25 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#020611] rounded-[10px] flex items-center justify-center">
                  <Award className="w-4 h-4 text-cyan-400 group-hover:text-white transition-colors" />
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-black tracking-tight text-white font-heading">
                    NOTA<span className="text-cyan-400">1000</span><span className="text-indigo-400 text-[10px] font-mono ml-1 px-1 py-0.2 rounded bg-indigo-950/60 border border-indigo-500/30">PRO</span>
                  </span>
                  <span className="flex h-2 w-2 relative" title="Sistema Oficial Ativo">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 -mt-0.5 font-medium hidden sm:block">
                  Matriz ENEM 2026
                </p>
              </div>
            </Link>

            {/* Desktop Links */}
            <nav className="hidden xl:flex items-center gap-1 bg-[#02050f]/80 px-2.5 py-1.5 rounded-xl border border-white/[0.06] shrink-0">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Streak & User Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {streak > 0 && (
                <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 text-[11px] font-bold font-mono" title="Sua sequência de treinos de redação!">
                  <Flame className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
                  <span>{streak} {streak === 1 ? 'treino' : 'treinos'}</span>
                </div>
              )}

              {usuario ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {isPro && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>PRO</span>
                    </span>
                  )}

                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-cyan-300 px-2 sm:px-2.5 py-1 rounded-lg border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">{usuario.nome.split(' ')[0]}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      logoutUsuario();
                      window.location.reload();
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                    title="Sair da conta"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link
                    href="/auth"
                    className="text-xs font-medium text-slate-300 hover:text-cyan-300 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                  >
                    Entrar
                  </Link>
                </div>
              )}
              
              <Link
                href="/nova-redacao"
                className="btn-cyber-primary px-3 sm:px-4 py-2 rounded-xl text-xs font-heading font-black flex items-center gap-1.5 group whitespace-nowrap shadow-lg shadow-cyan-500/25 cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                <span>AVALIAR</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform hidden sm:inline" />
              </Link>

              {/* Mobile Menu Trigger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-xl bg-[#030612] border border-cyan-500/20 text-cyan-400 hover:text-white transition-colors xl:hidden"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>

          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="xl:hidden mt-2 p-4 rounded-2xl bg-[#040816] border border-cyan-500/30 space-y-3 animate-fade-in shadow-2xl">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 px-3 rounded-lg text-xs font-bold text-slate-300 hover:text-cyan-300 hover:bg-white/[0.04]"
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-2 border-t border-white/[0.08] flex flex-col gap-2">
                {usuario ? (
                  <div className="flex items-center justify-between px-3 py-2 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <span className="text-xs font-bold text-cyan-300">{usuario.nome}</span>
                    <button
                      type="button"
                      onClick={() => {
                        logoutUsuario();
                        window.location.reload();
                      }}
                      className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sair</span>
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 text-center text-xs font-bold text-slate-300 hover:text-white"
                  >
                    Entrar na Conta
                  </Link>
                )}
                <Link
                  href="/nova-redacao"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-cyber-primary w-full py-3 rounded-xl text-xs font-heading font-black text-center"
                >
                  AVALIAR MINHA REDAÇÃO
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
