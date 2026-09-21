import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Desmonta o que cada teste renderizou.
 *
 * O Testing Library faz isso sozinho quando `globals: true` está ligado no
 * Vitest — e este projeto não liga. Sem o cleanup, cada `render()` fica no
 * `document.body` e as consultas de um teste enxergam a árvore montada pelo
 * anterior: `getAllBy...[0]` devolve o elemento do teste errado. O resultado
 * é um teste que depende da ordem em que roda, e que mente nos dois
 * sentidos — passa com código quebrado e falha com código correto.
 *
 * Roda também nos testes em ambiente `node`, onde não há nada montado e a
 * chamada não faz nada.
 */
afterEach(() => {
  cleanup();
});
