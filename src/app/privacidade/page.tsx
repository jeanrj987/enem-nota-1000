import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CONTROLADOR, SUBPROCESSADORES, VERSAO_DOCUMENTOS_LEGAIS } from '@/lib/controlador';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Nota 1000',
  description:
    'Quais dados pessoais o Nota 1000 coleta, para que os usa, com quem compartilha, por quanto tempo guarda e como exercer seus direitos como titular.',
};

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="fonte-serifada text-xl font-bold text-tinta">{titulo}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-tinta-suave">{children}</div>
    </section>
  );
}

export default function PoliticaDePrivacidade() {
  return (
    <div className="min-h-screen flex flex-col bg-papel text-tinta">
      <Navbar />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wider text-vermelho">Documento legal</p>
        <h1 className="mt-2 fonte-serifada text-3xl font-bold text-tinta sm:text-4xl">
          Política de Privacidade
        </h1>
        <p className="mt-2 text-sm text-tinta-fraca">
          Versão {VERSAO_DOCUMENTOS_LEGAIS}. Escrita para ser entendida por quem vai usar o
          produto, não só por advogado.
        </p>

        <Secao titulo="Quem é responsável pelos seus dados">
          <p>
            {CONTROLADOR.razaoSocial
              ? `${CONTROLADOR.razaoSocial}, inscrita no CNPJ ${CONTROLADOR.cnpj}, com sede em ${CONTROLADOR.endereco}.`
              : 'A empresa responsável pelo Nota 1000 (identificação completa a ser publicada).'}
          </p>
          <p>
            Encarregado pelo tratamento de dados pessoais (DPO), conforme o Art. 41 da LGPD:{' '}
            {CONTROLADOR.encarregadoNome ? (
              <>
                {CONTROLADOR.encarregadoNome} —{' '}
                <a className="text-vermelho underline" href={`mailto:${CONTROLADOR.encarregadoEmail}`}>
                  {CONTROLADOR.encarregadoEmail}
                </a>
              </>
            ) : (
              'a ser publicado.'
            )}
          </p>
        </Secao>

        <Secao titulo="Que dados coletamos e por quê">
          <p>Coletamos apenas o que o produto precisa para funcionar e para ser cobrado:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-tinta">E-mail e senha</strong> — para criar e acessar sua
              conta. A senha é guardada pelo Supabase de forma criptografada; nós não a vemos.
            </li>
            <li>
              <strong className="text-tinta">Nome completo, cidade/estado, data de nascimento e
              curso dos sonhos</strong> — para identificar você na plataforma e adaptar a
              comunicação ao seu objetivo.
            </li>
            <li>
              <strong className="text-tinta">WhatsApp</strong> — para falar com você sobre a sua
              conta, o seu uso do produto e, eventualmente, outras ofertas. Se você não quiser
              mais receber contato por esse canal, é só pedir pelo e-mail abaixo.
            </li>
            <li>
              <strong className="text-tinta">O texto das suas redações</strong> — é o objeto do
              serviço. Sem ele não há correção.
            </li>
            <li>
              <strong className="text-tinta">Registros de acesso</strong> — endereço IP, data e
              hora, guardados por obrigação do Marco Civil da Internet (Art. 15) e para conter
              abuso.
            </li>
          </ul>
        </Secao>

        <Secao titulo="Com quem seus dados são compartilhados">
          <p>
            Para funcionar, o produto usa serviços de terceiros. Todos estão{' '}
            <strong className="text-tinta">fora do Brasil</strong>, o que significa que há
            transferência internacional de dados — inclusive do texto da sua redação, que sai do
            país para ser corrigido:
          </p>
          <div className="overflow-x-auto">
            <table className="mt-2 w-full min-w-[520px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-regua text-left text-tinta">
                  <th className="py-2 pr-3 font-semibold">Serviço</th>
                  <th className="py-2 pr-3 font-semibold">Para quê</th>
                  <th className="py-2 pr-3 font-semibold">O que recebe</th>
                  <th className="py-2 font-semibold">País</th>
                </tr>
              </thead>
              <tbody>
                {SUBPROCESSADORES.map((s) => (
                  <tr key={s.nome} className="border-b border-regua/60 align-top">
                    <td className="py-2 pr-3 font-semibold text-tinta">{s.nome}</td>
                    <td className="py-2 pr-3">{s.finalidade}</td>
                    <td className="py-2 pr-3">{s.dados}</td>
                    <td className="py-2">{s.pais}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Não vendemos seus dados e não os entregamos a anunciantes.
          </p>
        </Secao>

        <Secao titulo="Por quanto tempo guardamos">
          <p>
            Sua conta e seu perfil ficam enquanto você quiser usar o serviço. As redações e suas
            correções são apagadas após{' '}
            <strong className="text-tinta">24 meses</strong>, porque depois desse prazo a
            finalidade que justificava guardá-las já se esgotou. Registros de acesso ficam por 6
            meses, prazo legal do Marco Civil. Dados de cobrança seguem o prazo fiscal exigido por
            lei, mesmo que você apague a conta antes.
          </p>
        </Secao>

        <Secao titulo="Seus direitos, e como exercê-los">
          <p>
            A LGPD (Art. 18) garante que você confirme, acesse, corrija, apague e leve seus dados
            embora. Para exercer qualquer um desses direitos — incluindo pedir uma cópia dos seus
            dados ou a exclusão da sua conta —, escreva para{' '}
            {CONTROLADOR.emailContato ? (
              <a className="text-vermelho underline" href={`mailto:${CONTROLADOR.emailContato}`}>
                {CONTROLADOR.emailContato}
              </a>
            ) : (
              'o e-mail de contato indicado no rodapé'
            )}
            . Respondemos identificando quem pediu, para não entregar dado de uma pessoa a outra.
          </p>
        </Secao>

        <Secao titulo="Uma coisa que você precisa saber sobre a nota">
          <p>
            A nota que este produto dá é uma <strong className="text-tinta">estimativa gerada
            automaticamente por um sistema de correção</strong>. Ela não é a nota oficial do INEP, não vem de um
            corretor credenciado e não tem qualquer valor perante o ENEM. Serve para estudo e
            preparação.
          </p>
        </Secao>

        <Secao titulo="Menores de 18 anos">
          <p>
            Boa parte de quem presta o ENEM tem 16 ou 17 anos. Se você é menor de 18, use este
            serviço com o conhecimento e a autorização de um responsável. Um responsável que
            queira que apaguemos os dados de um adolescente sob sua guarda pode pedir pelo e-mail
            acima, e nós faremos.
          </p>
        </Secao>

        <Secao titulo="Mudanças nesta política">
          <p>
            Quando o conteúdo mudar de forma relevante, a versão indicada no topo muda junto.
          </p>
        </Secao>

        <p className="mt-10 border-t border-regua pt-6 text-xs text-tinta-fraca">
          Este texto foi redigido para descrever fielmente o que o sistema faz hoje. Ele ainda
          precisa de revisão de um advogado antes de ser tratado como peça jurídica definitiva.
        </p>
      </main>

      <Footer />
    </div>
  );
}
