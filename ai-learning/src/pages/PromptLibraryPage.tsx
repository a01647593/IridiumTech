import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_PROMPTS } from '../constants';

export default function PromptLibraryPage() {
  const [prompts, setPrompts] = useState(MOCK_PROMPTS.map(p => ({ ...p, likedByMe: false })));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [showShareModal, setShowShareModal] = useState(false);
  const [newGema, setNewGema] = useState({ title: '', description: '', category: 'Productividad', tags: '' });

  const categories = ['Todas', 'Productividad', 'Ingeniería', 'Marketing', 'Finanzas', 'HR'];

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleLike = (id: string) => {
    setPrompts(prev => prev.map(p => {
      if (p.id === id) {
        const isLiked = !p.likedByMe;
        return { 
          ...p, 
          likedByMe: isLiked, 
          likes: isLiked ? p.likes + 1 : p.likes - 1 
        };
      }
      return p;
    }));
  };

  const handleShare = () => {
    if (newGema.title && newGema.description) {
      const gema = {
        id: Date.now().toString(),
        title: newGema.title,
        description: newGema.description,
        category: newGema.category,
        tags: newGema.tags.split(',').map(t => t.trim()),
        likes: 0,
        usageCount: 0,
        impact: 'Nuevo',
        author: 'Usuario'
      };
      setPrompts([gema, ...prompts]);
      setShowShareModal(false);
      setNewGema({ title: '', description: '', category: 'Productividad', tags: '' });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-black text-primary tracking-tight">Biblioteca de Gemas</h1>
          <p className="text-slate-500 font-medium mt-2">
            Repositorio corporativo de prompts y mejores prácticas validadas por GIT Labs para maximizar tu productividad.
          </p>
        </div>
        <button 
          onClick={() => setShowShareModal(true)}
          className="px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span> Compartir Gema
        </button>
      </header>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input 
            type="text" 
            placeholder="Buscar por título, descripción o tecnología..."
            className="w-full h-14 pl-12 pr-6 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 h-14 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
                selectedCategory === cat 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrompts.map((prompt, i) => (
          <motion.div 
            key={prompt.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden flex flex-col"
          >
            <div className="p-8 flex-1">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">smart_toy</span>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
                    {prompt.category}
                  </span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors">{prompt.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-6">{prompt.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {prompt.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-1 rounded-md">#{tag}</span>
                ))}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Impacto Reportado</p>
                <p className="text-xs font-bold text-green-600 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  {prompt.impact}
                </p>
              </div>
            </div>
            
            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
        <button 
          onClick={() => handleLike(prompt.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 ${
            prompt.likedByMe 
            ? 'bg-red-50 text-red-500 shadow-sm' 
            : 'text-slate-400 hover:bg-slate-100 hover:text-red-500'
          }`}
        >
          <span className={`material-symbols-outlined text-lg ${prompt.likedByMe ? 'material-symbols-fill' : ''}`}>favorite</span>
          <span className="text-xs font-bold">{prompt.likes}</span>
        </button>
                <div className="flex items-center gap-1 text-slate-400">
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  <span className="text-xs font-bold">{prompt.usageCount}</span>
                </div>
              </div>
              <button className="text-primary font-bold text-sm flex items-center gap-1 hover:underline whitespace-nowrap">
                Ver Gema <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
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
                <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título de la Gema</label>
                  <input 
                    type="text" 
                    value={newGema.title}
                    onChange={(e) => setNewGema({ ...newGema, title: e.target.value })}
                    className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium" 
                    placeholder="Ej. Optimizador de Consultas SQL" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</label>
                    <select 
                      value={newGema.category}
                      onChange={(e) => setNewGema({ ...newGema, category: e.target.value })}
                      className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium"
                    >
                      {categories.filter(c => c !== 'Todas').map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tags (separados por coma)</label>
                    <input 
                      type="text" 
                      value={newGema.tags}
                      onChange={(e) => setNewGema({ ...newGema, tags: e.target.value })}
                      className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium" 
                      placeholder="IA, SQL, Datos" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción / Prompt</label>
                  <textarea 
                    value={newGema.description}
                    onChange={(e) => setNewGema({ ...newGema, description: e.target.value })}
                    className="w-full p-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium h-32 resize-none" 
                    placeholder="Describe cómo usar esta gema y el prompt principal..."
                  ></textarea>
                </div>
              </div>
              <div className="p-8 bg-slate-50 flex justify-end gap-4">
                <button onClick={() => setShowShareModal(false)} className="px-6 py-3 font-bold text-slate-500 hover:text-on-surface transition-colors">Cancelar</button>
                <button 
                  onClick={handleShare}
                  className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  Publicar Gema
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {filteredPrompts.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-slate-300 text-4xl">search_off</span>
          </div>
          <h3 className="text-xl font-bold text-slate-400">No encontramos gemas que coincidan</h3>
          <p className="text-slate-400 mt-2">Prueba con otros términos o categorías.</p>
        </div>
      )}
    </div>
  );
}
