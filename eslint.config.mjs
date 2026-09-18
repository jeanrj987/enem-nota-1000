import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Telas preservadas fora de produção (ver design-alternativas/README.md);
    // já excluídas do tsconfig pelo mesmo motivo.
    "design-alternativas/**",
  ]),
  {
    rules: {
      // Convenção já usada nos testes (mocks/stubs com parâmetros de
      // assinatura obrigatória mas não usados no corpo): prefixo `_` marca
      // a omissão como intencional, em vez de forçar a remoção do parâmetro.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);

export default eslintConfig;
