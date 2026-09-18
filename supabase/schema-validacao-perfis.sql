-- Nota 1000 — travas de integridade em `perfis`.
-- Rode no SQL Editor do Supabase, depois de supabase/schema-perfis-email.sql.
--
-- POR QUE ISTO EXISTE
--
-- A validação de `/auth` e `/completar-perfil` roda toda no navegador, e
-- `salvarPerfil` grava direto no Supabase com a sessão do próprio usuário.
-- Quem abrir o console e chamar `supabase.from('perfis').upsert(...)` pula o
-- formulário inteiro. A RLS impede escrever na linha de OUTRA pessoa, mas
-- não impede escrever lixo na própria.
--
-- O banco é a única camada que não dá para contornar: tanto o upsert do
-- cliente quanto o trigger `handle_new_user` (que roda no cadastro) passam
-- por aqui.
--
-- REGRA DE OURO DESTE ARQUIVO: nenhuma trava pode ser MAIS estrita que a
-- validação do formulário. Se for, a pessoa preenche certo, o formulário
-- aceita, e o banco recusa com um erro de Postgres ilegível. As faixas
-- abaixo espelham `src/lib/data-nascimento.ts` e `src/lib/whatsapp.ts`.

-- ─────────────────────────────────────────────────────────────────────────
-- Todas as travas entram como NOT VALID de propósito.
--
-- NOT VALID aplica a regra a toda inserção e atualização daqui para frente,
-- mas NÃO varre as linhas que já existem. Isso garante que este script rode
-- sem erro mesmo que algum cadastro antigo (feito antes de `whatsapp.ts`
-- existir, por exemplo) esteja fora do padrão. Sem isso, um único registro
-- torto faria o ALTER inteiro falhar, e a mensagem não diria qual foi.
--
-- Para conferir os antigos depois, rode os VALIDATE do fim do arquivo.
-- ─────────────────────────────────────────────────────────────────────────

-- 1. Data de nascimento plausível.
--    Espelha IDADE_MAXIMA_ANOS (100) e IDADE_MINIMA_ANOS (10) de
--    src/lib/data-nascimento.ts. É o caso que passou em produção: o campo
--    aceitava o ano 98534.
alter table public.perfis
  add constraint perfis_data_nascimento_plausivel
  check (
    data_nascimento is null
    or (
      data_nascimento < current_date
      and data_nascimento > current_date - interval '100 years'
      and data_nascimento < current_date - interval '10 years'
    )
  ) not valid;

-- 2. WhatsApp em E.164 brasileiro, o formato que `normalizarWhatsapp`
--    produz: +55, DDD de 2 dígitos, o nono dígito obrigatório (sempre 9) e
--    mais 8 dígitos. Celular, não fixo — fixo não recebe WhatsApp, e este
--    campo é o ativo comercial do cadastro.
--
--    Não valida a lista de DDDs reais: isso vive em `whatsapp.ts`, e repetir
--    99 números aqui criaria duas listas para manter em sincronia. A trava
--    aqui pega o lixo grosseiro; a lista fina fica no formulário.
alter table public.perfis
  add constraint perfis_whatsapp_e164
  check (whatsapp is null or whatsapp ~ '^\+55[1-9][0-9]9[0-9]{8}$')
  not valid;

-- 3. Tetos de tamanho nos campos de texto.
--    `text` no Postgres não tem limite: sem isto, dá para gravar megabytes
--    em `nome_completo`. Não é roubo de dado, é custo de armazenamento e
--    payload — e é o tipo de coisa que só se descobre na fatura.
--    Os limites são folgados de propósito; ninguém legítimo esbarra neles.
alter table public.perfis
  add constraint perfis_textos_com_tamanho_sao
  check (
    (nome_completo is null or char_length(nome_completo) between 2 and 120)
    and (cidade_estado is null or char_length(cidade_estado) between 2 and 80)
    and (curso_dos_sonhos is null or char_length(curso_dos_sonhos) between 2 and 80)
    and (email is null or char_length(email) <= 254)
  ) not valid;

-- 4. E-mail com formato mínimo. Não tenta validar e-mail "de verdade" (isso
--    é impossível por regex e só se confirma enviando mensagem) — só recusa
--    o que claramente não é endereço.
alter table public.perfis
  add constraint perfis_email_formato
  check (email is null or email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
  not valid;

-- ─────────────────────────────────────────────────────────────────────────
-- CONFERIR OS CADASTROS ANTIGOS (opcional, rode depois)
--
-- Cada VALIDATE varre as linhas existentes e falha se alguma violar a
-- regra. Falhar aqui é informação, não problema: indica exatamente qual
-- trava algum cadastro antigo não cumpre, para corrigir a linha na mão.
-- ─────────────────────────────────────────────────────────────────────────
-- alter table public.perfis validate constraint perfis_data_nascimento_plausivel;
-- alter table public.perfis validate constraint perfis_whatsapp_e164;
-- alter table public.perfis validate constraint perfis_textos_com_tamanho_sao;
-- alter table public.perfis validate constraint perfis_email_formato;

-- Para ver quem violaria, sem alterar nada:
-- select user_id, nome_completo, whatsapp, data_nascimento, email
-- from public.perfis
-- where whatsapp !~ '^\+55[1-9][0-9]9[0-9]{8}$'
--    or data_nascimento >= current_date
--    or char_length(coalesce(nome_completo, '')) > 120;
