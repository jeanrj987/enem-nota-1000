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

1. Copiar o arquivo para `src/app/vendas/page.tsx`.
2. Conferir se as fontes ainda estão carregadas em `src/app/layout.tsx`:
   `Newsreader` (`--font-serifada`), `Karla` (`--font-humanista`) e `Caveat`
   (`--font-manuscrita`). Se tiverem sido removidas por limpeza, re-adicionar
   via `next/font/google` e incluir as variáveis no `className` do `<html>`.
3. Conferir se o bloco `.tema-papel` e os utilitários `.fonte-serifada`,
   `.fonte-humanista`, `.fonte-manuscrita`, `.margem-caderno`,
   `.bloco-pautado`, `.risco-corretor` e `.carimbo` continuam em
   `src/app/globals.css`.

O componente depende apenas do que a versão em produção já usa
(`useAuth`, `supabase`, `PlanoId`, `/api/checkout`), então o fluxo de compra
funciona sem ajuste — só o visual muda.
