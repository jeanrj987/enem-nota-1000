import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-papel text-tinta">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-azul">Erro 404</p>
        <h1 className="mt-2 fonte-serifada text-3xl font-bold sm:text-4xl">Essa página não existe</h1>
        <p className="mt-3 max-w-md text-sm text-tinta-fraca">
          O endereço que você tentou acessar não existe ou foi movido. Volte para a página inicial
          ou continue de onde parou.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-azul px-6 py-3 font-bold text-sm text-white shadow-[0_12px_35px_rgba(79,140,255,0.25)] hover:brightness-110 transition"
        >
          Voltar para a home
        </Link>
      </main>

      <Footer />
    </div>
  );
}
