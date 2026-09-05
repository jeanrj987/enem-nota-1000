'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface SalesStickyBarProps {
  onCtaClick?: () => void;
}

// Sem cronômetro nem contagem de "vagas restantes": nenhum dos dois
// refletia um estado real (o cronômetro reiniciava sozinho ao chegar a
// zero, e o produto digital não tem limite de vagas) — publicidade
// enganosa vedada pelo CDC. O banner mantém o CTA de desconto sem alegar
// urgência ou escassez que não existem.
export function SalesStickyBar({ onCtaClick }: SalesStickyBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show sticky bar after scrolling down 300px
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  const scrollToPricing = () => {
    if (onCtaClick) {
      onCtaClick();
    } else {
      const pricingElement = document.getElementById('pricing-section');
      if (pricingElement) {
        pricingElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 bg-slate-950/95 backdrop-blur-xl border-t border-blue-500/40 shadow-[0_-10px_35px_rgba(0,0,0,0.8)] transition-all animate-fade-in">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div>
            <div className="text-xs text-slate-300 font-medium">
              Corrija sua próxima redação com a matriz oficial do ENEM
            </div>
            <div className="text-xs sm:text-sm text-white font-bold flex items-center gap-2 mt-0.5">
              <span>Por apenas 12x de <strong className="text-emerald-400 text-sm sm:text-base">R$ 14,90</strong></span>
              <span className="text-slate-500 line-through text-xs font-normal">R$ 497,00</span>
            </div>
          </div>
        </div>

        <button
          onClick={scrollToPricing}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
        >
          <span>Ver Planos</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
