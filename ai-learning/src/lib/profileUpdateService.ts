import { supabase } from './supabaseClient';

export async function updateUserProfile(
  userId: string,
  payload: {
    nombre?: string;
    avatar_url?: string;
    department_id?: number;
  }
) {
  const { error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', userId);

  if (error) throw error;
}

export async function upsertUserProfile(
  userId: string,
  email: string,
  payload: {
    nombre: string;
    department_id: number;
    avatar_url?: string;
  }
) {
  const { error } = await supabase
    .from('users')
    .upsert({ id: userId, email, ...payload }, { onConflict: 'id' });

  if (error) throw error;
}