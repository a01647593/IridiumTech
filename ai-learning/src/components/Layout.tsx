import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { UserRole, User } from '../types';

interface LayoutProps {
  children: ReactNode;
  activePage: string;
  title: string;
  user: User;
  onLogout: () => void;
}

export default function Layout({ children, activePage, title, user, onLogout }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        activePage={activePage} 
        user={user}
        onLogout={onLogout} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <TopNav 
          title={title} 
          user={user}
          onLogout={onLogout}
          onMenuClick={() => setIsSidebarOpen(true)} 
        />
        <main className="flex-1 pt-16 lg:ml-64 bg-slate-50 transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
