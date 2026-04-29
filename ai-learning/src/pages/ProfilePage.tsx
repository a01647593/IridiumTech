import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Badge } from '../types';
import { MOCK_COURSES } from '../constants';
import { updateUserProfile } from '../lib/profileUpdateService.ts';
import { getUserProfile } from '../lib/profileService';

interface ProfilePageProps {
  user: User;
  onUserUpdated: (user: User) => void;
}

export default function ProfilePage({ user, onUserUpdated }: ProfilePageProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editAvatar, setEditAvatar] = useState(user.avatar);
  const [saving, setSaving] = useState(false);

  const completedCourses = MOCK_COURSES.filter((c) =>
    user.completedCourses.includes(c.id)
  );

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;

    setSaving(true);

    try {
      await updateUserProfile(user.id, {
        nombre: editName.trim(),
        avatar_url: editAvatar.trim(),
      });

      const refreshedUser = await getUserProfile(user.id);

      if (refreshedUser) {
        onUserUpdated(refreshedUser);
        localStorage.setItem('whirlpool_user', JSON.stringify(refreshedUser));
      }

      setShowEditModal(false);
    } catch (error) {
      console.error(error);
      alert('No se pudo actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
      <div className="relative h-48 sm:h-64 bg-gradient-to-r from-primary to-accent-blue rounded-[2.5rem] overflow-hidden shadow-xl shadow-primary/10">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay">
          <img
            src="https://picsum.photos/seed/profile-bg/1200/400"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="px-8 -mt-24 relative z-10 flex flex-col md:flex-row gap-8 items-start">
        <div className="relative">
          <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] object-cover"
            />
          </div>
        </div>

        <div className="pt-24 md:pt-28 flex-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-on-surface tracking-tight">
                {user.name}
              </h1>
              <p className="text-slate-500 font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">work</span>
                {user.area} • Whirlpool Corporation
              </p>
            </div>

            <button
              onClick={() => setShowEditModal(true)}
              className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-on-surface hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Editar Perfil
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-2xl font-black text-on-surface">
                  Editar Perfil
                </h2>
                <button onClick={() => setShowEditModal(false)}>
                  <span className="material-symbols-outlined text-slate-400">
                    close
                  </span>
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Nombre
                  </label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    URL Avatar
                  </label>
                  <input
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div className="flex justify-center">
                  <img
                    src={editAvatar}
                    alt=""
                    className="w-24 h-24 rounded-2xl object-cover border"
                  />
                </div>
              </div>

              <div className="p-8 bg-slate-50 flex justify-end gap-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 text-slate-500 font-bold"
                >
                  Cancelar
                </button>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg hover:scale-105 transition-all disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-on-surface">
              Estadísticas de Aprendizaje
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Total XP
                </p>
                <p className="text-2xl font-black text-primary">{user.score}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Racha
                </p>
                <p className="text-2xl font-black text-amber-500">
                  {user.streak} Días
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Cursos
                </p>
                <p className="text-2xl font-black text-on-surface">
                  {user.completedCourses.length}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Quizzes
                </p>
                <p className="text-2xl font-black text-on-surface">
                  {user.completedQuizzesCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-on-surface mb-6">
              Insignias Obtenidas
            </h3>

            <div className="grid grid-cols-3 gap-4">
              {user.badges.map((badge: Badge) => (
                <div key={badge.id} className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                    <span className="material-symbols-outlined text-2xl">
                      {badge.icon}
                    </span>
                  </div>
                  <p className="text-[10px] text-center mt-2 font-bold text-slate-500">
                    {badge.name}
                  </p>
                </div>
              ))}

              {user.badges.length === 0 && (
                <p className="col-span-3 text-center text-xs text-slate-400">
                  Aún no has ganado insignias.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-on-surface mb-6">
              Cursos Completados
            </h3>

            <div className="space-y-4">
              {completedCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl"
                >
                  <img
                    src={course.thumbnail}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-bold">{course.title}</h4>
                    <p className="text-xs text-slate-500">
                      {course.area} • {course.level}
                    </p>
                  </div>
                </div>
              ))}

              {completedCourses.length === 0 && (
                <p className="text-center text-slate-400 py-6">
                  No has completado cursos todavía.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}