import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { getLeaderboardData } from '../lib/adminService';

export default function LeaderboardPage() {
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [topAreas, setTopAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { topUsers: users, topAreas: areas } = await getLeaderboardData();
      const paddedUsers = [...users];
      while (paddedUsers.length < 3) {
        paddedUsers.push({ rank: paddedUsers.length + 1, name: '---', area: '---', score: 0, avatar: 'https://picsum.photos/seed/empty/200' });
      }
      setTopUsers(paddedUsers);
      setTopAreas(areas);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="p-10 text-center text-slate-500 font-semibold">Cargando ranking en tiempo real...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
      <header className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-black text-primary tracking-tight">Ranking Semanal</h1>
        <p className="text-slate-500 font-medium">Reconocimiento a los líderes en adopción de IA y aprendizaje continuo en Whirlpool.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top 3 Podium */}
        <div className="lg:col-span-12 flex flex-col md:flex-row items-end justify-center gap-4 sm:gap-8 py-12">
          {/* Rank 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center order-2 md:order-1"
          >
            <div className="relative mb-4">
              <img src={topUsers[1].avatar} alt="" className="w-20 h-20 rounded-full border-4 border-slate-200 shadow-xl object-cover" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-black text-slate-600 text-xs">2</div>
            </div>
            <div className="bg-white p-6 rounded-t-3xl border border-slate-100 shadow-sm w-48 text-center h-32 flex flex-col justify-center">
              <p className="font-bold text-on-surface truncate">{topUsers[1].name}</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{topUsers[1].area}</p>
              <p className="text-xl font-black text-primary mt-2">{topUsers[1].score} XP</p>
            </div>
          </motion.div>

          {/* Rank 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center order-1 md:order-2 scale-110 z-10"
          >
            <div className="relative mb-4">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-amber-500 animate-bounce">
                <span className="material-symbols-outlined text-4xl material-symbols-fill">workspace_premium</span>
              </div>
              <img src={topUsers[0].avatar} alt="" className="w-24 h-24 rounded-full border-4 border-amber-400 shadow-2xl object-cover" />
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center font-black text-white text-sm">1</div>
            </div>
            <div className="bg-white p-8 rounded-t-[2.5rem] border border-amber-100 shadow-xl w-56 text-center h-44 flex flex-col justify-center">
              <p className="font-black text-on-surface truncate text-lg">{topUsers[0].name}</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{topUsers[0].area}</p>
              <p className="text-2xl font-black text-primary mt-2">{topUsers[0].score} XP</p>
            </div>
          </motion.div>

          {/* Rank 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center order-3"
          >
            <div className="relative mb-4">
              <img src={topUsers[2].avatar} alt="" className="w-20 h-20 rounded-full border-4 border-orange-200 shadow-xl object-cover" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center font-black text-orange-700 text-xs">3</div>
            </div>
            <div className="bg-white p-6 rounded-t-3xl border border-slate-100 shadow-sm w-48 text-center h-28 flex flex-col justify-center">
              <p className="font-bold text-on-surface truncate">{topUsers[2].name}</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{topUsers[2].area}</p>
              <p className="text-xl font-black text-primary mt-2">{topUsers[2].score} XP</p>
            </div>
          </motion.div>
        </div>

        {/* Top 10 List */}
        <div className="lg:col-span-7 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50">
            <h3 className="text-lg font-bold text-on-surface">Top Colaboradores</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {topUsers.map((user, i) => (
              <div key={i} className="px-8 py-5 flex items-center gap-6 hover:bg-slate-50 transition-colors">
                <span className="w-6 text-sm font-black text-slate-300">{user.rank}</span>
                <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-surface truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate">{user.area}</p>
                </div>
                <p className="font-black text-primary whitespace-nowrap">{user.score} XP</p>
              </div>
            ))}
            {topUsers.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">
                Aún no hay usuarios con XP registrado.
              </div>
            )}
          </div>
        </div>

        {/* Top Areas */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-primary rounded-[2.5rem] p-8 text-white shadow-xl shadow-primary/20">
            <h3 className="text-xl font-bold mb-8">Top Áreas por Engagement</h3>
            <div className="space-y-6">
              {topAreas.map((area, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <p className="text-sm font-bold truncate pr-4">{area.area}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60 whitespace-nowrap">{area.participants} Participantes</p>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${area.engagement}%` }}
                      className="h-full bg-white"
                    ></motion.div>
                  </div>
                  <div className="flex justify-end">
                    <p className="text-[10px] font-black uppercase tracking-widest">{area.engagement}% Engagement</p>
                  </div>
                </div>
              ))}
              {topAreas.length === 0 && (
                <div className="text-center text-white/60 text-sm py-4">
                  No hay datos de áreas suficientes.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Próximas Recompensas</h4>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined material-symbols-fill">workspace_premium</span>
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">Insignia de Oro</p>
                <p className="text-xs text-slate-500">Mantente en el Top 3 por 4 semanas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}