---
title: Stack Tecnológica & Estrutura de Rotas
tags:
  - nextjs
  - app-router
  - rotas
  - arquitetura
  - frontend
updated: 2026-09-18 (páginas de erro 404/runtime, vincular-compra, robots/sitemap, medição e landing reestruturada)
---

> [!warning] **Requisito de runtime**
> Node **≥20.16 ou ≥22.3** (exigência de `pdf-parse`/`pdfjs-dist`; abaixo disso falha com `process.getBuiltinModule is not a function`). Ver `.nvmrc` (fixado em `22.22.3`). `next.config.ts` declara `serverExternalPackages: ["pdf-parse"]` — necessário para o worker do pdfjs resolver fora do bundle do Turbopack.

# 💻 Stack Tecnológica & Estrutura de Rotas

> [!info] **Visão Geral do Frontend & Framework**
> O projeto utiliza **Next.js 16+ (App Router)** com **TypeScript** e **Tailwind CSS v4**, otimizado para renderização híbrida rápida (SSR / Static Generation / Client Components), dispensando a necessidade de um backend separado.

---

## 🛠️ Stack Tecnológica Completa

| Camada | Tecnologia / Biblioteca | Função no Projeto |
| :--- | :--- | :--- |
| **Framework Web** | Next.js 16 (App Router) | Roteamento, API Serverless, SSR/SSG |
| **Linguagem** | TypeScript 5 | Tipagem estática rigorosa em 100% dos arquivos |
| **Estilização** | Tailwind CSS v4 + Vanilla CSS | Tokens semânticos no `@theme`, identidade "V2 dark" (ADR 031) |
| **Ícones** | Lucide React | Biblioteca moderna de ícones vetoriais |
| **Gráficos** | Recharts | Gráficos de evolução histórica e radar de competências |
| **IA & LLMs** | `@google/genai` + `openai` | Modelos Gemini 3.6 Flash e GPT-4o-mini |
| **Parsing de Arquivos** | `mammoth`, `pdf-parse` | Extração de texto de DOCX, PDF e TXT |
| **Geração de PDF** | `jspdf` | Exportação de relatórios de correção em PDF |
| **Gamificação** | `canvas-confetti` | Disparo de confete em notas 900+ |
| **Banco de Dados** | Supabase (`@supabase/supabase-js`) | Persistência de redações, assinaturas, perfis e compras órfãs; Auth real (e-mail/senha + Google) desde o ADR 011 |
| **Validação** | `zod` | Validação estrita de payload nas rotas de `src/app/api/*` |
| **Medição** | Meta Pixel + Conversions API, GA4 | Funil e atribuição de anúncio; a **compra sai pelo servidor**, porque o checkout roda no domínio da Kiwify (ADR 042) |
| **Cobrança** | Kiwify (link de checkout fixo + webhook) | 2 planos de acesso; a dependência `stripe` foi removida no ADR 028 |

---

## 🗺️ Mapa Completo de Rotas do App Router

```text
src/app/
├── layout.tsx                # Root Layout (tema dark V2, fontes Newsreader/Karla/Caveat)
├── globals.css               # Tokens do @theme, utilitários de superfície, highlights de erro
├── not-found.tsx             # Fallback de rota inexistente (404) — Navbar/Footer + CTA para "/"
├── error.tsx                 # Error boundary de runtime — Client Component minimalista, sem Navbar/Footer de propósito (ver comentário no arquivo)
├── page.tsx                  # Rota "/" (landing única = página de vendas, ADR 030)
├── vendas/
│   └── page.tsx              # Rota "/vendas" — só um permanentRedirect("/") 308, mantido por links já divulgados
├── nova-redacao/
│   └── page.tsx              # Rota "/nova-redacao" (Editor Tiptap / Upload) — atrás de RequerLogin (login + perfil completo, SEM exigir assinatura)
├── correcao/[id]/
│   └── page.tsx              # Rota "/correcao/:id" (Visualizador de Correção) — atrás de RequerLogin; conteúdo borrado (paywall) se não houver assinatura ativa
├── completar-perfil/
│   └── page.tsx              # Rota "/completar-perfil" (nome/WhatsApp/cidade-estado/nascimento/curso dos sonhos obrigatórios — força quem entrou via Google a completar o cadastro)
├── dashboard/
│   └── page.tsx              # Rota "/dashboard" (Painel do Estudante) — atrás de RequerAssinatura (login + perfil completo + assinatura)
├── historico/
│   └── page.tsx              # Rota "/historico" (Evolução & Gráficos Recharts) — atrás de RequerAssinatura
├── checkout/sucesso/
│   └── page.tsx              # Rota "/checkout/sucesso" (confirmação pós-pagamento; no estado "ainda confirmando" oferece /vincular-compra — ADR 040)
├── robots.ts                 # Gera /robots.txt em build — ADR 041
├── sitemap.ts                # Gera /sitemap.xml em build (só / e /privacidade) — ADR 041
├── vincular-compra/
│   └── page.tsx              # Rota "/vincular-compra" (resgate de compra paga com e-mail diferente do cadastro — ADR 040)
├── auth/
│   ├── page.tsx              # Rota "/auth" (Login / Cadastro real via Supabase Auth: e-mail/senha + Google)
│   └── callback/
│       └── page.tsx          # Rota "/auth/callback" (retorno do OAuth do Google)
└── api/
    ├── corrigir/
    │   └── route.ts          # Endpoint POST /api/corrigir
    ├── upload/
    │   └── route.ts          # Endpoint POST /api/upload
    ├── atribuicao/
    │   └── route.ts          # Endpoint POST /api/atribuicao (guarda _fbc/_fbp antes do checkout — ADR 042)
    ├── vincular-compra/
    │   └── route.ts          # Endpoint POST /api/vincular-compra (resgate de compra órfã; exige login + código do pedido, 5 tentativas/hora — ADR 040)
    └── kiwify/webhook/
        └── route.ts          # Endpoint POST /api/kiwify/webhook (ativa/revoga assinatura no Supabase — ADR 028; compra aprovada sem conta vai para compras_orfas — ADR 040)
```

