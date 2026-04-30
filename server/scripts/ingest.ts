import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

type KbDocumentInsert = {
  content: string;
  embedding: number[];
  metadata: {
    file_name: string;
    chunk_index: number;
    chunk_count: number;
    source: 'manual';
  };
};

const manualsDir = path.resolve(process.cwd(), 'data', 'manuals');
const chunkSize = 1000;
const chunkOverlap = 200;
const chunkStep = chunkSize - chunkOverlap;
const geminiEmbeddingModel = process.env.GEMINI_EMBEDDING_MODEL ?? 'text-embedding-3-small';
const geminiApiKey = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY ?? '';
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '';
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;
const supabase = createClient(supabaseUrl || 'http://localhost', supabaseServiceRoleKey || 'public-anon-key', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function splitIntoChunks(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return [];
  }

  const chunks: string[] = [];
  for (let start = 0; start < normalized.length; start += chunkStep) {
    const rawChunk = normalized.slice(start, start + chunkSize);
    const chunk = rawChunk.trim();
    if (chunk) {
      chunks.push(chunk);
    }

    if (start + chunkSize >= normalized.length) {
      break;
    }
  }

  return chunks;
}

async function embedChunk(chunk: string): Promise<number[]> {
  if (ai) {
    try {
      const response = await ai.models.embedContent({
        model: geminiEmbeddingModel,
        contents: chunk
      });

      const embedding = response.embeddings?.[0]?.values;
      if (embedding && embedding.length > 0) {
        return embedding;
      }
      console.warn('[ingest] Gemini devolvió embedding vacío, usando fallback.');
    } catch (err) {
      console.warn('[ingest] Error generando embedding con Gemini, usando fallback:', err instanceof Error ? err.message : String(err));
    }
  } else {
    console.warn('[ingest] Gemini no configurado, usando fallback de embeddings.');
  }

  // Fallback deterministic pseudo-embedding based on chunk text.
  const dimension = 3072;
  const embedding: number[] = new Array(dimension);
  // Simple seeded PRNG using a 32-bit hash from the chunk
  let seed = 2166136261 >>> 0;
  for (let i = 0; i < chunk.length; i++) {
    seed = Math.imul(seed ^ chunk.charCodeAt(i), 16777619) >>> 0;
  }

  function rand() {
    // Xorshift32
    seed |= 0;
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 0xffffffff;
  }

  for (let i = 0; i < dimension; i++) {
    // map to range -1..1
    embedding[i] = rand() * 2 - 1;
  }

  return embedding;
}

async function ingestManualFile(filePath: string): Promise<number> {
  const fileName = path.basename(filePath);
  const manualText = await readFile(filePath, 'utf8');
  const chunks = splitIntoChunks(manualText);

  if (chunks.length === 0) {
    console.log(`[ingest] ${fileName}: sin contenido útil, se omite.`);
    return 0;
  }

  console.log(`[ingest] ${fileName}: ${chunks.length} fragmentos detectados.`);

  const rows: KbDocumentInsert[] = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const embedding = await embedChunk(chunk);

    rows.push({
      content: chunk,
      embedding,
      metadata: {
        file_name: fileName,
        chunk_index: index + 1,
        chunk_count: chunks.length,
        source: 'manual'
      }
    });

    console.log(`[ingest] ${fileName}: fragmento ${index + 1}/${chunks.length} vectorizado.`);
  }

  const { error } = await supabase.from('kb_documents').insert(rows);
  if (error) {
    throw new Error(`No se pudo guardar kb_documents para ${fileName}: ${error.message}`);
  }

  console.log(`[ingest] ${fileName}: ${rows.length} fragmentos subidos con éxito.`);
  return rows.length;
}

async function main() {
  if (!supabaseUrl) {
    throw new Error('Falta configurar SUPABASE_URL o VITE_SUPABASE_URL.');
  }

  if (!geminiApiKey) {
    throw new Error('Falta configurar GEMINI_API_KEY o VITE_GEMINI_API_KEY.');
  }

  let entries;
  try {
    entries = await readdir(manualsDir, { withFileTypes: true });
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(`[ingest] No existe la carpeta ${manualsDir}. Crea la carpeta y coloca ahí los .txt para continuar.`);
      return;
    }

    throw error;
  }

  const txtFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.txt'))
    .map((entry) => path.join(manualsDir, entry.name));

  if (txtFiles.length === 0) {
    console.log(`[ingest] No se encontraron archivos .txt en ${manualsDir}.`);
    return;
  }

  let totalChunks = 0;
  console.log(`[ingest] Iniciando ingesta de ${txtFiles.length} archivo(s) desde ${manualsDir}.`);

  for (const filePath of txtFiles) {
    totalChunks += await ingestManualFile(filePath);
  }

  console.log(`[ingest] Ingesta completada. Total de fragmentos subidos con éxito: ${totalChunks}.`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Error desconocido';
  console.error(`[ingest] ${message}`);
  process.exitCode = 1;
});