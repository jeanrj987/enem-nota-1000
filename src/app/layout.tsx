import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
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
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable} dark antialiased`}>
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
