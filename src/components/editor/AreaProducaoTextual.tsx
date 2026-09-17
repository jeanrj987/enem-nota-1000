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
    <div className="glass-panel p-6 rounded-sm border border-regua space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-regua/80 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-vermelho" />
          <h3 className="text-sm font-bold text-tinta">Área de Produção Textual</h3>
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
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-folha-2/90 hover:bg-pauta text-tinta text-xs font-medium transition-all border border-regua/60 shadow-sm"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-vermelho" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-vermelho" />
            )}
            <span>{isUploading ? 'Extraindo...' : 'Importar PDF / Word / TXT'}</span>
          </button>
        </div>
      </div>

      {uploadedFileName && (
        <div className="flex items-center justify-between px-3 py-2 rounded-sm bg-vermelho-claro border border-vermelho/30 text-xs text-vermelho">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-vermelho" />
            <span>Arquivo importado com sucesso: <strong>{uploadedFileName}</strong></span>
          </div>
          <button onClick={onLimparUploadedFileName} className="text-tinta-fraca hover:text-tinta">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-sm bg-vermelho-claro border border-vermelho/30 text-xs text-vermelho">
          <AlertCircle className="w-4 h-4 text-vermelho" />
          <span>{uploadError}</span>
        </div>
      )}

      {!uploadedFileName && !uploadError && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-sm bg-ambar-claro border border-ambar/30 text-[11px] text-tinta-suave">
          <AlertCircle className="w-3.5 h-3.5 text-ambar shrink-0 mt-0.5" />
          <span>
            Envie um arquivo com <strong>texto real</strong> (não uma foto ou digitalização da folha
            escrita à mão). Letra legível e texto digitado garantem a melhor precisão da nota e a
            análise mais completa possível.
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto py-1">
        <span className="text-[11px] font-semibold text-tinta-fraca whitespace-nowrap">
          Conectivos rápidos:
        </span>
        {conectivosSugeridos.map((con, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onInserirConectivo(con.text)}
            className="px-2.5 py-1 rounded-md bg-folha hover:bg-folha-2 border border-regua/70 text-xs text-tinta-suave hover:text-vermelho whitespace-nowrap transition-colors"
          >
            + {con.label}
          </button>
        ))}
      </div>

      <div className="relative rounded-sm border border-regua/80 bg-papel/80 focus-within:border-vermelho focus-within:ring-1 focus-within:ring-vermelho transition-all">
        <textarea
          value={texto}
          onChange={(e) => onMudarTexto(e.target.value)}
          placeholder="Digite ou cole sua redação aqui. Desenvolva sua introdução com tese clara, 2 parágrafos de desenvolvimento com repertório produtivo e a proposta de intervenção completa com os 5 elementos..."
          rows={16}
          className="w-full p-4 bg-transparent text-sm text-tinta placeholder-tinta-fraca focus:outline-none resize-y leading-relaxed font-sans"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-tinta-fraca border-t border-regua/60">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-tinta">{palavras}</span> palavras
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-tinta">{caracteres}</span> caracteres
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`font-semibold ${linhasAproximadas >= 7 && linhasAproximadas <= 30 ? 'text-verde' : 'text-ambar'}`}>
              ~{linhasAproximadas}
            </span> / 30 linhas ENEM
          </div>
        </div>

        <div className="text-[11px] text-tinta-fraca">
          {palavras < 150 && (
            <span className="text-ambar">⚠️ Mínimo recomendado: ~250 palavras</span>
          )}
          {palavras >= 150 && palavras <= 400 && (
            <span className="text-verde">✓ Extensão ideal para nota 1000</span>
          )}
        </div>
      </div>
    </div>
  );
}
