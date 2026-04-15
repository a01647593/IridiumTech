// Conexión a Supabase, ya no es mysql

import { createClient } from '@supabase/supabase-js';

let _supabase = null;

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY, // server-side siempre usa service role
      { auth: { persistSession: false } }
    );
  }
  return _supabase;
}

// --

export async function query(table, builder) {
  const sb = getSupabase();
  const q = builder ? builder(sb.from(table)) : sb.from(table).select('*');
  const { data, error } = await q;
  if (error) throw new Error(`[db] ${table}: ${error.message}`);
  return data ?? [];
}

export async function queryOne(table, builder) {
  const sb = getSupabase();
  const ref = builder ? builder(sb.from(table)) : sb.from(table).select('*');
  const { data, error } = await ref.limit(1).maybeSingle();
  if (error) throw new Error(`[db] ${table}: ${error.message}`);
  return data ?? null;
}

export async function insert(table, values) {
  const { data, error } = await getSupabase()
    .from(table)
    .insert(values)
    .select()
    .single();
  if (error) throw new Error(`[db:insert] ${table}: ${error.message}`);
  return data;
}

export async function update(table, values, col, val) {
  const { data, error } = await getSupabase()
    .from(table)
    .update(values)
    .eq(col, val)
    .select()
    .single();
  if (error) throw new Error(`[db:update] ${table}: ${error.message}`);
  return data;
}

export async function remove(table, col, val) {
  const { error } = await getSupabase().from(table).delete().eq(col, val);
  if (error) throw new Error(`[db:delete] ${table}: ${error.message}`);
  return { success: true };
}