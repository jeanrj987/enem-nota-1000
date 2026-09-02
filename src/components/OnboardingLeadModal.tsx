'use client';

import React, { useState } from 'react';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { salvarUsuarioAtual, isUsuarioMaster, UsuarioSessao } from '@/lib/storage';

interface OnboardingLeadModalProps {
  isOpen: boolean;
  initialEmail?: string;
  initialNome?: string;
  onClose?: () => void;
  onSuccess: (usuario: UsuarioSessao) => void;
}

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const CURSOS_SUGERIDOS = [
  'Medicina',
  'Direito',
  'Engenharia',
  'Ciência da Computação',
  'Odontologia',
  'Psicologia',
  'Enfermagem',
  'Administração',
  'Arquitetura',
  'Biomedicina',
  'Outro Curso',
];

export function OnboardingLeadModal({
  isOpen,
  initialEmail = '',
  initialNome = '',
  onClose,
  onSuccess,
}: OnboardingLeadModalProps) {
  const [nome, setNome] = useState(initialNome);
  const [email, setEmail] = useState(initialEmail);
  const [whatsapp, setWhatsapp] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('SP');
  const [dataNascimento, setDataNascimento] = useState('');
  const [cursoSonho, setCursoSonho] = useState('Medicina');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  if (!isOpen) return null;

  // Máscara automática de WhatsApp: (XX) 9XXXX-XXXX
  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);

    if (v.length > 6) {
      v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    } else if (v.length > 2) {
      v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    } else if (v.length > 0) {
      v = `(${v}`;
    }
    setWhatsapp(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    const cleanZap = whatsapp.replace(/\D/g, '');
    if (cleanZap.length < 10) {
      setErro('Por favor, informe um WhatsApp válido com DDD.');
      return;
    }

    if (!nome.trim()) {
      setErro('Por favor, informe seu nome completo.');
      return;
    }

    if (!cidade.trim()) {
      setErro('Por favor, informe sua cidade.');
      return;
    }

    setLoading(true);

    const userEmail = email.trim().toLowerCase() || `estudante_${cleanZap}@enem.pro`;
    const isMaster = isUsuarioMaster(userEmail);

    const novoUsuario: UsuarioSessao = {
      id: isMaster ? 'usr_master' : `lead_${Date.now()}`,
      nome: nome.trim(),
      email: userEmail,
      whatsapp: whatsapp.trim(),
      cidade: cidade.trim(),
      estado: estado,
      data_nascimento: dataNascimento,
      curso_sonho: cursoSonho,
      plano: isMaster ? 'pro' : 'gratis',
      created_at: new Date().toISOString(),
    };

    salvarUsuarioAtual(novoUsuario);

    setTimeout(() => {
      setLoading(false);
      onSuccess(novoUsuario);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[100000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="tech-card max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-cyan-500/40 space-y-6 shadow-2xl animate-fade-in relative my-8">
        
        {/* Botão Fechar se disponível */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header do Questionário */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-600 p-[1px] mx-auto shadow-lg shadow-cyan-500/30">
            <div className="w-full h-full bg-[#020611] rounded-[15px] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-cyan-400" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Acesso Gratuito Liberado</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight font-heading">
              Complete seu Perfil de Estudante
            </h3>
            <p className="text-xs text-slate-300 font-sans max-w-md mx-auto">
              Preencha seus dados para liberar o estúdio oficial de redação e receber o diagnóstico completo da banca.
            </p>
          </div>
        </div>

        {erro && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 text-center font-medium">
            {erro}
          </div>
        )}

        {/* Formulário de Coleta */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Nome Completo */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase font-mono tracking-wider">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Nome Completo *</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Ana Clara Medeiros"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-[#040816] border border-cyan-500/25 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-medium"
            />
          </div>

          {/* WhatsApp & Data de Nascimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp com DDD *</span>
              </label>
              <input
                type="tel"
                required
                placeholder="(11) 98765-4321"
                value={whatsapp}
                onChange={handleWhatsappChange}
                className="w-full bg-[#040816] border border-cyan-500/25 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Data de Nascimento</span>
              </label>
              <input
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className="w-full bg-[#040816] border border-cyan-500/25 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>

          {/* Cidade & Estado */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cidade *</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Ribeirão Preto"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full bg-[#040816] border border-cyan-500/25 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider block">
                UF *
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full bg-[#040816] border border-cyan-500/25 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 font-mono cursor-pointer"
              >
                {ESTADOS_BRASIL.map((uf) => (
                  <option key={uf} value={uf} className="bg-[#040816] text-white">
                    {uf}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Curso dos Sonhos (Qualificação para o X1) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase font-mono tracking-wider">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Qual curso você quer passar?</span>
            </label>
            <select
              value={cursoSonho}
              onChange={(e) => setCursoSonho(e.target.value)}
              className="w-full bg-[#040816] border border-cyan-500/25 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 font-medium cursor-pointer"
            >
              {CURSOS_SUGERIDOS.map((c) => (
                <option key={c} value={c} className="bg-[#040816] text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Botão de Liberação Imediata */}
          <button
            type="submit"
            disabled={loading}
            className="btn-cyber-primary w-full py-3.5 rounded-2xl font-heading font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>LIBERANDO SEU ACESSO GRATUITO...</span>
              </>
            ) : (
              <>
                <span>LIBERAR MEU ACESSO GRATUITO AGORA</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Seus dados estão protegidos e não serão compartilhados com terceiros.</span>
          </div>
        </form>

      </div>
    </div>
  );
}
