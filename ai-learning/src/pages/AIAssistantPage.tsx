import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ThinkingIndicator from '../components/ThinkingIndicator';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const sanitizeEnvValue = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^['"]|['"]$/g, '');
};

const geminiApiKey =
  sanitizeEnvValue((import.meta as { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY) ||
  '';
const geminiModel =
  sanitizeEnvValue((import.meta as { env?: Record<string, string> }).env?.VITE_GEMINI_MODEL) ||
  'gemini-2.5-flash';

const geminiModelFallbacks = [geminiModel, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

async function generateAssistantReply(history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>) {
  if (!ai) {
    throw new Error('Falta configurar la API key de Gemini.');
  }

  const uniqueModels = Array.from(new Set(geminiModelFallbacks.filter(Boolean)));
  let lastError: unknown = null;

  for (const model of uniqueModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: history,
        config: {
          systemInstruction: 'Eres el asistente virtual de soporte para la nueva Plataforma Adaptativa de Whirlpool. Tu ÚNICA función es ayudar a los usuarios a navegar por esta plataforma, usar sus funciones y entender su interfaz. Tu ÚNICA fuente de verdad es el texto proporcionado bajo la etiqueta [CONTEXTO DE LA PLATAFORMA]. Si el usuario pregunta algo que no está en ese contexto (incluso si es sobre electrodomésticos Whirlpool, reparaciones, o temas externos), tienes estrictamente prohibido inventar o adivinar. Responde siempre: Lo siento, solo puedo ayudarte con dudas sobre el uso y las funciones de esta plataforma adaptativa.'
        }
      });

      return response.text?.trim() || 'Lo siento, no pude procesar tu solicitud en este momento.';
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!/503|UNAVAILABLE|high demand/i.test(message)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('No se pudo contactar con Gemini en este momento.');
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hola, soy el bot de Ingeniería de Whirlpool. ¿En qué puedo ayudarte hoy con tus procesos o aprendizaje de IA?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    if (!ai) {
      const missingKeyMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Falta configurar la API key de Gemini. Agrega GEMINI_API_KEY o VITE_GEMINI_API_KEY en tu archivo .env y reinicia el servidor.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, missingKeyMessage]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    const assistantMessageId = (Date.now() + 1).toString();

    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }
    ]);
    setInput('');
    setIsTyping(true);

    try {
      // Prepare history for Gemini
      const history = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      // Add current message
      history.push({
        role: 'user',
        parts: [{ text: input }]
      });

      const finalText = await generateAssistantReply(history);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                content: finalText
              }
            : message
        )
      );
    } catch (error) {
      console.error("Gemini API Error:", error);
      const errorMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: "Hubo un error al conectar con el servicio de IA. Por favor, intenta de nuevo más tarde.",
        timestamp: new Date()
      };
      setMessages((prev) =>
        prev.map((message) => (message.id === assistantMessageId ? errorMessage : message))
      );
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50">
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 no-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6 pb-32">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-3`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm text-primary">
                  <span className="material-symbols-outlined text-[18px] material-symbols-fill">smart_toy</span>
                </div>
              )}
              <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user' 
                ? 'bg-primary text-white' 
                : 'bg-white border border-slate-200 text-on-surface'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-slate prose-sm sm:prose-base max-w-none prose-headings:text-on-surface prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-on-surface prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-table:text-sm prose-table:my-0 prose-th:bg-slate-50 prose-th:font-bold prose-th:text-slate-700 prose-td:align-top prose-td:text-slate-700 prose-code:text-primary prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-md prose-pre:bg-slate-950 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:border prose-pre:border-slate-200 prose-pre:p-4 prose-blockquote:border-primary/30 prose-blockquote:text-slate-600">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1>{children}</h1>,
                        h2: ({ children }) => <h2>{children}</h2>,
                        h3: ({ children }) => <h3>{children}</h3>,
                        p: ({ children }) => <p>{children}</p>,
                        ul: ({ children }) => <ul>{children}</ul>,
                        ol: ({ children }) => <ol>{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        strong: ({ children }) => <strong>{children}</strong>,
                        em: ({ children }) => <em>{children}</em>,
                        code: ({ className, children, ...props }: any) =>
                          <code className={className} {...props}>
                            {children}
                          </code>,
                        blockquote: ({ children }) => <blockquote>{children}</blockquote>,
                        table: ({ children }) => <table>{children}</table>,
                        thead: ({ children }) => <thead>{children}</thead>,
                        tbody: ({ children }) => <tbody>{children}</tbody>,
                        tr: ({ children }) => <tr>{children}</tr>,
                        th: ({ children }) => <th>{children}</th>,
                        td: ({ children }) => <td>{children}</td>,
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noreferrer">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
                <p className={`text-[10px] mt-2 font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-white/60' : 'text-slate-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isTyping && <ThinkingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="fixed bottom-0 right-0 w-full lg:w-[calc(100%-16rem)] bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-10 pb-6 sm:pb-10 px-4 sm:px-8 z-30">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 flex items-center p-1 sm:p-2 group focus-within:ring-2 focus-within:ring-primary transition-all">
            <button className="p-2 sm:p-4 text-slate-400 hover:text-primary rounded-xl hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined">attach_file</span>
            </button>
            <textarea 
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 py-3 sm:py-4 px-2 resize-none h-12 sm:h-14 max-h-40 font-medium placeholder:text-slate-400 text-sm sm:text-base" 
              placeholder="Pregúntale al bot de Ingeniería..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            ></textarea>
            <div className="flex gap-2 pr-1 sm:pr-2">
              <button 
                onClick={handleSend}
                className="bg-primary text-white w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined material-symbols-fill text-lg sm:text-xl">send</span>
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-widest">
            GIT Labs AI Assistant • Whirlpool Proprietary Information
          </p>
        </div>
      </div>
    </div>
  );
}
