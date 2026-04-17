import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_PROMPTS } from '../constants';
import { addStoredCourse, deleteStoredCourse, getStoredCourses, type CourseDraft } from '../lib/courseStore';
import type { Course } from '../types';

export default function ContentManagementPage() {
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showGemaModal, setShowGemaModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'courses' | 'gemas'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseDraft, setCourseDraft] = useState<CourseDraft>({
    title: '',
    description: '',
    area: 'Ingeniería',
    level: 'Intermedio',
    duration: '2h 00m',
    thumbnail: '',
  });

  useEffect(() => {
    setCourses(getStoredCourses());
  }, []);

  const handleDeleteCourse = (courseId: string) => {
    if (!window.confirm('Quieres eliminar este curso?')) return;
    const nextCourses = deleteStoredCourse(courseId);
    setCourses(nextCourses);
  };

  const handleCreateCourse = () => {
    if (!courseDraft.title.trim() || !courseDraft.description.trim()) return;
    const createdCourse = addStoredCourse(courseDraft);
    setCourses((current) => [createdCourse, ...current]);
    setShowCourseModal(false);
    setCourseDraft({ title: '', description: '', area: 'Ingeniería', level: 'Intermedio', duration: '2h 00m', thumbnail: '' });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Gestión de Contenido</h1>
          <p className="text-slate-500 font-medium">GIT Labs Central: Crea y administra recursos de aprendizaje.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button className="px-6 py-3 bg-white border border-slate-200 text-on-surface font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">upload_file</span> <span className="whitespace-nowrap">Cargar Masivo</span>
          </button>
          <button 
            onClick={() => setShowGemaModal(true)}
            className="px-6 py-3 bg-white border border-primary text-primary font-bold rounded-2xl hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">auto_awesome</span> <span className="whitespace-nowrap">Nueva Gema</span>
          </button>
          <button 
            onClick={() => setShowCourseModal(true)}
            className="px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">add</span> <span className="whitespace-nowrap">Nuevo Curso</span>
          </button>
        </div>
      </header>

      <div className="flex gap-4 border-b border-slate-100 pb-4">
        <button 
          onClick={() => setActiveTab('courses')}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'courses' ? 'bg-primary text-white' : 'text-slate-400 hover:text-primary'}`}
        >
          Cursos
        </button>
        <button 
          onClick={() => setActiveTab('gemas')}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'gemas' ? 'bg-primary text-white' : 'text-slate-400 hover:text-primary'}`}
        >
          Gemas (Prompts)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Content List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">
                {activeTab === 'courses' ? 'Cursos Publicados' : 'Gemas Publicadas'}
              </h3>
              <div className="flex gap-2">
                <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-sm">filter_list</span>
                </button>
                <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-sm">search</span>
                </button>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {activeTab === 'courses' ? (
                courses.map(course => (
                  <div key={course.id} className="p-6 flex items-center gap-6 hover:bg-slate-50 transition-colors group">
                    <img src={course.thumbnail} alt="" className="w-16 h-16 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-on-surface truncate">{course.title}</h4>
                      <p className="text-xs text-slate-500">{course.area} • {course.modules.length} Módulos</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                        <span className="text-xs font-bold text-green-600">Publicado</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button onClick={() => handleDeleteCourse(String(course.id))} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                MOCK_PROMPTS.map(prompt => (
                  <div key={prompt.id} className="p-6 flex items-center gap-6 hover:bg-slate-50 transition-colors group">
                    <div className="w-16 h-16 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">terminal</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-on-surface truncate">{prompt.title}</h4>
                      <p className="text-xs text-slate-500">{prompt.area} • Impacto: {prompt.impact}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                        <span className="text-xs font-bold text-green-600">Activa</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions and Stats */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-on-surface mb-6">Gobernanza GIT Labs</h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-primary">verified_user</span>
                  <p className="text-sm font-bold text-on-surface">Control de Calidad</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Todo el contenido debe ser validado por el equipo de GIT Labs antes de su publicación global.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-primary">cloud_upload</span>
                  <p className="text-sm font-bold text-on-surface">Límite de Archivos</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Archivos directos limitados a 5MB. Para recursos pesados, utiliza enlaces a Google Drive corporativo.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-on-surface mb-6">Gemas Pendientes</h3>
            <div className="space-y-4">
              <p className="text-xs text-slate-400 italic">No hay gemas pendientes de revisión.</p>
              <button className="w-full py-3 bg-slate-50 text-slate-500 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all">
                Ver Historial de Revisiones
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCourseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCourseModal(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h2 className="text-2xl font-black text-on-surface">Crear Nuevo Curso</h2>
                <button onClick={() => setShowCourseModal(false)} className="text-slate-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título del Curso</label>
                  <input
                    type="text"
                    value={courseDraft.title}
                    onChange={(event) => setCourseDraft((current) => ({ ...current, title: event.target.value }))}
                    className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium"
                    placeholder="Ej. Introducción a Gemini en Manufactura"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Área</label>
                    <select
                      value={courseDraft.area}
                      onChange={(event) => setCourseDraft((current) => ({ ...current, area: event.target.value }))}
                      className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium"
                    >
                      <option>Ingeniería</option>
                      <option>Marketing</option>
                      <option>HR</option>
                      <option>Operaciones</option>
                      <option>General</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nivel</label>
                    <select
                      value={courseDraft.level}
                      onChange={(event) => setCourseDraft((current) => ({ ...current, level: event.target.value as CourseDraft['level'] }))}
                      className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium"
                    >
                      <option>Básico</option>
                      <option>Intermedio</option>
                      <option>Avanzado</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</label>
                  <textarea
                    value={courseDraft.description}
                    onChange={(event) => setCourseDraft((current) => ({ ...current, description: event.target.value }))}
                    className="w-full p-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium h-32 resize-none"
                    placeholder="Describe los objetivos del curso..."
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material del Curso</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex flex-col items-center gap-3 p-6 bg-slate-50 border-2 border-transparent hover:border-primary rounded-2xl transition-all group">
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-primary">picture_as_pdf</span>
                      <span className="text-sm font-bold text-slate-600 group-hover:text-on-surface">Subir PDF</span>
                    </button>
                    <button className="flex flex-col items-center gap-3 p-6 bg-slate-50 border-2 border-transparent hover:border-primary rounded-2xl transition-all group">
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-primary">video_library</span>
                      <span className="text-sm font-bold text-slate-600 group-hover:text-on-surface">Enlace Video</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    <input type="text" className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium text-sm" placeholder="URL del recurso (Drive, YouTube, etc.)" />
                  </div>
                </div>
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                  <span className="material-symbols-outlined text-slate-300 text-4xl">image</span>
                  <p className="text-sm font-bold text-slate-500">Sube una miniatura para el curso</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">JPG, PNG hasta 2MB</p>
                  <input
                    type="text"
                    value={courseDraft.thumbnail}
                    onChange={(event) => setCourseDraft((current) => ({ ...current, thumbnail: event.target.value }))}
                    className="mt-4 w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium text-sm"
                    placeholder="URL de miniatura opcional"
                  />
                </div>
              </div>
              <div className="p-8 bg-slate-50 flex justify-end gap-4">
                <button onClick={() => setShowCourseModal(false)} className="px-6 py-3 font-bold text-slate-500 hover:text-on-surface transition-colors">Cancelar</button>
                <button onClick={handleCreateCourse} className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">Crear Curso</button>
              </div>
            </motion.div>
          </div>
        )}

        {showGemaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGemaModal(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h2 className="text-2xl font-black text-on-surface">Crear Nueva Gema</h2>
                <button onClick={() => setShowGemaModal(false)} className="text-slate-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título de la Gema</label>
                  <input type="text" className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium" placeholder="Ej. Optimizador de Código Python" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Área de Aplicación</label>
                    <select className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium">
                      <option>Ingeniería</option>
                      <option>Marketing</option>
                      <option>HR</option>
                      <option>Operaciones</option>
                      <option>Ventas</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impacto Estimado</label>
                    <input type="text" className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium" placeholder="Ej. 2h/semana" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prompt (Instrucción)</label>
                  <textarea className="w-full p-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium h-48 resize-none" placeholder="Escribe el prompt detallado aquí..."></textarea>
                </div>
              </div>
              <div className="p-8 bg-slate-50 flex justify-end gap-4">
                <button onClick={() => setShowGemaModal(false)} className="px-6 py-3 font-bold text-slate-500 hover:text-on-surface transition-colors">Cancelar</button>
                <button className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">Publicar Gema</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
