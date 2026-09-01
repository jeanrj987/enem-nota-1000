# 🚀 NOTA 1000 PRO • Sistema Oficial de Treinamento e Avaliação ENEM 2026

Plataforma SaaS de alta performance calibrada na **Matriz Oficial do INEP (2026)** para avaliação anatômica das 5 competências do ENEM, simulador de notas de corte do SISU/Medicina, detector de repetições em tempo real e reescrita exemplar Nota 1000.

---

## 📚 Documentação Completa
Para ler toda a arquitetura técnica, fluxo de segurança anti-inspecionar (zero-leak), modelo de dados e o **guia de migração para banco de dados online (PostgreSQL/Supabase)**, acesse:
👉 **[DOCUMENTACAO_SISTEMA.md](file:///c:/Projetos/Enem/Enem/DOCUMENTACAO_SISTEMA.md)**

---

## ⚡ Início Rápido

```bash
# 1. Instalar dependências
npm install

# 2. Executar servidor de desenvolvimento
npm run dev

# 3. Compilar para produção
npm run build
```

Acesse em seu navegador: **`http://localhost:3000`**

---

## 🌟 Principais Recursos Implementados

1. **✍️ Estúdio Oficial de Redação**:
   - Folha Pautada Oficial (30 Linhas) idêntica à do exame.
   - Detector de repetições viciosas (Competência 4) com sugestão de sinônimos.
   - Auto-Save automático contínuo de rascunhos.
   - Modo Zen / Tela Cheia isolado.

2. **🎓 Simulador SISU / Medicina**:
   - Comparativo em tempo real da nota com notas de corte reais (USP, UFRJ, UFMG, etc.).

3. **🔒 Blindagem de Segurança Server-Side (Anti-DevTools)**:
   - Sanitização total no servidor para usuários gratuitos: zero notas ou textos privados trafegam no payload JSON ou no HTML.

4. **💳 Checkout PIX Dinâmico com QR Code**:
   - Geração de código PIX Copia e Cola e desbloqueio instantâneo.

5. **🏅 Gamificação & Sequência (Streak 🔥)**:
   - Acompanhamento de dias seguidos e conquistas do estudante.
