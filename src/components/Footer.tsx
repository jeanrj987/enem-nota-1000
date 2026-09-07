import React from 'react';
import Link from 'next/link';
import { GraduationCap, Shield, Sparkles, Heart, Award, ArrowUpRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-regua/80 bg-papel/60 backdrop-blur-md mt-auto text-tinta-fraca">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Coluna 1: Sobre */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-vermelho flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-folha" />
              </div>
              <span className="text-lg font-bold text-tinta">
                Nota <span className="gradient-text">1000 AI</span>
              </span>
            </div>
            <p className="text-sm text-tinta-fraca leading-relaxed">
              Plataforma de inteligência artificial de alta precisão calibrada na Matriz Oficial de Correção do ENEM para alavancar sua nota.
            </p>
            <div className="flex items-center gap-2 text-xs text-tinta-fraca">
              <Shield className="w-4 h-4 text-verde" />
              <span>Critérios 100% alinhados ao INEP</span>
            </div>
          </div>

          {/* Coluna 2: As 5 Competências */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-tinta uppercase tracking-wider">
              Competências ENEM
            </h3>
            <ul className="space-y-2 text-xs text-tinta-fraca">
              <li className="hover:text-vermelho transition-colors">
                <span className="text-vermelho font-medium">C1:</span> Norma Culta & Gramática
              </li>
              <li className="hover:text-vermelho transition-colors">
                <span className="text-vermelho font-medium">C2:</span> Tema & Repertório Sociocultural
              </li>
              <li className="hover:text-vermelho transition-colors">
                <span className="text-vermelho font-medium">C3:</span> Projeto de Texto & Argumentação
              </li>
              <li className="hover:text-vermelho transition-colors">
                <span className="text-vermelho font-medium">C4:</span> Coesão & Conectivos
              </li>
              <li className="hover:text-vermelho transition-colors">
                <span className="text-vermelho font-medium">C5:</span> Proposta de Intervenção (5 Elementos)
              </li>
            </ul>
          </div>

          {/* Coluna 3: Navegação Rápida */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-tinta uppercase tracking-wider">
              Recursos
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/vendas" className="text-ambar font-bold hover:text-ambar transition-colors flex items-center gap-1">
                  ⚡ Planos & Oferta 60% OFF <ArrowUpRight className="w-3 h-3 text-ambar" />
                </Link>
              </li>
              <li>
                <Link href="/nova-redacao" className="hover:text-tinta transition-colors flex items-center gap-1">
                  Corretor Instantâneo <ArrowUpRight className="w-3 h-3 text-tinta-fraca" />
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-tinta transition-colors flex items-center gap-1">
                  Meu Desempenho <ArrowUpRight className="w-3 h-3 text-tinta-fraca" />
                </Link>
              </li>
              <li>
                <Link href="/historico" className="hover:text-tinta transition-colors flex items-center gap-1">
                  Gráficos de Evolução <ArrowUpRight className="w-3 h-3 text-tinta-fraca" />
                </Link>
              </li>
              <li>
                <Link href="/auth" className="hover:text-tinta transition-colors">
                  Área do Estudante
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Destaque de Eficiência */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-tinta uppercase tracking-wider">
              Alta Performance
            </h3>
            <div className="p-3.5 rounded-sm bg-folha/80 border border-regua space-y-2">
              <div className="flex items-center gap-2 text-vermelho text-xs font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>IA OpenAI gpt-4o-mini</span>
              </div>
              <p className="text-xs text-tinta-fraca">
                Correção profunda em menos de 10 segundos com análise linha a linha e reescrita recomendada.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-regua/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-tinta-fraca">
          <p>© {new Date().getFullYear()} Nota 1000 AI. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              Feito para estudantes rumo à aprovação
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
