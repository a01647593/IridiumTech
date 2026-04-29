import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { getLessonDetail } from '../lib/courseService';
import {
  isYoutubeUrl,
  getYoutubeEmbedUrl,
  isDirectVideoFile,
} from '../lib/mediaHelpers';

type ModuleComment = {
  id: string;
  text: string;
  createdAt: string;
  authorName: string;
};

const getResourceIcon = (type: string) => {
  if (type === 'link') return 'link';
  if (type === 'video') return 'smart_display';
  return 'description';
};

export default function LessonPage({ user }: { user: any }) {
  const navigate = useNavigate();
  const { lessonId } = useParams();

  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [moduleComments, setModuleComments] = useState<ModuleComment[]>([]);

  useEffect(() => {
    async function loadLesson() {
      try {
        if (!lessonId) return;
        const data = await getLessonDetail(lessonId);
        console.log('LESSON DETAIL:', data);
        setLesson(data);
      } catch (err) {
        console.error('Error cargando lesson:', err);
      } finally {
        setLoading(false);
      }
    }

    loadLesson();
  }, [lessonId]);

  const instructionalContent = useMemo(
    () =>
      lesson?.content?.filter((c: any) =>
        ['video', 'slides', 'pdf', 'text'].includes(c.type)
      ) || [],
    [lesson]
  );

  const resources = useMemo(
    () =>
      lesson?.content?.filter((c: any) =>
        ['link'].includes(c.type)
      ) || [],
    [lesson]
  );

  const commentsStorageKey = `module_comments:${user?.id || 'anon'}:${lessonId}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(commentsStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setModuleComments(Array.isArray(parsed) ? parsed : []);
    } catch {
      setModuleComments([]);
    }
  }, [commentsStorageKey]);

  const handleAddComment = () => {
    if (!commentInput.trim()) return;

    const nextComments = [
      {
        id: `${Date.now()}`,
        text: commentInput.trim(),
        createdAt: new Date().toISOString(),
        authorName: user?.name || user?.nombre || user?.email || 'Usuario',
      },
      ...moduleComments,
    ];

    setModuleComments(nextComments);
    setCommentInput('');
    localStorage.setItem(commentsStorageKey, JSON.stringify(nextComments));
  };

  const handleContinueQuiz = async () => {
    navigate(`/quiz/${lesson.id}`);
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Cargando contenido...</div>;
  }

  if (!lesson) {
    return <div className="p-10 text-center text-red-500">Lección no encontrada.</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(`/courses/${lesson.courses?.id}`)}
          className="w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 text-primary hover:bg-primary hover:text-white transition-all shadow-sm group"
        >
          <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
            arrow_back
          </span>
        </button>

        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Lección
          </p>
          <p className="text-sm font-bold text-primary">
            Módulo {lesson.order_index + 1}
          </p>
        </div>
      </div>

      <header className="space-y-2">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-on-surface">
          {lesson.title}
        </h1>
        <p className="text-slate-500 font-medium">
          Estudia el contenido de {lesson.courses?.title} y continúa al quiz cuando termines.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-black text-on-surface">Contenido de la lección</h2>

          {instructionalContent.length === 0 ? (
            <div className="rounded-2xl bg-slate-100 p-10 text-center text-slate-500">
              No hay contenido instruccional cargado.
            </div>
          ) : (
            instructionalContent.map((contentBlock: any) => {
              const sourceUrl = contentBlock.external_url || contentBlock.file_url;

              if (contentBlock.type === 'video') {
                if (!sourceUrl) return null;

                if (isYoutubeUrl(sourceUrl)) {
                  const embedUrl = getYoutubeEmbedUrl(sourceUrl);

                  return (
                    <div key={contentBlock.id} className="aspect-video rounded-2xl overflow-hidden">
                      <iframe
                        src={embedUrl || ''}
                        className="w-full h-full"
                        allowFullScreen
                        title={contentBlock.title}
                      />
                    </div>
                  );
                }

                if (isDirectVideoFile(sourceUrl)) {
                  return (
                    <div key={contentBlock.id} className="aspect-video rounded-2xl bg-slate-900 overflow-hidden">
                      <video
                        src={sourceUrl}
                        controls
                        className="w-full h-full object-cover"
                      />
                    </div>
                  );
                }

                return (
                  <a
                    key={contentBlock.id}
                    href={sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block p-6 rounded-2xl border border-slate-200 bg-slate-50"
                  >
                    Abrir video externo
                  </a>
                );
              }

              if (contentBlock.type === 'slides') {
                return (
                  <div key={contentBlock.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 font-bold text-slate-700">
                      {contentBlock.title || 'Diapositivas'}
                    </div>
                    <iframe
                      src={sourceUrl}
                      className="w-full h-[600px]"
                      title={contentBlock.title}
                    />
                  </div>
                );
              }

              if (contentBlock.type === 'pdf') {
                return (
                  <div key={contentBlock.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 font-bold text-slate-700">
                      {contentBlock.title || 'Documento PDF'}
                    </div>
                    <iframe
                      src={sourceUrl}
                      className="w-full h-[700px]"
                      title={contentBlock.title}
                    />
                  </div>
                );
              }

              if (contentBlock.type === 'text') {
                return (
                  <div key={contentBlock.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                      Lectura
                    </p>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                      {contentBlock.text_content}
                    </p>
                  </div>
                );
              }

              return null;
            })
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
              Recursos complementarios
            </h3>

            {resources.length === 0 ? (
              <p className="text-sm text-slate-500">No hay enlaces externos.</p>
            ) : (
              resources.map((resource: any, index: number) => (
                <motion.a
                  key={resource.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  href={resource.external_url || resource.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4 hover:border-primary hover:shadow-md transition-all"
                >
                  <span className="material-symbols-outlined text-primary">
                    {getResourceIcon(resource.type)}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-on-surface">
                      {resource.title || resource.file_name}
                    </p>
                    <p className="text-xs text-slate-500 uppercase tracking-widest">
                      {resource.type}
                    </p>
                  </div>
                </motion.a>
              ))
            )}
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
              Comentarios del módulo
            </h3>

            <textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              rows={3}
              placeholder="Escribe una duda o comentario..."
              className="w-full resize-none rounded-2xl border border-slate-200 p-3 text-sm"
            />

            <button
              onClick={handleAddComment}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold"
            >
              Guardar comentario
            </button>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {moduleComments.map((comment) => (
                <div key={comment.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-bold text-primary">{comment.authorName}</p>
                  <p className="text-sm text-slate-700">{comment.text}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleContinueQuiz}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            Continuar al Quiz
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </section>
    </div>
  );
}