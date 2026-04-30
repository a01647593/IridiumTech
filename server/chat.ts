import { GoogleGenAI } from '@google/genai';
import type { Server, Socket } from 'socket.io';
import { addLog, demoProfile } from './store.js';
import { findBestWhirlpoolManualMatch, getRecentChatMessages, insertChatMessages, verifySupabaseToken, getUserCourses, matchCourseDocumentsMultiple, type ChatMessageRow } from './supabase.js';
import UserCoursesTool from './tools/userCoursesTool.js';
import { extractTextFromPdfBuffer } from './pdfHelpers.js';

type ChatMessagePayload = {
  content?: string;
  token?: string;
  accessToken?: string;
  userId?: string;
  user_id?: string;
};

type ChatAck = {
  ok: boolean;
  error?: string;
  reply?: string;
  userId?: string;
  memoryMessages?: ChatMessageRow[];
};

const geminiApiKey = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY ?? '';
const geminiModel = process.env.GEMINI_MODEL ?? 'gemini-3-flash-preview';
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;
const whirlpoolFallbackMessage = 'Lo siento, como asistente de Whirlpool solo puedo ayudarte con temas relacionados a nuestros productos.';
const prohibitedBrandPattern = /\b(samsung|lg|daewoo)\b/i;

function extractToken(socket: Socket, payload: ChatMessagePayload): string {
  const authToken = typeof socket.handshake.auth?.accessToken === 'string' ? socket.handshake.auth.accessToken : '';
  const bearerToken = typeof socket.handshake.headers.authorization === 'string'
    ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, '')
    : '';
  return (payload.token ?? payload.accessToken ?? authToken ?? bearerToken).trim();
}

function buildGeminiHistory(memoryMessages: ChatMessageRow[], userMessage: string) {
  return [
    ...memoryMessages.map((message) => ({
      role: message.role === 'user' ? 'user' : 'model',
      parts: [{ text: message.content }]
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }]
    }
  ];
}

function formatTechnicalContext(contextText: string): string {
  return `Contexto técnico: ${contextText.trim()}`;
}

function buildSystemInstruction(technicalContext?: string): string {
  const baseInstruction =
    'Eres el asistente virtual de soporte para la Plataforma Adaptativa de Whirlpool. Puedes consultar información de cursos a los que el usuario está inscrito y procesar archivos adjuntos (por ejemplo, PDFs) mediante RAG o pasando el contenido directo al modelo. Tu función principal es ayudar a los usuarios a navegar por la plataforma, usar sus funciones y entender su interfaz y contenido de cursos al que tienen permiso de acceso.\n\nCuando uses contenido de cursos o PDFs, asegúrate de validar permisos del usuario y no exponer contenido de cursos privados para usuarios no autorizados.';

  if (!technicalContext) {
    return baseInstruction;
  }

  return `${baseInstruction}\n\n[CONTEXTO_DE_LA_PLATAFORMA]\n${formatTechnicalContext(technicalContext)}\n[/CONTEXTO_DE_LA_PLATAFORMA]\n\nINSTRUCCIONES:\n- Trata el bloque entre delimitadores como fuente relevante de verdad para la plataforma adaptativa.\n- Si requieres información sobre cursos del usuario, puedes invocar la función getUserCourses (está disponible como tool) o solicitar que se adjunte el PDF para ingesta/RAG.\n- Antes de incluir contenido de curso en el prompt, valida que el usuario está inscrito en el curso correspondiente.\n- No inventes ni adivines sobre contenido que no esté en el contexto o en los documentos ingeridos.`;
}

async function generateGeminiReply(memoryMessages: ChatMessageRow[], userMessage: string, technicalContext?: string): Promise<string> {
  if (!ai) {
    throw new Error('Falta configurar GEMINI_API_KEY.');
  }

  const contents = buildGeminiHistory(memoryMessages, userMessage);

  // Prepare callable tools (server-side implementations)
  const userCoursesTool = new UserCoursesTool();

  // First generation: allow model to request tool call if needed
  const maxIterations = 2;
  let iteration = 0;
  let lastResponse: any = null;

  // The loop implements a simple AFC cycle: if model requests function calls, execute them and re-run.
  while (iteration < maxIterations) {
    const response = await ai.models.generateContent({
      model: geminiModel,
      contents,
      config: {
        systemInstruction: buildSystemInstruction(technicalContext),
        // Provide the tool object so the SDK can surface its function declaration
        tools: [userCoursesTool],
        automaticFunctionCalling: { maximumRemoteCalls: 1 }
      }
    });

    // If the model returned functionCalls, execute them via the tool's callTool
    // The SDK surface may include `functionCalls` on the response or in candidates
    const functionCalls = response.functionCalls ?? response.candidates?.[0]?.functionCalls ?? null;
    if (functionCalls && functionCalls.length > 0) {
      // Execute the tool
      const toolResultParts = await userCoursesTool.callTool(functionCalls);
      // Append the tool result as a user message (the SDK loop in dist does similar)
      contents.push({ role: 'user', parts: [{ text: toolResultParts.join('\n') }] });
      lastResponse = response;
      iteration++;
      continue; // re-run generation with tool output in context
    }

    // No function calls — return model text
    return response.text?.trim() || 'No pude generar una respuesta en este momento.';
  }

  // If we exhausted iterations, return last known text or fallback
  return lastResponse?.text?.trim() || 'No pude generar una respuesta en este momento.';
}

