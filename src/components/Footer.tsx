import React from 'react';
import Link from 'next/link';
import { Cpu, ShieldCheck, ArrowUpRight, Activity, Terminal, CheckCircle2, Lock, Zap } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-cyan-500/20 bg-[#030611] mt-auto text-slate-400 relative overflow-hidden">
      
      {/* Background Matrix Mesh Grid */}
      <div className="absolute inset-0 tech-grid-bg opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Column 1: Engine Specs & Core (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-black shadow-lg shadow-cyan-500/20">
                <Cpu className="w-4 h-4 text-black" />
              </div>
              <span className="text-base font-black tracking-tight text-white font-heading">
                NOTA<span className="text-cyan-400">1000</span>.<span className="text-indigo-400 font-mono text-xs">PRO</span>
              </span>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm font-sans">
              Motor tecnológico de alta precisão calibrado nos critérios e manuais oficiais de corretores do Exame Nacional do Ensino Médio (INEP 2026).
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#070d1d] border border-cyan-500/30 text-[11px] font-mono text-cyan-300">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>BANCA OFICIAL INEP 2026</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#070d1d] border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE: 99.98%</span>
              </div>
            </div>
          </div>

          {/* Column 2: As 5 Competências do ENEM (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <div className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>MATRIZ DE COMPETÊNCIAS</span>
            </div>
            
            <ul className="space-y-2 text-xs font-mono text-slate-400">
              <li className="flex items-center gap-2 hover:text-cyan-300 transition-colors">
                <span className="text-cyan-400 font-bold">[C1]</span> Norma Culta & Sintaxe
              </li>
              <li className="flex items-center gap-2 hover:text-cyan-300 transition-colors">
                <span className="text-cyan-400 font-bold">[C2]</span> Tema & Repertório Legitimado
              </li>
              <li className="flex items-center gap-2 hover:text-cyan-300 transition-colors">
                <span className="text-cyan-400 font-bold">[C3]</span> Projeto de Texto & Argumentação
              </li>
              <li className="flex items-center gap-2 hover:text-cyan-300 transition-colors">
                <span className="text-cyan-400 font-bold">[C4]</span> Coesão & Conectivos Interparágrafos
              </li>
              <li className="flex items-center gap-2 hover:text-cyan-300 transition-colors">
                <span className="text-emerald-400 font-bold">[C5]</span> Proposta de Intervenção (5 Elementos)
              </li>
            </ul>
          </div>

          {/* Column 3: Telemetria & Links (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>ESTAÇÃO DE ESTUDOS</span>
            </div>
            
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/nova-redacao" className="hover:text-cyan-300 transition-colors flex items-center justify-between">
                  <span>Estúdio de Redação</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-600" />
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-cyan-300 transition-colors flex items-center justify-between">
                  <span>Centro de Controle</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-600" />
                </Link>
              </li>
              <li>
                <Link href="/historico" className="hover:text-cyan-300 transition-colors flex items-center justify-between">
                  <span>Telemetria & Gráficos</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-600" />
                </Link>
              </li>
              <li>
                <Link href="/auth" className="hover:text-cyan-300 transition-colors flex items-center justify-between">
                  <span>Acesso do Estudante</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-600" />
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Status Bar */}
        <div className="pt-8 mt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <p>© {new Date().getFullYear()} NOTA 1000 PRO • High-Performance Redaction Engine.</p>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span className="hover:text-cyan-300 transition-colors cursor-pointer">Protocolo de Privacidade</span>
            <span className="text-slate-700">•</span>
            <span className="hover:text-cyan-300 transition-colors cursor-pointer">Diretrizes INEP</span>
            <span className="text-slate-700">•</span>
            <span className="hover:text-cyan-300 transition-colors cursor-pointer">Suporte Técnico</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
