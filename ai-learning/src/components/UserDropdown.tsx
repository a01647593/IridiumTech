import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';

interface UserDropdownProps {
  user: User;
  onLogout: () => void;
  isSidebar?: boolean;
}

export default function UserDropdown({ user, onLogout, isSidebar = false }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 transition-all duration-300 ${
          isSidebar 
            ? 'w-full px-4 py-3 rounded-xl hover:bg-white/10' 
            : 'h-8 w-8 rounded-full overflow-hidden ring-2 ring-slate-100 hover:ring-primary'
        }`}
      >
        <div className={`${isSidebar ? 'h-8 w-8' : 'h-full w-full'} rounded-full overflow-hidden flex-shrink-0`}>
          <img alt="User Avatar" className="h-full w-full object-cover" src={user.avatar} />
        </div>
        {isSidebar && (
          <div className="flex flex-col text-left min-w-0">
            <span className="text-xs font-bold truncate text-white">{user.name}</span>
            <span className="text-[10px] text-white/40 truncate">{user.email}</span>
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: isSidebar ? -10 : 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: isSidebar ? -10 : 10 }}
            className={`absolute z-[60] w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 ${
              isSidebar ? 'bottom-full left-0 mb-2' : 'top-full right-0 mt-2'
            }`}
          >
            <div className="px-4 py-2 border-b border-slate-50 mb-1">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Mi Cuenta</p>
            </div>
            
            <Link 
              to="/profile" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-lg text-slate-400">person</span>
              <span className="font-bold">Ver Perfil</span>
            </Link>
            
            <Link 
              to="/profile" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-lg text-slate-400">photo_camera</span>
              <span className="font-bold">Cambiar Foto</span>
            </Link>

            <div className="h-px bg-slate-50 my-1" />
            
            <button 
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span className="font-bold">Cerrar Sesión</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
