'use client';

import { RefObject } from 'react';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';

interface Conectivo {
  label: string;
  text: string;
}

interface AreaProducaoTextualProps {
  texto: string;
  onMudarTexto: (valor: string) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  uploadedFileName: string | null;
  onLimparUploadedFileName: () => void;
  uploadError: string | null;
  conectivosSugeridos: Conectivo[];
  onInserirConectivo: (texto: string) => void;
  palavras: number;
  caracteres: number;
  linhasAproximadas: number;
}

/** Área de produção textual: upload de arquivo, conectivos rápidos, textarea e contadores. */
export function AreaProducaoTextual({
  texto,
  onMudarTexto,
  fileInputRef,
  onFileUpload,
  isUploading,
  uploadedFileName,
  onLimparUploadedFileName,
  uploadError,
  conectivosSugeridos,
  onInserirConectivo,
  palavras,
  caracteres,
  linhasAproximadas,
}: AreaProducaoTextualProps) {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Área de Produção Textual</h3>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileUpload}
            accept=".txt,.pdf,.docx"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all border border-slate-700/60 shadow-sm"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span>{isUploading ? 'Extraindo...' : 'Importar PDF / Word / TXT'}</span>
          </button>
        </div>
      </div>

      {uploadedFileName && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-blue-950/40 border border-blue-800/50 text-xs text-blue-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span>Arquivo importado com sucesso: <strong>{uploadedFileName}</strong></span>
          </div>
          <button onClick={onLimparUploadedFileName} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{uploadError}</span>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto py-1">
        <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
          Conectivos rápidos:
        </span>
        {conectivosSugeridos.map((con, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onInserirConectivo(con.text)}
            className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-xs text-slate-300 hover:text-blue-400 whitespace-nowrap transition-colors"
          >
            + {con.label}
          </button>
        ))}
      </div>

      <div className="relative rounded-xl border border-slate-700/80 bg-slate-950/80 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
        <textarea
          value={texto}
          onChange={(e) => onMudarTexto(e.target.value)}
          placeholder="Digite ou cole sua redação aqui. Desenvolva sua introdução com tese clara, 2 parágrafos de desenvolvimento com repertório produtivo e a proposta de intervenção completa com os 5 elementos..."
          rows={16}
          className="w-full p-4 bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none resize-y leading-relaxed font-sans"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-slate-400 border-t border-slate-800/60">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-200">{palavras}</span> palavras
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-200">{caracteres}</span> caracteres
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`font-semibold ${linhasAproximadas >= 7 && linhasAproximadas <= 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
              ~{linhasAproximadas}
            </span> / 30 linhas ENEM
          </div>
        </div>

        <div className="text-[11px] text-slate-400">
          {palavras < 150 && (
            <span className="text-amber-400">⚠️ Mínimo recomendado: ~250 palavras</span>
          )}
          {palavras >= 150 && palavras <= 400 && (
            <span className="text-emerald-400">✓ Extensão ideal para nota 1000</span>
          )}
        </div>
      </div>
    </div>
  );
}
