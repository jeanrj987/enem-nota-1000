import jsPDF from 'jspdf';
import { Correcao, Redacao } from '@/types';

/**
 * Gera e baixa o relatório em PDF de uma correção. Extraído de CorrecaoView
 * para isolar a lógica de geração de documento (sem JSX) do componente visual.
 */
export function exportarCorrecaoParaPDF(correcao: Correcao, redacao: Redacao): void {
  const doc = new jsPDF();
  let y = 20;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text('Relatório Oficial de Correção ENEM - Nota 1000 AI', 14, y);
  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Data: ${new Date(correcao.created_at).toLocaleDateString('pt-BR')} | Tema: ${redacao.tema}`, 14, y);
  y += 12;

  // Nota Geral
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, 182, 22, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(37, 99, 235);
  doc.text(`NOTA FINAL: ${correcao.nota_geral} / 1000 PONTOS`, 20, y + 14);
  y += 30;

  // Competências
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Desempenho por Competência:', 14, y);
  y += 8;

  correcao.competencias.forEach((comp) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(`${comp.nome}: ${comp.nota} / 200 pts`, 14, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const splitComment = doc.splitTextToSize(comp.comentario, 180);
    doc.text(splitComment, 14, y);
    y += splitComment.length * 4.5 + 4;
  });

  // Feedback Pedagógico
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Feedback Pedagógico e Próximos Passos:', 14, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const splitFeedback = doc.splitTextToSize(correcao.feedback_pedagogico, 180);
  doc.text(splitFeedback, 14, y);

  doc.save(`correcao-enem-${redacao.id}.pdf`);
}
