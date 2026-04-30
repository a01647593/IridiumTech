#!/usr/bin/env node
import fetch from 'node-fetch';
import { adminClient, embedWhirlpoolQuestion } from '../supabase.js';
import { extractTextFromPdfBuffer } from '../pdfHelpers.js';

// Simple chunking: split by paragraphs, join until reach approx maxChars
function chunkText(text: string, maxChars = 1500) {
  const paragraphs = text.split(/\n{2,}/g).map(p => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  for (const p of paragraphs) {
    if ((current + '\n\n' + p).length > maxChars) {
      if (current) chunks.push(current.trim());
      current = p;
    } else {
      current = current ? `${current}\n\n${p}` : p;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

async function fetchBuffer(url: string) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching ${url}`);
  const arrayBuffer = await resp.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  console.log('[ingest_courses] Starting ingestion of PDFs from content table...');

  // Query content rows of type 'pdf' with lesson/course relationship
  const { data: rows, error } = await adminClient
    .from('content')
    .select('id, external_url, lesson_id, lessons(course_id)')
    .eq('type', 'pdf');

  if (error) {
    console.error('[ingest_courses] Error querying content:', error.message);
    process.exit(1);
  }

  const items = (rows ?? []) as any[];
  console.log(`[ingest_courses] Found ${items.length} PDF content rows.`);

  for (const item of items) {
    const url = item.external_url ?? '';
    const lessonId = item.lesson_id ?? null;
    const courseId = item.lessons?.course_id ?? null;
    if (!url) {
      console.warn('[ingest_courses] skipping content id without external_url:', item.id);
      continue;
    }

    try {
      console.log('[ingest_courses] Fetching PDF:', url);
      const buffer = await fetchBuffer(url);
      const text = await extractTextFromPdfBuffer(buffer);
      if (!text) {
        console.warn('[ingest_courses] No text extracted for', url);
        continue;
      }

      const chunks = chunkText(text, 1600);
      console.log(`[ingest_courses] Extracted ${chunks.length} chunks from ${url}`);

      let chunkIndex = 0;
      for (const chunk of chunks) {
        chunkIndex++;
        // generate embedding using server helper (respects GEMINI_EMBEDDING_MODEL env)
        const embedding = await embedWhirlpoolQuestion(chunk);

        const metadata = {
          source: 'course_pdf',
          content_id: item.id,
          chunk_index: chunkIndex,
          lesson_id: lessonId,
          file_url: url
        };

        const { data: inserted, error: insErr } = await adminClient
          .from('course_documents')
          .insert([{ course_id: courseId, lesson_id: lessonId, content: chunk, embedding, metadata }]);

        if (insErr) {
          console.error('[ingest_courses] Insert error for chunk', chunkIndex, insErr.message);
        } else {
          console.log('[ingest_courses] Inserted chunk', chunkIndex, 'id=', inserted?.[0]?.id ?? '<unknown>');
        }
      }

    } catch (err: any) {
      console.error('[ingest_courses] Failed processing', url, err?.message ?? String(err));
    }
  }

  console.log('[ingest_courses] Ingestion complete');
}

void main().catch((e) => {
  console.error('[ingest_courses] fatal error', e instanceof Error ? e.message : String(e));
  process.exit(1);
});
