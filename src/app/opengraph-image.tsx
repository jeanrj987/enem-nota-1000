import { ImageResponse } from 'next/og';

/**
 * Card de preview do link (WhatsApp, Instagram, X, LinkedIn). Gerado em build
 * pelo Next — não é arquivo de imagem no repositório — e serve tanto para
 * Open Graph quanto para o Twitter Card, que herda esta imagem.
 *
 * Cores escritas em hexadecimal, e não nos tokens do Tailwind: isto roda no
 * Satori (o renderizador do `next/og`), que não enxerga o `globals.css`. Se a
 * paleta mudar, este arquivo precisa mudar junto — ver a identidade "V2 dark"
 * na nota de design system do Vault.
 */

export const alt = 'Nota 1000 — correção de redações do ENEM pelas 5 competências';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PAPEL = '#070b14';
const FOLHA = '#101827';
const TINTA = '#f8fafc';
const TINTA_SUAVE = '#b8c4d6';
const REGUA = '#223047';
const AZUL = '#4f8cff';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: PAPEL,
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 16,
              background: AZUL,
              color: '#ffffff',
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            N1
          </div>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, color: TINTA }}>
            NOTA <span style={{ color: AZUL, marginLeft: 10 }}>1000</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 68,
              fontWeight: 800,
              color: TINTA,
              lineHeight: 1.1,
              letterSpacing: -2,
            }}
          >
            Descubra por que sua redação
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 68,
              fontWeight: 800,
              color: AZUL,
              lineHeight: 1.1,
              letterSpacing: -2,
            }}
          >
            não está chegando aos 900+
          </div>
          <div style={{ display: 'flex', fontSize: 28, color: TINTA_SUAVE }}>
            Correção detalhada pelos critérios do ENEM, erro a erro.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          {['C1', 'C2', 'C3', 'C4', 'C5'].map((competencia) => (
            <div
              key={competencia}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 92,
                height: 60,
                borderRadius: 14,
                background: FOLHA,
                border: `1px solid ${REGUA}`,
                color: TINTA_SUAVE,
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {competencia}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
