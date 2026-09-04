/**
 * Conjunto de calibração — redações reais com nota 1000 (200/200 em cada
 * competência), transcritas e cruzadas com os microdados oficiais do INEP pela
 * Cartilha Redação a Mil 8.0 (Poliedro / Lucas Felpi, ENEM 2025, distribuição
 * gratuita — ver Redacao/Cartilha-Redacao-a-Mil-8.0-*.pdf neste repositório).
 *
 * IMPORTANTE — isto é um conjunto de CALIBRAÇÃO DE TETO, não um conjunto de
 * calibração completo: as três redações abaixo tiraram nota máxima em todas as
 * competências. Elas respondem a uma pergunta específica — "o corretor
 * reconhece corretamente um texto excelente como excelente?" — mas não dizem
 * nada sobre a precisão do modelo em notas medianas ou baixas, que é onde a
 * maioria dos alunos reais está e onde erros de correção pesam mais. Métricas
 * como QWK exigem variância nas notas-alvo, que não existe aqui. Para medir
 * acurácia de verdade (R8 completo), este conjunto precisa ser expandido com
 * redações de nota mediana e baixa, avaliadas por um corretor humano.
 */

export interface RedacaoCalibrada {
  id: string;
  fonte: string;
  candidato: string;
  tema: string;
  ano: number;
  texto: string;
  notaOficial: {
    geral: number;
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    c5: number;
  };
}

