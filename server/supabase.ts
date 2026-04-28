import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[supabase] Missing env vars: SUPABASE_URL and/or SUPABASE_ANON_KEY.');
}

const authClient = createClient(supabaseUrl || 'http://localhost', supabaseAnonKey || 'public-anon-key', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const adminClient = createClient(supabaseUrl || 'http://localhost', supabaseServiceRoleKey || supabaseAnonKey || 'public-anon-key', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const geminiApiKey = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY ?? '';
const geminiEmbeddingModel = process.env.GEMINI_EMBEDDING_MODEL ?? '';
const candidateEmbeddingModels = [
  geminiEmbeddingModel,
  'text-embedding-3-large',
  'text-embedding-3-small',
  'embedding-gecko-001',
  'gemini-embedding-1'
].filter(Boolean) as string[];
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

export type VerifiedSupabaseUser = {
  id: string;
  email: string | null;
};

export type ChatMessageRow = {
  id: string;
  user_id: string;
  role: string;
  content: string;
  created_at: string;
};

export type ChatMessageInsert = {
  role: string;
  content: string;
};

export type WhirlpoolManualMatch = {
  id?: string;
  content?: string;
  metadata?: Record<string, unknown>;
  similarity?: number;
  [key: string]: unknown;
};

export async function verifySupabaseToken(token: string): Promise<VerifiedSupabaseUser> {
  const accessToken = token.trim();
  if (!accessToken) {
    throw new Error('Token de Supabase faltante.');
  }

  const { data, error } = await authClient.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new Error('Token de Supabase inválido o expirado.');
  }

  return {
    id: data.user.id,
    email: data.user.email ?? null
  };
}

export async function getRecentChatMessages(userId: string, limit = 10): Promise<ChatMessageRow[]> {
  const { data, error } = await adminClient
    .from('chat_messages')
    .select('id, user_id, role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`No se pudo leer chat_messages: ${error.message}`);
  }

  return [...(data ?? [])].reverse() as ChatMessageRow[];
}

export async function insertChatMessages(userId: string, messages: ChatMessageInsert[]): Promise<ChatMessageRow[]> {
  const records = messages.map((message) => ({
    user_id: userId,
    role: message.role,
    content: message.content
  }));

  const { data, error } = await adminClient
    .from('chat_messages')
    .insert(records)
    .select('id, user_id, role, content, created_at');

  if (error) {
    throw new Error(`No se pudo guardar chat_messages: ${error.message}`);
  }

  return (data ?? []) as ChatMessageRow[];
}

export async function embedWhirlpoolQuestion(question: string): Promise<number[]> {
  const normalizedQuestion = question.trim();
  if (!normalizedQuestion) {
    throw new Error('La pregunta no puede estar vacía.');
  }

  if (!ai) {
    throw new Error('Falta configurar GEMINI_API_KEY para generar embeddings.');
  }

  const errors: string[] = [];

  for (const model of candidateEmbeddingModels) {
    try {
      const response = await ai.models.embedContent({ model, contents: normalizedQuestion });
      const embedding = response.embeddings?.[0]?.values;
      if (embedding && embedding.length > 0) {
        return embedding;
      }
      errors.push(`model=${model} returned empty embedding`);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`model=${model} error=${msg}`);
      // try next model
    }
  }

  throw new Error(`Gemini embeddings failed for candidates: ${errors.join(' | ')}`);
}

export async function matchWhirlpoolManualDocuments(question: string, matchCount = 5): Promise<WhirlpoolManualMatch[]> {
  const queryEmbedding = await embedWhirlpoolQuestion(question);

  const { data, error } = await adminClient.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_count: matchCount,
  });

  if (error) {
    throw new Error(`No se pudo ejecutar match_documents: ${error.message}`);
  }

  return (data ?? []) as WhirlpoolManualMatch[];
}

export async function findBestWhirlpoolManualMatch(question: string): Promise<WhirlpoolManualMatch | null> {
  const matches = await matchWhirlpoolManualDocuments(question, 1);
  const minSimEnv = process.env.MATCH_MIN_SIMILARITY ?? process.env.GEMINI_MATCH_MIN_SIMILARITY ?? '';
  const minSim = minSimEnv ? parseFloat(minSimEnv) : 0.7;
  const best = matches[0] ?? null;
  if (!best) return null;
  // If similarity present, enforce threshold
  const sim = typeof best.similarity === 'number' ? best.similarity : null;
  if (sim === null) return best;
  return sim >= minSim ? best : null;
}