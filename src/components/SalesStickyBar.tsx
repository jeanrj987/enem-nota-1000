'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Flame, ArrowRight, ShieldCheck, Clock, Terminal } from 'lucide-react';

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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-2.5 sm:p-3.5 bg-[#030612]/95 backdrop-blur-2xl border-t border-cyan-500/30 shadow-[0_-10px_40px_rgba(0,0,0,0.85)] transition-all">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Urgency Message */}
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="hidden md:flex w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/35 items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <Zap className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                ACESSO ANTECIPADO • VAGAS LIMITADAS
              </span>
              <span className="text-xs text-slate-300 font-sans hidden sm:inline">
                Apenas <strong>4 slots disponíveis</strong> com condição de lançamento
              </span>
            </div>
            <div className="text-xs sm:text-sm text-white font-bold flex items-center gap-2 mt-0.5 font-sans">
              <span>Por 12x de <strong className="text-cyan-400 font-mono text-sm sm:text-base">R$ 14,90</strong></span>
              <span className="text-slate-500 line-through text-xs font-mono">R$ 497,00</span>
            </div>
          </div>
        </div>

        {/* Countdown + Action Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Digital Timer Display */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#080d1e] border border-cyan-500/30 text-xs font-mono text-cyan-300 shrink-0 shadow-inner">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold tracking-wider">
              {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={scrollToPricing}
            className="btn-cyber-primary flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-heading font-black shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>DESBLOQUEAR ACESSO</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
