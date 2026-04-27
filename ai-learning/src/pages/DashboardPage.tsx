import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { listCourses } from '../lib/courseService';

interface DashboardPageProps {
  user: any;
}

export default function DashboardPage({ user }: DashboardPageProps) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await listCourses({ usuarioId: user?.id, soloActivos: true });
        setCourses(data);
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) loadDashboard();
  }, [user]);

  const pendingCourses = courses.filter(
    (c) => c.progreso?.porcentaje > 0 && c.progreso?.porcentaje < 100
  );

  const recommendedCourses = courses
    .filter((c) => c.progreso?.porcentaje === 0)
    .slice(0, 4);

  const completedCourses = courses.filter(
    (c) => c.progreso?.porcentaje === 100
  );

  const userScore = completedCourses.length * 150 + pendingCourses.length * 50;
  const userStreak = pendingCourses.length + 2;
  const userBadges = completedCourses.length;

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500 font-semibold">
        Cargando dashboard...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-primary tracking-tight">
            Mi Tablero de Aprendizaje
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Hola, {(user?.name || user?.nombre || 'Usuario').split(' ')[0]}. Tienes{' '}
            {pendingCourses.length} cursos pendientes por completar.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate('/assistant')}
            className="px-6 py-3 bg-white border border-slate-200 text-on-surface font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-primary">smart_toy</span>
            <span className="whitespace-nowrap">Asistente IA</span>
          </button>

          <button
            onClick={() => navigate('/courses')}
            className="px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">school</span>
            <span className="whitespace-nowrap">Explorar Cursos</span>
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon="emoji_events" color="text-primary bg-primary/10" title="Mi Score" value={`${userScore} XP`} delay={0} />
        <StatCard icon="local_fire_department" color="text-amber-500 bg-amber-50" title="Racha Actual" value={`${userStreak} Días`} delay={0.1} fill />
        <StatCard icon="task_alt" color="text-green-600 bg-green-50" title="Completados" value={completedCourses.length} delay={0.2} />
        <StatCard icon="workspace_premium" color="text-purple-600 bg-purple-50" title="Insignias" value={userBadges} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Continue Learning */}
          <section>
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-xl font-bold text-on-surface">Continuar Aprendiendo</h2>
              <Link to="/courses" className="text-primary text-xs font-bold hover:underline">
                Ver todos
              </Link>
            </div>

            {pendingCourses.length === 0 ? (
              <p className="text-slate-500">No tienes cursos en progreso.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingCourses.map((course, i) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all group"
                  >
                    <div className="h-32 bg-gradient-to-r from-primary/80 to-indigo-500 relative">
                      <div className="absolute bottom-4 left-6">
                        <span className="px-2 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-md border border-white/20">
                          Curso Activo
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="font-bold text-on-surface mb-2 truncate">{course.title}</h3>
                      <p className="text-xs text-slate-500 mb-4">{course.description}</p>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span>Progreso</span>
                          <span>{course.progreso?.porcentaje}%</span>
                        </div>

                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${course.progreso?.porcentaje}%` }}
                            className="h-full bg-primary"
                          />
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
            )}
          </section>

          {/* Recommended */}
          <section>
            <h2 className="text-xl font-bold text-on-surface mb-6">Cursos Recomendados</h2>

            {recommendedCourses.length === 0 ? (
              <p className="text-slate-500">No hay cursos recomendados por ahora.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendedCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    whileHover={{ y: -5 }}
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex gap-4 items-center"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-primary to-indigo-500 flex-shrink-0"></div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-on-surface truncate">{course.title}</h4>
                      <p className="text-xs text-slate-500 mb-3">
                        {course.totalLessons} lecciones disponibles
                      </p>
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
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-primary rounded-[2.5rem] p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <h3 className="text-xl font-bold mb-4 relative z-10">Asistente GIT Labs</h3>
            <p className="text-white/70 text-sm mb-6 leading-relaxed relative z-10">
              Consulta dudas, conceptos de IA o apoyo durante tu capacitación.
            </p>
            <button
              onClick={() => navigate('/assistant')}
              className="w-full py-4 bg-white text-primary font-bold rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 relative z-10"
            >
              <span className="material-symbols-outlined">smart_toy</span> Iniciar Chat
            </button>
          </section>

          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-on-surface mb-6">Actividad Reciente</h3>
            <div className="space-y-6">
              <ActivityItem label="Dashboard sincronizado" time="Hace unos segundos" icon="sync" color="text-blue-500" />
              <ActivityItem label={`${pendingCourses.length} cursos activos`} time="Sesión actual" icon="school" color="text-amber-500" />
              <ActivityItem label={`${completedCourses.length} cursos completados`} time="Historial" icon="task_alt" color="text-green-500" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, color, title, value, delay, fill = false }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        <span className={`material-symbols-outlined text-2xl ${fill ? 'material-symbols-fill' : ''}`}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-on-surface">{value}</p>
      </div>
    </motion.div>
  );
}

function ActivityItem({ label, time, icon, color }: any) {
  return (
    <div className="flex gap-4">
      <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center ${color}`}>
        <span className="material-symbols-outlined text-sm">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-bold text-on-surface">{label}</p>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{time}</p>
      </div>
    </div>
  );
}