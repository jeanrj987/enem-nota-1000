import { permanentRedirect } from 'next/navigation';

/**
 * `/vendas` deixou de ser página em 17/09: o conteúdo virou a home (`/`),
 * que antes era uma landing institucional concorrente. A rota continua de pé
 * porque o link já foi divulgado e pode estar em anúncio, bio e mensagem
 * antiga — 308 preserva o método e diz ao buscador que o endereço bom agora
 * é a raiz.
 */
export default function VendasRedirect() {
  permanentRedirect('/');
}