---

## 🧭 Detalhamento das Principais Páginas

### 1. Landing única / Página de Vendas (`/`)
- **Desde o ADR 030 existe uma landing só.** Antes, `/` era uma landing institucional e `/vendas` era a página de conversão, cada uma com o seu próprio visual — quem criava conta atravessava o funil de uma para a outra e via o site "mudar por completo" no meio do caminho.
- **Reestruturada em 18/09 em torno da prova (ADR 043).** A ordem das seções é o argumento: hero → problema → virada → **a prova** (`ExemploCorrecao`) → como funciona → 5 competências → **o que é grátis e o que é pago** → planos → garantia → FAQ → CTA final.
- **O CTA principal é a correção gratuita, não o preço.** Antes, todo botão dizia "CORRIGIR MINHA REDAÇÃO" e rolava para a tabela de planos. Hoje leva a `/nova-redacao` (via `/auth` quando deslogado), que é a ação prometida. O CTA do topo e o do rodapé são a mesma ação, de propósito.
- **Seção "A prova"**: `src/components/vendas/ExemploCorrecao.tsx` monta uma correção de exemplo com as **mesmas classes de marcação do produto** (`highlight-*`, as mesmas de `TextoDestacado`), para a demonstração não envelhecer separada do que é entregue. O riscado e a superfície do texto usam Tailwind, já que `.risco-corretor`/`.bloco-pautado` saíram no ADR 035.
- **Seção "O que é grátis e o que é pago"** vem antes do preço: o gratuito entrega a correção e **quantos desvios** o texto tem; o diagnóstico completo é do plano (RLS de `correcoes`, ADR 013).
- **Shell próprio**: não usa `Navbar`/`Footer` do app, porque o menu interno só leva a destinos que exigem assinatura. O header tem âncoras (`#exemplo`, `#como`, `#planos`, `#faq`) e um link que alterna entre "Entrar" e "Minha conta" conforme `useAuth`.
- **Medição**: dispara `ViewContent` ao montar e `InitiateCheckout` no clique de assinar, e guarda a atribuição do anúncio (`_fbc`/`_fbp`) via `/api/atribuicao` antes de redirecionar para a Kiwify. Ver ADR 042.
- Caminhos de entrada: acesso direto, o item "Início" do `Navbar` na área logada, os CTAs de paywall (`Footer.tsx` e `CorrecaoBloqueada.tsx`, que apontam para `/#planos`) e o redirecionamento automático de `RequerAssinatura` quando alguém sem assinatura ativa tenta abrir `/dashboard` ou `/historico`.

### 2. Redirect de `/vendas`
- A rota antiga sobrevive só como `permanentRedirect("/")` (308), para não quebrar link divulgado em anúncio, bio ou mensagem antiga. Não tem conteúdo próprio.

### 3. Nova Redação (`/nova-redacao`)
- Editor inteligente com contagem de palavras/linhas, seleção de temas oficiais/inéditos do ENEM e aba de upload para arquivos `.pdf`, `.docx` e `.txt`.

### 4. Visualizador de Correção (`/correcao/[id]`)
- Exibição de nota geral de 0 a 1000, notas de C1 a C5, marcações interativas coloridas sobre o texto, reescrita sugerida, plano de ação pedagógico e botão de exportar em PDF.

### 5. Histórico & Evolução (`/historico`)
- Gráficos em linha da evolução das notas, gráfico de radar mostrando qual competência é o ponto forte e qual necessita de reforço.

### 6. Resgate de Compra (`/vincular-compra`)
- **Para quem pagou e não recebeu acesso** porque o e-mail do checkout da Kiwify (campo editável) não é o do cadastro. Exige login e pede dois dados: o **e-mail usado na compra** e o **código do pedido**.
- O código do pedido não é burocracia — é a prova de posse. Sem ele, qualquer conta criada de graça reivindicaria a compra alheia chutando e-mails. Ver ADR 040 e [[05 - Banco de Dados & Integrações/Supabase, Storage & Env|a tabela `compras_orfas`]].
- Só é alcançável por dois caminhos, ambos onde a pessoa de fato aparece: o estado "ainda confirmando" de `/checkout/sucesso` e uma linha abaixo da garantia, na seção de planos da home. Não está no `Navbar` — é uma saída de exceção, não um item de menu.

---

## 🔗 Links Relacionados
- [[04 - Arquitetura Técnica/Componentes & Design System|Design System e Componentes]]
- [[04 - Arquitetura Técnica/APIs, Modelos & Tipagem|Tipos TypeScript e Endpoints de API]]
- [[01 - Visão Geral & Negócio/Estratégia de Vendas & Copywriting|Estratégia da landing de vendas (`/`)]]
