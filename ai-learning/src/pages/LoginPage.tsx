import { motion } from 'motion/react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import whirlpoolLogo from '../assets/logowhirlpoolblack.png';
import { loginWithGoogle } from '../lib/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { User, UserRole } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeRole = (value: unknown): UserRole => {
  if (typeof value !== 'string') return 'user';
  const v = value.trim().toLowerCase();
  if (v === 'super-admin' || v === 'superadministrador') return 'super-admin';
  if (v === 'content-admin' || v === 'admin' || v === 'administrador') return 'content-admin';
  return 'user';
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; credentials?: string }>({});
  const [ssoError, setSsoError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const nextErrors: typeof errors = {};
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      nextErrors.email = 'Ingresa tu correo.';
    } else if (!EMAIL_PATTERN.test(normalizedEmail)) {
      nextErrors.email = 'Ingresa un correo completo y válido.';
    }
    if (!password) {
      nextErrors.password = 'Ingresa tu contraseña.';
    } else if (password.length < 6) {
      nextErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }
    return nextErrors;
  };

  const handleCredentialLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error || !data.user) {
        setErrors({ credentials: 'Correo o contraseña incorrectos.' });
        return;
      }

      const authUser = data.user;
      const metadata = {
        ...(authUser.app_metadata ?? {}),
        ...(authUser.user_metadata ?? {}),
      };

      const loggedInUser: User = {
        id: authUser.id,
        email: authUser.email ?? normalizedEmail,
        role: normalizeRole(metadata.role ?? metadata.rol),
        name: typeof metadata.full_name === 'string'
          ? metadata.full_name
          : typeof metadata.name === 'string'
            ? metadata.name
            : normalizedEmail.split('@')[0],
        avatar: typeof metadata.avatar_url === 'string'
          ? metadata.avatar_url
          : `https://picsum.photos/seed/${authUser.id}/100/100`,
        area: typeof metadata.area === 'string' ? metadata.area : 'General',
        gender: 'M',
        score: 0,
        badges: [],
        completedCourses: [],
        pendingCourses: [],
        streak: 0,
        completedQuizzesCount: 0,
        savedPrompts: [],
      };

      onLogin(loggedInUser);

    } catch {
      setErrors({ credentials: 'No se pudo conectar con el servicio de autenticación.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSsoError('');

    if (!isSupabaseConfigured) {
      setSsoError('Google SSO no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.');
      return;
    }

    try {
      await loginWithGoogle();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar Google SSO.';
      setSsoError(message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-blue/5 rounded-full blur-3xl animate-pulse [animation-delay:2s]"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 sm:p-12 text-center">
          <div className="mb-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-2xl border border-slate-50">
              <img
                src={whirlpoolLogo}
                alt="Whirlpool"
                className="w-16 h-16 object-contain"
              />
            </div>
            <h1 className="text-3xl font-black text-on-surface tracking-tight mb-2">GIT Labs AI</h1>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Whirlpool Corporation</p>
          </div>

          <div className="space-y-6 text-left">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <h2 className="text-lg font-bold text-on-surface mb-1">Acceso Corporativo</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Inicia sesión con tu correo y contraseña corporativos.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleCredentialLogin} noValidate>
              <div className="space-y-2">
                <label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Correo
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email || errors.credentials) {
                      setErrors((prev) => ({ ...prev, email: undefined, credentials: undefined }));
                    }
                  }}
                  placeholder="usuario@whirlpool.com"
                  className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${errors.email ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-primary/10'}`}
                />
                {errors.email && <p className="text-xs font-medium text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Contraseña
                </label>
                <div className={`flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 transition-all focus-within:ring-2 ${errors.password ? 'border-red-300 focus-within:ring-red-100' : 'border-slate-200 focus-within:ring-primary/10'}`}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password || errors.credentials) {
                        setErrors((prev) => ({ ...prev, password: undefined, credentials: undefined }));
                      }
                    }}
                    placeholder="Ingresa tu contraseña"
                    className="flex-1 border-0 bg-transparent p-0 text-sm text-on-surface placeholder:text-slate-400 focus:ring-0 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-slate-400 hover:text-primary transition-colors"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.password && <p className="text-xs font-medium text-red-500">{errors.password}</p>}
              </div>

              {errors.credentials && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
                  {errors.credentials}
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
                    Verificando...
                  </>
                ) : (
                  <>
                    Ingresar
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center gap-4 my-2">
              <div className="h-px bg-slate-100 flex-1"></div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Google SSO</span>
              <div className="h-px bg-slate-100 flex-1"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Continuar con Google SSO
            </button>

            {ssoError && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 font-medium">
                {ssoError}
              </div>
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-50">
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Al continuar, aceptas los términos de uso y políticas de privacidad de Whirlpool Corporation.
              Acceso restringido a empleados autorizados.
            </p>
            <p className="text-center text-xs text-slate-400 mt-6">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-primary font-bold hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      <footer className="mt-12 text-center z-10">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
          © 2024 Whirlpool GIT Labs • Innovation at Scale
        </p>
      </footer>
    </div>
  );
}