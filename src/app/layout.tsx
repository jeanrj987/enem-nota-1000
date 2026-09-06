import type { Metadata } from 'next';
import { Inter, Outfit, Anton, Barlow } from 'next/font/google';
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
      className={`${inter.variable} ${outfit.variable} ${anton.variable} ${barlow.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
