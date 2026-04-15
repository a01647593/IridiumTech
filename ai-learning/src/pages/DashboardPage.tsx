import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MOCK_COURSES, MOCK_PROMPTS } from '../constants';
import { User } from '../types';

interface DashboardPageProps {
  user: User;
}

export default function DashboardPage({ user }: DashboardPageProps) {
  const navigate = useNavigate();
  
  const pendingCourses = MOCK_COURSES.filter(c => c.progress > 0 && c.progress < 100);
  const recommendedCourses = MOCK_COURSES.filter(c => c.progress === 0 && (c.area === user.area || c.area === 'General')).slice(0, 4);

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-primary tracking-tight">Mi Tablero de Aprendizaje</h1>
          <p className="text-slate-500 mt-2 font-medium">Hola, {user.name.split(' ')[0]}. Tienes {pendingCourses.length} cursos pendientes por completar.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button onClick={() => navigate('/assistant')} className="px-6 py-3 bg-white border border-slate-200 text-on-surface font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-primary">smart_toy</span> <span className="whitespace-nowrap">Asistente IA</span>
          </button>
          <button onClick={() => navigate('/courses')} className="px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">school</span> <span className="whitespace-nowrap">Explorar Cursos</span>
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">emoji_events</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mi Score</p>
            <p className="text-2xl font-black text-on-surface">{user.score} XP</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl material-symbols-fill">local_fire_department</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Racha Actual</p>
            <p className="text-2xl font-black text-on-surface">{user.streak} Días</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">task_alt</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completados</p>
            <p className="text-2xl font-black text-on-surface">{user.completedCourses.length}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">workspace_premium</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Insignias</p>
            <p className="text-2xl font-black text-on-surface">{user.badges.length}</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Learning Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Continue Learning */}
          <section>
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-xl font-bold text-on-surface">Continuar Aprendiendo</h2>
              <Link to="/courses" className="text-primary text-xs font-bold hover:underline">Ver todos</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingCourses.map((course, i) => (
                <motion.div 
                  key={course.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all group"
                >
                  <div className="h-32 relative overflow-hidden">
                    <img src={course.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-6">
                      <span className="px-2 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-md border border-white/20">
                        {course.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-on-surface mb-4 truncate">{course.title}</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Progreso</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          className="h-full bg-primary"
                        ></motion.div>
                      </div>
                      <button 
                        onClick={() => navigate(`/courses/${course.id}`)}
                        className="w-full py-3 bg-slate-50 text-primary font-bold text-xs rounded-xl group-hover:bg-primary group-hover:text-white transition-all"
                      >
                        Continuar
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Recommended for your area */}
          <section>
            <h2 className="text-xl font-bold text-on-surface mb-6">Recomendado para {user.area}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendedCourses.map((course, i) => (
                <motion.div 
                  key={course.id}
                  whileHover={{ y: -5 }}
                  className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex gap-4 items-center"
                >
                  <img src={course.thumbnail} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-on-surface truncate">{course.title}</h4>
                    <p className="text-xs text-slate-500 mb-3">{course.duration} • {course.level}</p>
                    <button 
                      onClick={() => navigate(`/courses/${course.id}`)}
                      className="text-primary text-xs font-bold hover:underline"
                    >
                      Ver Detalles
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-8">
          {/* Quick Assistant */}
          <section className="bg-primary rounded-[2.5rem] p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <h3 className="text-xl font-bold mb-4 relative z-10">Asistente GIT Labs</h3>
            <p className="text-white/70 text-sm mb-6 leading-relaxed relative z-10">
              ¿Tienes dudas sobre cómo aplicar IA en {user.area}? Pregúntame ahora.
            </p>
            <button 
              onClick={() => navigate('/assistant')}
              className="w-full py-4 bg-white text-primary font-bold rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 relative z-10"
            >
              <span className="material-symbols-outlined">smart_toy</span> Iniciar Chat
            </button>
          </section>

          {/* Area Prompts */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-on-surface mb-6">Gemas de {user.area}</h3>
            <div className="space-y-4">
              {MOCK_PROMPTS.filter(p => p.area === user.area).slice(0, 2).map(prompt => (
                <div key={prompt.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group cursor-pointer hover:border-primary/30 transition-all">
                  <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{prompt.title}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Impacto: {prompt.impact}</p>
                </div>
              ))}
              <button 
                onClick={() => navigate('/prompts')}
                className="w-full py-3 text-primary text-xs font-bold hover:underline"
              >
                Explorar Biblioteca
              </button>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-on-surface mb-6">Actividad Reciente</h3>
            <div className="space-y-6">
              {[
                { label: 'Quiz Completado', time: 'Hace 2 horas', icon: 'task_alt', color: 'text-green-500' },
                { label: 'Gema Guardada', time: 'Ayer', icon: 'bookmark', color: 'text-blue-500' },
                { label: 'Curso Iniciado', time: 'Hace 3 días', icon: 'play_circle', color: 'text-amber-500' },
              ].map((act, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center ${act.color}`}>
                    <span className="material-symbols-outlined text-sm">{act.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{act.label}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
