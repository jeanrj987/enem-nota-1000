'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Flame, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

interface SalesStickyBarProps {
  onCtaClick?: () => void;
}

export function SalesStickyBar({ onCtaClick }: SalesStickyBarProps) {
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number }>({
    minutes: 14,
    seconds: 45,
  });
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

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        } else {
          return { minutes: 15, seconds: 0 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
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
        {/* Urgency Message */}
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="hidden md:flex w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 items-center justify-center text-amber-400 shrink-0">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                Lote 1 Expirando
              </span>
              <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                Apenas <strong>5 vagas</strong> restantes com 60% OFF
              </span>
            </div>
            <div className="text-xs sm:text-sm text-white font-bold flex items-center gap-2 mt-0.5">
              <span>Por apenas 12x de <strong className="text-emerald-400 text-sm sm:text-base">R$ 14,90</strong></span>
              <span className="text-slate-500 line-through text-xs font-normal">R$ 497,00</span>
            </div>
          </div>
        </div>

        {/* Countdown + Action Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Timer Display */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-amber-400 shrink-0">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">
              {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={scrollToPricing}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
          >
            <span>Garantir Desconto</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
