import { supabase } from './supabaseClient';
import type { UserRole } from '../types';

export async function fetchUserRole(userId: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      roles (
        name
      )
    `)
    .eq('user_id', userId)
    .single();

  if (error || !data) return 'user';

  const roleName = String((data as any).roles?.name ?? '').toLowerCase();

  if (roleName === 'super-admin') return 'super-admin';
  if (roleName === 'content-admin') return 'content-admin';
  return 'user';
}