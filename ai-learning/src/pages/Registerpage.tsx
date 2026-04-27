import { motion } from 'motion/react';
import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import whirlpoolLogo from '../assets/logowhirlpoolblack.png';
import { supabase } from '../lib/supabaseClient';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AREAS = [
  'Ingeniería',
  'Marketing',
  'Finanzas',
  'HR',
  'Operaciones',
  'Innovación',
  'General',
];

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    area: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '', general: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};

    if (!form.name.trim()) next.name = 'Ingresa tu nombre completo.';

    if (!form.email.trim()) {
      next.email = 'Ingresa tu correo.';
    } else if (!EMAIL_PATTERN.test(form.email.trim())) {
      next.email = 'Ingresa un correo válido.';
    }

    if (!form.area) next.area = 'Selecciona tu área.';

    if (!form.password) {
      next.password = 'Ingresa una contraseña.';
    } else if (form.password.length < 6) {
      next.password = 'Mínimo 6 caracteres.';
    }

    if (!form.confirmPassword) {
      next.confirmPassword = 'Confirma tu contraseña.';
    } else if (form.password !== form.confirmPassword) {
      next.confirmPassword = 'Las contraseñas no coinciden.';
    }

    return next;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            full_name: form.name.trim(),
            area: form.area,
            role: 'user',
          },
        },
      });

      if (error) {
        setErrors({ general: error.message });
        return;
      }

      if (!data.user) {
        setErrors({ general: 'Supabase no devolvió el usuario creado.' });
        return;
      }

      const { error: insertError } = await supabase.from('users').insert({
        id: data.user.id,
        nombre: form.name.trim(),
        empleado_verificado: false,
        ultima_actividad: new Date().toISOString(),
        created_at: new Date().toISOString(),
        email: form.email.trim().toLowerCase(),
        department_id: 1,
      });

      if (insertError) {
        setErrors({ general: insertError.message });
        return;
      }

      await supabase.auth.signOut();
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setErrors({ general: 'No se pudo crear la cuenta. Intenta de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-12 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl text-green-500">mark_email_read</span>
          </div>

          <h2 className="text-2xl font-black text-on-surface mb-3">¡Cuenta creada!</h2>

          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Usuario creado correctamente.
          </p>

          <Link
            to="/login"
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Ir al Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-blue/5 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 sm:p-12">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-5 shadow-xl border border-slate-50">
              <img src={whirlpoolLogo} alt="Whirlpool" className="w-14 h-14 object-contain" />
            </div>

            <h1 className="text-2xl font-black text-on-surface tracking-tight mb-1">Crear Cuenta</h1>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
              GIT Labs · Whirlpool
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Nombre completo
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Juan Pérez"
                className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.name ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-primary/10'
                }`}
              />
              {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Correo corporativo
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="usuario@whirlpool.com"
                className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.email ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-primary/10'
                }`}
              />
              {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Área
              </label>
              <select
                value={form.area}
                onChange={(e) => set('area', e.target.value)}
                className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all appearance-none ${
                  errors.area ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-primary/10'
                } ${!form.area ? 'text-slate-400' : ''}`}
              >
                <option value="" disabled>
                  Selecciona tu área
                </option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              {errors.area && <p className="text-xs text-red-500 font-medium">{errors.area}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Contraseña
              </label>
              <div
                className={`flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 transition-all focus-within:ring-2 ${
                  errors.password ? 'border-red-300 focus-within:ring-red-100' : 'border-slate-200 focus-within:ring-primary/10'
                }`}
              >
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="flex-1 border-0 bg-transparent p-0 text-sm text-on-surface placeholder:text-slate-400 focus:ring-0 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="text-slate-400 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Confirmar contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value)}
                placeholder="Repite tu contraseña"
                className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.confirmPassword ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-primary/10'
                }`}
              />
              {errors.confirmPassword && <p className="text-xs text-red-500 font-medium">{errors.confirmPassword}</p>}
            </div>

            {errors.general && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
                {errors.general}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                  Creando cuenta...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">person_add</span>
                  Crear Cuenta
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}