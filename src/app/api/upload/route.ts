import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

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
      try {
        // Extração de texto de PDF compatível com Next.js Serverless
        // Fallback e parsing de streams de texto de PDF
        const rawString = buffer.toString('latin1');
        const textStreams: string[] = [];
        
        // Regex para capturar blocos BT (Begin Text) ... ET (End Text) em PDFs
        const streamRegex = /BT[\s\S]*?ET/g;
        let match;
        while ((match = streamRegex.exec(rawString)) !== null) {
          const block = match[0];
          // Capturar texto dentro de parênteses (ex: (Texto aqui) Tj)
          const textMatches = block.match(/\((.*?)\)/g);
          if (textMatches) {
            const line = textMatches
              .map((m) => m.slice(1, -1))
              .join('')
              .replace(/\\([()\\])/g, '$1');
            if (line.trim()) {
              textStreams.push(line);
            }
          }
        }

        if (textStreams.length > 0) {
          extractedText = textStreams.join('\n');
        } else {
          // Fallback para caracteres textuais limpos do buffer
          extractedText = buffer
            .toString('utf-8')
            .replace(/[^\x20-\x7E\n\r\táàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ]/g, ' ')
            .replace(/\s+/g, ' ');
        }
      } catch (pdfErr) {
        console.error('Erro na extração de texto do PDF:', pdfErr);
        extractedText = buffer
          .toString('utf-8')
          .replace(/[^\x20-\x7E\n\r\táàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ]/g, ' ');
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
