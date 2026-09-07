import type { Metadata } from 'next';
import { Newsreader, Karla, Caveat } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

// Identidade "caderno & caneta vermelha": serifada para o enunciado (é assim
// que uma prova é impressa), humanista para leitura corrida e manuscrita
// reservada às anotações do corretor.
const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
});

const karla = Karla({
  subsets: ['latin'],
  variable: '--font-karla',
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
});

export const metadata: Metadata = {
  title: 'Nota 1000 AI | Correção de Redações do ENEM com Inteligência Artificial',
  description:
    'Plataforma de alta precisão calibrada na Matriz Oficial do ENEM (INEP). Receba correção detalhada pelas 5 competências, erros destacados no texto e versão reescrita nota 1000 em segundos.',
  keywords: [
    'redação enem',
    'corretor de redação',
    'inteligencia artificial enem',
    'nota 1000 enem',
    'competencias enem',
    'inep',
    'estudos enem',
  ],
  authors: [{ name: 'Nota 1000 AI' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${newsreader.variable} ${karla.variable} ${caveat.variable} antialiased`}
    >
      <body className="min-h-screen bg-papel text-tinta flex flex-col fonte-humanista selection:bg-vermelho selection:text-folha">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
