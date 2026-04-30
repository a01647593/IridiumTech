import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchAllUsers, updateUserRole, type TeamUser, updateUserDetails} from '../lib/userService';

type UserFilter = 'all' | 'admins' | 'inactive';

export default function UserManagementPage({ currentUser }: { currentUser?: any }) {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<TeamUser['role']>('user');
  const [activeFilter, setActiveFilter] = useState<UserFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<TeamUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [formUser, setFormUser] = useState<Omit<TeamUser, 'id'>>({
    name: '',
    email: '',
    area: 'Ingeniería',
    role: 'user',
    status: 'Activo',
  });

  useEffect(() => {
    loadUsers();
    
    if (currentUser?.role) {
      setCurrentUserRole(currentUser.role);
    } else {
      try {
        const raw = localStorage.getItem('whirlpool_user');
        if (raw) {
          const parsed = JSON.parse(raw) as { role?: TeamUser['role'] };
          setCurrentUserRole(parsed.role ?? 'user');
        }
      } catch {
        setCurrentUserRole('user');
      }
    }
  }, [currentUser]);

  const loadUsers = async () => {
    setLoading(true);
    const data = await fetchAllUsers();
    setUsers(data);
    setLoading(false);
  };

  const roleOptions: Array<{ value: TeamUser['role']; label: string }> = currentUserRole === 'super-admin'
    ? [
        { value: 'user', label: 'Usuario' },
        { value: 'content-admin', label: 'Administrador de Contenido' },
        { value: 'super-admin', label: 'Super Administrador' },
      ]
    : [
        { value: 'user', label: 'Usuario' },
      ];

  const handleOpenModal = (user?: TeamUser) => {
    setEditingUser(user || null);
    setFormUser(user ? { name: user.name, email: user.email, area: user.area, role: user.role, status: user.status } : {
      name: '',
      email: '',
      area: 'Ingeniería',
      role: 'user',
      status: 'Activo',
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!formUser.name.trim() || !formUser.email.trim()) return;
  
    try {
      if (editingUser) {
        await updateUserDetails(editingUser.id, {
          name: formUser.name,
          email: formUser.email,
          area: formUser.area,
          status: formUser.status
        });
  
        if (editingUser.role !== formUser.role) {
          await updateUserRole(editingUser.id, formUser.role);
        }
        
        alert('Usuario actualizado con éxito');
        await loadUsers();
      } else {
        alert('Función de invitación pendiente de implementar con Auth.');
      }
      setShowUserModal(false);
    } catch (error: any) {
      console.error('Error al guardar:', error);
      alert(`No se pudo actualizar: ${error.message}`);
    }
  };

  const handleDeleteUser = (userId: string) => {
    alert('Por seguridad y trazabilidad, los usuarios deben desactivarse (cambiar estado a Inactivo) en lugar de eliminarse por completo de la base de datos.');
  };

  const filteredUsers = users.filter((user) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 ||
      user.name.toLowerCase().includes(normalizedSearch) ||
      user.email.toLowerCase().includes(normalizedSearch) ||
      user.area.toLowerCase().includes(normalizedSearch);

    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'admins' && (user.role === 'content-admin' || user.role === 'super-admin')) ||
      (activeFilter === 'inactive' && user.status === 'Inactivo');

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Equipo y Roles</h1>
          <p className="text-slate-500 font-medium">Administra personas, accesos y jerarquías de tu equipo en Whirlpool AI.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full lg:w-auto px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">person_add</span> {currentUserRole === 'super-admin' ? 'Invitar Administrador' : 'Agregar Persona'}
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Filtros e Inputs se mantienen igual */}
        <div className="p-8 border-b border-slate-50 flex flex-col xl:flex-row justify-between items-center gap-4">
          <div className="relative w-full xl:w-96">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              type="text" 
              placeholder="Buscar por nombre, email o área..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full h-12 pl-12 pr-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            <button onClick={() => setActiveFilter('all')} className={`flex-1 xl:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeFilter === 'all' ? 'bg-slate-50 text-slate-600' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'}`}>Todos</button>
            <button onClick={() => setActiveFilter('admins')} className={`flex-1 xl:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeFilter === 'admins' ? 'bg-slate-50 text-slate-600' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'}`}>Administradores</button>
            <button onClick={() => setActiveFilter('inactive')} className={`flex-1 xl:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeFilter === 'inactive' ? 'bg-slate-50 text-slate-600' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'}`}>Inactivos</button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
             <div className="py-20 text-center text-slate-400 font-medium">Cargando usuarios...</div>
          ) : (
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
                {filteredUsers.map((user, i) => (
                  <tr key={user.id || i} className="hover:bg-slate-50 transition-colors group">
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
                        <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined text-sm">block</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-10 text-center text-sm font-medium text-slate-400">
                      No hay resultados para este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
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
                    value={formUser.name}
                    onChange={(event) => setFormUser((current) => ({ ...current, name: event.target.value }))}
                    className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium disabled:opacity-50" 
                    placeholder="Ej. Juan Pérez" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo Electrónico</label>
                  <input 
                    type="email" 
                    value={formUser.email}
                    onChange={(event) => setFormUser((current) => ({ ...current, email: event.target.value }))}
                    className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium disabled:opacity-50" 
                    placeholder="usuario@whirlpool.com" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Área</label>
                    <select 
                      value={formUser.area}
                      onChange={(event) => setFormUser((current) => ({ ...current, area: event.target.value }))}
                      className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium disabled:opacity-50"
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
                      value={formUser.role}
                      onChange={(event) => setFormUser((current) => ({ ...current, role: event.target.value as TeamUser['role'] }))}
                      className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium"
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</label>
                  <select 
                    value={formUser.status}
                    onChange={(event) => setFormUser((current) => ({ ...current, status: event.target.value as TeamUser['status'] }))}
                    className="w-full h-12 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium disabled:opacity-50"
                  >
                    <option>Activo</option>
                    <option>Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="p-8 bg-slate-50 flex justify-end gap-4">
                <button onClick={() => setShowUserModal(false)} className="px-6 py-3 font-bold text-slate-500 hover:text-on-surface transition-colors">Cancelar</button>
                <button onClick={handleSaveUser} className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">
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