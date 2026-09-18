---
title: Regras de Manutenção do Vault
tags:
  - governanca
  - regras
  - obsidian
  - agentes
updated: 2026-09-18 (protocolo de trabalho em paralelo — numeração de ADR)
---

# 🛡️ Regras de Manutenção & Atualização Contínua do Vault

> [!important] **Protocolo Obrigatório para Agentes e Desenvolvedores**
> A pasta `Vault/` é a **Central de Conhecimento e Memória Permanente** deste repositório. Sempre que qualquer informação, dúvida ou implementação for necessária, consulte primeiro este cofre. Sempre que qualquer mudança for feita no código, na arquitetura ou nas regras de negócio, a respectiva documentação no `Vault/` **DEVE ser atualizada imediatamente**.

---

## 📌 1. Princípios de Consulta
1. **Consultar Antes de Agir**: Antes de iniciar uma refatoração, adicionar novas dependências ou criar novas rotas, o agente deve buscar no `Vault/` o padrão já estabelecido (ex: modelos de dados em [[04 - Arquitetura Técnica/APIs, Modelos & Tipagem]], prompt em [[03 - Inteligência Artificial/Arquitetura de IA & Prompts]]).
2. **Respeitar as Decisões Arquiteturais**: Decisões como o fallback Gemini $\rightarrow$ OpenAI $\rightarrow$ heurística offline já estão documentadas em [[06 - Registro de Decisões/Decisões de Arquitetura & Changelog]] e devem ser preservadas.

---

## 📌 2. Princípios de Escrita e Formatação no Obsidian
- **Links Internos Bidirecionais**: Use sempre sintaxe de *wikilinks* `[[Caminho/Nota|Texto Visível]]` para manter o grafo de conhecimento do Obsidian conectado.
- **Frontmatter YAML**: Toda nota deve conter cabeçalho frontmatter com `title`, `tags` e `updated`.
- **Callouts**: Use callouts do Obsidian (`> [!tip]`, `> [!warning]`, `> [!important]`, `> [!info]`, `> [!example]`) para dar ênfase visual à leitura.
- **Tabelas & Blocos de Código**: Use blocos de código com linguagem explícita (`tsx`, `ts`, `json`, `css`) e tabelas comparativas para facilitar o entendimento rápido.

---

## 📌 3. Gatilhos de Atualização Obrigatória
Sempre que ocorrer qualquer uma das seguintes situações, atualize o `Vault/`:

| Acontecimento no Código | O que deve ser atualizado no Vault? |
| :--- | :--- |
| **Nova Rota ou Página Criada** | Atualizar [[04 - Arquitetura Técnica/Stack & Estrutura de Rotas]] e [[00 - Índice Principal]] |
| **Mudança em Prompts ou Lógica de IA** | Atualizar [[03 - Inteligência Artificial/Arquitetura de IA & Prompts]] |
| **Alteração em Tipos TypeScript ou APIs** | Atualizar [[04 - Arquitetura Técnica/APIs, Modelos & Tipagem]] |
| **Novos Planos, Copy ou Preços** | Atualizar [[01 - Visão Geral & Negócio/Estratégia de Vendas & Copywriting]] |
| **Nova Versão / Deploy / Refatoração** | Adicionar entrada no [[06 - Registro de Decisões/Decisões de Arquitetura & Changelog]] |

---

## 📌 4. Estrutura de Diretórios Recomendada no Vault

```text
Vault/
├── 00 - Índice Principal.md
├── 00 - Regras de Manutenção do Vault.md
├── 01 - Visão Geral & Negócio/
│   ├── Visão do Produto.md
│   ├── Persona & Dores dos Vestibulandos.md
│   └── Estratégia de Vendas & Copywriting.md
├── 02 - Metodologia ENEM/
│   ├── Matriz Oficial do INEP.md
│   └── Competências Detalhadas C1 a C5.md
├── 03 - Inteligência Artificial/
│   └── Arquitetura de IA & Prompts.md
├── 04 - Arquitetura Técnica/
│   ├── Stack & Estrutura de Rotas.md
│   ├── Componentes & Design System.md
│   └── APIs, Modelos & Tipagem.md
├── 05 - Banco de Dados & Integrações/
│   └── Supabase, Storage & Env.md
└── 06 - Registro de Decisões/
    └── Decisões de Arquitetura & Changelog.md
```

