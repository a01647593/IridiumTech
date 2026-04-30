import { useEffect, useState, type FormEvent } from 'react';
import { fetchDepartments, type Department } from '../lib/departmentService';
import { getUserProfile } from '../lib/profileService';
import { upsertUserProfile } from '../lib/profileUpdateService';
import { supabase } from '../lib/supabaseClient';
import type { User } from '../types';

interface CompleteProfilePageProps {
  onComplete: (user: User) => void;
}

export default function CompleteProfilePage({ onComplete }: CompleteProfilePageProps) {
  const [nombre, setNombre] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDepartments().then(setDepartments);

    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata;
      const suggested =
        (meta?.full_name as string | undefined) ||
        (meta?.name as string | undefined) ||
        '';
      if (suggested) setNombre(suggested);
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError('Ingresa tu nombre.'); return; }
    if (departmentId === '') { setError('Selecciona tu departamento.'); return; }

    setLoading(true);
    setError('');

    try {
      const { data } = await supabase.auth.getUser();
      const authUser = data.user;
      if (!authUser) throw new Error('Sin sesión activa.');

      await upsertUserProfile(authUser.id, authUser.email ?? '', {
        nombre: nombre.trim(),
        department_id: departmentId as number,
        avatar_url: (authUser.user_metadata?.avatar_url as string | undefined) ?? undefined,
      });

      const profile = await getUserProfile(authUser.id);
      if (!profile) throw new Error('No se pudo cargar el perfil.');

      onComplete(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-blue/5 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />

      <div className="w-full max-w-md z-10">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 sm:p-12">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-3xl">person_add</span>
            </div>
            <h1 className="text-2xl font-black text-on-surface tracking-tight">Completa tu perfil</h1>
            <p className="text-sm text-slate-500 mt-1">Necesitamos unos datos antes de continuar.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Nombre completo
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => { setNombre(e.target.value); setError(''); }}
                placeholder="Tu nombre"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Departamento
              </label>
              <select
                value={departmentId}
                onChange={(e) => { setDepartmentId(e.target.value === '' ? '' : Number(e.target.value)); setError(''); }}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              >
                <option value="">Selecciona un departamento</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                  Guardando...
                </>
              ) : (
                <>
                  Continuar
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
