import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import whirlpoolLogo from '../assets/logowhirlpool.png';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      {/* Hero Section */}
      <section className="relative py-20 px-6 sm:px-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 skew-x-[-12deg] translate-x-1/4 z-0"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-2xl bg-primary/5 border border-primary/10 text-primary text-xs font-black tracking-widest uppercase">
              GIT Labs Innovation Hub
            </div>
            <h1 className="text-5xl sm:text-7xl font-black text-on-surface leading-[1.1] tracking-tight">
              Impulsando el Futuro con <span className="text-primary">IA Generativa</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl">
              Bienvenido a la plataforma oficial de adopción de IA de Whirlpool. 
              Capacítate, comparte gemas y transforma tu productividad diaria.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
              >
                Ir a mi Tablero <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <button 
                onClick={() => navigate('/courses')}
                className="px-8 py-4 bg-white border border-slate-200 text-on-surface font-bold rounded-2xl hover:bg-slate-50 transition-all"
              >
                Explorar Cursos
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="aspect-square bg-gradient-to-br from-primary to-accent-blue rounded-[3rem] shadow-2xl overflow-hidden relative">
              <img 
                src="https://picsum.photos/seed/whirlpool-ai/800/800" 
                alt="Innovation" 
                className="w-full h-full object-cover mix-blend-overlay opacity-60"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/20">
                  <img 
                    src={whirlpoolLogo}
                    alt="Whirlpool" 
                    className="w-20 h-20 object-contain animate-pulse"
                  />
                </div>
              </div>
            </div>
            
            {/* Floating Stats */}
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Usuarios Activos</p>
              <p className="text-2xl font-black text-primary">+5,000</p>
            </div>
            <div className="absolute -top-6 -right-6 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gemas Compartidas</p>
              <p className="text-2xl font-black text-accent-blue">+1,200</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 sm:px-12 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-on-surface">Ecosistema de Aprendizaje Whirlpool</h2>
            <p className="text-slate-500 font-medium">Diseñado para escalar la innovación en todas las áreas del negocio.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Capacitación Continua', desc: 'Cursos especializados por área funcional, desde manufactura hasta finanzas.', icon: 'school', color: 'bg-blue-50 text-blue-600' },
              { title: 'Repositorio de Gemas', desc: 'Accede a prompts validados que ahorran horas de trabajo manual cada semana.', icon: 'auto_awesome', color: 'bg-amber-50 text-amber-600' },
              { title: 'Asistente Inteligente', desc: 'Soporte 24/7 basado en Gemini para resolver dudas sobre procesos internos.', icon: 'smart_toy', color: 'bg-green-50 text-green-600' },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm"
              >
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-8`}>
                  <span className="material-symbols-outlined text-3xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-4">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
