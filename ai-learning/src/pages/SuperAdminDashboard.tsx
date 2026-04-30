import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { getSuperAdminStats } from '../lib/adminService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';

const COLORS = ['#003DA5', '#00A9E0', '#FFB81C', '#E35205', '#78BE20', '#6C1D45'];

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const data = await getSuperAdminStats();
      setStats(data);
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) {
    return <div className="p-10 text-center text-slate-500 font-semibold">Cargando Global Analytics...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Global Analytics</h1>
          <p className="text-slate-500 font-medium">Panel de control global de adopción de IA en Whirlpool.</p>
        </div>
        <div className="flex gap-3">
          {/*<button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-all">
            <span className="material-symbols-outlined text-sm">download</span> Exportar Reporte
          </button>
          <button className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            <span className="material-symbols-outlined text-sm">settings</span> Configuración
          </button> */}
        </div>
      </header>

      {/* High Level Stats REAles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Usuarios Totales', value: stats?.totalUsers || 0, icon: 'group', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Usuarios Activos', value: stats?.activeUsers || 0, icon: 'bolt', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Tasa de Finalización', value: `${stats?.completionRate || 0}%`, icon: 'task_alt', color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Score Promedio', value: `${stats?.avgScore || 0}/100`, icon: 'analytics', color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-on-surface">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Adoption Trend (Gráfica Lineal) */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-on-surface mb-8">Tendencia de Adopción (Últimos meses)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.adoptionTrend || []}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#003DA5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#003DA5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="users" stroke="#003DA5" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Users by Area (Gráfica de Pastel) */}
        <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-on-surface mb-8">Distribución por Área</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.usersByArea || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(stats?.usersByArea || []).map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {(stats?.usersByArea || []).map((area: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{area.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Area Performance Table (Tabla REAL) */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-on-surface">Desempeño por Departamento</h3>
          {/*<button className="text-primary text-xs font-bold hover:underline">Ver todos los detalles</button>*/}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Área</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Participantes</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Engagement</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cursos incompletos</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(stats?.areaMetrics || []).map((metric: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-5"><p className="font-bold text-on-surface">{metric.area}</p></td>
                  <td className="px-8 py-5"><p className="text-sm text-slate-500 font-medium">{metric.count}</p></td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                        <div className="h-full bg-primary" style={{ width: `${metric.engagement}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-primary">{metric.engagement}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-5"><p className="text-sm text-red-500 font-bold">{metric.abandonmentRate}%</p></td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      metric.engagement > 80 ? 'bg-green-50 text-green-600' : 
                      metric.engagement > 40 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {metric.engagement > 80 ? 'Excelente' : metric.engagement > 40 ? 'Regular' : 'En Riesgo'}
                    </span>
                  </td>
                </tr>
              ))}
              {(stats?.areaMetrics?.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">No hay datos de departamentos aún.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}