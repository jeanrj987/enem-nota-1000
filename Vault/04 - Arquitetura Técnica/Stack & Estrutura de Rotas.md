---
title: Stack Tecnológica & Estrutura de Rotas
tags:
  - nextjs
  - app-router
  - rotas
  - arquitetura
  - frontend
updated: 2026-09-01
---

# 💻 Stack Tecnológica & Estrutura de Rotas

> [!info] **Visão Geral do Frontend & Framework**
> O projeto utiliza **Next.js 16+ (App Router)** com **TypeScript** e **Tailwind CSS**, otimizado para renderização híbrida rápida (SSR / Static Generation / Client Components) com segurança de dados *server-side*.

---

## 🛠️ Stack Tecnológica Completa

| Camada | Tecnologia / Biblioteca | Função no Projeto |
| :--- | :--- | :--- |
| **Framework Web** | Next.js 16 (App Router) | Roteamento, API Serverless, SSR/SSG |
| **Linguagem** | TypeScript 5 | Tipagem estática rigorosa em 100% dos arquivos |
| **Estilização** | Tailwind CSS + Cyber Aesthetic | Design System, Dark Mode, Glassmorphism, Efeitos Neon |
| **Ícones** | Lucide React | Biblioteca moderna de ícones vetoriais |
| **Gráficos** | Recharts | Gráficos de evolução temporal e radar de competências |
| **IA & LLMs** | `@google/genai` + `openai` | Modelos Gemini Flash e OpenAI com fallback offline |
| **Parsing de Arquivos** | `mammoth`, `pdf-parse` | Extração de texto de DOCX, PDF, imagens e TXT |
| **Geração de PDF** | `jspdf` | Exportação de laudos de correção em PDF |
| **Gamificação** | `canvas-confetti` | Disparo de confete em notas 900+ e no checkout |
| **Banco & Armazenamento** | `localStorage` (Local) / PostgreSQL (Nuvem) | Armazenamento de redações, rascunhos e perfis |

---

## 🗺️ Mapa Completo de Rotas do App Router

```text
src/app/
├── layout.tsx                # Root Layout (Dark Mode, ProvaSocialToast global)
├── globals.css               # Variáveis CSS, Glassmorphism, Folha Pautada, Highlights
├── page.tsx                  # Rota "/" (Landing Page com Simulador SISU e Checkout PIX)
├── nova-redacao/
│   └── page.tsx              # Rota "/nova-redacao" (Editor 30 Linhas / Detector C4 / Upload)
├── correcao/[id]/
│   └── page.tsx              # Rota "/correcao/:id" (Laudo Anatômico / Simulador SISU / Reescrita)
├── dashboard/
│   └── page.tsx              # Rota "/dashboard" (Painel do Estudante, Conquistas & Streak)
├── historico/
│   └── page.tsx              # Rota "/historico" (Evolução & Gráficos Recharts)
├── auth/
│   └── page.tsx              # Rota "/auth" (Login / Cadastro / Acesso Rápido PRO)
└── api/
    ├── corrigir/
    │   └── route.ts          # POST /api/corrigir (Sanitização para plano grátis)
    ├── desbloquear/
    │   └── route.ts          # POST /api/desbloquear (Desbloqueio integral pós-pagamento)
    └── upload/
        └── route.ts          # POST /api/upload (OCR e extração de PDF/DOCX)
```

---

## 🧭 Detalhamento das Principais Páginas

### 1. Landing Page (`/`)
- Demonstração visual interativa, calculadora rápida de impacto da redação no SISU, depoimentos com prova social e tabela de planos com modal dinâmico de **PIX QR Code**.

### 2. Estúdio de Redação (`/nova-redacao`)
- Editor com alternador para **Modo Folha Pautada Oficial (30 Linhas)**, detector em tempo real de palavras repetidas (**Competência 4**) com sinônimos sugeridos, auto-save automático de rascunhos e upload de arquivos.

### 3. Laudo de Correção (`/correcao/[id]`)
- Exibição da nota oficial (0 a 1000), pontuação C1–C5, marcações interativas de desvios, versão Nota 1000 reescrita, **Simulador SISU integrado** e exportação para PDF.
- Blindagem *server-side*: contas gratuitas visualizam notas mascaradas (`••••`) e popover para upgrade.

### 4. Painel do Estudante (`/dashboard`)
- KPIs de média geral e maior nota, simulador SISU, quadro de **Conquistas/Gamificação** e listagem completa de redações salvas.

### 5. Histórico & Evolução (`/historico`)
- Gráfico temporal de evolução das redações e radar de competências.

### 6. Autenticação & Testes (`/auth`)
- Cadastro e login de estudantes, com botão de **1 clique para Acesso Total PRO (100% Liberado)** para testes locais.

---

## 🔗 Links Relacionados
- [[04 - Arquitetura Técnica/Componentes & Design System|Design System e Componentes]]
- [[04 - Arquitetura Técnica/APIs, Modelos & Tipagem|Tipos TypeScript e Endpoints de API]]
- [[04 - Arquitetura Técnica/Segurança & Blindagem Server-Side|Segurança & Blindagem Server-Side (Zero-Leak)]]
- [[05 - Banco de Dados & Integrações/Supabase, Storage & Env|Estrutura de Dados & Migração para Nuvem]]
