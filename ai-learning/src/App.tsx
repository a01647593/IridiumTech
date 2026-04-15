import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { UserRole, User } from './types';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AIAssistantPage from './pages/AIAssistantPage';
import CourseCatalogPage from './pages/CourseCatalogPage';
import CourseDetailPage from './pages/CourseDetailPage';
import LessonPage from './pages/LessonPage';
import QuizPage from './pages/QuizPage';
import PromptLibraryPage from './pages/PromptLibraryPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import UserManagementPage from './pages/UserManagementPage';
import ContentManagementPage from './pages/ContentManagementPage';
import HomePage from './pages/HomePage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import { MOCK_BADGES } from './constants';

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();

  const handleLogin = (email: string, role: UserRole) => {
    const newUser: User = {
      email,
      role,
      name: role === 'super-admin' ? 'Admin GIT Labs' : role === 'content-admin' ? 'Editor Contenido' : 'Juan Pérez',
      avatar: `https://picsum.photos/seed/${email}/100/100`,
      area: role === 'super-admin' ? 'Innovación' : role === 'content-admin' ? 'HR' : 'Ingeniería',
      gender: 'M',
      score: 850,
      badges: MOCK_BADGES.slice(0, 3),
      completedCourses: ['3'],
      pendingCourses: ['1', '4'],
      streak: 3,
      completedQuizzesCount: 5,
      savedPrompts: ['1', '2'],
    };
    setUser(newUser);
    localStorage.setItem('whirlpool_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('whirlpool_user');
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('whirlpool_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  if (user && location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

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
      
      <Route element={
        <Layout 
          activePage={getActivePage()} 
          title={getPageTitle()}
          user={user!} 
          onLogout={handleLogout}
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage user={user!} />} />
            <Route path="/courses" element={<CourseCatalogPage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route path="/lesson" element={<LessonPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/prompts" element={<PromptLibraryPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/assistant" element={<AIAssistantPage />} />
            <Route path="/help" element={<KnowledgeBasePage />} />
            <Route path="/profile" element={<ProfilePage user={user!} />} />
            
            {/* Admin Routes */}
            {user?.role === 'super-admin' && (
              <>
                <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
                <Route path="/admin/users" element={<UserManagementPage />} />
              </>
            )}
            {(user?.role === 'super-admin' || user?.role === 'content-admin') && (
              <Route path="/admin/content" element={<ContentManagementPage />} />
            )}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      } path="/*" />
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
