import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { MOCK_COURSES } from '../constants';
import type { Course } from '../types';

type ApiContent = { id: number | string; tipo?: 'pdf' | 'slides' | 'sheets' | 'video'; titulo?: string; contenidoURLoTexto?: string };
type ApiLesson = { id: number | string; titulo?: string; orden?: number; Contenido?: ApiContent[]; completada?: boolean };
type ApiCourseDetail = { id: number | string; titulo?: string; descripcion?: string; Leccion?: ApiLesson[] };

const normalizeLessonCourse = (raw: ApiCourseDetail): Course => {
  const lessons = Array.isArray(raw.Leccion) ? raw.Leccion : [];
  const sorted = [...lessons].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  const firstLessonContent = sorted[0]?.Contenido ?? [];
  const externalLinks = firstLessonContent.length
    ? firstLessonContent.map((c, idx) => ({
        type: (c.tipo ?? 'pdf') as 'pdf' | 'slides' | 'sheets' | 'video',
        label: c.titulo ?? `Recurso ${idx + 1}`,
        url: c.contenidoURLoTexto ?? '#',
      }))
    : [{ type: 'pdf' as const, label: 'Lectura del curso', url: '#' }];

  return {
    id: String(raw.id),
    title: raw.titulo ?? 'Curso sin titulo',
    description: raw.descripcion ?? 'Descripcion no disponible',
    thumbnail: 'https://picsum.photos/seed/course-lesson-api/1200/700',
    category: 'General',
    area: 'General',
    progress: lessons.length ? Math.round((lessons.filter((l) => !!l.completada).length / lessons.length) * 100) : 0,
    duration: '2h 00m',
    level: 'Intermedio',
    externalLinks,
    modules: sorted.map((lesson) => ({
      id: String(lesson.id),
      title: lesson.titulo ?? 'Leccion',
      completed: !!lesson.completada,
      duration: '30m',
    })),
  };
};

const getResourceIcon = (type: string) => {
  if (type === 'video') return 'play_circle';
  if (type === 'pdf') return 'picture_as_pdf';
  if (type === 'slides') return 'slideshow';
  if (type === 'sheets') return 'table_chart';
  return 'description';
};

export default function LessonPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const courseId = searchParams.get('courseId') || '1';
  const moduleId = searchParams.get('moduleId');
  const [course, setCourse] = useState<Course>(
    MOCK_COURSES.find((c) => String(c.id) === courseId) || MOCK_COURSES[0]
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}`);
        if (!response.ok) throw new Error('No se pudo cargar leccion');
        const payload = await response.json();
        if (mounted && payload) {
          setCourse(normalizeLessonCourse(payload));
        }
      } catch {
        if (mounted) {
          setCourse(MOCK_COURSES.find((c) => String(c.id) === courseId) || MOCK_COURSES[0]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCourse();

    return () => {
      mounted = false;
    };
  }, [courseId]);

  const selectedModule = useMemo(() => {
    if (!moduleId) return course.modules[0];
    return course.modules.find((m) => m.id === moduleId) || course.modules[0];
  }, [course.modules, moduleId]);

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(`/courses/${course.id}`)}
          className="w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 text-primary hover:bg-primary hover:text-white transition-all shadow-sm group"
        >
          <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
        </button>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leccion</p>
          <p className="text-sm font-bold text-primary">{selectedModule?.duration}</p>
        </div>
      </div>

      <header className="space-y-2">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-on-surface">{selectedModule?.title}</h1>
        <p className="text-slate-500 font-medium">
          Estudia el contenido de {course.title} y cuando termines continua al quiz para validar tu conocimiento.
        </p>
      </header>

      {loading && <div className="text-sm font-medium text-slate-500">Cargando contenido...</div>}

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-black text-on-surface">Contenido de la leccion</h2>

          <div className="aspect-video rounded-2xl bg-slate-900 text-white flex items-center justify-center">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl mb-2">ondemand_video</span>
              <p className="font-bold">Video explicativo del modulo</p>
              <p className="text-xs text-slate-300 mt-1">Recurso demostrativo listo para reemplazar por tu URL real</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Objetivo</p>
            <p className="text-slate-600 font-medium">
              Comprender los conceptos clave y preparar la aplicacion practica antes de responder el quiz final.
            </p>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Recursos</h3>
            {course.externalLinks.map((resource, index) => (
              <motion.a
                key={`${resource.label}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4 hover:border-primary hover:shadow-md transition-all"
              >
                <span className="material-symbols-outlined text-primary">{getResourceIcon(resource.type)}</span>
                <div>
                  <p className="text-sm font-bold text-on-surface">{resource.label}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">{resource.type}</p>
                </div>
              </motion.a>
            ))}
          </div>

          <button
            onClick={() => navigate(`/quiz?id=${course.id}&courseId=${course.id}&moduleId=${selectedModule?.id}`)}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Continuar al Quiz
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </section>
    </div>
  );
}
