import { motion } from 'motion/react';
import { useState, type FormEvent } from 'react';
import { UserRole } from '../types';
import { findAuthAccount } from '../lib/authApi';
import whirlpoolLogo from '../assets/logowhirlpoolblack.png';
import { loginWithGoogle } from '../lib/auth'

const handleGoogleLogin = async () => {
  try {
    await loginWithGoogle()
  } catch (e: any) {
    console.error(e.message)
  }
}

interface LoginPageProps {
  onLogin: (email: string, role: UserRole) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inferRoleFromRedirect = (redirectTo?: string): UserRole => {
  if (redirectTo?.startsWith('/admin/super')) return 'super-admin';
  if (redirectTo?.startsWith('/admin/dashboard')) return 'super-admin';
  if (redirectTo?.startsWith('/admin/content')) return 'content-admin';
  return 'user';
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; credentials?: string }>({});

  const validateCredentials = () => {
    const nextErrors: { email?: string; password?: string; credentials?: string } = {};
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

  const handleCredentialLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateCredentials();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ correo: normalizedEmail, password }),
    })
      .then(async (response) => {
        if (response.ok) {
          const payload = await response.json().catch(() => ({} as { redirectTo?: string; role?: UserRole }));
          setErrors({});
          onLogin(normalizedEmail, payload.role ?? inferRoleFromRedirect(payload.redirectTo));
          return;
        }

        const account = findAuthAccount(normalizedEmail, password);
        if (account) {
          setErrors({});
          onLogin(account.email, account.role);
          return;
        }

        setErrors({ credentials: 'Correo o contraseña incorrectos.' });
      })
      .catch(() => {
        const account = findAuthAccount(normalizedEmail, password);
        if (account) {
          setErrors({});
          onLogin(account.email, account.role);
          return;
        }

        setErrors({ credentials: 'No se pudo conectar con el servicio de autenticación.' });
      });
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
                Inicia sesión con correo y contraseña para entrar al panel correspondiente.
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
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (errors.email || errors.credentials) {
                      setErrors((current) => ({ ...current, email: undefined, credentials: undefined }));
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
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (errors.password || errors.credentials) {
                        setErrors((current) => ({ ...current, password: undefined, credentials: undefined }));
                      }
                    }}
                    placeholder="Ingresa tu contraseña"
                    className="flex-1 border-0 bg-transparent p-0 text-sm text-on-surface placeholder:text-slate-400 focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
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
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
              >
                Ingresar
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </form>

            <div className="flex items-center gap-4 my-2">
              <div className="h-px bg-slate-100 flex-1"></div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Google SSO</span>
              <div className="h-px bg-slate-100 flex-1"></div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="w-full py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 group"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Continuar con Google SSO
            </button>

          </div>

          <div className="mt-12 pt-8 border-t border-slate-50">
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Al continuar, aceptas los términos de uso y políticas de privacidad de Whirlpool Corporation. 
              Acceso restringido a empleados autorizados.
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
