import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      // Valores fictícios só para satisfazer checagens de "está configurado?"
      // nas rotas — nenhum teste faz chamada de rede real ao Stripe/Supabase.
      STRIPE_SECRET_KEY: 'sk_test_placeholder_para_testes',
      STRIPE_WEBHOOK_SECRET: 'whsec_placeholder_para_testes',
      NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'placeholder_service_role_key',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
