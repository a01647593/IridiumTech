import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const geminiApiKey =
  (import.meta as { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY ||
  (process.env as { GEMINI_API_KEY?: string }).GEMINI_API_KEY ||
  '';

const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hola, soy la Gema de Ingeniería de Whirlpool. ¿En qué puedo ayudarte hoy con tus procesos o aprendizaje de IA?',
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

    setMessages(prev => [...prev, userMessage]);
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

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: history,
        config: {
          systemInstruction: "Eres la 'Gema de Ingeniería' de Whirlpool, un asistente experto en IA y procesos corporativos. Tu objetivo es ayudar a los empleados a optimizar sus flujos de trabajo, aprender sobre IA generativa y utilizar las herramientas de GIT Labs. Sé profesional, servicial y enfocado en la eficiencia técnica. Responde siempre en español.",
        }
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || "Lo siento, no pude procesar tu solicitud en este momento.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Hubo un error al conectar con el servicio de IA. Por favor, intenta de nuevo más tarde.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
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
                  <div className="text-sm sm:text-base leading-relaxed text-slate-700">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="text-lg sm:text-xl font-black text-on-surface mt-2 mb-3">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base sm:text-lg font-bold text-on-surface mt-2 mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm sm:text-base font-bold text-on-surface mt-2 mb-2">{children}</h3>,
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        strong: ({ children }) => <strong className="font-bold text-on-surface">{children}</strong>,
                        code: ({ children }) => <code className="px-1.5 py-0.5 rounded bg-slate-100 text-[13px] text-primary">{children}</code>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/30 pl-3 italic text-slate-600 my-2">{children}</blockquote>,
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2 hover:text-accent-blue">
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
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
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
              placeholder="Pregúntale a la Gema de Ingeniería..."
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