export const REDACOES_CALIBRACAO: RedacaoCalibrada[] = [
  {
    id: 'calib_2025_bruna',
    fonte: 'Cartilha Redação a Mil 8.0 (Poliedro/Lucas Felpi), cruzado com microdados INEP',
    candidato: 'Bruna Gabriella Tavares',
    tema: 'Perspectivas acerca do envelhecimento na sociedade brasileira',
    ano: 2025,
    texto: `No filme "O Senhor Estagiário", é retratada a dificuldade de inserção de um homem idoso no ambiente laboral, onde ele sofre preconceitos relacionados à sua idade e à sua capacitação profissional. Fora da ficção, a problemática abordada na trama faz-se cada vez mais presente no cenário brasileiro, haja vista o progressivo envelhecimento populacional no país. Diante disso, é crucial analisar a escassez de políticas assistenciais voltadas aos idosos e o etarismo como mazelas referentes a tal fenômeno social.

Sob essa ótica, vale frisar a insuficiência de auxílios governamentais à crescente população idosa. Acerca disso, cabe mencionar que o Estatuto do Idoso prevê a garantia da qualidade de vida dos idosos brasileiros, por meio, por exemplo, do acesso pleno à aposentadoria. Entretanto, tal premissa não se consolida integralmente no Brasil, uma vez que considerável parcela dos indivíduos mais velhos — em especial os mais pobres — não usufrui de benefícios e de serviços essenciais à manutenção de seu bem-estar, como atendimentos de saúde regulares. Isso ocorre em razão do ínfimo investimento estatal em políticas assistenciais voltadas ao público idoso, a título de auxílio financeiro e da oferta de tratamento médico gratuito em hospitais públicos. Em consequência disso, muitos idosos, incapazes de custear as próprias necessidades - frequentemente devido à falta de renda na velhice — e carentes de um suporte governamental, ficam ainda mais vulneráveis ao desenvolvimento de enfermidades que exigem tratamentos e acompanhamento adequados, como o Mal de Alzheimer.

Outrossim, os preconceitos associados à população mais velha são outro empecilho relacionado ao envelhecimento populacional. Nessa lógica, em sua obra "A Velhice", Simone de Beauvoir afirma que a sociedade visualiza os idosos como indivíduos inválidos, incapazes de contribuir com o corpo social. A perspectiva estigmatizada denunciada pela socióloga configura o etarismo, preconceito que dificulta a integração de idosos em determinados espaços sociais, como as universidades. Posto isto, tal visão deturpada se perpetua devido à falta de projetos midiáticos que visem desconstruir os supracitados estigmas, a exemplo de programas televisivos que abordem a participação de pessoas mais velhas no mercado de trabalho. Dessa forma, a persistência da rejeição social à inserção dos idosos na dinâmica social contribui para a marginalização e para a dificuldade de sustento e de realização pessoal desse grupo.

Portanto, cabe às secretarias estaduais e municipais promover a disponibilidade de programas assistenciais à parcela idosa, mediante a destinação de verbas, a fim de garantir o acesso aos serviços fundamentais a esse grupo (a exemplo do atendimento médico), promovendo, assim, a qualidade de vida dessas pessoas. Ademais, a Mídia deve exibir programas televisivos com o fito de desconstruir o etarismo no Brasil, evitando realidades como a retratada em "O Senhor Estagiário".`,
    notaOficial: { geral: 1000, c1: 200, c2: 200, c3: 200, c4: 200, c5: 200 },
  },
  {
    id: 'calib_2025_caio',
    fonte: 'Cartilha Redação a Mil 8.0 (Poliedro/Lucas Felpi), cruzado com microdados INEP',
    candidato: 'Caio Braga',
    tema: 'Perspectivas acerca do envelhecimento na sociedade brasileira',
    ano: 2025,
    texto: `Em "O Karaíba", o autor indígena Daniel Munduruku traz narrativas dos povos originários no Brasil pré-cabralino. Nessa obra, ele retrata elementos característicos das culturas e dos costumes das comunidades tradicionais, como o respeito aos mais velhos e à sua sabedoria. Nesse contexto, é nítido que a perspectiva dos personagens do livro não reflete a forma como a sociedade brasileira enxergou o envelhecimento ao longo do tempo, tampouco as tendências mais modernas disso.

Historicamente, no Brasil, envelhecer é um privilégio, não um direito. Isso é evidenciado por estratégias de manutenção da ordem social implementadas pelas elites, como a promulgação da Lei do Sexagenário — uma das leis pré-abolicionistas, que libertava escravizados maiores de sessenta anos. Ao contrário do senso comum, que vê essa medida como uma conquista para eles, a historiografia entende que essa medida não tinha intenções reais de oferecer liberdade a essas pessoas, pois suas expectativas de vida eram baixíssimas. Nesse cenário, portanto, envelhecer não era uma oportunidade para todos os brasileiros, mas um privilégio de alguns.

Por outro lado, correntes contemporâneas de pensamento colocam os idosos e o envelhecimento em outras posições: de enfrentamento ao etarismo, de atividade física e econômica e de engajamento político e social. Um exemplo disso é o filme estrelado por Fernanda Montenegro, em 2025, "Vitória", em que a atriz interpreta uma senhora em uma comunidade periférica no Rio de Janeiro e expõe suas denúncias contra a violência e o tráfico onde vive. Sob essa óptica, a figura do idoso deixa um espaço de fragilidade e impotência e passa a assumir protagonismo de sua própria vida.

Dessa forma, tendo em vista as múltiplas perspectivas acerca do envelhecimento na sociedade brasileira, é necessário que o Ministério da Educação, por meio de iniciativas de capacitação e autonomia para idosos — como o "projeto envelhecer" do Cin-UFPE, que os ensina a conviver no ambiente digital — atue na formação dessas pessoas para que resgatem sua independência.`,
    notaOficial: { geral: 1000, c1: 200, c2: 200, c3: 200, c4: 200, c5: 200 },
  },
  {
    id: 'calib_2025_wellington',
    fonte: 'Cartilha Redação a Mil 8.0 (Poliedro/Lucas Felpi), cruzado com microdados INEP',
    candidato: 'Wellington Ribeiro',
    tema: 'Perspectivas acerca do envelhecimento na sociedade brasileira',
    ano: 2025,
    texto: `Na obra "Feliz aniversário", a escritora Clarice Lispector aborda, dentre outros aspectos, a realidade de exclusão vivenciada por grande parte dos idosos brasileiros, os quais, de acordo com a autora, só são lembrados por seus familiares em datas comemorativas. Ao transpor o viés literário, percebe-se a acentuação dessa problemática, a qual aborda a falta de perspectiva social perante o envelhecimento existente no Brasil contemporâneo. À vista desse conceito, é ideal analisar o passado nacional e o descaso governamental como desafios para a plena longevidade da sociedade.

Diante desse cenário, nota-se que a dificultosa promoção de um futuro digno à terceira idade advém de um processo de desenvolvimento nacional pautado na exclusão socioespacial. Isso pode ser constatado, de forma evidente, pois o país, desde o período do Brasil Colônia, foi construído por práticas violentas (como a promulgação da Lei dos Sexagenários), as quais visavam à marginalização de escravizados com mais de 60 anos em detrimento da inserção respeitosa dessa parcela da população no cotidiano brasileiro. Nesse sentido, essa atitude segregacionista mascara, há gerações, a necessidade de reverter esse revés e naturaliza, nos dias atuais, o silenciamento desenfreado dos idosos, produzindo culturalmente a ideia de inferioridade desse grupo. Assim, torna-se inegável o contínuo retrocesso da nação acerca do reconhecimento da velhice como importante e inevitável, à medida que a manutenção de raízes históricas degradantes existe.

Ademais, é fundamental ressaltar que a negligência estatal perpetua a aversão social ao inerente envelhecimento populacional. Essa questão se intensifica, na atualidade, ao passo que o Brasil não possui uma campanha nacional concreta e eficaz de estímulo à qualidade de vida da terceira idade. Tal panorama foi estudado pelo pesquisador Ruy Braga, o qual, a partir de uma perspectiva crítica voltada à realidade latino-americana, verbaliza que a ausência de um modelo assistencial inclusivo e socialmente comprometido permite o não reconhecimento dos idosos como integrantes ativos da sociedade. Sob essa ótica, o posicionamento do estudioso é válido, visto que políticas públicas ineficientes possibilitam a precarização do bem-estar da terceira idade, de modo a qualificar essa faixa etária como pouco importante para a edificação da nação - suprimindo o seu futuro salutar. Por isso, essa situação hostil precisa ser revertida.

É premente, portanto, uma medida que perpetue perspectivas positivas ao envelhecimento populacional. Logo, cabe ao Poder Executivo Federal — mais especificamente ao Ministério dos Direitos Humanos e da Cidadania — fomentar o respeito à terceira idade. Tal ação ocorrerá por meio da criação do "Projeto Nacional Vida Feliz", o qual engajará debates públicos — ministrados por idosos —, nos 5570 municípios brasileiros, a fim de desmistificar ideais advindos da colonização do Brasil e de protagonizar a atuação de pessoas idosas no combate direto e frontal à marginalização sofrida por elas, culminando na promoção da dignidade a essa parte da sociedade. Afinal, não é aceitável que, em um país democrático, a população envelhecida seja, como denunciado por Clarice, invisibilizada.`,
    notaOficial: { geral: 1000, c1: 200, c2: 200, c3: 200, c4: 200, c5: 200 },
  },
];
