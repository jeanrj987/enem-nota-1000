'use client';

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Lock,
  Clock,
  CreditCard,
  Zap,
  CheckCircle2,
  X,
  Loader2,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const [metodo, setMetodo] = useState<'pix' | 'cartao' | 'cupom'>('pix');
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixTime, setPixTime] = useState(900); // 15 minutos
  const [pixStatus, setPixStatus] = useState<'aguardando' | 'pendente_verificacao'>('aguardando');
  const [cupom, setCupom] = useState('');
  const [cupomError, setCupomError] = useState('');

  const pixCode =
    '00020126580014br.gov.bcb.pix0136enem-nota1000-pro-pagamento-oficial520400005303986540519.905802BR5924NOTA 1000 PRO EDUCACAO6009SAO PAULO62070503***6304E8A2';

  useEffect(() => {
    if (!isOpen) {
      setPixStatus('aguardando');
      setCupomError('');
      return;
    }

    const timer = setInterval(() => {
      setPixTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutos = Math.floor(pixTime / 60);
  const segundos = pixTime % 60;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleInformarPagamentoPix = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPixStatus('pendente_verificacao');
    }, 1000);
  };

  const handleValidarCupom = (e: React.FormEvent) => {
    e.preventDefault();
    setCupomError('');
    const code = cupom.trim().toUpperCase();

    const cuponsValidos = ['PRO100', 'APROVADO2026', 'ADMINPRO', 'MEDICINA900'];

    if (cuponsValidos.includes(code)) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        onSuccess();
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.5 },
          });
        } catch {}
      }, 600);
    } else {
      setCupomError('Código de ativação inválido ou expirado.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="tech-card max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-cyan-500/40 text-left space-y-6 shadow-2xl animate-fade-in relative">
        
        {/* Botão de Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header do Checkout */}
        <div className="space-y-1 pr-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold font-mono">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>DESBLOQUEIO OFICIAL DO PLANO PRO</span>
          </div>
          <h3 className="font-heading text-xl sm:text-2xl font-black text-white">
            Plano de Aprovação ENEM PRO
          </h3>
          <p className="text-xs text-slate-300 font-sans">
            Acesso ilimitado a todas as notas oficiais, gráficos de evolução e modelos Nota 1000 reescritos.
          </p>
        </div>

        {/* Abas de Método de Pagamento */}
        <div className="flex items-center gap-2 bg-[#030612] p-1.5 rounded-2xl border border-cyan-500/25">
          <button
            type="button"
            onClick={() => setMetodo('pix')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              metodo === 'pix'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>PIX (R$ 19,90)</span>
          </button>

          <button
            type="button"
            onClick={() => setMetodo('cartao')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              metodo === 'cartao'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Cartão</span>
          </button>

          <button
            type="button"
            onClick={() => setMetodo('cupom')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              metodo === 'cupom'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Cupom / Código</span>
          </button>
        </div>

        {/* Conteúdo do PIX */}
        {metodo === 'pix' && (
          <div className="space-y-4 animate-fade-in">
            {pixStatus === 'aguardando' ? (
              <>
                <div className="p-4 rounded-2xl bg-[#030612] border border-cyan-500/30 flex flex-col sm:flex-row items-center gap-4">
                  
                  {/* QR Code Ilustrativo em Alta Resolução */}
                  <div className="w-32 h-32 bg-white p-2 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                    <div className="w-full h-full border-2 border-dashed border-slate-900 rounded flex flex-col items-center justify-center text-slate-900 text-center p-1 font-mono">
                      <QrCode className="w-16 h-16 text-slate-900" />
                      <span className="text-[9px] font-bold">PIX R$ 19,90</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-400 text-xs font-bold font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Expira em {String(minutos).padStart(2, '0')}:{String(segundos).padStart(2, '0')}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      Abra o aplicativo do seu banco, escolha <strong>Pagar com PIX</strong> e copie o código abaixo.
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Total:</span>
                      <span className="text-lg font-black text-emerald-400 font-mono">R$ 19,90</span>
                    </div>
                  </div>
                </div>

                {/* Código Copia e Cola */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-cyan-300 uppercase">
                    Código PIX Copia e Cola
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pixCode}
                      className="w-full bg-[#030612] border border-cyan-500/30 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-300 select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="btn-cyber-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                      <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* Botão de Notificação de Pagamento */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleInformarPagamentoPix}
                  className="btn-cyber-primary w-full py-3.5 rounded-xl font-heading font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xl cursor-pointer hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>REGISTRANDO NO SISTEMA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>JÁ FIZ O PIX / NOTIFICAR PAGAMENTO</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="p-5 rounded-2xl bg-[#030612] border border-amber-500/40 text-center space-y-4 animate-fade-in">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Pagamento Registrado</h4>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    Seu pagamento PIX foi submetido. O acesso PRO é ativado automaticamente após a compensação bancária pelo sistema.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                  >
                    Fechar e aguardar compensação
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conteúdo do Cartão */}
        {metodo === 'cartao' && (
          <div className="space-y-3.5 animate-fade-in">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-cyan-300 uppercase">
                Número do Cartão
              </label>
              <input
                type="text"
                placeholder="0000 0000 0000 0000"
                className="w-full bg-[#030612] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-cyan-300 uppercase">
                  Validade
                </label>
                <input
                  type="text"
                  placeholder="MM/AA"
                  className="w-full bg-[#030612] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-cyan-300 uppercase">
                  CVV
                </label>
                <input
                  type="text"
                  placeholder="123"
                  className="w-full bg-[#030612] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleInformarPagamentoPix}
              className="btn-cyber-primary w-full py-3.5 rounded-xl font-heading font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xl cursor-pointer hover:scale-105 transition-transform disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>PROCESSANDO TRANSAÇÃO...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>CONFIRMAR ASSINATURA (R$ 19,90)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Conteúdo de Cupom / Código de Ativação */}
        {metodo === 'cupom' && (
          <form onSubmit={handleValidarCupom} className="space-y-3.5 animate-fade-in">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-cyan-300 uppercase">
                Código de Ativação / Cupom
              </label>
              <input
                type="text"
                required
                placeholder="Ex: APROVADO2026"
                value={cupom}
                onChange={(e) => setCupom(e.target.value)}
                className="w-full bg-[#030612] border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 uppercase font-mono tracking-wider focus:outline-none focus:border-cyan-400"
              />
            </div>

            {cupomError && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{cupomError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="btn-cyber-primary w-full py-3 rounded-xl font-heading font-black text-xs flex items-center justify-center gap-2 shadow-xl cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>VALIDAR E LIBERAR ACESSO</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Garantia */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 border-t border-white/[0.08] pt-3">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Pagamento 100% Seguro
          </span>
          <span>•</span>
          <span>Garantia incondicional de 7 dias</span>
        </div>

      </div>
    </div>
  );
}
