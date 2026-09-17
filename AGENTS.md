<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Documentação no Vault (Obsidian)

`Vault/` é a fonte única da verdade deste projeto: regras pedagógicas do ENEM
(matriz do INEP, C1–C5), arquitetura de prompts, rotas, modelos de dados,
copywriting de vendas e decisões de produto. Ponto de entrada:
`Vault/00 - Índice Principal.md`.

- **Antes de escrever código**, consulte a nota correspondente no `Vault/`.
- **Ao criar ou alterar** rota, componente, endpoint, prompt ou regra de
  negócio, atualize a nota correspondente e registre a mudança em
  `Vault/06 - Registro de Decisões/Decisões de Arquitetura & Changelog.md`.
- Notas usam sintaxe Obsidian: frontmatter YAML, callouts (`> [!tip]`), tags e
  links internos `[[...]]`. Mantenha o padrão.

As regras de manutenção do cofre estão em
`Vault/00 - Regras de Manutenção do Vault.md`.

# Padrões de código (sempre ativos)

Atue com o rigor e o julgamento pragmático de um Senior Staff Software
Engineer em todo código deste projeto.

## Anti-patterns proibidos

- **Erro silenciado**: nunca `catch (e) {}` vazio. Registre com contexto
  (operação, entrada) ou re-lance. Capture apenas o que sabe tratar.
- **Tipagem fraca**: proibido `any` desnecessário. Use tipos explícitos, união
  de tipos ou interfaces estritas.
- **Config hardcoded**: chaves de API, URLs e flags de ambiente vêm apenas de
  `process.env`.
- **Funções grandes**: responsabilidade única, máx. 40 linhas. Mais de 4
  parâmetros vira objeto de opções.
- **Abstração prematura**: não crie framework genérico para algo usado em 1
  lugar. Tolere duplicação até a 3ª ocorrência.
- **Valores mágicos**: `if (tentativas > 3)` vira `MAX_TENTATIVAS`. Exceção:
  0, 1 e status HTTP conhecidos.

## Produção e robustez

- **Resiliência**: toda chamada externa (Gemini, OpenAI, Supabase, Stripe)
  precisa de tratamento de erro, timeout e fallback seguro.
- **Validação de entrada**: toda rota em `src/app/api/*` valida estritamente o
  payload antes de processar. O projeto já usa `zod` — use-o.
- **Performance**: evite re-render desnecessário no React e queries sem índice.

## Verificação antes de concluir

- `npm run lint`, `npm test` e `npm run build` sem erros.
- Se um teste que você não tocou falhar, confirme que ele também falha em
  `main` antes de assumir que é pré-existente.
- Nenhum `console.log` ou `debugger` em caminho de produção.

Guia aprofundado (workflow de entrega, estimativas, refatoração, revisão) em
`.claude/skills/engineering-senior-developer/SKILL.md`.
