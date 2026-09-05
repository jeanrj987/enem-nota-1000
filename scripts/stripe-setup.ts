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

const PLANOS = [
  {
    lookupKey: 'nota1000_mensal',
    nome: 'Nota 1000 AI — Plano Mensal',
    valorCentavos: 2990,
    diasDeAcesso: 30,
  },
  {
    lookupKey: 'nota1000_anual',
    nome: 'Nota 1000 AI — Plano Anual (até o ENEM)',
    valorCentavos: 14700,
    diasDeAcesso: 365,
  },
  {
    lookupKey: 'nota1000_semestral',
    nome: 'Nota 1000 AI — Plano Semestral',
    valorCentavos: 8900,
    diasDeAcesso: 180,
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
