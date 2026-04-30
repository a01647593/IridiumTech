import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchGemById, incrementGemUses, type AiGem } from '../lib/gemService';
import type { User } from '../types';

export default function PromptDetailPage({ user: _user }: { user: User }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [gem, setGem] = useState<AiGem | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchGemById(id).then((data) => {
      setGem(data);
      setLoading(false);
      if (data) incrementGemUses(id);
    });
  }, [id]);

  const handleCopy = () => {
    if (!gem) return;
    navigator.clipboard.writeText(gem.prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleUseInAssistant = () => {
    if (!gem) return;
    navigate('/assistant', { state: { initialPrompt: gem.prompt } });
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Cargando gema...</div>;
  }

  if (!gem) {
    return (
      <div className="p-6 lg:p-10 max-w-4xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300">error</span>
          <h2 className="text-2xl font-black text-on-surface mt-4">Gema no encontrada</h2>
          <p className="text-slate-500 mt-2">No pudimos cargar esta gema.</p>
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
    <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
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
            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg">
              {gem.department_name}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight">{gem.title}</h1>

          {gem.description && (
            <p className="text-slate-600 leading-relaxed">{gem.description}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Autor</p>
              <p className="text-sm font-bold text-on-surface mt-1">{gem.author_name}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usos</p>
              <p className="text-sm font-bold text-on-surface mt-1">{gem.uses_count}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Publicada</p>
              <p className="text-sm font-bold text-on-surface mt-1">
                {new Date(gem.created_at).toLocaleDateString('es-MX')}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prompt</p>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline transition-colors"
              >
                <span className="material-symbols-outlined text-sm">
                  {copied ? 'check' : 'content_copy'}
                </span>
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-mono">
              {gem.prompt}
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleCopy}
            className="flex-1 py-4 border border-primary text-primary font-bold rounded-2xl hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">{copied ? 'check' : 'content_copy'}</span>
            {copied ? 'Prompt copiado' : 'Copiar prompt'}
          </button>
          <button
            onClick={handleUseInAssistant}
            className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">smart_toy</span>
            Usar en Asistente IA
          </button>
        </div>
      </section>
    </div>
  );
}