---

## 📌 5. Trabalho em Paralelo (dois devs, dois agentes, o mesmo changelog)

> [!danger] **O `Decisões de Arquitetura & Changelog.md` é o ponto de colisão do projeto**
> É o único arquivo que **todo** trabalho toca, e sempre no mesmo lugar: o topo. Em 18/09, dois lados trabalhando no mesmo dia produziram dois acidentes diferentes nele — e nenhum dos dois apareceu como conflito do git.

**O que aconteceu, para não se repetir:**

1. **Numeração duplicada.** Os dois lados criaram ADRs partindo do último número que viam *localmente*. Um registrou 033–039, o outro 033–036 — quatro números com dois significados cada. O git não reclama: são inserções em pontos diferentes do arquivo.
2. **ADR sobrescrito em silêncio.** Ao inserir o ADR 039, a edição substituiu a **linha de título** do ADR 038 em vez de inserir um bloco novo acima dele. O corpo do 038 sobreviveu órfão, colado sob o título do 039, e a perda só foi notada porque um comentário em `src/lib/gates.ts` apontava para um ADR que não existia mais.

### Protocolo obrigatório antes de escrever um ADR

```bash
# 1. Veja o que o OUTRO lado já publicou — não confie só no arquivo local
git fetch origin
git show origin/main:"Vault/06 - Registro de Decisões/Decisões de Arquitetura & Changelog.md" \
  | grep -o '^### ADR [0-9]\+' | head -3

# 2. Compare com o local
grep -o '^### ADR [0-9]\+' "Vault/06 - Registro de Decisões/Decisões de Arquitetura & Changelog.md" | head -3

# 3. O número novo é (o MAIOR dos dois) + 1. Nunca o maior local + 1.
```

### Regras

- **Inserir, nunca sobrescrever.** Um ADR novo é um bloco novo *acima* do anterior. A linha `### ADR NNN:` do ADR que já existe não se toca. Se a sua ferramenta de edição está substituindo aquela linha, a edição está errada.
- **O mesmo vale para as versões do changelog** (`### [vX.Y.Z]`), pelo mesmo motivo e no mesmo arquivo.
- **Quem ainda não deu `push` renumera.** Se a colisão já aconteceu, quem tem os commits só locais é quem ajusta — renumerar o que já está em `origin/main` quebraria as referências de quem já puxou.
- **Referência a ADR em comentário de código é um link.** Se `src/**` cita `ADR NNN`, esse ADR tem que existir. Foi assim que a perda do 038 foi descoberta.

### Verificação obrigatória depois de todo merge

```bash
# A sequência tem que ser contínua e decrescente, sem buraco nenhum.
grep -o '^### ADR [0-9]\+' "Vault/06 - Registro de Decisões/Decisões de Arquitetura & Changelog.md" | head -20

# Todo ADR citado no código existe no changelog?
grep -rho 'ADR [0-9]\{3\}' src --include='*.ts' --include='*.tsx' | sort -u | while read -r _ n; do
  grep -q "^### ADR $n" "Vault/06 - Registro de Decisões/Decisões de Arquitetura & Changelog.md" \
    || echo "REFERENCIA QUEBRADA: o codigo cita ADR $n, que nao existe no changelog"
done
```

Um buraco na sequência (ex.: 039 → 037) quase sempre significa um ADR sobrescrito, **não** um número pulado. Procure o corpo órfão colado sob o ADR de cima antes de assumir que nunca existiu.
