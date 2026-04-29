import { motion } from 'motion/react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import whirlpoolLogo from '../assets/logowhirlpoolblack.png';
import { fetchDepartments, type Department } from '../lib/departmentService';
import { registerCorporateUser } from '../lib/registerService';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const [departments, setDepartments] = useState<Department[]>([]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    departmentId: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadDepartments = async () => {
      const data = await fetchDepartments();
      setDepartments(data);
      setLoadingDepartments(false);
    };

    void loadDepartments();
  }, []);

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

    if (!form.departmentId) next.departmentId = 'Selecciona tu departamento.';

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
      await registerCorporateUser({
        name: form.name,
        email: form.email,
        password: form.password,
        departmentId: Number(form.departmentId),
      });

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrors({ general: err.message || 'No se pudo crear la cuenta.' });
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
            Usuario corporativo registrado correctamente.
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
                className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm ${
                  errors.name ? 'border-red-300' : 'border-slate-200'
                }`}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
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
                className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm ${
                  errors.email ? 'border-red-300' : 'border-slate-200'
                }`}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Departamento
              </label>
              <select
                value={form.departmentId}
                onChange={(e) => set('departmentId', e.target.value)}
                disabled={loadingDepartments}
                className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm ${
                  errors.departmentId ? 'border-red-300' : 'border-slate-200'
                }`}
              >
                <option value="">
                  {loadingDepartments ? 'Cargando departamentos...' : 'Selecciona tu departamento'}
                </option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              {errors.departmentId && <p className="text-xs text-red-500">{errors.departmentId}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Contraseña
              </label>
              <div className="flex items-center rounded-2xl border border-slate-200 px-4 py-3">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="flex-1 bg-transparent outline-none text-sm"
                />
                <button type="button" onClick={() => setShowPassword((p) => !p)}>
                  <span className="material-symbols-outlined text-slate-400">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
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
                className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm ${
                  errors.confirmPassword ? 'border-red-300' : 'border-slate-200'
                }`}
              />
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            {errors.general && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errors.general}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:scale-[1.02] transition-all"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
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