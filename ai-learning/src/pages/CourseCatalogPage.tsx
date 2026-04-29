import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { listCourses } from '../lib/courseService'; // <-- Importamos tu servicio real

// Añadimos la prop del usuario para poder enviarlo a la BD y calcular su progreso
export default function CourseCatalogPage({ user }: { user?: any }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]); // Usamos any o Course ajustado
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState('Todas');
  const [selectedLevel, setSelectedLevel] = useState('Todos');

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      try {
        // Pedimos los cursos al servicio, pasando el ID del usuario si existe
        const data = await listCourses({ usuarioId: user?.id, soloActivos: true });
        setCourses(data);
      } catch (error) {
        console.error('Error cargando el catálogo de cursos:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, [user]);

  const filteredCourses = courses.filter(c => {
    const matchesArea = selectedArea === 'Todas' || c.area === selectedArea;
    const matchesLevel = selectedLevel === 'Todos' || c.level === selectedLevel;
    return matchesArea && matchesLevel;
  });

  const areas = ['Todas', ...new Set(courses.map(c => c.area))];
  const levels = ['Todos', 'Básico', 'Intermedio', 'Avanzado'];

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-black tracking-tight text-primary leading-tight">
            Catálogo de Aprendizaje <span className="text-on-surface">GIT Labs</span>
          </h1>
          <p className="text-slate-500 mt-4 text-lg font-medium">
            Domina las herramientas de IA Generativa y metodologías avanzadas para liderar la transformación digital en Whirlpool.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="space-y-2 flex-1 sm:flex-none">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar por Área</p>
            <select 
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full sm:w-48 h-12 px-4 bg-white border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              {areas.map(area => <option key={area} value={area}>{area}</option>)}
            </select>
          </div>
          <div className="space-y-2 flex-1 sm:flex-none">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nivel</p>
            <select 
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full sm:w-48 h-12 px-4 bg-white border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              {levels.map(level => <option key={level} value={level}>{level}</option>)}
            </select>
          </div>
        </div>
      </header>

      {loading && (
        <div className="py-20 text-center">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-4 block">progress_activity</span>
          <div className="text-sm font-bold text-slate-500">Cargando catálogo...</div>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course, i) => {
            // Extraemos el progreso usando la estructura de tu servicio real
            const percentage = course.progreso?.porcentaje || 0;

            return (
              <motion.div 
                key={course.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/courses/${course.id}`)} 
                className="group bg-white rounded-[2.5rem] overflow-hidden cursor-pointer border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col"
              >
                <div className="h-56 overflow-hidden relative bg-slate-100">
                  {/* Se mantiene el fallback por si algún curso no tiene imagen */}
                  <img 
                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" 
                    src={course.thumbnail || `https://picsum.photos/seed/${course.id}/600/400`} 
                    alt={course.title} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                  <div className="absolute top-6 left-6 flex gap-2">
                    <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-primary shadow-sm">
                      {course.area}
                    </span>
                    {course.isNew && (
                      <span className="bg-accent-blue text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                        Nuevo
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1 drop-shadow-md">
                      <span className="material-symbols-outlined text-sm">schedule</span> {course.duration}
                    </span>
                    <span className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1 drop-shadow-md">
                      <span className="material-symbols-outlined text-sm">signal_cellular_alt</span> {course.level}
                    </span>
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors leading-tight">{course.title}</h3>
                  <p className="text-slate-500 text-sm mb-8 line-clamp-2 flex-1 leading-relaxed">{course.description}</p>
                  
                  <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex flex-col flex-1 mr-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tu Progreso</span>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <span className={`text-xs font-bold ${percentage === 100 ? 'text-green-600' : 'text-slate-400'}`}>
                          {percentage}%
                        </span>
                      </div>
                    </div>
                    <button className="px-6 py-3 bg-primary text-white text-xs font-bold rounded-2xl uppercase tracking-widest shadow-lg shadow-primary/20 group-hover:scale-105 transition-all">
                      {percentage > 0 ? 'Continuar' : 'Empezar'}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loading && filteredCourses.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-slate-300 text-4xl">search_off</span>
          </div>
          <h3 className="text-xl font-bold text-slate-400">No encontramos cursos con estos filtros</h3>
          <p className="text-slate-400 mt-2">Prueba ajustando el área o nivel de dificultad.</p>
        </div>
      )}
    </div>
  );
}