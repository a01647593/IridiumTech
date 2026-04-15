import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Badge } from '../types';
import { MOCK_BADGES, MOCK_COURSES } from '../constants';

interface ProfilePageProps {
  user: User;
}

export default function ProfilePage({ user }: ProfilePageProps) {
  const [avatar, setAvatar] = useState(user.avatar);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const completedCourses = MOCK_COURSES.filter(c => user.completedCourses.includes(c.id));

  const handleUpdatePhoto = () => {
    if (newAvatarUrl) {
      setAvatar(newAvatarUrl);
      setShowPhotoModal(false);
      setNewAvatarUrl('');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
      {/* Header / Cover */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-r from-primary to-accent-blue rounded-[2.5rem] overflow-hidden shadow-xl shadow-primary/10">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay">
          <img src="https://picsum.photos/seed/profile-bg/1200/400" alt="" className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="px-8 -mt-24 relative z-10 flex flex-col md:flex-row gap-8 items-start">
        {/* Avatar and Basic Info */}
        <div className="relative group">
          <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl">
            <img src={avatar} alt={user.name} className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] object-cover" />
          </div>
          <button 
            onClick={() => setShowPhotoModal(true)}
            className="absolute bottom-2 right-2 p-3 bg-primary text-white rounded-2xl shadow-lg hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
          >
            <span className="material-symbols-outlined text-sm">photo_camera</span>
          </button>
        </div>
        
        <div className="pt-24 md:pt-28 flex-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-on-surface tracking-tight">{user.name}</h1>
              <p className="text-slate-500 font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">work</span>
                {user.area} • Whirlpool Corporation
              </p>
            </div>
            <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-on-surface hover:bg-slate-50 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">edit</span> Editar Perfil
            </button>
          </div>
        </div>
      </div>

      {/* Photo Change Modal */}
      <AnimatePresence>
        {showPhotoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPhotoModal(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h2 className="text-2xl font-black text-on-surface">Cambiar Foto</h2>
                <button onClick={() => setShowPhotoModal(false)} className="text-slate-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URL de la Imagen</label>
                  <input 
                    type="text" 
                    value={newAvatarUrl}
                    onChange={(e) => setNewAvatarUrl(e.target.value)}
                    className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium" 
                    placeholder="https://ejemplo.com/foto.jpg" 
                  />
                </div>
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                  <span className="material-symbols-outlined text-slate-300 text-4xl">cloud_upload</span>
                  <p className="text-sm font-bold text-slate-500">O sube un archivo</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">JPG, PNG hasta 1MB</p>
                </div>
              </div>
              <div className="p-8 bg-slate-50 flex justify-end gap-4">
                <button onClick={() => setShowPhotoModal(false)} className="px-6 py-3 font-bold text-slate-500 hover:text-on-surface transition-colors">Cancelar</button>
                <button 
                  onClick={handleUpdatePhoto}
                  className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  Actualizar Foto
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Stats and Badges */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-on-surface">Estadísticas de Aprendizaje</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total XP</p>
                <p className="text-2xl font-black text-primary">{user.score}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Racha</p>
                <p className="text-2xl font-black text-amber-500">{user.streak} Días</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cursos</p>
                <p className="text-2xl font-black text-on-surface">{user.completedCourses.length}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quizzes</p>
                <p className="text-2xl font-black text-on-surface">{user.completedQuizzesCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-on-surface mb-6">Insignias Obtenidas</h3>
            <div className="grid grid-cols-3 gap-4">
              {user.badges.map((badge: Badge) => (
                <div key={badge.id} className="group relative flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                    <span className="material-symbols-outlined text-2xl">{badge.icon}</span>
                  </div>
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-32 p-2 bg-on-surface text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center">
                    <p className="font-bold">{badge.name}</p>
                    <p className="text-white/60">{badge.description}</p>
                  </div>
                </div>
              ))}
              {user.badges.length === 0 && (
                <p className="col-span-3 text-center text-xs text-slate-400 py-4">Aún no has ganado insignias.</p>
              )}
            </div>
          </div>
        </div>

        {/* Activity and Courses */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-on-surface mb-6">Cursos Completados</h3>
            <div className="space-y-4">
              {completedCourses.map(course => (
                <div key={course.id} className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <img src={course.thumbnail} alt="" className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1">
                    <h4 className="font-bold text-on-surface">{course.title}</h4>
                    <p className="text-xs text-slate-500">{course.area} • {course.level}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full">Completado</span>
                    <p className="text-[10px] text-slate-400 mt-1">Finalizado en 2024</p>
                  </div>
                </div>
              ))}
              {completedCourses.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-400 font-medium">No has completado cursos todavía.</p>
                  <button className="text-primary font-bold text-sm mt-2 hover:underline">Explorar catálogo</button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-on-surface mb-6">Gemas Guardadas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.savedPrompts.map(promptId => (
                <div key={promptId} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                    <span className="material-symbols-outlined text-lg">terminal</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface truncate">Prompt de Ingeniería #{promptId}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Gema Guardada</p>
                  </div>
                  <button className="text-slate-400 hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined text-lg">bookmark_remove</span>
                  </button>
                </div>
              ))}
              {user.savedPrompts.length === 0 && (
                <p className="col-span-2 text-center text-xs text-slate-400 py-8">No has guardado gemas aún.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
