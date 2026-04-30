//De aqui salen las metricas para el adminDashboard

import { supabase } from './supabaseClient';

export async function getAdminDashboardStats() {
  try {
    const { count: usersCount } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('empleado_verificado', true);

    const { count: coursesCount } = await supabase
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('active', true);

    const { count: completedLessonsCount } = await supabase
      .from('lesson_progress')
      .select('lesson_id', { count: 'exact', head: true });

    const { count: assignmentsCount } = await supabase
      .from('course_assignments')
      .select('id', { count: 'exact', head: true })
      .is('completed_at', null);

    const { data: adminsData } = await supabase
      .from('user_roles')
      .select('roles!inner(name)');
      
    const contentAdminsCount = adminsData?.filter((r: any) => r.roles.name === 'content-admin').length || 0;

    const { data: usersData } = await supabase
      .from('users')
      .select('departments(name)');

    const areaCounts: Record<string, number> = {};
    usersData?.forEach((u: any) => {
      const areaName = u.departments?.name || 'Sin Área';
      areaCounts[areaName] = (areaCounts[areaName] || 0) + 1;
    });

    const chartData = Object.entries(areaCounts)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      usersCount: usersCount || 0,
      coursesCount: coursesCount || 0,
      completedLessonsCount: completedLessonsCount || 0,
      assignmentsCount: assignmentsCount || 0,
      contentAdminsCount,
      chartData
    };
  } catch (error) {
    console.error('Error obteniendo stats del admin:', error);
    return null;
  }
}


export async function getSuperAdminStats() {
  try {
    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: activeUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('empleado_verificado', true);

    const { count: totalAssignments } = await supabase.from('course_assignments').select('*', { count: 'exact', head: true });
    const { count: completedAssignments } = await supabase.from('course_assignments').select('*', { count: 'exact', head: true }).not('completed_at', 'is', null);
    const completionRate = totalAssignments ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

    const { data: attempts } = await supabase.from('attempts').select('score');
    const validScores = attempts?.filter(a => a.score > 0) || [];
    const avgScore = validScores.length ? Math.round(validScores.reduce((acc, a) => acc + a.score, 0) / validScores.length) : 0;


    const { data: usersData } = await supabase.from('users').select(`
      created_at, 
      departments(name), 
      course_assignments(completed_at)
    `);

    const areaStats: Record<string, { count: number, completed: number, totalAssigned: number }> = {};
    const monthlyTrend: Record<string, number> = {};

    usersData?.forEach((u: any) => {
      const areaName = u.departments?.name || 'Sin Área';
      if (!areaStats[areaName]) areaStats[areaName] = { count: 0, completed: 0, totalAssigned: 0 };
      areaStats[areaName].count += 1;

      u.course_assignments?.forEach((ca: any) => {
         areaStats[areaName].totalAssigned += 1;
         if (ca.completed_at) areaStats[areaName].completed += 1;
      });

      if (u.created_at) {
         const date = new Date(u.created_at);
         const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
         monthlyTrend[monthYear] = (monthlyTrend[monthYear] || 0) + 1;
      }
    });

    const usersByArea = Object.entries(areaStats).map(([name, data]) => ({
      name,
      value: data.count
    }));

    const areaMetrics = Object.entries(areaStats).map(([area, data]) => {
       const engagement = data.totalAssigned ? Math.round((data.completed / data.totalAssigned) * 100) : 0;
       const abandonmentRate = data.totalAssigned ? Math.round(((data.totalAssigned - data.completed) / data.totalAssigned) * 10) : 0; 
       return { area, count: data.count, engagement, abandonmentRate };
    }).sort((a, b) => b.count - a.count);

    const sortedMonths = Object.keys(monthlyTrend).sort();
    let cumulativeUsers = 0;
    const adoptionTrend = sortedMonths.map(month => {
       cumulativeUsers += monthlyTrend[month];
       return { date: month, users: cumulativeUsers };
    }).slice(-6);

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      completionRate,
      avgScore,
      usersByArea,
      areaMetrics,
      adoptionTrend: adoptionTrend.length ? adoptionTrend : [{ date: 'Actual', users: totalUsers || 0 }]
    };
  } catch (error) {
    console.error('Error calculando estadísticas de Super Admin:', error);
    return null;
  }
}

export async function getLeaderboardData() {
  try {
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, nombre, avatar_url, departments(name)');

    if (usersError) throw usersError;

    const { data: xpData, error: xpError } = await supabase
      .from('xp_logs')
      .select('user_id, xp');

    if (xpError) throw xpError;

    const userScores: Record<string, number> = {};
    xpData.forEach(log => {
      userScores[log.user_id] = (userScores[log.user_id] || 0) + (log.xp || 0);
    });

    const topUsers = usersData
      .map(user => ({
        id: user.id,
        name: user.nombre || 'Usuario Anónimo',
        area: user.departments?.name || 'General',
        avatar: user.avatar_url || `https://picsum.photos/seed/${user.id}/200/200`,
        score: userScores[user.id] || 0
      }))
      .filter(u => u.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((u, index) => ({ ...u, rank: index + 1 }))
      .slice(0, 10);

    const areaStats: Record<string, { totalXp: number, participants: Set<string> }> = {};
    
    usersData.forEach(user => {
      const areaName = user.departments?.name || 'General';
      if (!areaStats[areaName]) {
        areaStats[areaName] = { totalXp: 0, participants: new Set() };
      }
      
      const xp = userScores[user.id] || 0;
      if (xp > 0) {
        areaStats[areaName].totalXp += xp;
        areaStats[areaName].participants.add(user.id);
      }
    });

    let maxEngagementScore = 0;
    const rawAreas = Object.entries(areaStats).map(([area, stats]) => {
      const participantCount = stats.participants.size;
      const avgXp = participantCount > 0 ? stats.totalXp / participantCount : 0;
      if (avgXp > maxEngagementScore) maxEngagementScore = avgXp;
      
      return { area, participants: participantCount, avgXp };
    }).filter(a => a.participants > 0);

    const topAreas = rawAreas
      .map(a => ({
        area: a.area,
        participants: a.participants,
        engagement: maxEngagementScore > 0 ? Math.round((a.avgXp / maxEngagementScore) * 100) : 0
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5);

    return { topUsers, topAreas };

  } catch (error) {
    console.error('Error calculando el Leaderboard:', error);
    return { topUsers: [], topAreas: [] };
  }
}