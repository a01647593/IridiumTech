import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getAdminDashboardStats } from '../lib/adminService'; // Asegúrate de importar el servicio

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  
  // Estado para almacenar las métricas reales
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#003da5', '#ffb81c', '#00a9e0', '#4a4a4a', '#8a8a8a'];

  useEffect(() => {
    async function loadStats() {
      const data = await getAdminDashboardStats();
      setStats(data);
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) {
    return <div className="p-10 text-center text-slate-500 font-semibold">Cargando métricas globales...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-primary mb-2">Panel de Control GIT Labs</h2>
          <p className="text-slate-500 font-medium text-sm sm:text-base">Gobernanza centralizada del conocimiento y métricas de impacto IA.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={() => navigate('/admin/users')} className="flex-1 sm:flex-none px-6 py-3 bg-white text-primary border border-slate-200 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all">Gestionar Usuarios</button>
          <button onClick={() => navigate('/admin/content')} className="flex-1 sm:flex-none px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all">Gestión de Contenido</button>
        </div>
      </header>

      {/* MÉTRICAS SUPERIORES ACTUALIZADAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Usuarios Activos</p>
          <h3 className="text-3xl font-black text-primary">{stats?.usersCount || 0}</h3>
          <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">check_circle</span> Colaboradores
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cursos Publicados</p>
          <h3 className="text-3xl font-black text-primary">{stats?.coursesCount || 0}</h3>
          <p className="text-xs text-slate-400 font-bold mt-2">Disponibles en catálogo</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impacto (Lecciones)</p>
          <h3 className="text-3xl font-black text-primary">{stats?.completedLessonsCount || 0}</h3>
          <p className="text-xs text-accent-blue font-bold mt-2">Módulos completados</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cursos en Progreso</p>
          <h3 className="text-3xl font-black text-on-surface">{stats?.assignmentsCount || 0}</h3>
          <p className="text-xs text-amber-600 font-bold mt-2">Asignaciones activas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-xl font-bold text-primary">Participación por Área (Top 5)</h4>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tiempo Real</span>
          </div>
          <div className="h-80 w-full">
            {stats?.chartData && stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="area" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats.chartData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">No hay datos suficientes</div>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h4 className="text-xl font-bold text-primary mb-6">Gobernanza GIT Labs</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">verified_user</span>
                  <span className="text-sm font-bold">Super Admin</span>
                </div>
                <span className="text-[10px] font-black bg-primary text-white px-2 py-1 rounded">ACTIVO</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">edit_note</span>
                  <span className="text-sm font-bold">Content Admins</span>
                </div>
                <span className="text-sm font-black text-primary">{stats?.contentAdminsCount || 0}</span>
              </div>
              <button className="w-full py-3 bg-slate-100 text-slate-500 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all">Ver Logs de Auditoría</button>
            </div>
          </div>

          <div className="bg-primary p-8 rounded-2xl shadow-lg text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-8xl">auto_awesome</span>
            </div>
            <h4 className="text-lg font-bold mb-2">IA Insights</h4>
            <p className="text-sm text-white/80 leading-relaxed mb-6">El tablero se actualiza en tiempo real basado en la participación de los {stats?.usersCount || 0} usuarios en la plataforma.</p>
            <button className="w-full py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold rounded-xl hover:bg-white/20 transition-all">Generar Reporte Completo</button>
          </div>
        </div>
      </div>
    </div>
  );
}