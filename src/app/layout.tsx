import type { Metadata } from 'next';
import { Inter, Outfit, Newsreader, Karla, Caveat, Anton, Barlow } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
});

// Identidade "caderno & caneta vermelha": serifada editorial para títulos,
// humanista para leitura corrida e manuscrita só para anotações de corretor.
const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-serifada',
});

const karla = Karla({
  subsets: ['latin'],
  variable: '--font-humanista',
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-manuscrita',
});

// Identidade "placar": condensada pesada para as notas (que são o herói da
// página de vendas) e uma grotesca esportiva para o restante da interface.
const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-placar',
});

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ui',
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
      className={`${inter.variable} ${outfit.variable} ${newsreader.variable} ${karla.variable} ${caveat.variable} ${anton.variable} ${barlow.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
