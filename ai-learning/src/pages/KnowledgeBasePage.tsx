import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const FAQS = [
  {
    question: '¿Qué es GIT Labs AI?',
    answer: 'GIT Labs AI es la plataforma centralizada de Whirlpool para el aprendizaje y adopción de Inteligencia Artificial. Aquí encontrarás cursos, prompts validados y un asistente inteligente para potenciar tu trabajo diario.'
  },
  {
    question: '¿Cómo puedo compartir un prompt o gema?',
    answer: 'Puedes compartir tus prompts en la sección "Biblioteca de Gemas" haciendo clic en "Compartir Gema". Tu propuesta será revisada por el equipo de GIT Labs antes de ser publicada para toda la organización.'
  },
  {
    question: '¿Qué modelos de IA están disponibles?',
    answer: 'Actualmente la plataforma se integra principalmente con Gemini de Google, pero también ofrecemos capacitación en otros modelos generativos y arquitecturas neuronales avanzadas.'
  },
  {
    question: '¿Cómo se calculan los puntos (XP)?',
    answer: 'Ganas XP completando módulos (+20 XP), aprobando quizzes con 100% (+100 XP), o manteniendo rachas de actividad diaria (+30 XP).'
  },
  {
    question: '¿Quién puede ver mi progreso?',
    answer: 'Tu progreso es visible para ti y para los administradores de GIT Labs para fines de métricas de adopción. Los líderes de área pueden ver reportes agregados por departamento.'
  }
];

export default function KnowledgeBasePage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = FAQS.filter(f => 
    f.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto space-y-12">
      <header className="text-center space-y-6">
        <h1 className="text-4xl font-black text-primary tracking-tight">Centro de Conocimiento</h1>
        <p className="text-slate-500 font-medium max-w-xl mx-auto">
          Encuentra respuestas rápidas y guías de autogestión para aprovechar al máximo las herramientas de IA en Whirlpool.
        </p>
        
        <div className="relative max-w-2xl mx-auto">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input 
            type="text" 
            placeholder="¿En qué podemos ayudarte hoy?"
            className="w-full h-16 pl-12 pr-6 bg-white border border-slate-200 rounded-[2rem] shadow-xl shadow-slate-200/50 focus:ring-2 focus:ring-primary transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-on-surface mb-8 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">quiz</span> Preguntas Frecuentes
        </h2>
        
        <div className="space-y-4">
          {filteredFaqs.map((faq, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full p-6 text-left flex justify-between items-center hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-on-surface">{faq.question}</span>
                <span className={`material-symbols-outlined transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
              {openIndex === i && (
                <div className="px-6 pb-6 text-sm text-slate-500 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                  {faq.answer}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-primary rounded-[2.5rem] p-8 text-white shadow-xl shadow-primary/20">
          <h3 className="text-xl font-bold mb-4">¿No encuentras lo que buscas?</h3>
          <p className="text-white/70 text-sm mb-8 leading-relaxed">
            Nuestro asistente inteligente está entrenado con toda la documentación de GIT Labs para ayudarte en tiempo real.
          </p>
          <div className="mb-8 rounded-2xl bg-white/10 border border-white/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Apoyo directo</p>
            <p className="text-sm font-bold text-white">soporte.gitlabs@whirlpool.com</p>
            <p className="text-sm font-bold text-white mt-1">+52 81 1234 5678</p>
            <p className="text-xs text-white/70 mt-1">Atención de lunes a viernes, de 10:00 a 18:00.</p>
          </div>
          <button 
            onClick={() => navigate('/assistant')}
            className="w-full py-4 bg-white text-primary font-bold rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">smart_toy</span> Hablar con la Gema
          </button>
        </div>
        
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-on-surface mb-4">Recursos Externos</h3>
          <div className="space-y-3">
            {[
              { label: 'Documentación Gemini API', icon: 'link' },
              { label: 'Whirlpool Brand Guidelines', icon: 'description' },
              { label: 'Políticas de Seguridad IT', icon: 'security' },
            ].map((link, i) => (
              <a key={i} href="#" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">{link.icon}</span>
                  <span className="text-sm font-bold text-slate-600">{link.label}</span>
                </div>
                <span className="material-symbols-outlined text-slate-300 text-sm">open_in_new</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
