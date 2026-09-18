import type { Metadata } from 'next';
import { Newsreader, Karla } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { urlDoSite } from '@/lib/site';
import { Medicao } from '@/components/analytics/Medicao';

// Serifada para o enunciado (é assim que uma prova é impressa) e humanista
// para leitura corrida. Sobreviveram à troca de identidade visual; só a
// paleta mudou. A manuscrita (Caveat) foi removida em 18/09 junto com o
// último utilitário CSS que a usava (.fonte-manuscrita, ver ADR 035).
const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
});

const karla = Karla({
  subsets: ['latin'],
  variable: '--font-karla',
});

const TITULO = 'Nota 1000 | Correção de Redações do ENEM';
const DESCRICAO =
  'Plataforma de alta precisão calibrada na Matriz Oficial do ENEM (INEP). Receba correção detalhada pelas 5 competências, erros destacados no texto e versão reescrita nota 1000 em segundos.';

export const metadata: Metadata = {
  // Sem `metadataBase` o link colado no WhatsApp ou no Instagram sai sem card
  // de preview: as URLs relativas de imagem não têm como virar absolutas.
  metadataBase: new URL(urlDoSite()),
  title: TITULO,
  description: DESCRICAO,
  keywords: [
    'redação enem',
    'corretor de redação',
    'nota 1000 enem',
    'competencias enem',
    'inep',
    'estudos enem',
  ],
  authors: [{ name: 'Nota 1000' }],
  // O domínio da Vercel responde o mesmo conteúdo do domínio próprio. O
  // canônico diz ao buscador qual dos dois indexar, para a relevância não
  // ficar dividida entre os dois endereços.
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: 'Nota 1000',
    title: TITULO,
    description: DESCRICAO,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITULO,
    description: DESCRICAO,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${newsreader.variable} ${karla.variable} antialiased`}
    >
      <body className="min-h-screen bg-papel text-tinta flex flex-col fonte-humanista selection:bg-azul selection:text-folha">
        <AuthProvider>{children}</AuthProvider>
        {/* Depois do conteúdo e com `afterInteractive`: medição não pode
            atrasar a pintura da landing. Sem as variáveis configuradas, não
            renderiza nada. */}
        <Medicao />
      </body>
    </html>
  );
}
