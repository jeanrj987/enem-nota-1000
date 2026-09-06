# Direções de design preservadas

Esta pasta guarda versões completas de telas que foram construídas e **não
entraram em produção**, para que possam ser retomadas sem refazer do zero.
Nada aqui é compilado: a pasta está no `exclude` do `tsconfig.json` e fora de
`src/`, então não vira rota nem quebra o type-check quando o resto do código
evoluir.

## `vendas-caderno-e-caneta-vermelha.tsx`

Direção visual **"caderno & caneta vermelha"** para a rota `/vendas`,
construída em 2026-09-05 e colocada em espera aguardando avaliação de sócio.
A rota em produção usa a direção **"placar"**, escolhida depois.

**Conceito**: a página imita uma folha de redação corrigida à mão — que é o
próprio produto. Fundo de papel `#F7F4ED`, tinta quente `#1C1917`, vermelho de
corretor `#C0392B` como único acento, azul de caneta `#29487D` para o texto do
aluno. A manchete é ela mesma uma correção: "Sua redação corrigida ~~em duas
semanas~~ *hoje mesmo*".

### Como restaurar

1. Copiar `vendas-caderno-e-caneta-vermelha.tsx` para `src/app/vendas/page.tsx`.
2. Colar o conteúdo de `vendas-caderno.css` no fim de `src/app/globals.css`
   (foi removido de lá para não deixar CSS morto no site em produção).
3. Recarregar as três fontes em `src/app/layout.tsx` — também removidas por
   estarem sendo baixadas por todo visitante sem nenhuma tela usá-las:

   ```ts
   import { Newsreader, Karla, Caveat } from 'next/font/google';

   const newsreader = Newsreader({ subsets: ['latin'], variable: '--font-serifada' });
   const karla = Karla({ subsets: ['latin'], variable: '--font-humanista' });
   const caveat = Caveat({ subsets: ['latin'], variable: '--font-manuscrita' });
   ```

   E incluir `${newsreader.variable} ${karla.variable} ${caveat.variable}` no
   `className` do elemento `<html>`.

O componente depende apenas do que a versão em produção já usa
(`useAuth`, `supabase`, `PlanoId`, `/api/checkout`), então o fluxo de compra
funciona sem ajuste — só o visual muda.
