import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { MOCK_BADGES } from './constants';
import { supabase } from './lib/supabaseClient';
import AIAssistantPage from './pages/AIAssistantPage';
import ContentManagementPage from './pages/ContentManagementPage';
import CourseCatalogPage from './pages/CourseCatalogPage';
import CourseDetailPage from './pages/CourseDetailPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import LeaderboardPage from './pages/LeaderboardPage';
import LessonPage from './pages/LessonPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import PromptDetailPage from './pages/PromptDetailPage';
import PromptLibraryPage from './pages/PromptLibraryPage';
import QuizPage from './pages/QuizPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import UserManagementPage from './pages/UserManagementPage';
import type { User, UserRole } from './types';


const USER_STORAGE_KEY = 'whirlpool_user';

const getDefaultRouteByRole = (role: UserRole) => {
  if (role === 'super-admin') return '/admin/dashboard';
  if (role === 'content-admin') return '/admin/content';
  return '/dashboard';
};

const normalizeRole = (value: unknown): UserRole | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'super-admin' || normalized === 'superadministrador') return 'super-admin';
  if (normalized === 'content-admin' || normalized === 'admin' || normalized === 'administrador') return 'content-admin';
  if (normalized === 'user' || normalized === 'usuario') return 'user';
  return null;
};

const buildUser = (
  id: string,
  email: string,
  role: UserRole,
  overrides: Partial<Pick<User, 'name' | 'avatar' | 'area'>> = {},
): User => ({
  id,
  email,
  role,
  name: overrides.name ?? (role === 'super-admin' ? 'Admin GIT Labs' : role === 'content-admin' ? 'Editor Contenido' : 'Empleado'),
  avatar: overrides.avatar ?? `https://picsum.photos/seed/${email}/100/100`,
  area: overrides.area ?? (role === 'super-admin' ? 'Innovación' : role === 'content-admin' ? 'HR' : 'Ingeniería'),
  gender: 'M',
  score: 0,
  badges: [],
  completedCourses: [],
  pendingCourses: [],
  streak: 0,
  completedQuizzesCount: 0,
  savedPrompts: [],
});

const buildUserFromSupabase = (authUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}): User => {
  const email = authUser.email?.trim().toLowerCase() ?? '';
  const metadata = {
    ...(authUser.app_metadata ?? {}),
    ...(authUser.user_metadata ?? {}),
  };

  const role = normalizeRole(metadata.role) ?? normalizeRole(metadata.rol) ?? 'user';

  const name =
    typeof metadata.full_name === 'string'
      ? metadata.full_name
      : typeof metadata.name === 'string'
        ? metadata.name
        : undefined;

  const avatar = typeof metadata.avatar_url === 'string' ? metadata.avatar_url : undefined;
  const area = typeof metadata.area === 'string' ? metadata.area : undefined;

  return buildUser(authUser.id, email, role, { name, avatar, area });
};

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const restoreUser = (): User | null => {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (!saved) return null;
      try {
        return JSON.parse(saved) as User;
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
        return null;
      }
    };

    const syncAuthUser = async () => {
      const localUser = restoreUser();
      if (isMounted && localUser) setUser(localUser);

      const { data, error } = await supabase.auth.getUser();
      if (!isMounted) return;

      if (error || !data.user) {
        setUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
        setIsAuthReady(true);
        return;
      }

      const syncedUser = buildUserFromSupabase(data.user);
      setUser(syncedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(syncedUser));
      setIsAuthReady(true);
    };

    void syncAuthUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      if (!session?.user) {
        setUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
        setIsAuthReady(true);
        return;
      }

      const syncedUser = buildUserFromSupabase(session.user);
      setUser(syncedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(syncedUser));
      setIsAuthReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));
    setIsAuthReady(true);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    void supabase.auth.signOut();
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-medium text-slate-500">
        Cargando sesión...
      </div>
    );
  }

  const defaultAuthenticatedRoute = user ? getDefaultRouteByRole(user.role) : '/login';

  if (!user && location.pathname !== '/login' && location.pathname !== '/register') return <Navigate to="/login" replace />;
  if (user && location.pathname === '/login') return <Navigate to={defaultAuthenticatedRoute} replace />;
  if (user && location.pathname === '/' && user.role !== 'super-admin') return <Navigate to={defaultAuthenticatedRoute} replace />;

  const getActivePage = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/courses')) return 'courses';
    if (path.startsWith('/lesson')) return 'courses';
    if (path.startsWith('/prompts')) return 'prompts';
    if (path.startsWith('/leaderboard')) return 'leaderboard';
    if (path.startsWith('/assistant')) return 'assistant';
    if (path.startsWith('/help')) return 'help';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/admin/dashboard')) return 'admin-dashboard';
    if (path.startsWith('/admin/content')) return 'content-management';
    if (path.startsWith('/admin/users')) return 'user-management';
    return '';
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Whirlpool AI Platform';
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/courses')) return 'Catálogo de Cursos';
    if (path.startsWith('/lesson')) return 'Lección';
    if (path.startsWith('/prompts')) return 'Biblioteca de Gemas';
    if (path.startsWith('/leaderboard')) return 'Leaderboard';
    if (path.startsWith('/assistant')) return 'Asistente IA';
    if (path.startsWith('/help')) return 'Centro de Ayuda';
    if (path.startsWith('/profile')) return 'Mi Perfil';
    if (path.startsWith('/admin/dashboard')) return 'Global Analytics';
    if (path.startsWith('/admin/content')) return 'Gestión de Contenido';
    if (path.startsWith('/admin/users')) return 'Usuarios y Roles';
    return 'GIT Labs';
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/*"
        element={
          <Layout activePage={getActivePage()} title={getPageTitle()} user={user!} onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage user={user!} />} />
              <Route path="/courses" element={<CourseCatalogPage />} />
              <Route path="/courses/:id" element={<CourseDetailPage />} />
              <Route path="/lesson" element={<LessonPage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/prompts" element={<PromptLibraryPage />} />
              <Route path="/prompts/:id" element={<PromptDetailPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/assistant" element={<AIAssistantPage />} />
              <Route path="/help" element={<KnowledgeBasePage />} />
              <Route path="/profile" element={<ProfilePage user={user!} />} />

              {user?.role === 'super-admin' && (
                <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
              )}
              {(user?.role === 'super-admin' || user?.role === 'content-admin') && (
                <Route path="/admin/content" element={<ContentManagementPage />} />
              )}
              {(user?.role === 'super-admin' || user?.role === 'content-admin') && (
                <Route path="/admin/users" element={<UserManagementPage />} />
              )}

              <Route path="*" element={<Navigate to={defaultAuthenticatedRoute} replace />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}