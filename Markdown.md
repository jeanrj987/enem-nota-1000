Você é um desenvolvedor full-stack sênior. Construa uma aplicação web completa para correção de redações com integração de IA, seguindo exatamente as especificações abaixo.

## OBJETIVO
Plataforma onde o usuário envia uma redação (texto ou upload de arquivo), recebe correção detalhada com feedback pedagógico, nota por competência, sugestões de melhoria e orientações personalizadas. A correção é feita por um agente de IA cujo prompt de comportamento já está definido e deve ser injetado como system prompt na chamada da API.

## STACK TECNOLÓGICA (menor custo possível, máxima eficiência)

### Frontend
- Next.js 14+ (App Router) — SSR/SSG, rotas de API embutidas, dispensa backend separado
- Tailwind CSS — estilização
- React Hook Form + Zod — validação de formulários
- Tiptap — editor de texto rico para escrever/visualizar redação
- Recharts — gráficos de evolução

### Backend / API
- Next.js API Routes (Serverless) — sem custo de servidor dedicado
- Edge Functions quando possível — menor latência e custo

### Inteligência Artificial
- OpenAI API com modelo gpt-4o-mini — melhor custo-benefício (~$0.150/1M input tokens, ~$0.600/1M output tokens)
- Alternativa mais barata: Groq + Llama 3.1 (gratuito até certa quota)
- Estrutura: system prompt com instruções do agente + user prompt com a redação
- Resposta em JSON estruturado

### Banco de Dados
- Supabase (PostgreSQL) — plano gratuito (500MB, 50k MAU)
- Tabelas: users, redacoes, correcoes, feedbacks
- Row Level Security (RLS) nativo

### Autenticação
- Supabase Auth — incluído sem custo adicional, login Google/GitHub/Email

### Hospedagem
- Vercel plano gratuito — deploy direto, SSL grátis, CDN global

### Armazenamento de Arquivos
- Supabase Storage — upload de redações em PDF/DOCX, 1GB no plano grátis

### Bibliotecas Auxiliares
- pdf-parse — extração de texto de PDF
- mammoth — extração de texto de DOCX
- jspdf ou @react-pdf/renderer — exportar correção em PDF

## ESTRUTURA DE PÁGINAS
1. / — Landing page (apresentação, como funciona, CTA)
2. /auth — Login/Cadastro
3. /dashboard — Lista de redações e histórico de correções
4. /nova-redacao — Editor Tiptap ou upload de arquivo
5. /correcao/[id] — Resultado da correção (nota geral, nota por competência, comentários linha por linha, erros categorizados, versão reescrita sugerida, feedback pedagógico)
6. /historico — Evolução do usuário com gráficos

## FLUXO DE INTEGRAÇÃO DA IA
Usuário envia redação → Frontend envia para API Route (/api/corrigir) → API monta payload:
{
  system: "[PROMPT DO AGENTE FORNECIDO PELO USUÁRIO]",
  user: "Corrija a seguinte redação:\n\n{texto_da_redacao}"
}
→ Chamada para OpenAI API (gpt-4o-mini) → Resposta JSON estruturado:
{
  nota_geral: number,
  competencias: [{ nome, nota, comentario }],
  erros: [{ trecho, tipo, correcao, explicacao }],
  versao_reescrita: string,
  feedback_pedagogico: string
}
→ Salvar no Supabase → Retornar para frontend renderizar

## ESTRUTURA DE PASTAS
/src
  /app
    /api
      /corrigir/route.ts
      /upload/route.ts
    /page.tsx
    /dashboard/page.tsx
    /nova-redacao/page.tsx
    /correcao/[id]/page.tsx
    /historico/page.tsx
  /components
    /Editor.tsx
    /CorrecaoView.tsx
    /GraficoEvolucao.tsx
    /Navbar.tsx
  /lib
    /supabase.ts
    /openai.ts
    /prompt-agente.ts
  /types
    /index.ts

## VARIÁVEIS DE AMBIENTE
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=

## REQUISITOS
- Upload por texto ou arquivo (.txt, .pdf, .docx)
- Correção com retorno JSON estruturado
- Destaque visual de erros sobre o texto
- Histórico com gráfico de evolução
- Exportar correção em PDF
- Modo escuro/claro
- Interface responsiva (mobile-first)
- TypeScript em todos os arquivos
- Tempo de resposta da correção < 30s

## ESTIMATIVA DE CUSTO MENSAL
- Vercel (grátis): R$ 0
- Supabase (grátis): R$ 0
- OpenAI gpt-4o-mini (~500 redações/mês): ~R$ 15-25
- Total: ~R$ 15-25/mês

Gere o código completo do projeto seguindo esta especificação. Comece pela configuração, depois implemente página por página, e por último a integração com a IA. Use TypeScript em todos os arquivos.