function validateGeminiReply(reply: string): string {
  const normalizedReply = reply.trim();
  if (!normalizedReply) {
    return whirlpoolFallbackMessage;
  }

  if (prohibitedBrandPattern.test(normalizedReply)) {
    return whirlpoolFallbackMessage;
  }

  if (!/\bwhirlpool\b/i.test(normalizedReply)) {
    return whirlpoolFallbackMessage;
  }

  return normalizedReply;
}

export function registerChatSocketHandlers(io: Server) {
  io.on('connection', (socket) => {
    socket.on('chat:message', async (payload: ChatMessagePayload, ack?: (response: ChatAck) => void) => {
      const content = typeof payload.content === 'string' ? payload.content.trim() : '';
      // Support inline PDF data (base64) sent with the message payload as `pdfBase64`.
      // If present, extract text and include it as additional technical context for RAG.
      let pdfText: string | undefined = undefined;
      try {
        if (payload && (payload as any).pdfBase64) {
          const base64 = String((payload as any).pdfBase64 || '').trim();
          if (base64) {
            const buf = Buffer.from(base64, 'base64');
            pdfText = await extractTextFromPdfBuffer(buf);
          }
        }
      } catch (err) {
        // if PDF extraction fails, log but continue — model will still have other context
        void addLog({ userId: demoProfile.id, level: 'warn', scope: 'chat', message: 'PDF extraction failed' });
      }
      if (!content) {
        const response = { ok: false, error: 'El mensaje está vacío.' } satisfies ChatAck;
        ack?.(response);
        socket.emit('chat:error', response);
        return;
      }

      try {
        const token = extractToken(socket, payload);
        const authUser = await verifySupabaseToken(token);
        const requestedUserId = (payload.userId ?? payload.user_id ?? '').trim();

        if (requestedUserId && requestedUserId !== authUser.id) {
          const response = { ok: false, error: 'El user_id del mensaje no coincide con el usuario autenticado.' } satisfies ChatAck;
          ack?.(response);
          socket.emit('chat:error', response);
          return;
        }

        const memoryMessages = await getRecentChatMessages(authUser.id, 10);
        
        // Get user's enrolled courses and search for relevant documents
        const userCourses = await getUserCourses(authUser.id);
        const courseIds = userCourses.map((c: any) => c.id).filter(Boolean);
        
        // Search vectorial course documents (if any available)
        let courseDocumentsContext = '';
        try {
          if (courseIds.length > 0) {
            const courseMatches = await matchCourseDocumentsMultiple(courseIds, content, 3, authUser.id);
            if (courseMatches.length > 0) {
              const docsText = courseMatches.map((m: any) => m.content || '').join('\n---\n').trim();
              if (docsText) {
                courseDocumentsContext = `\n[DOCUMENTOS DE CURSOS]\n${docsText}\n[/DOCUMENTOS DE CURSOS]`;
              }
            }
          }
        } catch (err) {
          // if course document search fails, log but continue with manual context
          void addLog({ userId: authUser.id, level: 'warn', scope: 'chat', message: 'Course document search failed' });
        }
        
        // Combine manual match + course documents + inline PDF text into technicalContext
        const technicalMatch = await findBestWhirlpoolManualMatch(content);
        const manualContext = technicalMatch?.content?.trim();
        const technicalContext = [manualContext, courseDocumentsContext, pdfText].filter(Boolean).join('\n\n');
        
        const reply = validateGeminiReply(await generateGeminiReply(memoryMessages, content, technicalContext || undefined));
        const persistedMessages = await insertChatMessages(authUser.id, [
          { role: 'user', content },
          { role: 'assistant', content: reply }
        ]);

        const response = {
          ok: true,
          reply,
          userId: authUser.id,
          memoryMessages: [...memoryMessages, ...persistedMessages]
        } satisfies ChatAck;

        ack?.(response);
        socket.emit('chat:response', response);

        void addLog({
          userId: authUser.id,
          level: 'info',
          scope: 'chat',
          message: `Mensaje de chat procesado para ${authUser.id} (${memoryMessages.length} mensajes de memoria)`
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo procesar el mensaje.';
        const response = { ok: false, error: message } satisfies ChatAck;
        ack?.(response);
        socket.emit('chat:error', response);

        void addLog({
          userId: demoProfile.id,
          level: 'error',
          scope: 'chat',
          message: message.slice(0, 120)
        });
      }
    });
  });
}