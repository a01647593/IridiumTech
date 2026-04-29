import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { getCourseDetail } from '../lib/courseService';

interface DashboardCourse {
  id: string;
  title: string;
  description: string;
  totalLessons: number;
  completedLessons: number;
  progreso: { porcentaje: number };
  lessons: any[];
}

export default function CourseDetailPage({ user }: { user: any }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const [course, setCourse] = useState<DashboardCourse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourse() {
      try {
        if (!id) return;

        const data = await getCourseDetail(id, user?.id);
        setCourse(data);
      } catch (err) {
        console.error('Error cargando detalle:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCourse();
  }, [id, user]);

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500 font-semibold">
        Cargando detalle del curso...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-10 text-center text-red-500 font-semibold">
        Curso no encontrado.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-8 sm:space-y-12">
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-col gap-6">
            <button
              onClick={() => navigate('/courses')}
              className="w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 text-primary hover:bg-primary hover:text-white transition-all shadow-sm group"
            >
              <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
            </button>

            <div className="inline-flex w-fit items-center px-4 py-1.5 rounded-xl bg-primary/5 text-primary text-[10px] font-black tracking-widest uppercase border border-primary/10">
              Masterclass Profesional
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-on-surface leading-tight">
              {course.title}
            </h1>
            <p className="text-lg sm:text-xl text-slate-500 max-w-3xl leading-relaxed font-medium">
              {course.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <InfoBadge icon="schedule" text={`${course.totalLessons} módulos`} />
            <InfoBadge icon="bar_chart" text="Intermedio" />
            <InfoBadge icon="workspace_premium" text="Certificado GIT Labs" />
          </div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl space-y-8 sticky top-24"
          >
            <div className="aspect-video rounded-3xl overflow-hidden shadow-inner relative group">
              <img
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                src={`https://picsum.photos/seed/${course.id}/1200/700`}
                alt={course.title}
              />
              <div className="absolute inset-0 bg-black/20"></div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Tu Progreso
                </span>
                <span className="text-lg font-black text-primary">
                  {course.progreso?.porcentaje || 0}%
                </span>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${course.progreso?.porcentaje || 0}%` }}
                  transition={{ duration: 1 }}
                  className="bg-primary h-full"
                />
              </div>

              <button
                onClick={() =>
                  navigate(`/lesson/${course.lessons?.[0]?.id}`)
                }
                className="w-full py-5 bg-primary text-white font-bold rounded-[1.5rem] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined">play_arrow</span>
                {(course.progreso?.porcentaje || 0) > 0
                  ? 'Continuar Aprendizaje'
                  : 'Empezar Curso Ahora'}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          <div className="flex gap-10 border-b border-slate-100">
            <button className="pb-6 text-sm font-black text-primary border-b-4 border-primary uppercase tracking-widest">
              Currículo
            </button>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-black text-on-surface mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">
                list_alt
              </span>
              Módulos del Curso
            </h3>

            <div className="space-y-4">
              {course.lessons?.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigate(`/lesson/${lesson.id}`)}
                  className="bg-white p-8 rounded-[2rem] border border-slate-100 flex items-center gap-8 group hover:border-primary hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-primary font-black text-xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                      {lesson.title}
                    </h4>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                      {lesson.content?.length || 0} recursos disponibles
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {lesson.completed ? (
                      <span className="material-symbols-outlined text-green-500 text-3xl material-symbols-fill">
                        check_circle
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-slate-200 text-3xl group-hover:text-primary transition-colors">
                        play_circle
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBadge({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 text-slate-600 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
      <span className="material-symbols-outlined text-primary">{icon}</span>
      <span className="text-sm font-bold">{text}</span>
    </div>
  );
}