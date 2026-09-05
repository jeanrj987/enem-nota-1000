---
title: Stack Tecnológica & Estrutura de Rotas
tags:
  - nextjs
  - app-router
  - rotas
  - arquitetura
  - frontend
updated: 2026-09-05
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
| **Gamificação** | `canvas-confetti` | Disparo de confete em notas 900+ e no checkout |
| **Banco de Dados & Auth** | Supabase (`@supabase/supabase-js`) | PostgreSQL, RLS, Storage de redações |

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
│   └── page.tsx              # Rota "/nova-redacao" (Editor Tiptap / Upload)
├── correcao/[id]/
│   └── page.tsx              # Rota "/correcao/:id" (Visualizador de Correção)
├── dashboard/
│   └── page.tsx              # Rota "/dashboard" (Painel do Estudante)
├── historico/
│   └── page.tsx              # Rota "/historico" (Evolução & Gráficos Recharts)
├── auth/
│   └── page.tsx              # Rota "/auth" (Login / Cadastro)
└── api/
    ├── corrigir/
    │   └── route.ts          # Endpoint POST /api/corrigir
    └── upload/
        └── route.ts          # Endpoint POST /api/upload
```

---

## 🧭 Detalhamento das Principais Páginas

### 1. Landing Page (`/`)
- Apresentação do produto, demonstração em vídeo/mockup, as 5 competências do INEP e primeiros passos para o vestibulando.

### 2. Página de Vendas (`/vendas`)
- Página de conversão com cronômetro de urgência, termômetro interativo de risco, comparativo tradicional vs IA, tabela de preços, bônus e garantia incondicional de 7 dias.

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
