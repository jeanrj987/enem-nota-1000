# 📘 DOCUMENTAÇÃO TÉCNICA E ARQUITETURAL • NOTA 1000 PRO
> **Sistema Inteligente de Avaliação e Treinamento de Redações ENEM**  
> *Calibrado estritamente na Matriz Oficial de Correção do INEP (2026)*

---

## 📑 Sumário
1. [Visão Geral & Filosofia do Produto](#1-visão-geral--filosofia-do-produto)
2. [Arquitetura de Segurança & Blindagem Anti-Inspecionar (Zero-Leak)](#2-arquitetura-de-segurança--blindagem-anti-inspecionar-zero-leak)
3. [Estrutura de Rotas e Telas](#3-estrutura-de-rotas-e-telas)
4. [Módulos e Componentes do Frontend](#4-módulos-e-componentes-do-frontend)
5. [Endpoints de Backend & Motor de Avaliação](#5-endpoints-de-backend--motor-de-avaliação)
6. [Modelo de Dados & Armazenamento Local](#6-modelo-de-dados--armazenamento-local)
7. [Guia Passo a Passo para Migração para Banco de Dados Online](#7-guia-passo-a-passo-para-migração-para-banco-de-dados-online)
8. [Matriz Pedagógica Oficial do ENEM (Competências 1 a 5)](#8-matriz-pedagógica-oficial-do-enem-competências-1-a-5)
9. [Comandos de Desenvolvimento e Produção](#9-comandos-de-desenvolvimento-e-produção)

---

## 1. Visão Geral & Filosofia do Produto
O **NOTA 1000 PRO** é uma plataforma web completa projetada para estudantes que prestam o Exame Nacional do Ensino Médio (ENEM). O sistema oferece:
- Estúdio de escrita com **simulador de folha pautada oficial (30 linhas)** e **detector de repetições em tempo real (C4)**.
- Avaliação anatômica instantânea e detalhada segundo a matriz de 5 competências do INEP.
- Reescrita modelo padrão 1000 pontos.
- **Simulador de Aprovação SISU / Medicina** comparando a nota com notas de corte reais das maiores universidades do país.
- Funil de monetização com **Modo Demonstração (Grátis)** e **Modo PRO (Pago / Desbloqueado)** com checkout via **PIX QR Code**.

---

## 2. Arquitetura de Segurança & Blindagem Anti-Inspecionar (Zero-Leak)

### O Problema do DevTools (Inspecionar Elemento)
Em modelos ingênuos de SaaS, o servidor envia a nota real e a reescrita completa no payload JSON, e o frontend aplica apenas uma máscara de CSS (`blur`, `display: none` ou `opacity: 0`). Nesse caso, qualquer usuário abrindo o Inspecionar Elemento (F12) ou a aba Network consegue ler a nota sem pagar.

### A Solução Implementada (Segurança Server-Side)
No NOTA 1000 PRO, a blindagem é **estritamente processada no servidor** antes da resposta HTTP:
1. **Sanitização no Backend (`/api/corrigir`)**:
   - Para usuários do plano `'gratis'`, o servidor calcula a correção, mas **substitui todos os números de notas por `0`**, ofusca os comentários de competência e substitui o texto reescrito por um placeholder seguro.
   - **Zero dígitos ou textos secretos trafegam no payload JSON ou existem no DOM**.
2. **Desbloqueio Seguro no Backend (`/api/desbloquear`)**:
   - Somente quando o usuário possui assinatura ou confirma o pagamento, o cliente envia uma requisição para `/api/desbloquear`, que recalcula ou entrega os dados 100% integrais.
3. **Mascaração no Client (`CorrecaoView.tsx`, `dashboard/page.tsx`, `historico/page.tsx`)**:
   - Elementos em modo demonstração exibem o caractere de segurança `••••` em vez de números, tornando impossível qualquer edição via DevTools.

---

## 3. Estrutura de Rotas e Telas

| Rota | Descrição |
|---|---|
| `/` | Landing Page de alta conversão com calculadora SISU, depoimentos e planos com checkout PIX. |
| `/auth` | Tela de autenticação/cadastro obrigatório para testes, com botão de acesso rápido PRO. |
| `/nova-redacao` | Estúdio de Redação oficial com modo 30 linhas, contador de caracteres e detector de repetições. |
| `/correcao/[id]` | Laudo oficial de correção anatômica, simulador SISU integrado e versão reescrita Nota 1000. |
| `/dashboard` | Painel do Estudante com histórico de treinos, conquistas (gamificação), streak e simulador SISU. |
| `/historico` | Gráficos analíticos de evolução temporal e telemetria de notas por competência. |

---

## 4. Módulos e Componentes do Frontend

- **`Editor.tsx`**:
  - Modo alternador: Texto livre vs Folha Pautada Oficial (30 Linhas).
  - Detector de repetições viciosas de palavras (Competência 4) com sugestões de sinônimos em 1 clique.
  - Auto-Save automático em `localStorage` a cada alteração com indicador de data/hora.
  - Modo Zen / Tela Cheia com `createPortal` isolado do header.
- **`CorrecaoView.tsx`**:
  - Visualização de notas gerais e radar das 5 competências.
  - Módulo integrado do **Simulador SISU**.
  - Popups explicativos de cada desvio gramatical no texto original.
  - Comparativo com a versão reescrita Nota 1000.
  - Exportação oficial do laudo em formato PDF para impressão.
- **`SimuladorSisu.tsx`**:
  - Simulador interativo com notas de corte reais (Medicina USP/UFRJ, Direito UFMG, Computação USP, etc.).
- **`CheckoutModal.tsx`**:
  - Modal dinâmico com chave PIX Copia e Cola, QR Code visual e confirmação de teste em 1 clique.
- **`BannerUrgencia.tsx`**:
  - Barra de contagem regressiva para o primeiro dia do ENEM 2026.
- **`ProvaSocialToast.tsx`**:
  - Notificações discretas de aprovação e desbloqueio de outros estudantes em tempo real.
- **`Navbar.tsx`**:
  - Cabeçalho responsivo com contador de streak (`🔥`), atalho rápido de alternância PRO/Demo e navegação.

---

## 5. Endpoints de Backend & Motor de Avaliação

- **`POST /api/corrigir`**:
  - Recebe `{ tema, titulo, texto, plano }`.
  - Processa a redação segundo os critérios rigorosos do manual de corretores do INEP.
  - Aplica a sanitização de segurança caso `plano === 'gratis'`.
- **`POST /api/desbloquear`**:
  - Recebe `{ tema, titulo, texto }` para recalcular e entregar o laudo completo sem qualquer ofuscação.
- **`POST /api/upload`**:
  - Suporta envio de arquivos PDF, imagens digitalizadas de redações manuscritas (OCR) ou arquivos DOCX.

---

## 6. Modelo de Dados & Armazenamento Local

### Chaves do `localStorage`:
- **`enem_ai_redacoes_v3`**: Array de redações salvas contendo `id`, `tema`, `titulo`, `texto`, `correcao` e `created_at`.
- **`enem_usuario_sessao_v1`**: Objeto do usuário ativo:
  ```json
  {
    "id": "usr_1788280540315",
    "nome": "Jean",
    "email": "jean@enem.pro",
    "plano": "pro", // 'gratis' | 'pro' | 'medicina'
    "created_at": "2026-09-01T17:00:00.000Z"
  }
  ```
- **`enem_rascunho_temp_v1`**: Auto-save do estúdio com `{ tema, titulo, texto, updated_at }`.

---

## 7. Guia Passo a Passo para Migração para Banco de Dados Online

Quando for migrar do armazenamento local para um banco em nuvem (ex: **Supabase / PostgreSQL**, **Firebase** ou **Prisma ORM**):

### 1. Esquema SQL Sugerido (PostgreSQL):
```sql
-- Tabela de Usuários
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    plano VARCHAR(50) DEFAULT 'gratis', -- 'gratis', 'pro', 'medicina'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Redações
CREATE TABLE redacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    tema TEXT NOT NULL,
    titulo TEXT,
    texto TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Pareceres / Correções
CREATE TABLE correcoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    redacao_id UUID REFERENCES redacoes(id) ON DELETE CASCADE,
    nota_geral INT NOT NULL,
    c1 INT NOT NULL,
    c2 INT NOT NULL,
    c3 INT NOT NULL,
    c4 INT NOT NULL,
    c5 INT NOT NULL,
    pontos_fortes JSONB,
    pontos_fracos JSONB,
    dicas_melhoria JSONB,
    reescrita_nota_1000 TEXT,
    checklist_c5 JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Adaptação no Frontend (`src/lib/storage.ts`):
Substitua as funções de leitura/escrita de `localStorage` por chamadas à API REST (`fetch('/api/redacoes')`) ou pelo client do Supabase (`supabase.from('redacoes').select('*')`).

---

## 8. Matriz Pedagógica Oficial do ENEM (Competências 1 a 5)

1. **Competência 1 (0 a 200 pts)**: Domínio da norma padrão da língua escrita (concordância, regência, crase, ortografia, pontuação, sintaxe truncada ou justa).
2. **Competência 2 (0 a 200 pts)**: Compreensão da proposta temática, aplicação de repertório sociocultural produtivo e legitimado, e respeito à tipologia dissertativo-argumentativa.
3. **Competência 3 (0 a 200 pts)**: Seleção, relação, organização e interpretação de informações, fatos, opiniões e argumentos em defesa de um ponto de vista (projeto de texto estratégico).
4. **Competência 4 (0 a 200 pts)**: Demonstração de conhecimento dos mecanismos linguísticos necessários para a construção da argumentação (coesão inter e intraparágrafos, variedade de conectivos, ausência de repetições viciosas).
5. **Competência 5 (0 a 200 pts)**: Elaboração de proposta de intervenção para o problema abordado, contendo os 5 elementos obrigatórios: **Agente**, **Ação**, **Meio/Modo**, **Efeito/Detalhamento** e **Respeito aos Direitos Humanos**.

---

## 9. Comandos de Desenvolvimento e Produção

```bash
# Instalação de dependências
npm install

# Executar em ambiente de desenvolvimento local
npm run dev

# Compilar para produção (Validação de tipos e assets)
npm run build

# Iniciar servidor de produção compilado
npm start
```
