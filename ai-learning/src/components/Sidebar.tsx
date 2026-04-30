import { Link } from 'react-router-dom';
import { User } from '../types';
import UserDropdown from './UserDropdown';
import whirlpoolLogo from '../assets/logowhirlpool.png';

interface SidebarProps {
  activePage: string;
  user: User;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activePage, user, onLogout, isOpen, onClose }: SidebarProps) {
  const commonNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard', roles: ['user', 'content-admin', 'super-admin'] },
    { id: 'courses', label: 'Cursos', icon: 'school', path: '/courses', roles: ['user', 'content-admin', 'super-admin'] },
    { id: 'prompts', label: 'Biblioteca de Gemas', icon: 'auto_awesome', path: '/prompts', roles: ['user', 'content-admin', 'super-admin'] },
    { id: 'leaderboard', label: 'Leaderboard', icon: 'leaderboard', path: '/leaderboard', roles: ['user', 'content-admin', 'super-admin'] },
    { id: 'assistant', label: 'Asistente IA', icon: 'smart_toy', path: '/assistant', roles: ['user', 'content-admin', 'super-admin'] },
    { id: 'help', label: 'Ayuda & FAQ', icon: 'help', path: '/help', roles: ['user', 'content-admin', 'super-admin'] },
  ];

  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Global Analytics', icon: 'analytics', path: '/admin/dashboard', roles: ['super-admin'] },
    { id: 'content-management', label: 'Gestión de Contenido', icon: 'edit_note', path: '/admin/content', roles: ['super-admin', 'content-admin'] },
    { id: 'user-management', label: 'Equipo y Roles', icon: 'manage_accounts', path: '/admin/users', roles: ['super-admin', 'content-admin'] },
  ];

  const superAdminOnlyNavItems = [
    { id: 'home', label: 'Inicio', icon: 'home', path: '/', roles: ['super-admin'] },
    { id: 'profile', label: 'Mi Perfil', icon: 'person', path: '/profile', roles: ['super-admin'] },
  ];

  const navItems = user.role === 'super-admin'
    ? [...superAdminOnlyNavItems, ...commonNavItems, ...adminNavItems]
    : user.role === 'content-admin'
      ? [...commonNavItems, ...adminNavItems.filter((item) => item.roles.includes('content-admin'))]
      : commonNavItems;

  const filteredItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className={`fixed left-0 top-0 h-full w-64 flex flex-col bg-primary text-white z-50 font-body text-sm font-medium tracking-tight overflow-y-auto transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-8 flex items-center justify-between">
        <Link to="/" onClick={onClose} className="flex items-center gap-3 group">
          <img 
            alt="Whirlpool" 
            className="h-10 w-auto drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform duration-300" 
            src={whirlpoolLogo}
          />
          <span className="text-xl font-black tracking-tighter group-hover:text-white transition-colors">GIT Labs</span>
        </Link>
        <button onClick={onClose} className="lg:hidden p-2 hover:bg-white/10 rounded-lg">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div className="px-8 mb-4">
        <p className="text-[10px] text-white/60 uppercase tracking-[0.2em] font-bold">Intellectual Workspace</p>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {filteredItems.map((item) => (
          <Link 
            key={item.id} 
            to={item.path} 
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${activePage === item.id ? 'sidebar-active text-white' : 'text-white/70 hover:bg-white/10'}`}
          >
            <span className={`material-symbols-outlined text-[20px] ${activePage === item.id ? 'material-symbols-fill' : ''}`}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 bg-black/10 mt-auto border-t border-white/10">
        <div className="px-4 py-3 flex flex-col">
          <span className="text-[10px] text-white/40 uppercase font-bold mb-2">Usuario</span>
          <UserDropdown user={user} onLogout={onLogout} isSidebar />
        </div>
      </div>
    </aside>
  );
}
