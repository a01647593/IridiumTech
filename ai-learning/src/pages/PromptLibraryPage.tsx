import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { fetchGems, createGem, type AiGem } from '../lib/gemService';
import { fetchDepartments, type Department } from '../lib/departmentService';
import type { User } from '../types';

export default function PromptLibraryPage({ user }: { user: User }) {
  const navigate = useNavigate();

  const [gems, setGems] = useState<AiGem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    title: '',
    description: '',
    prompt: '',
    department_id: null as number | null,
  });

  useEffect(() => {
    Promise.all([fetchGems(), fetchDepartments()]).then(([gemsData, deptsData]) => {
      setGems(gemsData);
      setDepartments(deptsData);
      setLoading(false);
    });
  }, []);

  const filtered = gems.filter((g) => {
    const matchesDept = selectedDeptId === null || g.department_id === selectedDeptId;
    const matchesSearch =
      !searchTerm ||
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.description ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleCreate = async () => {
    if (!draft.title.trim() || !draft.prompt.trim()) return;
    setSaving(true);
    const gem = await createGem(user.id, draft);
    if (gem) {
      setGems((prev) => [gem, ...prev]);
      setShowModal(false);
      setDraft({ title: '', description: '', prompt: '', department_id: null });
    }
    setSaving(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-black text-primary tracking-tight">Biblioteca de Gemas</h1>
          <p className="text-slate-500 font-medium mt-2">
            Repositorio corporativo de prompts validados por GIT Labs. Encuentra, comparte y usa las mejores gemas de IA.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <span className="material-symbols-outlined">add</span> Compartir Gema
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            type="text"
            placeholder="Buscar por título o descripción..."
            className="w-full h-14 pl-12 pr-6 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <button
            onClick={() => setSelectedDeptId(null)}
            className={`px-6 h-14 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
              selectedDeptId === null
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            Todas
          </button>
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDeptId(dept.id)}
              className={`px-6 h-14 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
                selectedDeptId === dept.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 font-medium">Cargando gemas...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-slate-300 text-4xl">search_off</span>
          </div>
          <h3 className="text-xl font-bold text-slate-400">No hay gemas que coincidan</h3>
          <p className="text-slate-400 mt-2">Prueba con otros filtros o sé el primero en compartir una.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((gem, i) => (
            <motion.div
              key={gem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden flex flex-col cursor-pointer"
              onClick={() => navigate(`/prompts/${gem.id}`)}
            >
              <div className="p-8 flex-1">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <span className="material-symbols-outlined">auto_awesome</span>
                  </div>
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
                    {gem.department_name}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors line-clamp-2">
                  {gem.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                  {gem.description || 'Sin descripción.'}
                </p>
              </div>

              <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="material-symbols-outlined text-sm">play_circle</span>
                  <span className="text-xs font-bold">{gem.uses_count} usos</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                  <span className="material-symbols-outlined text-sm">person</span>
                  {gem.author_name}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h2 className="text-2xl font-black text-on-surface">Compartir Nueva Gema</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título *</label>
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium"
                    placeholder="Ej. Optimizador de reportes de ingeniería"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Departamento</label>
                  <select
                    value={draft.department_id ?? ''}
                    onChange={(e) => setDraft({ ...draft, department_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium"
                  >
                    <option value="">General</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</label>
                  <input
                    type="text"
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium"
                    placeholder="¿Para qué sirve esta gema?"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prompt *</label>
                  <textarea
                    value={draft.prompt}
                    onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
                    className="w-full p-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium h-36 resize-none"
                    placeholder="Escribe el prompt completo aquí..."
                  />
                </div>
              </div>
              <div className="p-8 bg-slate-50 flex justify-end gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 font-bold text-slate-500 hover:text-on-surface transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving || !draft.title.trim() || !draft.prompt.trim()}
                  className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {saving ? 'Publicando...' : 'Publicar Gema'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
