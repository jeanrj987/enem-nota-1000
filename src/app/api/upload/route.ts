import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { GoogleGenAI } from '@google/genai';
import { checarRateLimit, obterIpCliente } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PAGINAS_OCR = 5;
const MAX_TAMANHO_ARQUIVO_BYTES = 10 * 1024 * 1024; // 10MB
const LIMITE_UPLOADS = 15;
const JANELA_UPLOADS_MS = 10 * 60 * 1000; // 10 minutos

/**
 * OCR de último recurso para PDFs sem texto selecionável (foto/scan de
 * redação manuscrita): renderiza as páginas como imagem via pdf-parse e pede
 * transcrição literal ao Gemini. Retorna string vazia se não houver chave
 * configurada ou se o modelo não conseguir transcrever nada.
 */
async function extrairTextoViaOCR(buffer: Buffer): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'sua-chave-gemini-aqui') {
    return '';
  }

  const parser = new PDFParse({ data: buffer });
  let paginas: Uint8Array[];
  try {
    const screenshot = await parser.getScreenshot({ scale: 2, first: MAX_PAGINAS_OCR });
    paginas = screenshot.pages.map((p) => p.data).filter((d): d is Uint8Array => !!d);
  } finally {
    await parser.destroy();
  }

  if (paginas.length === 0) return '';

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'Transcreva literalmente o texto manuscrito ou impresso nas imagens a seguir, que são páginas de uma redação escolar. Preserve a divisão em parágrafos. Não corrija erros de português, não resuma, não comente — apenas transcreva exatamente o que está escrito. Se não conseguir ler algum trecho com confiança, indique com [ilegível] naquele ponto.',
            },
            ...paginas.map((data) => ({
              inlineData: { mimeType: 'image/png', data: Buffer.from(data).toString('base64') },
            })),
          ],
        },
      ],
      config: { temperature: 0 },
    });

    return response.text?.trim() || '';
  } catch (ocrError) {
    console.error('OCR de PDF via Gemini falhou:', ocrError);
    return '';
  }
}

export async function POST(req: NextRequest) {
  // Autenticação antes do rate limit e antes de ler o corpo: um PDF sem texto
  // selecionável dispara OCR por visão, que custa por chamada. Sem esta
  // barreira, qualquer pessoa da internet consegue gastar essa cota, e o
  // limite por IP não segura quem troca de IP. A tela já exigia login —
  // era a rota por baixo que estava aberta.
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json(
      { error: 'É necessário estar logado para enviar um arquivo.' },
      { status: 401 }
    );
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Autenticação não está configurada.' }, { status: 503 });
  }
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Sessão inválida. Faça login novamente.' }, { status: 401 });
  }

  // O limite passa a ser por usuário, não por endereço: quem quiser abusar
  // precisa criar contas, o que deixa rastro. O IP entra só como reserva
  // caso o identificador do usuário venha vazio.
  const ip = obterIpCliente(req);
  const rate = checarRateLimit(
    `upload:${userData.user.id || ip}`,
    LIMITE_UPLOADS,
    JANELA_UPLOADS_MS
  );

  if (!rate.permitido) {
    return NextResponse.json(
      {
        error: `Limite de envios de arquivo atingido. Tente novamente em ${Math.ceil(
          (rate.resetEm - Date.now()) / 1000 / 60
        )} minuto(s).`,
      },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rate.resetEm - Date.now()) / 1000)) } }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    if (file.size > MAX_TAMANHO_ARQUIVO_BYTES) {
      return NextResponse.json(
        { error: `Arquivo excede o limite de ${MAX_TAMANHO_ARQUIVO_BYTES / (1024 * 1024)}MB.` },
        { status: 413 }
      );
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
        // PDF sem texto selecionável (foto/scan) — tenta OCR via visão do Gemini.
        extractedText = await extrairTextoViaOCR(buffer);

        if (!extractedText.trim()) {
          return NextResponse.json(
            {
              error:
                'Não encontramos texto selecionável neste PDF, e não foi possível transcrevê-lo automaticamente (verifique se a chave do Gemini está configurada ou se a imagem está legível). Copie e cole o texto manualmente na área de produção textual.',
            },
            { status: 422 }
          );
        }
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
