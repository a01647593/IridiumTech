import { supabase } from './supabaseClient';

export interface AiGem {
  id: string;
  user_id: string;
  department_id: number | null;
  title: string;
  description: string | null;
  prompt: string;
  uses_count: number;
  created_at: string;
  author_name: string;
  department_name: string;
}

export async function fetchGems(): Promise<AiGem[]> {
  const { data, error } = await supabase
    .from('ai_gems')
    .select(`
      id, user_id, department_id, title, description, prompt, uses_count, created_at,
      users(nombre, email),
      departments(name)
    `)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((g: any) => ({
    id: g.id,
    user_id: g.user_id,
    department_id: g.department_id,
    title: g.title,
    description: g.description,
    prompt: g.prompt,
    uses_count: g.uses_count ?? 0,
    created_at: g.created_at,
    author_name: g.users?.nombre || g.users?.email || 'Usuario',
    department_name: g.departments?.name || 'General',
  }));
}

export async function fetchGemById(id: string): Promise<AiGem | null> {
  const { data, error } = await supabase
    .from('ai_gems')
    .select(`
      id, user_id, department_id, title, description, prompt, uses_count, created_at,
      users(nombre, email),
      departments(name)
    `)
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: (data as any).id,
    user_id: (data as any).user_id,
    department_id: (data as any).department_id,
    title: (data as any).title,
    description: (data as any).description,
    prompt: (data as any).prompt,
    uses_count: (data as any).uses_count ?? 0,
    created_at: (data as any).created_at,
    author_name: (data as any).users?.nombre || (data as any).users?.email || 'Usuario',
    department_name: (data as any).departments?.name || 'General',
  };
}

export async function createGem(
  userId: string,
  payload: { title: string; description: string; prompt: string; department_id: number | null }
): Promise<AiGem | null> {
  const { data, error } = await supabase
    .from('ai_gems')
    .insert({ user_id: userId, ...payload })
    .select('id, user_id, department_id, title, description, prompt, uses_count, created_at')
    .single();

  if (error || !data) {
    console.error('Error creando gema:', error);
    return null;
  }

  return {
    ...(data as any),
    uses_count: 0,
    author_name: 'Tú',
    department_name: 'General',
  };
}

export async function incrementGemUses(id: string): Promise<void> {
  const { data } = await supabase
    .from('ai_gems')
    .select('uses_count')
    .eq('id', id)
    .single();

  if (data) {
    await supabase
      .from('ai_gems')
      .update({ uses_count: ((data as any).uses_count ?? 0) + 1 })
      .eq('id', id);
  }
}
