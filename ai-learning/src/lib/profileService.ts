import { supabase } from './supabaseClient';
import type { User, UserRole, Badge } from '../types';

const normalizeRole = (value: unknown): UserRole => {
  if (typeof value !== 'string') return 'user';

  const v = value.trim().toLowerCase();

  if (v === 'super-admin') return 'super-admin';
  if (v === 'content-admin') return 'content-admin';

  return 'user';
};

export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const [
      userRes,
      roleRes,
      xpRes,
      streakRes,
      achievementsRes,
      completedCoursesRes,
      completedLessonsRes,
    ] = await Promise.all([
      supabase
        .from('users')
        .select(`
          id,
          nombre,
          email,
          avatar_url,
          departments (
            name
          )
        `)
        .eq('id', userId)
        .single(),

      supabase
        .from('user_roles')
        .select(`
          roles (
            name
          )
        `)
        .eq('user_id', userId)
        .single(),

      supabase
        .from('xp_logs')
        .select('xp')
        .eq('user_id', userId),

      supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', userId)
        .single(),

      supabase
        .from('user_achievements')
        .select(`
          unlocked_at,
          achievements (
            id,
            name,
            description
          )
        `)
        .eq('user_id', userId),

      supabase
        .from('course_assignments')
        .select('course_id')
        .eq('user_id', userId)
        .not('completed_at', 'is', null),

      supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId),
    ]);

    if (userRes.error || !userRes.data) {
      console.error(userRes.error);
      return null;
    }

    const dbUser = userRes.data as any;
    const dbRole = roleRes.data as any;

    const role = normalizeRole(dbRole?.roles?.name);

    const totalXp =
      xpRes.data?.reduce((sum, row) => sum + (row.xp ?? 0), 0) ?? 0;

    const streak = streakRes.data?.current_streak ?? 0;

    const badges: Badge[] =
      achievementsRes.data?.map((row: any) => ({
        id: row.achievements?.id ?? crypto.randomUUID(),
        name: row.achievements?.name ?? 'Achievement',
        description: row.achievements?.description ?? '',
        icon: 'military_tech',
        dateEarned: row.unlocked_at ?? undefined,
      })) ?? [];

    const completedCourses =
      completedCoursesRes.data?.map((row) => row.course_id) ?? [];

    const completedQuizzesCount =
      completedLessonsRes.data?.length ?? 0;

    const profile: User = {
      id: dbUser.id,
      email: dbUser.email,
      role,
      name: dbUser.nombre ?? 'Usuario Whirlpool',
      avatar:
        dbUser.avatar_url ||
        `https://picsum.photos/seed/${dbUser.id}/200/200`,
      area: dbUser.departments?.name ?? 'General',
      gender: 'Other',
      score: totalXp,
      badges,
      completedCourses,
      pendingCourses: [],
      streak,
      lastActivityDate: undefined,
      completedQuizzesCount,
      savedPrompts: [],
    };

    return profile;
  } catch (error) {
    console.error('Error loading full profile:', error);
    return null;
  }
}