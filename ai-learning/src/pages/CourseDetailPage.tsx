import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import type { Course } from '../types';
import { getStoredCourseById, getStoredCourses } from '../lib/courseStore.ts';

type ApiLesson = { id: number | string; titulo?: string; completada?: boolean; orden?: number };
type ApiCourseDetail = {
  id: number | string;
  titulo?: string;
  descripcion?: string;
  Leccion?: ApiLesson[];
};

const normalizeDetailCourse = (raw: ApiCourseDetail): Course => {
  const lessons = Array.isArray(raw.Leccion) ? raw.Leccion : [];
  const sorted = [...lessons].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  return {
    id: String(raw.id),
    title: raw.titulo ?? 'Curso sin titulo',
    description: raw.descripcion ?? 'Descripcion no disponible',
    thumbnail: 'https://picsum.photos/seed/course-detail-api/1200/700',
    category: 'General',
    area: 'General',
    progress: lessons.length ? Math.round((lessons.filter((l) => !!l.completada).length / lessons.length) * 100) : 0,
    duration: '2h 00m',
    level: 'Intermedio',
    externalLinks: [
      { type: 'pdf', label: 'Lectura de la leccion', url: '#' },
      { type: 'video', label: 'Video de la leccion', url: '#' },
    ],
    modules: sorted.map((lesson) => ({
      id: String(lesson.id),
      title: lesson.titulo ?? 'Leccion',
      completed: !!lesson.completada,
      duration: '30m',
    })),
  };
};

export default function CourseDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const fallbackCourse = useMemo(() => getStoredCourseById(id ?? '') || getStoredCourses()[0], [id]);
  const [course, setCourse] = useState<Course>(fallbackCourse);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const courseId = id ?? fallbackCourse.id;

    const loadCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}`);
        if (!response.ok) throw new Error('No se pudo cargar el curso');
        const payload = await response.json();
        if (mounted && payload) {
          setCourse(normalizeDetailCourse(payload));
        }
      } catch {
        if (mounted) setCourse(fallbackCourse);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCourse();

    return () => {
      mounted = false;
    };
  }, [id, fallbackCourse]);

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-8 sm:space-y-12">
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-col gap-6">
            <button 
              onClick={() => navigate('/courses')} 
              className="w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 text-primary hover:bg-primary hover:text-white transition-all shadow-sm group"
            >
              <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
            </button>
            <div className="inline-flex w-fit items-center px-4 py-1.5 rounded-xl bg-primary/5 text-primary text-[10px] font-black tracking-widest uppercase border border-primary/10">
              {course.area} • Masterclass
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
            <div className="flex items-center gap-3 text-slate-600 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
              <span className="material-symbols-outlined text-primary">schedule</span>
              <span className="text-sm font-bold">{course.duration}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
              <span className="material-symbols-outlined text-primary">bar_chart</span>
              <span className="text-sm font-bold">{course.level}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
              <span className="material-symbols-outlined text-primary">workspace_premium</span>
              <span className="text-sm font-bold">Certificado GIT Labs</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl space-y-8 sticky top-24"
          >
            <div className="aspect-video rounded-3xl overflow-hidden shadow-inner relative group">
              <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={course.thumbnail} alt={course.title} />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-white text-6xl material-symbols-fill">play_circle</span>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tu Progreso</span>
                <span className="text-lg font-black text-primary">{course.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${course.progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-primary h-full"
                ></motion.div>
              </div>
              <button 
                onClick={() => navigate(`/lesson?courseId=${course.id}&moduleId=${course.modules?.[0]?.id || 'm1'}`)}
                className="w-full py-5 bg-primary text-white font-bold rounded-[1.5rem] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined">play_arrow</span>
                {course.progress > 0 ? 'Continuar Aprendizaje' : 'Empezar Curso Ahora'}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {loading && <div className="text-sm font-medium text-slate-500">Cargando detalle del curso...</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          <div className="flex gap-10 border-b border-slate-100">
            <button className="pb-6 text-sm font-black text-primary border-b-4 border-primary uppercase tracking-widest">Currículo</button>
            <button className="pb-6 text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">Recursos</button>
            <button className="pb-6 text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">Comunidad</button>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-black text-on-surface mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">list_alt</span> Módulos del Curso
            </h3>
            <div className="space-y-4">
              {course.modules?.map((module, index) => (
                <motion.div 
                  key={module.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigate(`/lesson?courseId=${course.id}&moduleId=${module.id}`)}
                  className="bg-white p-8 rounded-[2rem] border border-slate-100 flex items-center gap-8 group hover:border-primary hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-primary font-black text-xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                      {module.title}
                    </h4>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Video + Quiz Interactivo • 45 min</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {module.completed ? (
                      <span className="material-symbols-outlined text-green-500 text-3xl material-symbols-fill">check_circle</span>
                    ) : (
                      <span className="material-symbols-outlined text-slate-200 text-3xl group-hover:text-primary transition-colors">play_circle</span>
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
