---
title: Stack Tecnológica & Estrutura de Rotas
tags:
  - nextjs
  - app-router
  - rotas
  - arquitetura
  - frontend
updated: 2026-09-05 (correção gratuita com resultado borrado + cadastro obrigatório)
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
| **Estilização** | Tailwind CSS v4 + Vanilla CSS | Design System, Dark Mode, Glassmorphism |
| **Ícones** | Lucide React | Biblioteca moderna de ícones vetoriais |
| **Gráficos** | Recharts | Gráficos de evolução histórica e radar de competências |
| **IA & LLMs** | `@google/genai` + `openai` | Modelos Gemini 3.6 Flash e GPT-4o-mini |
| **Parsing de Arquivos** | `mammoth`, `pdf-parse` | Extração de texto de DOCX, PDF e TXT |
| **Geração de PDF** | `jspdf` | Exportação de relatórios de correção em PDF |
| **Gamificação** | `canvas-confetti` | Disparo de confete em notas 900+ |
| **Banco de Dados** | Supabase (`@supabase/supabase-js`) | Persistência de redações e assinaturas (sem Auth real ainda) |
| **Cobrança** | `stripe` | Checkout Sessions dos 3 planos de acesso |

---

## 🗺️ Mapa Completo de Rotas do App Router

```text
src/app/
├── layout.tsx                # Root Layout (Dark Mode, Fontes Outfit & Inter)
├── globals.css               # Variáveis CSS, Glassmorphism, Highlights de Erro
├── page.tsx                  # Rota "/" (Landing Page Institucional)
├── vendas/
│   └── page.tsx              # Rota "/vendas" (Página de Vendas de Alta Conversão)
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
│   └── page.tsx              # Rota "/checkout/sucesso" (confirmação pós-pagamento do Stripe)
├── auth/
│   ├── page.tsx              # Rota "/auth" (Login / Cadastro real via Supabase Auth: e-mail/senha + Google)
│   └── callback/
│       └── page.tsx          # Rota "/auth/callback" (retorno do OAuth do Google)
└── api/
    ├── corrigir/
    │   └── route.ts          # Endpoint POST /api/corrigir
    ├── upload/
    │   └── route.ts          # Endpoint POST /api/upload
    ├── checkout/
    │   ├── route.ts          # Endpoint POST /api/checkout (cria Stripe Checkout Session)
    │   └── verificar/
    │       └── route.ts      # Endpoint POST /api/checkout/verificar (confirma pagamento pelo session_id)
    └── stripe/webhook/
        └── route.ts          # Endpoint POST /api/stripe/webhook (ativa assinatura no Supabase)
```

---

## 🧭 Detalhamento das Principais Páginas

### 1. Landing Page (`/`)
- Apresentação do produto, demonstração em vídeo/mockup, as 5 competências do INEP e primeiros passos para o vestibulando.

### 2. Página de Vendas (`/vendas`)
- Página de conversão com termômetro interativo de risco, comparativo tradicional vs IA, tabela de preços, bônus e garantia incondicional de 7 dias. Os 3 CTAs de plano criam uma sessão real do Stripe Checkout via `/api/checkout` (sem cronômetro nem "vagas restantes" — removidos por serem falsos, ver [[06 - Registro de Decisões/Decisões de Arquitetura & Changelog]]).
- **Não há mais link direto para `/vendas` no menu principal** (`src/components/Navbar.tsx`) — o item "⚡ Planos & Oferta" foi removido a pedido do usuário, que não queria essa rota exposta como destino de navegação livre. O único caminho de entrada agora é o redirecionamento automático feito por `RequerAssinatura` quando alguém sem assinatura ativa tenta abrir `/nova-redacao`, `/dashboard`, `/historico` ou `/correcao/[id]`. O link continua existindo no rodapé (`Footer.tsx`).

### 3. Nova Redação (`/nova-redacao`)
- Editor inteligente com contagem de palavras/linhas, seleção de temas oficiais/inéditos do ENEM e aba de upload para arquivos `.pdf`, `.docx` e `.txt`.

### 4. Visualizador de Correção (`/correcao/[id]`)
- Exibição de nota geral de 0 a 1000, notas de C1 a C5, marcações interativas coloridas sobre o texto, reescrita sugerida, plano de ação pedagógico e botão de exportar em PDF.

### 5. Histórico & Evolução (`/historico`)
- Gráficos em linha da evolução das notas, gráfico de radar mostrando qual competência é o ponto forte e qual necessita de reforço.

---

## 🔗 Links Relacionados
- [[04 - Arquitetura Técnica/Componentes & Design System|Design System e Componentes]]
- [[04 - Arquitetura Técnica/APIs, Modelos & Tipagem|Tipos TypeScript e Endpoints de API]]
- [[01 - Visão Geral & Negócio/Estratégia de Vendas & Copywriting|Estratégia da Página /vendas]]
