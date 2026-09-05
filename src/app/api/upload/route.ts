import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name.toLowerCase();
    let extractedText = '';

    if (fileName.endsWith('.txt')) {
      extractedText = buffer.toString('utf-8');
    } else if (fileName.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (fileName.endsWith('.pdf')) {
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText({ pageJoiner: '\n\n' });
        extractedText = result.text;
      } finally {
        await parser.destroy();
      }

      if (!extractedText.trim()) {
        return NextResponse.json(
          {
            error:
              'Não encontramos texto selecionável neste PDF. Se a redação foi digitalizada como foto/scan (sem OCR), copie e cole o texto manualmente na área de produção textual.',
          },
          { status: 422 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Formato não suportado. Envie arquivos .txt, .pdf ou .docx' },
        { status: 400 }
      );
    }

    // Limpeza de quebras de linha excessivas
    extractedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!extractedText || extractedText.length < 5) {
      return NextResponse.json(
        { error: 'Não foi possível extrair texto legível do documento fornecido.' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      text: extractedText,
    });
  } catch (error: any) {
    console.error('Erro na extração de texto do arquivo:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao processar arquivo.' },
      { status: 500 }
    );
  }
}
