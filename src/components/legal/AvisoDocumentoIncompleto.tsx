import { AlertTriangle } from 'lucide-react';
import { dadosDoControladorCompletos } from '@/lib/controlador';

/**
 * Aviso visível quando a identificação do controlador ainda não foi
 * preenchida em `src/lib/controlador.ts`. Existe para que um documento legal
 * incompleto não passe despercebido em produção: é melhor o visitante ver que
 * falta informação do que ler uma política que finge estar completa.
 */
export function AvisoDocumentoIncompleto() {
  if (dadosDoControladorCompletos()) return null;

  return (
    <div className="mb-8 flex items-start gap-3 rounded-sm border border-vermelho bg-vermelho-claro p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-vermelho" />
      <div className="text-sm text-tinta">
        <p className="font-bold">Documento em preenchimento</p>
        <p className="mt-1 text-tinta-suave">
          A identificação da empresa responsável e do encarregado de dados ainda não foi
          publicada. Enquanto isso não acontece, use os canais de contato do site para
          exercer qualquer direito previsto neste documento.
        </p>
      </div>
    </div>
  );
}
