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

Regra completa em `.agents/rules/obsidian-documentation.md`.
