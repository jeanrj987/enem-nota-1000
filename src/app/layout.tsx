import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ProvaSocialToast } from '@/components/ProvaSocialToast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NOTA 1000 PRO • Matriz Oficial ENEM 2026',
  description:
    'Simulador Oficial e Avaliação Anatômica de Redações ENEM pelas 5 Competências do INEP. Acesso à nota oficial, diagnóstico e versão Nota 1000 reescrita.',
  keywords: [
    'redação enem',
    'corretor de redação',
    'nota 1000 enem',
    'competencias enem inep',
    'banca oficial inep',
    'estudos enem 2026',
    'simulador sisu',
  ],
  authors: [{ name: 'Nota 1000 PRO' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-[#02040a] text-slate-100 flex flex-col font-sans selection:bg-cyan-400 selection:text-black relative">
        {children}
        <ProvaSocialToast />
      </body>
    </html>
  );
}
