import { useNavigate } from 'react-router-dom';

export default function HelpPage() {
  const navigate = useNavigate();
  const faqs = [
    { q: "¿Qué es una 'Gema'?", a: "En Whirlpool, una Gema es un prompt de IA optimizado y validado por expertos que ayuda a automatizar tareas específicas." },
    { q: "¿Cómo obtengo acceso a GIT Labs?", a: "El acceso es automático para todos los empleados de Whirlpool a través de SSO. Tus permisos dependen de tu área funcional." },
    { q: "¿Puedo compartir mis propios prompts?", a: "¡Sí! Ve a la Biblioteca de Prompts y haz clic en 'Compartir Gema'. Tu propuesta será revisada por el equipo de GIT Labs." },
    { q: "¿Los cursos tienen certificación?", a: "Sí, al completar el 100% de un curso y aprobar el quiz final, recibirás una insignia digital en tu perfil." }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative py-12 sm:py-24 px-6 sm:px-12 overflow-hidden text-center bg-white border-b border-slate-100">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-on-surface mb-4">Centro de Ayuda</h2>
        <p className="text-base sm:text-xl text-slate-500 font-medium mb-8 sm:mb-12">Resuelve tus dudas sobre la plataforma y la adopción de IA en Whirlpool.</p>
        <div className="max-w-2xl mx-auto relative">
          <input className="w-full h-14 sm:h-16 bg-slate-100 border-none rounded-2xl px-6 sm:px-8 text-base sm:text-lg focus:ring-2 focus:ring-primary" placeholder="¿En qué podemos ayudarte?" />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-sm sm:text-base">Buscar</button>
        </div>
      </section>

      <section className="px-6 sm:px-12 py-12 sm:py-16 max-w-6xl mx-auto space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-primary transition-all group">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-3xl">forum</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Chat con Soporte</h3>
            <p className="text-slate-500 text-sm mb-6">Habla con un experto del equipo GIT Labs en tiempo real.</p>
            <button 
              onClick={() => navigate('/assistant')}
              className="text-primary font-bold flex items-center gap-2 hover:underline"
            >
              Iniciar chat <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-primary transition-all group">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-3xl">menu_book</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Documentación</h3>
            <p className="text-slate-500 text-sm mb-6">Guías detalladas sobre el uso de Gemini y mejores prácticas.</p>
            <button className="text-primary font-bold flex items-center gap-2 hover:underline">Ver guías <span className="material-symbols-outlined text-sm">arrow_forward</span></button>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-primary transition-all group">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-3xl">mail</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Email Support</h3>
            <p className="text-slate-500 text-sm mb-6">Soporte técnico vía correo para consultas complejas.</p>
            <button className="text-primary font-bold flex items-center gap-2 hover:underline">Enviar ticket <span className="material-symbols-outlined text-sm">arrow_forward</span></button>
          </div>
        </div>

        <div className="space-y-8">
          <h3 className="text-2xl font-bold text-on-surface text-center">Preguntas Frecuentes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-lg mb-2 text-primary">{faq.q}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-primary rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">¿No encuentras lo que buscas?</h3>
            <p className="text-white/80 text-lg">Prueba nuestra Gema de Soporte, entrenada con toda la base de conocimientos de Whirlpool.</p>
          </div>
          <button 
            onClick={() => navigate('/assistant')}
            className="px-8 py-4 bg-white text-primary font-bold rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">smart_toy</span> Hablar con la Gema
          </button>
        </div>
      </section>
    </div>
  );
}
