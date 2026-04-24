import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MOCK_PROMPTS } from '../constants';
import { Prompt } from '../types';

type PromptWithLike = Prompt & { likedByMe?: boolean };

interface PromptComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface PromptMetrics {
  likes: number;
  likedByMe: boolean;
  views: number;
}

const getCommentsKey = (promptId: string) => `prompt_comments_${promptId}`;
const getMetricsKey = (promptId: string) => `prompt_metrics_${promptId}`;

export default function PromptDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const statePrompt = (location.state as { prompt?: PromptWithLike } | null)?.prompt;

  const prompt = useMemo(() => {
    if (statePrompt) {
      return statePrompt;
    }
    return MOCK_PROMPTS.find((p) => p.id === id);
  }, [id, statePrompt]);

  const [comments, setComments] = useState<PromptComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [metrics, setMetrics] = useState<PromptMetrics>({ likes: 0, likedByMe: false, views: 0 });

  useEffect(() => {
    if (!prompt?.id) {
      return;
    }

    const storedComments = localStorage.getItem(getCommentsKey(prompt.id));
    if (storedComments) {
      try {
        setComments(JSON.parse(storedComments));
      } catch {
        setComments([]);
      }
    } else {
      setComments([]);
    }
  }, [prompt?.id]);

  useEffect(() => {
    if (!prompt?.id) {
      return;
    }

    const storageKey = getMetricsKey(prompt.id);
    const storedMetrics = localStorage.getItem(storageKey);

    const baseMetrics: PromptMetrics = {
      likes: prompt.likes,
      likedByMe: Boolean(statePrompt?.likedByMe),
      views: prompt.usageCount,
    };

    if (storedMetrics) {
      try {
        const parsed = JSON.parse(storedMetrics) as Partial<PromptMetrics>;
        if (typeof parsed.likes === 'number') {
          baseMetrics.likes = parsed.likes;
        }
        if (typeof parsed.likedByMe === 'boolean') {
          baseMetrics.likedByMe = parsed.likedByMe;
        }
        if (typeof parsed.views === 'number') {
          baseMetrics.views = parsed.views;
        }
      } catch {
        // Ignore invalid metrics payload and keep defaults.
      }
    }

    const sessionViewKey = `prompt_viewed_${prompt.id}_${location.key}`;
    if (!sessionStorage.getItem(sessionViewKey)) {
      baseMetrics.views += 1;
      sessionStorage.setItem(sessionViewKey, '1');
    }

    setMetrics(baseMetrics);
    localStorage.setItem(storageKey, JSON.stringify(baseMetrics));
  }, [location.key, prompt?.id, prompt?.likes, prompt?.usageCount, statePrompt?.likedByMe]);

  const handleToggleLike = () => {
    if (!prompt?.id) {
      return;
    }

    setMetrics((prev) => {
      const likedByMe = !prev.likedByMe;
      const likes = likedByMe ? prev.likes + 1 : Math.max(prev.likes - 1, 0);
      const updatedMetrics = {
        ...prev,
        likedByMe,
        likes,
      };

      localStorage.setItem(getMetricsKey(prompt.id), JSON.stringify(updatedMetrics));
      return updatedMetrics;
    });
  };

  const handleCommentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt?.id) {
      return;
    }

    const text = commentText.trim();
    if (!text) {
      return;
    }

    const userRaw = localStorage.getItem('whirlpool_user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    const authorName = user?.name || 'Usuario';

    const newComment: PromptComment = {
      id: Date.now().toString(),
      author: authorName,
      text,
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [newComment, ...comments];
    setComments(updatedComments);
    localStorage.setItem(getCommentsKey(prompt.id), JSON.stringify(updatedComments));
    setCommentText('');
  };

  if (!prompt) {
    return (
      <div className="p-6 lg:p-10 max-w-4xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300">error</span>
          <h2 className="text-2xl font-black text-on-surface mt-4">Gema no encontrada</h2>
          <p className="text-slate-500 mt-2">No pudimos abrir esta gema. Regresa a la biblioteca para continuar.</p>
          <button
            onClick={() => navigate('/prompts')}
            className="mt-6 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-all"
          >
            Volver a Gemas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <button
        onClick={() => navigate('/prompts')}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Volver a la biblioteca
      </button>

      <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 sm:p-10 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
              {prompt.category}
            </span>
            <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg">
              {prompt.area}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight">{prompt.title}</h1>
          <p className="text-slate-600 leading-relaxed">{prompt.description}</p>

          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                metrics.likedByMe
                  ? 'bg-red-50 text-red-500 shadow-sm'
                  : 'text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-red-500'
              }`}
            >
              <span className={`material-symbols-outlined text-lg ${metrics.likedByMe ? 'material-symbols-fill' : ''}`}>favorite</span>
              <span className="text-sm font-bold">{metrics.likes}</span>
            </button>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 text-slate-500">
              <span className="material-symbols-outlined text-lg">visibility</span>
              <span className="text-sm font-bold">{metrics.views}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Autor</p>
              <p className="text-sm font-bold text-on-surface mt-2">{prompt.author}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Likes</p>
              <p className="text-sm font-bold text-on-surface mt-2">{metrics.likes}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vistas</p>
              <p className="text-sm font-bold text-on-surface mt-2">{metrics.views}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Prompt</p>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {prompt.content}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {prompt.tags.map((tag) => (
              <span key={tag} className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-1 rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 sm:p-10 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-on-surface">Comentarios sobre la gema</h2>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{comments.length} comentarios</span>
        </div>

        <form onSubmit={handleCommentSubmit} className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agregar comentario</label>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium h-28 resize-none"
            placeholder="Escribe tu experiencia, recomendaciones o mejoras para esta gema..."
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-all"
            >
              Subir comentario
            </button>
          </div>
        </form>

        {comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
            Aun no hay comentarios. Se la primera persona en aportar.
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <article key={comment.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-sm font-bold text-on-surface">{comment.author}</p>
                  <p className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleString('es-MX')}</p>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
