import { LayoutDashboard, PenTool, TrendingUp } from 'lucide-react';

/**
 * Os destinos da área logada, numa fonte só.
 *
 * Existe porque passaram a ter dois consumidores com regras diferentes: o
 * `Navbar` (que acrescenta "Início" e marca o que exige plano) e o header da
 * landing, que mostra esta lista ao cliente pagante que cai na página de
 * vendas (ADR 047). Duas cópias divergiriam na primeira rota nova, e a que
 * ficaria desatualizada é justamente a menos visitada.
 *
 * `exigePlano` é lido pelo `Navbar` para decidir cadeado e destino. Na
 * landing a lista só aparece para quem já tem plano, então lá o campo é
 * verdadeiro por construção e não precisa ser consultado.
 */
export const DESTINOS_DO_APP = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exigePlano: true },
  { href: '/nova-redacao', label: 'Nova Redação', icon: PenTool, exigePlano: false },
  { href: '/historico', label: 'Histórico & Evolução', icon: TrendingUp, exigePlano: true },
] as const;
