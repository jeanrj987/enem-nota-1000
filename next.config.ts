import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (via pdfjs-dist) resolve seu worker por caminho de arquivo em
  // tempo de execução — precisa ficar fora do bundle do Turbopack/Webpack
  // para achar pdf.worker.mjs em node_modules normalmente.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
