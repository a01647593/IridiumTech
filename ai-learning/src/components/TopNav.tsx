import { useEffect, useRef, useState } from 'react';
import { User } from '../types';
import UserDropdown from './UserDropdown';
import whirlpoolLogo from '../assets/logowhirlpool.png';

export default function TopNav({ title = "", user, onLogout, onMenuClick }: { title?: string; user: User; onLogout: () => void; onMenuClick: () => void }) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!notificationRef.current) return;
      if (!notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: '1', title: 'Nueva gema comentada', time: 'Hace 5 min' },
    { id: '2', title: 'Tienes un curso pendiente', time: 'Hace 1 hora' },
    { id: '3', title: 'Tu puntuacion subio +20 XP', time: 'Ayer' },
  ];

  return (
    <header className="fixed top-0 right-0 w-full lg:w-[calc(100%-16rem)] h-16 z-40 flex items-center justify-between px-4 lg:px-8 bg-white/85 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img 
            src={whirlpoolLogo}
            alt="Whirlpool" 
            className="h-7 w-auto lg:hidden drop-shadow-sm active:scale-95 transition-transform flex-shrink-0"
          />
          <div className="hidden sm:flex items-center w-full max-w-md relative">
            <span className="material-symbols-outlined absolute left-3 text-slate-400">search</span>
            <input className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/10 transition-all duration-300" placeholder="Buscar..." type="text"/>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-4 text-slate-600 flex-shrink-0">
        {title && <span className="hidden xl:inline text-sm font-bold text-primary mr-2">{title}</span>}
        <button className="hidden xs:block p-2 hover:bg-slate-100 rounded-full transition-all">
          <span className="material-symbols-outlined">language</span>
        </button>
        <div ref={notificationRef} className="relative">
          <button
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="p-2 hover:bg-slate-100 rounded-full transition-all relative"
            aria-label="Abrir notificaciones"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 pb-2">Notificaciones</p>
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <p className="text-sm font-semibold text-slate-700">{notification.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{notification.time}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <UserDropdown user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
