// Lista fixa dos 27 estados brasileiros — não muda, não precisa de API.
export const UFS_BRASIL = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
] as const;

const TIMEOUT_MUNICIPIOS_MS = 8000;

/**
 * Busca os municípios de um estado na API pública do IBGE. Lista de cidades
 * é grande demais (5570 no Brasil) para embutir no bundle, então é buscada
 * sob demanda quando o usuário escolhe o estado.
 */
export async function buscarMunicipiosPorUf(uf: string): Promise<string[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MUNICIPIOS_MS);

  try {
    const resposta = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`,
      { signal: controller.signal }
    );

    if (!resposta.ok) {
      throw new Error(`IBGE respondeu ${resposta.status} para o estado ${uf}`);
    }

    const dados: Array<{ nome: string }> = await resposta.json();
    return dados.map((m) => m.nome).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  } catch (erro) {
    console.error(`Falha ao buscar municípios do IBGE para ${uf}:`, erro);
    throw new Error('Não foi possível carregar a lista de cidades. Tente novamente.');
  } finally {
    clearTimeout(timeoutId);
  }
}
