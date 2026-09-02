'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Download,
  Search,
  ExternalLink,
  ShieldCheck,
  Award,
  ArrowLeft,
  Filter,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { obterTodosLeadsSupabase } from '@/lib/supabase';
import { getUsuarioAtual, isUsuarioMaster, UsuarioSessao } from '@/lib/storage';

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<UsuarioSessao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('all');

  useEffect(() => {
    async function carregarLeads() {
      setLoading(true);
      const data = await obterTodosLeadsSupabase();
      
      // Se o Supabase estiver vazio ou local, adiciona o usuário logado se houver
      const usuarioLocal = getUsuarioAtual();
      if (usuarioLocal && !data.some((u) => u.id === usuarioLocal.id)) {
        setLeads([usuarioLocal, ...data]);
      } else {
        setLeads(data);
      }
      setLoading(false);
    }

    carregarLeads();
  }, []);

  const leadsFiltrados = leads.filter((lead) => {
    const matchesTexto =
      (lead.nome || '').toLowerCase().includes(filtroTexto.toLowerCase()) ||
      (lead.whatsapp || '').includes(filtroTexto) ||
      (lead.cidade || '').toLowerCase().includes(filtroTexto.toLowerCase()) ||
      (lead.email || '').toLowerCase().includes(filtroTexto.toLowerCase());

    const matchesCurso = filtroCurso === 'all' || lead.curso_sonho === filtroCurso;

    return matchesTexto && matchesCurso;
  });

  const exportarCSV = () => {
    if (leadsFiltrados.length === 0) return;

    const headers = ['Nome', 'WhatsApp', 'Cidade', 'Estado', 'Data de Nascimento', 'Curso dos Sonhos', 'Plano', 'Data de Cadastro'];
    const rows = leadsFiltrados.map((l) => [
      `"${l.nome}"`,
      `"${l.whatsapp || ''}"`,
      `"${l.cidade || ''}"`,
      `"${l.estado || ''}"`,
      `"${l.data_nascimento || ''}"`,
      `"${l.curso_sonho || ''}"`,
      `"${l.plano}"`,
      `"${new Date(l.created_at).toLocaleDateString('pt-BR')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_enem_x1_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getWhatsAppLink = (lead: UsuarioSessao) => {
    const rawNumber = (lead.whatsapp || '').replace(/\D/g, '');
    if (!rawNumber) return '#';
    const numeroCompleto = rawNumber.startsWith('55') ? rawNumber : `55${rawNumber}`;
    const primeiroNome = lead.nome.split(' ')[0];
    const curso = lead.curso_sonho || 'o ENEM';
    const mensagem = encodeURIComponent(
      `Olá ${primeiroNome}! Tudo bem? Vi que você enviou uma redação na nossa plataforma do ENEM focando em ${curso}. O que achou da avaliação?`
    );
    return `https://wa.me/${numeroCompleto}?text=${mensagem}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#02040a] text-slate-100 font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/20 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                Painel Comercial • Vendas no X1 (WhatsApp)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-heading">
              Gestão de Leads Capturados
            </h1>
            <p className="text-xs text-slate-400">
              Estudantes que responderam ao mini questionário e liberaram a plataforma no plano gratuito.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={exportarCSV}
              className="btn-cyber-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Leads (Excel / CSV)</span>
            </button>
          </div>
        </div>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="tech-card p-5 rounded-2xl border border-cyan-500/30 space-y-1">
            <span className="text-xs font-mono text-slate-400 uppercase">Total de Leads</span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">{leads.length}</div>
          </div>
          <div className="tech-card p-5 rounded-2xl border border-emerald-500/30 space-y-1">
            <span className="text-xs font-mono text-emerald-400 uppercase">Com WhatsApp Válido</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {leads.filter((l) => l.whatsapp).length}
            </div>
          </div>
          <div className="tech-card p-5 rounded-2xl border border-indigo-500/30 space-y-1">
            <span className="text-xs font-mono text-indigo-400 uppercase">Foco Medicina / Direito</span>
            <div className="text-2xl sm:text-3xl font-black text-indigo-300 font-mono">
              {leads.filter((l) => l.curso_sonho === 'Medicina' || l.curso_sonho === 'Direito').length}
            </div>
          </div>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nome, WhatsApp, cidade ou e-mail..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="w-full bg-[#040816] border border-cyan-500/25 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          <select
            value={filtroCurso}
            onChange={(e) => setFiltroCurso(e.target.value)}
            className="bg-[#040816] border border-cyan-500/25 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 font-mono cursor-pointer"
          >
            <option value="all">Todos os Cursos</option>
            <option value="Medicina">Medicina</option>
            <option value="Direito">Direito</option>
            <option value="Engenharia">Engenharia</option>
            <option value="Ciência da Computação">Ciência da Computação</option>
            <option value="Odontologia">Odontologia</option>
            <option value="Psicologia">Psicologia</option>
          </select>
        </div>

        {/* Tabela de Leads */}
        <div className="tech-card rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#030612] border-b border-white/[0.08] text-slate-400 uppercase font-mono tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Estudante</th>
                  <th className="py-3.5 px-4">WhatsApp (X1)</th>
                  <th className="py-3.5 px-4">Localização</th>
                  <th className="py-3.5 px-4">Curso Alvo</th>
                  <th className="py-3.5 px-4">Data Nasc.</th>
                  <th className="py-3.5 px-4">Data Cadastro</th>
                  <th className="py-3.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {leadsFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                      Nenhum lead encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  leadsFiltrados.map((lead) => (
                    <tr key={lead.id} className="hover:bg-cyan-950/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white font-heading text-sm">{lead.nome}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{lead.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {lead.whatsapp ? (
                          <span className="font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/30">
                            {lead.whatsapp}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono">Não informado</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200">
                          {lead.cidade ? `${lead.cidade} - ${lead.estado || 'BR'}` : 'Não informado'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-1 rounded bg-indigo-950/50 text-indigo-300 font-bold border border-indigo-500/30">
                          {lead.curso_sonho || 'Geral'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {lead.data_nascimento || '---'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {lead.whatsapp ? (
                          <a
                            href={getWhatsAppLink(lead)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-xs transition-all shadow-md shadow-emerald-500/20"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Chamar no X1</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-600 font-mono">Sem WhatsApp</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
