const DEVICE_ID_KEY = 'enem_ai_device_id';

/**
 * ID anônimo persistido no navegador, usado como chave de persistência no
 * Supabase enquanto não há autenticação real. Não é uma fronteira de
 * segurança — só agrupa o histórico de redações por navegador/dispositivo.
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';

  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'unknown';
  }
}
