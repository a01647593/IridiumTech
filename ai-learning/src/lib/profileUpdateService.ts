import { supabase } from './supabaseClient';

export async function updateUserProfile(
  userId: string,
  payload: {
    nombre?: string;
    avatar_url?: string;
  }
) {
  const { error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', userId);

  if (error) throw error;
}