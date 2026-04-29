import { supabase } from './supabaseClient';

export interface Department {
  id: number;
  name: string;
}

export async function fetchDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name')
    .order('id', { ascending: true });

  if (error || !data) return [];
  return data;
}