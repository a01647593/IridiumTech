import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const MOCK_USERS = [
  { id: '1', name: 'Admin GIT Labs', email: 'admin@whirlpool.com', area: 'Innovación', role: 'super-admin', status: 'Activo' },
  { id: '2', name: 'Editor Contenido', email: 'editor@whirlpool.com', area: 'Recursos Humanos', role: 'content-admin', status: 'Activo' },
  { id: '3', name: 'Juan Pérez', email: 'j.perez@whirlpool.com', area: 'Ingeniería', role: 'user', status: 'Activo' },
  { id: '4', name: 'María García', email: 'm.garcia@whirlpool.com', area: 'Marketing', role: 'user', status: 'Activo' },
  { id: '5', name: 'Roberto Garza', email: 'r.garza@whirlpool.com', area: 'Operaciones', role: 'user', status: 'Inactivo' },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const handleOpenModal = (user?: any) => {
    setEditingUser(user || null);
    setShowUserModal(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Usuarios y Roles</h1>
          <p className="text-slate-500 font-medium">Administra accesos y jerarquías de la plataforma Whirlpool AI.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full lg:w-auto px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">person_add</span> Invitar Usuario
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col xl:flex-row justify-between items-center gap-4">
          <div className="relative w-full xl:w-96">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              type="text" 
              placeholder="Buscar por nombre, email o área..."
              className="w-full h-12 pl-12 pr-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            <button className="flex-1 xl:flex-none px-4 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100 transition-all">Todos</button>
            <button className="flex-1 xl:flex-none px-4 py-2 bg-white border border-slate-100 text-slate-400 text-xs font-bold rounded-lg hover:bg-slate-50 transition-all whitespace-nowrap">Administradores</button>
            <button className="flex-1 xl:flex-none px-4 py-2 bg-white border border-slate-100 text-slate-400 text-xs font-bold rounded-lg hover:bg-slate-50 transition-all whitespace-nowrap">Inactivos</button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Área</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm text-slate-500 font-medium">{user.area}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      user.role === 'super-admin' ? 'bg-purple-50 text-purple-600' :
                      user.role === 'content-admin' ? 'bg-blue-50 text-blue-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.status === 'Activo' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                      <span className="text-xs font-bold text-slate-500">{user.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenModal(user)}
                        className="p-2 text-slate-400 hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-sm">key</span>
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-sm">block</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUserModal(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h2 className="text-2xl font-black text-on-surface">
                  {editingUser ? 'Editar Usuario' : 'Invitar Usuario'}
                </h2>
                <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo</label>
                  <input 
                    type="text" 
                    defaultValue={editingUser?.name}
                    className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium" 
                    placeholder="Ej. Juan Pérez" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo Electrónico</label>
                  <input 
                    type="email" 
                    defaultValue={editingUser?.email}
                    className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium" 
                    placeholder="usuario@whirlpool.com" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Área</label>
                    <select 
                      defaultValue={editingUser?.area || 'Ingeniería'}
                      className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium"
                    >
                      <option>Ingeniería</option>
                      <option>Marketing</option>
                      <option>HR</option>
                      <option>Operaciones</option>
                      <option>Innovación</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</label>
                    <select 
                      defaultValue={editingUser?.role || 'user'}
                      className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium"
                    >
                      <option value="user">Usuario</option>
                      <option value="content-admin">Editor de Contenido</option>
                      <option value="super-admin">Administrador</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</label>
                  <select 
                    defaultValue={editingUser?.status || 'Activo'}
                    className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium"
                  >
                    <option>Activo</option>
                    <option>Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="p-8 bg-slate-50 flex justify-end gap-4">
                <button onClick={() => setShowUserModal(false)} className="px-6 py-3 font-bold text-slate-500 hover:text-on-surface transition-colors">Cancelar</button>
                <button className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                  {editingUser ? 'Guardar Cambios' : 'Enviar Invitación'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
