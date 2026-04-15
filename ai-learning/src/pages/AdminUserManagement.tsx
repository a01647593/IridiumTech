import { useState } from 'react';

export default function AdminUserManagement() {
  const [users, setUsers] = useState([
    { id: 1, name: 'Elena Rodriguez', email: 'e.rodriguez@whirlpool.com', role: 'user', area: 'Marketing', status: 'Activo' },
    { id: 2, name: 'Jaime Whirlpool', email: 'admin@whirlpool.com', role: 'admin', area: 'GIT Labs', status: 'Activo' },
    { id: 3, name: 'Super Admin', email: 'superadmin@whirlpool.com', role: 'super-admin', area: 'GIT Labs', status: 'Activo' },
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 sm:mb-10">
        <div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-primary tracking-tight">Gestión de Usuarios</h2>
          <p className="text-slate-500 mt-2 text-sm sm:text-lg font-medium">Control de acceso y asignación de roles jerárquicos (GIT Labs).</p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-white text-primary font-bold rounded-xl shadow-sm border border-slate-200 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
            <span className="material-symbols-outlined text-sm sm:text-base">file_download</span> Exportar
          </button>
          <button className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-all">
            <span className="material-symbols-outlined text-sm sm:text-base">person_add</span> Invitar Usuario
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="pb-4 px-4">Usuario</th>
                <th className="pb-4">Área</th>
                <th className="pb-4">Rol</th>
                <th className="pb-4">Estado</th>
                <th className="pb-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-5 px-4 flex items-center gap-3">
                    <img className="h-10 w-10 rounded-xl object-cover" src={`https://picsum.photos/seed/${user.email}/100/100`} alt={user.name} />
                    <div>
                      <p className="font-bold text-on-surface">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-5 text-sm font-semibold text-slate-600">{user.area}</td>
                  <td className="py-5">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${
                      user.role === 'super-admin' ? 'bg-primary text-white' : 
                      user.role === 'admin' ? 'bg-accent-blue text-white' : 
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-5">
                    <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-5 text-right">
                    <button className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
