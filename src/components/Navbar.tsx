'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  BookOpen,
  LayoutDashboard,
  PenTool,
  TrendingUp,
  Menu,
  X,
  GraduationCap,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { sair } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSair = async () => {
    await sair();
    setMobileMenuOpen(false);
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: 'Início', icon: Sparkles },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/nova-redacao', label: 'Nova Redação', icon: PenTool },
    { href: '/historico', label: 'Histórico & Evolução', icon: TrendingUp },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Nota <span className="gradient-text">1000 AI</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-medium tracking-wider uppercase">
                Banca ENEM Especialista
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {usuario ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 max-w-[160px] truncate" title={usuario.email ?? ''}>
                  {usuario.email}
                </span>
                <button
                  onClick={handleSair}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors"
              >
                Entrar
              </Link>
            )}
            <Link
              href="/nova-redacao"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <PenTool className="w-4 h-4" />
              <span>Escrever Redação</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 focus:outline-none"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-5 h-5 text-blue-400" />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-800/60 flex flex-col gap-2">
            <Link
              href="/nova-redacao"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium shadow-md shadow-blue-600/30"
            >
              <PenTool className="w-4 h-4" />
              Nova Redação
            </Link>
            {usuario ? (
              <button
                onClick={handleSair}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-slate-900 text-slate-200 border border-slate-800 text-sm font-medium cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sair ({usuario.email})
              </button>
            ) : (
              <Link
                href="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-slate-900 text-slate-200 border border-slate-800 text-sm font-medium"
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
