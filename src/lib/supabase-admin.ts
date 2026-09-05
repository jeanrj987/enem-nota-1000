import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Cliente Supabase com service role — ignora RLS. Uso exclusivo em código
 * de servidor de confiança (webhook do Stripe), nunca em código que roda
 * no navegador. Não importar isto de nenhum componente client-side.
 */
export const supabaseAdmin =
  supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;
