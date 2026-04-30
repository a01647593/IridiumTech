import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_PROMPTS } from '../constants';
import { fetchCoursesDeep, createCourseDB, deleteCourseDB, addLessonDB, deleteLessonDB, type CourseDraft, syncQuizDB } from '../lib/courseService';
import type { Course } from '../types';
import { supabase } from '../lib/supabaseClient';

export default function ContentManagementPage() {
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showGemaModal, setShowGemaModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'courses' | 'gemas'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseDraft, setCourseDraft] = useState<CourseDraft>({
    title: '',
    description: '',
    area: 'Ingeniería',
    level: 'Intermedio',
    thumbnail: '',
  });
  const [moduleDraft, setModuleDraft] = useState({
    title: '',
    duration: '45m',
    pdfUrl: '',
    pdfFile: null as File | null,
    videoUrl: '',
    addQuiz: true,
  });

  useEffect(() => {
    loadCourses();
  }, []);
  
  const loadCourses = async () => {
    try {
      const dbCourses = await fetchCoursesDeep();
      setCourses(dbCourses);
    } catch (error) {
      console.error('Error cargando cursos:', error);
    }
  };

  const persistEditedCourse = (nextCourse: Course) => {
    setEditingCourse(nextCourse);
  };

  const createDefaultQuizTemplate = (moduleTitle: string) => ({
    id: `q-new-${Date.now()}`,
    title: `Quiz: ${moduleTitle}`,
    questions: [
      {
        id: `q-${Date.now()}`,
        question: 'Pregunta de prueba',
        options: ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4'],
        correctAnswer: 0,
      }
    ]
  });

  const handleSaveAllChanges = async () => {
    if (!editingCourse) return;
    
    try {
      for (const module of editingCourse.modules) {
        await syncQuizDB(module.id, module.quiz);
      }
      
      await loadCourses();
      alert('Cambios guardados con éxito');
      setShowEditCourseModal(false);
    } catch (error) {
      console.error('Error guardando los cambios del curso:', error);
      alert('Hubo un error al guardar los cambios.');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Quieres eliminar este curso?')) return;
  
    try {
      await deleteCourseDB(courseId);
      await loadCourses();
    } catch (error) {
      console.error('Error eliminando curso:', error);
      alert('No se pudo eliminar el curso.');
    }
  };

  const handleCreateCourse = async () => {
    if (!courseDraft.title.trim() || !courseDraft.description.trim()) return;
  
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
  
      if (!user) {
        alert('No se pudo identificar el usuario actual.');
        return;
      }
  
      await createCourseDB(courseDraft, user.id);
      await loadCourses();
  
      setShowCourseModal(false);
      setCourseDraft({
        title: '',
        description: '',
        area: 'Ingeniería',
        level: 'Intermedio',
        thumbnail: '',
      });
    } catch (error) {
      console.error('Error creando curso:', error);
      alert('No se pudo crear el curso.');
    }
  };

  const handleThumbnailUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCourseDraft((current) => ({ ...current, thumbnail: String(reader.result ?? '') }));
    };
    reader.readAsDataURL(file);
  };

  const openEditCourse = (course: Course) => {
    setEditingCourse(course);
    setModuleDraft({ title: '', duration: '45m', pdfUrl: '', videoUrl: '', addQuiz: true });
    setShowEditCourseModal(true);
  };

  const handleAddModule = async () => {
    if (!editingCourse || !moduleDraft.title.trim()) return;
  
    try {
      await addLessonDB(String(editingCourse.id), moduleDraft);
  
      const refreshed = await fetchCoursesDeep();
      setCourses(refreshed);
  
      const updatedEditing = refreshed.find((c) => String(c.id) === String(editingCourse.id)) || null;
      setEditingCourse(updatedEditing);
  
      setModuleDraft({
        title: '',
        duration: '45m',
        pdfUrl: '',
        pdfFile: null,
        videoUrl: '',
        addQuiz: true,
      });
    } catch (error) {
      console.error('Error agregando módulo:', error);
      alert('No se pudo agregar el módulo.');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!editingCourse) return;
  
    try {
      await deleteLessonDB(moduleId);
  
      const refreshed = await fetchCoursesDeep();
      setCourses(refreshed);
  
      const updatedEditing = refreshed.find((c) => String(c.id) === String(editingCourse.id)) || null;
      setEditingCourse(updatedEditing);
    } catch (error) {
      console.error('Error eliminando módulo:', error);
      alert('No se pudo eliminar el módulo.');
    }
  };

  const handleAttachDefaultQuiz = (moduleId: string) => {
    if (!editingCourse) return;
    const nextCourse = {
      ...editingCourse,
      modules: editingCourse.modules.map((module) =>
        module.id === moduleId ? { ...module, quiz: createDefaultQuizTemplate(module.title) } : module
      ),
    };
    persistEditedCourse(nextCourse);
  };

  const handleRemoveQuiz = (moduleId: string) => {
    if (!editingCourse) return;
    const nextCourse = {
      ...editingCourse,
      modules: editingCourse.modules.map((module) =>
        module.id === moduleId ? { ...module, quiz: undefined } : module
      ),
    };
    persistEditedCourse(nextCourse);
  };

  const handleQuizTitleChange = (moduleId: string, title: string) => {
    if (!editingCourse) return;
    const nextCourse = {
      ...editingCourse,
      modules: editingCourse.modules.map((module) => {
        if (module.id !== moduleId || !module.quiz) return module;
        return { ...module, quiz: { ...module.quiz, title } };
      }),
    };
    persistEditedCourse(nextCourse);
  };

  const handleQuizQuestionChange = (moduleId: string, questionId: string, question: string) => {
    if (!editingCourse) return;
    const nextCourse = {
      ...editingCourse,
      modules: editingCourse.modules.map((module) => {
        if (module.id !== moduleId || !module.quiz) return module;
        return {
          ...module,
          quiz: {
            ...module.quiz,
            questions: module.quiz.questions.map((item) =>
              item.id === questionId ? { ...item, question } : item
            ),
          },
        };
      }),
    };
    persistEditedCourse(nextCourse);
  };

  const handleQuizOptionChange = (moduleId: string, questionId: string, optionIndex: number, value: string) => {
    if (!editingCourse) return;
    const nextCourse = {
      ...editingCourse,
      modules: editingCourse.modules.map((module) => {
        if (module.id !== moduleId || !module.quiz) return module;
        return {
          ...module,
          quiz: {
            ...module.quiz,
            questions: module.quiz.questions.map((item) => {
              if (item.id !== questionId) return item;
              const nextOptions = [...item.options];
              nextOptions[optionIndex] = value;
              return { ...item, options: nextOptions };
            }),
          },
        };
      }),
    };
    persistEditedCourse(nextCourse);
  };

  const handleQuizCorrectAnswerChange = (moduleId: string, questionId: string, optionIndex: number) => {
    if (!editingCourse) return;
    const nextCourse = {
      ...editingCourse,
      modules: editingCourse.modules.map((module) => {
        if (module.id !== moduleId || !module.quiz) return module;
        return {
          ...module,
          quiz: {
            ...module.quiz,
            questions: module.quiz.questions.map((item) =>
              item.id === questionId ? { ...item, correctAnswer: optionIndex } : item
            ),
          },
        };
      }),
    };
    persistEditedCourse(nextCourse);
  };

  const handleAddQuizQuestion = (moduleId: string) => {
    if (!editingCourse) return;
    const nextCourse = {
      ...editingCourse,
      modules: editingCourse.modules.map((module) => {
        if (module.id !== moduleId || !module.quiz) return module;
        const newQuestion = {
          id: `q-${Date.now()}`,
          question: `Pregunta ${module.quiz.questions.length + 1}`,
          options: ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4'],
          correctAnswer: 0,
        };
        return {
          ...module,
          quiz: {
            ...module.quiz,
            questions: [...module.quiz.questions, newQuestion],
          },
        };
      }),
    };
    persistEditedCourse(nextCourse);
  };

  const handleRemoveQuizQuestion = (moduleId: string, questionId: string) => {
    if (!editingCourse) return;
    const nextCourse = {
      ...editingCourse,
      modules: editingCourse.modules.map((module) => {
        if (module.id !== moduleId || !module.quiz) return module;
        return {
          ...module,
          quiz: {
            ...module.quiz,
            questions: module.quiz.questions.filter((item) => item.id !== questionId),
          },
        };
      }),
    };
    persistEditedCourse(nextCourse);
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
                        <button onClick={() => openEditCourse(course)} className="p-2 text-slate-400 hover:text-primary transition-colors">
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
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                  <span className="material-symbols-outlined text-slate-300 text-4xl">image</span>
                  <p className="text-sm font-bold text-slate-500">Miniatura del curso (URL o archivo)</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">JPG, PNG hasta 2MB</p>
                  <input
                    type="text"
                    value={courseDraft.thumbnail}
                    onChange={(event) => setCourseDraft((current) => ({ ...current, thumbnail: event.target.value }))}
                    className="mt-4 w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium text-sm"
                    placeholder="URL de miniatura opcional"
                  />
                  <label className="inline-flex mt-2 items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50">
                    <span className="material-symbols-outlined text-sm">upload</span>
                    Subir miniatura
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleThumbnailUpload(event.target.files?.[0])}
                    />
                  </label>
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

        {showEditCourseModal && editingCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditCourseModal(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-on-surface">Editar Curso</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {editingCourse.title} • {editingCourse.area} • {editingCourse.level}
                  </p>
                </div>
                <button onClick={() => setShowEditCourseModal(false)} className="text-slate-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar space-y-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-on-surface">Módulos del curso</h3>
                  {editingCourse.modules.length === 0 && (
                    <div className="p-6 rounded-2xl bg-slate-50 text-sm text-slate-500">
                      Este curso aún no tiene módulos. Agrega el primero abajo.
                    </div>
                  )}
                  {editingCourse.modules.map((module) => (
                    <div key={module.id} className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-on-surface">{module.title}</p>
                          <p className="text-xs text-slate-500">
                            {module.duration} • {(module.resources?.length ?? 0)} recurso(s) • {module.quiz ? 'Quiz activo' : 'Sin quiz'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!module.quiz ? (
                            <button
                              onClick={() => handleAttachDefaultQuiz(module.id)}
                              className="px-3 py-2 text-xs font-bold rounded-xl bg-primary/10 text-primary hover:bg-primary/20"
                            >
                              Agregar Quiz
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRemoveQuiz(module.id)}
                              className="px-3 py-2 text-xs font-bold rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200"
                            >
                              Quitar Quiz
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteModule(module.id)}
                            className="px-3 py-2 text-xs font-bold rounded-xl bg-red-100 text-red-600 hover:bg-red-200"
                          >
                            Eliminar módulo
                          </button>
                        </div>
                      </div>
                      {module.resources && module.resources.length > 0 && (
                        <div className="grid sm:grid-cols-2 gap-2">
                          {module.resources.map((resource) => (
                            <a
                              key={resource.id}
                              href={resource.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-2 rounded-xl bg-slate-50 text-xs text-slate-600 font-medium hover:bg-slate-100"
                            >
                              {resource.type.toUpperCase()} • {resource.label}
                            </a>
                          ))}
                        </div>
                      )}
                      {module.quiz && (
                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Título del Quiz</label>
                            <input
                              type="text"
                              value={module.quiz.title}
                              onChange={(event) => handleQuizTitleChange(module.id, event.target.value)}
                              className="w-full h-10 px-3 rounded-lg bg-white text-sm text-slate-700"
                            />
                          </div>

                          <div className="space-y-4">
                            {module.quiz.questions.map((question, questionIndex) => (
                              <div key={question.id} className="p-3 rounded-lg bg-white border border-blue-100 space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    Pregunta {questionIndex + 1}
                                  </label>
                                  <button
                                    onClick={() => handleRemoveQuizQuestion(module.id, question.id)}
                                    className="text-[10px] font-bold text-red-500 hover:text-red-700"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={question.question}
                                  onChange={(event) => handleQuizQuestionChange(module.id, question.id, event.target.value)}
                                  className="w-full h-10 px-3 rounded-lg bg-slate-50 text-sm"
                                  placeholder="Escribe la pregunta"
                                />
                                <div className="grid sm:grid-cols-2 gap-2">
                                  {question.options.map((option, optionIndex) => (
                                    <label key={`${question.id}-opt-${optionIndex}`} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                                      <input
                                        type="radio"
                                        name={`correct-${module.id}-${question.id}`}
                                        checked={question.correctAnswer === optionIndex}
                                        onChange={() => handleQuizCorrectAnswerChange(module.id, question.id, optionIndex)}
                                      />
                                      <input
                                        type="text"
                                        value={option}
                                        onChange={(event) => handleQuizOptionChange(module.id, question.id, optionIndex, event.target.value)}
                                        className="flex-1 bg-transparent text-sm outline-none"
                                        placeholder={`Opción ${optionIndex + 1}`}
                                      />
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() => handleAddQuizQuestion(module.id)}
                            className="px-3 py-2 text-xs font-bold rounded-lg bg-white text-primary border border-primary/30 hover:bg-primary/5"
                          >
                            Agregar pregunta
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-4 border-t border-slate-100 pt-6">
                  <h3 className="text-lg font-bold text-on-surface">Agregar Módulo</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título del Módulo</label>
                      <input
                        type="text"
                        value={moduleDraft.title}
                        onChange={(event) => setModuleDraft((current) => ({ ...current, title: event.target.value }))}
                        className="w-full h-12 px-4 bg-slate-50 rounded-xl"
                        placeholder="Ej. Introducción a Prompt Engineering"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duración</label>
                      <input
                        type="text"
                        value={moduleDraft.duration}
                        onChange={(event) => setModuleDraft((current) => ({ ...current, duration: event.target.value }))}
                        className="w-full h-12 px-4 bg-slate-50 rounded-xl"
                        placeholder="Ej. 45m"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                        <input
                          type="checkbox"
                          checked={moduleDraft.addQuiz}
                          onChange={(event) => setModuleDraft((current) => ({ ...current, addQuiz: event.target.checked }))}
                        />
                        Agregar Quiz
                      </label>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Material PDF (Sube un archivo O pega una URL)
                        </label>
                        <div className="flex gap-2">
                          {/* Opción 1: Subir Archivo */}
                          <label className="flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer transition-colors text-sm font-bold">
                            <span className="material-symbols-outlined mr-2 text-sm">upload_file</span>
                            {moduleDraft.pdfFile ? 'Archivo seleccionado' : 'Subir Local'}
                            <input
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              onChange={(event) => {
                                const file = event.target.files?.[0] || null;
                                setModuleDraft((current) => ({ ...current, pdfFile: file, pdfUrl: '' }));
                              }}
                            />
                          </label>

                          {/* Opción 2: Pegar URL */}
                          <input
                            type="text"
                            value={moduleDraft.pdfUrl}
                            disabled={!!moduleDraft.pdfFile}
                            onChange={(event) => setModuleDraft((current) => ({ ...current, pdfUrl: event.target.value }))}
                            className="flex-1 h-12 px-4 bg-slate-50 rounded-xl disabled:opacity-50"
                            placeholder="https://... o usa el botón de subir"
                          />
                        </div>
                        {moduleDraft.pdfFile && (
                          <p className="text-xs text-primary font-bold mt-1">
                            Archivo listo para subir: {moduleDraft.pdfFile.name}
                          </p>
                        )}
                      </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URL Video (opcional)</label>
                      <input
                        type="text"
                        value={moduleDraft.videoUrl}
                        onChange={(event) => setModuleDraft((current) => ({ ...current, videoUrl: event.target.value }))}
                        className="w-full h-12 px-4 bg-slate-50 rounded-xl"
                        placeholder="https://...video"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddModule}
                    className="px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                  >
                    Agregar Módulo
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-50 flex justify-end gap-4">
                <button
                  onClick={() => setShowEditCourseModal(false)}
                  className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-on-surface transition-colors"
                >
                  Cancelar
                </button>
              <button
                  onClick={handleSaveAllChanges}
                 className="px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
               >
                 Guardar Cambios
               </button>
             </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
