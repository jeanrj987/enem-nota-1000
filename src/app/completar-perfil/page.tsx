'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Phone, MapPin, Calendar, Award, ArrowRight, Loader2, GraduationCap } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { buscarPerfil, salvarPerfil, perfilCompleto } from '@/lib/perfil';
import { destinoSeguro, urlDeLogin } from '@/lib/redirecionamento';
import { formatarWhatsapp, normalizarWhatsapp, validarWhatsapp } from '@/lib/whatsapp';
import { UFS_BRASIL, buscarMunicipiosPorUf } from '@/lib/localidades';

function CompletarPerfilForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Passa por `destinoSeguro`: o parâmetro já era lido aqui, mas sem
  // validação — aceitar uma URL externa transformaria esta tela em trampolim
  // de phishing.
  const destino = destinoSeguro(searchParams.get('redirect'));
  const { usuario, carregando } = useAuth();

  const [checando, setChecando] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [erroWhatsapp, setErroWhatsapp] = useState<string | null>(null);
  const [uf, setUf] = useState('');
  const [cidade, setCidade] = useState('');
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [carregandoMunicipios, setCarregandoMunicipios] = useState(false);
  const [erroMunicipios, setErroMunicipios] = useState<string | null>(null);
  const [tentativaMunicipios, setTentativaMunicipios] = useState(0);
  const [dataNascimento, setDataNascimento] = useState('');
  const [cursoDosSonhos, setCursoDosSonhos] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (carregando) return;
    if (!usuario) {
      router.replace(urlDeLogin(destino));
      return;
    }

    buscarPerfil(usuario.id).then((perfil) => {
      if (perfilCompleto(perfil)) {
        router.replace(destino);
        return;
      }
      setNomeCompleto(perfil?.nome_completo || usuario.user_metadata?.full_name || usuario.user_metadata?.name || '');
      // Vem do banco em E.164 (+5511912345678); remascara para leitura.
      setWhatsapp(formatarWhatsapp(perfil?.whatsapp || ''));
      // Perfis salvos antes desta tela virar seleção (formato livre "Cidade - UF")
      // só são reaproveitados se baterem exatamente com uma sigla de UF válida —
      // caso contrário, a pessoa escolhe de novo nos dois selects.
      const cidadeEstadoSalva = perfil?.cidade_estado || '';
      const partes = cidadeEstadoSalva.split(' - ');
      const ufSalva = partes[1]?.trim().toUpperCase();
      if (partes.length === 2 && UFS_BRASIL.some((u) => u.sigla === ufSalva)) {
        setUf(ufSalva);
        setCidade(partes[0].trim());
      }
      setDataNascimento(perfil?.data_nascimento || '');
      setCursoDosSonhos(perfil?.curso_dos_sonhos || '');
      setChecando(false);
    });
  }, [carregando, usuario, router, destino]);

  useEffect(() => {
    if (!uf) return;

    let cancelado = false;
    // Sinaliza o início da busca antes da chamada assíncrona ao IBGE — mesmo
    // padrão de fetch-em-efeito já presente em AuthContext.tsx.
    setCarregandoMunicipios(true); // eslint-disable-line react-hooks/set-state-in-effect
    setErroMunicipios(null);

    buscarMunicipiosPorUf(uf)
      .then((lista) => {
        if (cancelado) return;
        setMunicipios(lista);
      })
      .catch((erroBusca: Error) => {
        if (cancelado) return;
        setErroMunicipios(erroBusca.message);
        setMunicipios([]);
      })
      .finally(() => {
        if (!cancelado) setCarregandoMunicipios(false);
      });

    return () => {
      cancelado = true;
    };
  }, [uf, tentativaMunicipios]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    const problemaWhatsapp = validarWhatsapp(whatsapp);
    if (problemaWhatsapp) {
      setErroWhatsapp(problemaWhatsapp);
      setErro(problemaWhatsapp);
      return;
    }

    setSalvando(true);
    setErro(null);

    const resultado = await salvarPerfil(usuario.id, {
      nomeCompleto,
      whatsapp: normalizarWhatsapp(whatsapp),
      cidadeEstado: `${cidade} - ${uf}`,
      dataNascimento,
      cursoDosSonhos,
    });

    if (!resultado.sucesso) {
      setErro(resultado.erro || 'Não foi possível salvar seu perfil.');
      setSalvando(false);
      return;
    }

    router.push(destino);
  };

  if (carregando || checando) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-azul animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-azul hover:brightness-110 flex items-center justify-center mx-auto shadow-lg shadow-tinta/10">
          <GraduationCap className="w-7 h-7 text-folha" />
        </div>
        <h1 className="text-2xl font-extrabold text-tinta">Só mais um passo</h1>
        <p className="text-xs text-tinta-fraca">
          Complete seu cadastro para liberar a correção de redações.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass-panel p-6 sm:p-8 rounded-xl border border-regua shadow-2xl space-y-4"
      >
        {erro && (
          <div className="p-3 rounded-xl text-xs bg-vermelho-claro border border-vermelho/30 text-vermelho">{erro}</div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-tinta-suave">Nome Completo</label>
          <div className="relative">
            <User className="w-4 h-4 text-tinta-fraca absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              className="w-full bg-folha/90 border border-regua/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-tinta focus:outline-none focus:border-azul"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-tinta-suave">WhatsApp</label>
          <div className="relative">
            <Phone className="w-4 h-4 text-tinta-fraca absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              inputMode="numeric"
              required
              placeholder="(11) 91234-5678"
              value={whatsapp}
              onChange={(e) => setWhatsapp(formatarWhatsapp(e.target.value))}
              onBlur={() => setErroWhatsapp(validarWhatsapp(whatsapp))}
              aria-invalid={erroWhatsapp ? true : undefined}
              className={`w-full bg-folha/90 border rounded-xl pl-10 pr-4 py-2.5 text-xs text-tinta placeholder-tinta-fraca focus:outline-none focus:border-azul ${
                erroWhatsapp ? 'border-vermelho' : 'border-regua/80'
              }`}
            />
          </div>
          {erroWhatsapp && <p className="text-[11px] text-vermelho">{erroWhatsapp}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-tinta-suave">Estado</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-tinta-fraca absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                required
                value={uf}
                onChange={(e) => {
                  setUf(e.target.value);
                  setCidade('');
                  setMunicipios([]);
                  setErroMunicipios(null);
                }}
                className="w-full bg-folha/90 border border-regua/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-tinta focus:outline-none focus:border-azul appearance-none"
              >
                <option value="">Selecione</option>
                {UFS_BRASIL.map((u) => (
                  <option key={u.sigla} value={u.sigla}>
                    {u.sigla} — {u.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-tinta-suave">Cidade</label>
            <select
              required
              disabled={!uf || carregandoMunicipios}
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="w-full bg-folha/90 border border-regua/80 rounded-xl px-3 py-2.5 text-xs text-tinta focus:outline-none focus:border-azul appearance-none disabled:opacity-50"
            >
              <option value="">
                {!uf ? 'Escolha o estado' : carregandoMunicipios ? 'Carregando...' : 'Selecione'}
              </option>
              {municipios.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            {erroMunicipios && (
              <button
                type="button"
                onClick={() => setTentativaMunicipios((n) => n + 1)}
                className="text-[11px] text-vermelho underline"
              >
                {erroMunicipios} Tentar de novo.
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-tinta-suave">Data de Nascimento</label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-tinta-fraca absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              required
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              className="w-full bg-folha/90 border border-regua/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-tinta focus:outline-none focus:border-azul"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-tinta-suave">Curso dos Sonhos</label>
          <div className="relative">
            <Award className="w-4 h-4 text-tinta-fraca absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="Ex: Medicina, Direito, Engenharia"
              value={cursoDosSonhos}
              onChange={(e) => setCursoDosSonhos(e.target.value)}
              className="w-full bg-folha/90 border border-regua/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-tinta placeholder-tinta-fraca focus:outline-none focus:border-azul"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={salvando}
          className="w-full py-3 rounded-xl bg-azul hover:brightness-110 text-folha text-xs font-bold shadow-lg shadow-tinta/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {salvando ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Concluir Cadastro</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function CompletarPerfilPage() {
  return (
    <div className="min-h-screen flex flex-col bg-papel text-tinta">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Suspense fallback={<Loader2 className="w-8 h-8 text-azul animate-spin" />}>
          <CompletarPerfilForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
