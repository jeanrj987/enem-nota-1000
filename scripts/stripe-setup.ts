/**
 * Cria (de forma idempotente, via lookup_key) os produtos/preços do Stripe
 * usados pela página /vendas. Rodar uma vez por ambiente (test/live):
 *
 *   npm run stripe:setup
 *
 * Imprime os Price IDs gerados — colar em src/lib/planos.ts.
 */
import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error('STRIPE_SECRET_KEY ausente em .env.local');
  process.exit(1);
}

const stripe = new Stripe(secretKey);

// Modelo de planos atualizado em 14 de setembro (ver src/lib/planos.ts). O
// projeto está migrando o gateway de pagamento para a Kirvano — este script
// fica como registro de como os preços foram criados no Stripe em modo de
// teste, não como o processo ativo de configuração.
const PLANOS = [
  {
    lookupKey: 'nota1000_mensal',
    nome: 'Nota 1000 AI — Plano Mensal (recorrente)',
    valorCentavos: 9700,
    diasDeAcesso: 30,
  },
  {
    lookupKey: 'nota1000_unico',
    nome: 'Nota 1000 AI — Acesso 40 dias (pagamento único)',
    valorCentavos: 14700,
    diasDeAcesso: 40,
  },
];

async function run() {
  for (const plano of PLANOS) {
    const existentes = await stripe.prices.list({ lookup_keys: [plano.lookupKey], limit: 1 });
    if (existentes.data.length > 0) {
      console.log(`${plano.lookupKey}: já existe -> ${existentes.data[0].id}`);
      continue;
    }

    const produto = await stripe.products.create({ name: plano.nome });
    const preco = await stripe.prices.create({
      product: produto.id,
      unit_amount: plano.valorCentavos,
      currency: 'brl',
      lookup_key: plano.lookupKey,
      metadata: { dias_de_acesso: String(plano.diasDeAcesso) },
    });

    console.log(`${plano.lookupKey}: criado -> ${preco.id}`);
  }
}

run().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
